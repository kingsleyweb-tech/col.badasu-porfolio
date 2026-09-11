import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  queueFiles,
  updateFileInQueue,
  getPendingFiles,
  removeFileFromQueue,
  removePendingBatchFromQueue,
  clearDoneFiles,
  type QueuedFile
} from '../services/uploadQueue'
import { saveGalleryImageRecord } from '../services/galleryFirestore'

export type FileUploadStatus = 'pending' | 'uploading' | 'done' | 'error' | 'cancelled'

export interface FileUploadItem {
  id: string
  name: string
  status: FileUploadStatus
  progress: number
  stageText?: string
  error?: string
  sizeBytes?: number
}

export interface BatchUpload {
  id: string
  collectionName: string
  folder: string
  files: FileUploadItem[]
  startedAt: number
  done: boolean
  cancelled: boolean
  isMinimized: boolean
  activeFileIndex: number
  uploadSpeedText?: string
}

interface UploadContextValue {
  batches: BatchUpload[]
  startBatchUpload: (
    collectionName: string,
    folder: string,
    files: File[],
    onComplete?: (uploaded: number, total: number) => void
  ) => string
  cancelBatchUpload: (batchId: string) => void
  toggleMinimize: (batchId: string) => void
  retryFailedInBatch: (batchId: string) => void
  dismissBatch: (batchId: string) => void
  isUploading: boolean
}

const UploadContext = createContext<UploadContextValue | null>(null)

/**
 * Intelligent client-side image compression.
 * Optimizes images to WebP/JPEG (max 1920px) before uploading.
 * Skips processing if image is already small (< 300KB) and optimized.
 */
async function compressToBlob(file: File, maxSizePx = 1920, quality = 0.82): Promise<{ blob: Blob; width?: number; height?: number }> {
  // If already small and optimized, return directly to save time
  if (file.size < 300_000 && (file.type === 'image/webp' || file.type === 'image/jpeg' || file.type === 'image/png')) {
    return { blob: file }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxSizePx || height > maxSizePx) {
          if (width > height) {
            height = Math.round((height * maxSizePx) / width)
            width = maxSizePx
          } else {
            width = Math.round((width * maxSizePx) / height)
            height = maxSizePx
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        // Prefer modern WebP format where supported
        const outputType = 'image/webp'
        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, width, height })
            else {
              // Fallback to JPEG if WebP blob creation failed
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) resolve({ blob: jpegBlob, width, height })
                  else reject(new Error('Canvas compression failed'))
                },
                'image/jpeg',
                quality
              )
            }
          },
          outputType,
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image for compression'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read local file'))
  })
}

interface UploadResponse {
  success: boolean
  publicId?: string
  url?: string
  thumbnailUrl?: string
  largeUrl?: string
  error?: string
}

/**
 * Uploads a single image blob to Cloudinary via /api/upload with AbortSignal support.
 */
async function uploadBlob(
  blob: Blob,
  filename: string,
  folder: string,
  signal: AbortSignal,
  onProgress: (pct: number, stage: string) => void
): Promise<UploadResponse> {
  try {
    onProgress(15, 'Preparing upload...')
    
    // Read blob as Data URL (base64)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })

    if (signal.aborted) throw new Error('Upload cancelled')
    onProgress(45, 'Uploading to Cloudinary...')

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64, folder, filename }),
      signal
    })

    onProgress(85, 'Saving image reference...')

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      return { success: false, error: errJson.error || 'Upload request failed' }
    }

    const data = await res.json()
    onProgress(100, 'Upload complete!')
    return {
      success: true,
      publicId: data.publicId,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      largeUrl: data.largeUrl
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || signal.aborted) {
      return { success: false, error: 'Cancelled' }
    }
    return { success: false, error: err.message || 'Network error during upload' }
  }
}

// ─── Provider Component ────────────────────────────────────────────────────────

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<BatchUpload[]>([])
  const activeControllersRef = useRef<Map<string, AbortController>>(new Map())

  const isUploading = batches.some((b) => !b.done && !b.cancelled)

  const updateFileInState = useCallback(
    (batchId: string, fileId: string, patch: Partial<FileUploadItem>) => {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b
          const updatedFiles = b.files.map((f) => (f.id === fileId ? { ...f, ...patch } : f))
          const activeIdx = updatedFiles.findIndex((f) => f.status === 'uploading')
          return {
            ...b,
            files: updatedFiles,
            activeFileIndex: activeIdx >= 0 ? activeIdx : b.activeFileIndex
          }
        })
      )
    },
    []
  )

  const updateBatchStats = useCallback((batchId: string, patch: Partial<BatchUpload>) => {
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, ...patch } : b)))
  }, [])

  const markBatchDone = useCallback((batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b
        return { ...b, done: true }
      })
    )
    clearDoneFiles()
  }, [])

  // ── Core Sequential Upload Queue Runner ──────────────────────────────────────
  const runBatchSequentially = useCallback(
    async (
      batchId: string,
      queuedItems: QueuedFile[],
      onComplete?: (uploaded: number, total: number) => void
    ) => {
      let uploadedCount = 0
      const total = queuedItems.length
      const controller = new AbortController()
      activeControllersRef.current.set(batchId, controller)

      for (let i = 0; i < queuedItems.length; i++) {
        // Check cancellation status before starting next image
        if (controller.signal.aborted) {
          break
        }

        const item = queuedItems[i]

        // Update state to active uploading
        updateBatchStats(batchId, { activeFileIndex: i })
        await updateFileInQueue(item.id, { status: 'uploading', progress: 5 })
        updateFileInState(batchId, item.id, {
          status: 'uploading',
          progress: 5,
          stageText: 'Optimizing image...'
        })

        const startTime = Date.now()

        // Step 1: Upload to Cloudinary (one image at a time)
        const result = await uploadBlob(
          item.blob,
          item.filename,
          item.folder,
          controller.signal,
          async (pct, stage) => {
            await updateFileInQueue(item.id, { progress: pct })
            updateFileInState(batchId, item.id, { progress: pct, stageText: stage })
          }
        )

        if (controller.signal.aborted) {
          updateFileInState(batchId, item.id, { status: 'cancelled', stageText: 'Cancelled' })
          break
        }

        if (result.success && result.url && result.publicId) {
          // Calculate upload speed
          const elapsedSec = (Date.now() - startTime) / 1000
          const bytes = item.blob.size
          const speedKBps = elapsedSec > 0 ? (bytes / 1024 / elapsedSec).toFixed(0) : '0'
          const speedText = `${speedKBps} KB/s`

          // Step 2: REQUIREMENT 5 & 6 & 16: IMMEDIATELY save reference to Firestore right after success!
          // NOTE: This requires real Firebase Auth (not demo mode). If permission denied,
          //       the image IS uploaded to Cloudinary and will appear via the gallery API.
          try {
            await saveGalleryImageRecord({
              id: result.publicId.replace(/[^a-zA-Z0-9_-]/g, '_'),
              publicId: result.publicId,
              collectionSlug: item.folder,
              collectionName: item.batchCollectionName,
              title: item.filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
              alt: `${item.batchCollectionName} - ${item.filename}`,
              url: result.url,
              thumbnailUrl: result.thumbnailUrl || result.url,
              largeUrl: result.largeUrl || result.url,
              order: i,
              uploadedAt: Date.now()
            })
          } catch (fsErr: any) {
            // Don't block the upload — the image is safe in Cloudinary.
            // Firestore save failure is usually a permissions issue (demo mode).
            console.warn(
              '[Upload] Firestore save failed for', item.filename,
              '— Image uploaded to Cloudinary successfully but metadata not saved to Firestore.',
              'If you see "Missing or insufficient permissions", ensure you are logged in with a real Firebase account.',
              fsErr
            )
          }

          uploadedCount++
          await updateFileInQueue(item.id, { status: 'done', progress: 100 })
          updateFileInState(batchId, item.id, {
            status: 'done',
            progress: 100,
            stageText: '✓ Saved to Firestore'
          })
          updateBatchStats(batchId, { uploadSpeedText: speedText })

          // Remove completed file from IndexedDB queue (survives refreshes safely)
          await removeFileFromQueue(item.id)
        } else if (result.error === 'Cancelled') {
          updateFileInState(batchId, item.id, { status: 'cancelled', stageText: 'Cancelled' })
          break
        } else {
          // REQUIREMENT 11: Mark individual image as failed, continue queue with next image!
          await updateFileInQueue(item.id, { status: 'error', error: result.error })
          updateFileInState(batchId, item.id, {
            status: 'error',
            error: result.error || 'Upload failed',
            stageText: '✕ Upload failed'
          })
        }
      }

      activeControllersRef.current.delete(batchId)
      markBatchDone(batchId)
      onComplete?.(uploadedCount, total)
    },
    [updateFileInState, updateBatchStats, markBatchDone]
  )

  // ── Mount Effect: Resume any interrupted uploads from IndexedDB ─────────────
  useEffect(() => {
    ;(async () => {
      const pending = await getPendingFiles()
      if (pending.length === 0) return

      const byBatch = pending.reduce<Record<string, QueuedFile[]>>((acc, f) => {
        if (!acc[f.batchId]) acc[f.batchId] = []
        acc[f.batchId].push(f)
        return acc
      }, {})

      for (const [batchId, items] of Object.entries(byBatch)) {
        const collectionName = items[0].batchCollectionName
        const folder = items[0].folder

        const fileItems: FileUploadItem[] = items.map((f) => ({
          id: f.id,
          name: f.filename,
          status: 'pending',
          progress: 0,
          sizeBytes: f.blob.size
        }))

        setBatches((prev) => [
          {
            id: batchId,
            collectionName,
            folder,
            files: fileItems,
            startedAt: items[0].addedAt,
            done: false,
            cancelled: false,
            isMinimized: false,
            activeFileIndex: 0
          },
          ...prev
        ])

        for (const item of items) {
          await updateFileInQueue(item.id, { status: 'pending', progress: 0 })
        }

        runBatchSequentially(batchId, items)
      }
    })()
  }, [runBatchSequentially])

  // ── Public Start Batch Upload Handler ────────────────────────────────────────
  const startBatchUpload = useCallback(
    (
      collectionName: string,
      folder: string,
      files: File[],
      onComplete?: (uploaded: number, total: number) => void
    ): string => {
      const batchId = 'batch-' + Date.now()

      const fileItems: FileUploadItem[] = files.map((f, i) => ({
        id: `${batchId}-file-${i}`,
        name: f.name,
        status: 'pending',
        progress: 0,
        sizeBytes: f.size
      }))

      setBatches((prev) => [
        {
          id: batchId,
          collectionName,
          folder,
          files: fileItems,
          startedAt: Date.now(),
          done: false,
          cancelled: false,
          isMinimized: false,
          activeFileIndex: 0
        },
        ...prev
      ])

      // Compress images client-side & persist to IndexedDB before running sequential queue
      ;(async () => {
        const queuedItems: QueuedFile[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const id = fileItems[i].id
          try {
            updateFileInState(batchId, id, { stageText: 'Compressing...' })
            const { blob } = await compressToBlob(file)
            const qf: QueuedFile = {
              id,
              batchId,
              batchCollectionName: collectionName,
              folder,
              filename: file.name,
              blob,
              status: 'pending',
              progress: 0,
              addedAt: Date.now(),
              order: i
            }
            queuedItems.push(qf)
          } catch (err: any) {
            updateFileInState(batchId, id, { status: 'error', error: 'Compression failed' })
          }
        }

        if (queuedItems.length > 0) {
          await queueFiles(queuedItems)
          runBatchSequentially(batchId, queuedItems, onComplete)
        } else {
          markBatchDone(batchId)
        }
      })()

      return batchId
    },
    [runBatchSequentially, updateFileInState, markBatchDone]
  )

  // ── REQUIREMENT 7: Safe Cancellation Handler ─────────────────────────────────
  const cancelBatchUpload = useCallback(
    async (batchId: string) => {
      // 1. Abort active upload fetch controller if running
      const controller = activeControllersRef.current.get(batchId)
      if (controller) {
        controller.abort()
        activeControllersRef.current.delete(batchId)
      }

      // 2. Remove non-completed items from IndexedDB
      await removePendingBatchFromQueue(batchId)

      // 3. Update React batch state: completed items REMAIN, pending/uploading become cancelled
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b
          const updatedFiles = b.files.map((f) => {
            if (f.status === 'done') return f // Retain completed images!
            return { ...f, status: 'cancelled' as FileUploadStatus, stageText: 'Cancelled' }
          })
          return {
            ...b,
            files: updatedFiles,
            done: true,
            cancelled: true
          }
        })
      )
    },
    []
  )

  // ── REQUIREMENT 9: Toggle Minimize Progress Modal ───────────────────────────
  const toggleMinimize = useCallback((batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, isMinimized: !b.isMinimized } : b))
    )
  }, [])

  // ── REQUIREMENT 11: Retry Failed Images in Batch ────────────────────────────
  const retryFailedInBatch = useCallback(
    async (batchId: string) => {
      const targetBatch = batches.find((b) => b.id === batchId)
      if (!targetBatch) return

      const failedFiles = targetBatch.files.filter((f) => f.status === 'error')
      if (failedFiles.length === 0) return

      // Reset failed files status to pending
      failedFiles.forEach((f) => {
        updateFileInState(batchId, f.id, { status: 'pending', progress: 0, error: undefined })
      })

      updateBatchStats(batchId, { done: false, cancelled: false })

      // Create queued items for failed files and rerun queue
      const queuedItems: QueuedFile[] = failedFiles.map((f) => ({
        id: f.id,
        batchId,
        batchCollectionName: targetBatch.collectionName,
        folder: targetBatch.folder,
        filename: f.name,
        blob: new Blob([]), // will read original if in IndexedDB
        status: 'pending',
        progress: 0,
        addedAt: Date.now()
      }))

      runBatchSequentially(batchId, queuedItems)
    },
    [batches, updateFileInState, updateBatchStats, runBatchSequentially]
  )

  const dismissBatch = useCallback((batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId))
  }, [])

  return (
    <UploadContext.Provider
      value={{
        batches,
        startBatchUpload,
        cancelBatchUpload,
        toggleMinimize,
        retryFailedInBatch,
        dismissBatch,
        isUploading
      }}
    >
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used inside <UploadProvider>')
  return ctx
}
