import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  queueFiles,
  updateFileInQueue,
  getPendingFiles,
  removeFileFromQueue,
  clearDoneFiles,
  type QueuedFile,
} from '../services/uploadQueue'

export type FileUploadStatus = 'pending' | 'uploading' | 'done' | 'error'

export interface FileUploadItem {
  id: string
  name: string
  status: FileUploadStatus
  progress: number
  error?: string
}

export interface BatchUpload {
  id: string
  collectionName: string
  files: FileUploadItem[]
  startedAt: number
  done: boolean
}

interface UploadContextValue {
  batches: BatchUpload[]
  startBatchUpload: (
    collectionName: string,
    folder: string,
    files: File[],
    onComplete?: (uploaded: number, total: number) => void
  ) => string
  dismissBatch: (batchId: string) => void
  isUploading: boolean
}

const UploadContext = createContext<UploadContextValue | null>(null)

const CONCURRENCY = 4

/** Compress image via canvas, returns a Blob (not base64 string) */
async function compressToBlob(file: File, maxSizePx = 1800, quality = 0.82): Promise<Blob> {
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
        const outputType =
          file.type === 'image/png' && file.size < 200_000 ? 'image/png' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas compression failed'))
          },
          outputType,
          quality
        )
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
  })
}

/** Upload a blob to /api/upload */
async function uploadBlob(
  blob: Blob,
  filename: string,
  folder: string,
  onProgress: (pct: number) => void
): Promise<boolean> {
  try {
    onProgress(10)
    // Convert blob to base64 for the API
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
    onProgress(40)

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64, folder, filename }),
    })
    onProgress(90)
    if (!res.ok) return false
    await res.json()
    onProgress(100)
    return true
  } catch {
    return false
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<BatchUpload[]>([])

  const isUploading = batches.some((b) => !b.done)

  // ── helpers to update React state ──────────────────────────────────────────
  const updateFile = useCallback(
    (batchId: string, fileId: string, patch: Partial<FileUploadItem>) => {
      setBatches((prev) =>
        prev.map((b) =>
          b.id !== batchId
            ? b
            : { ...b, files: b.files.map((f) => (f.id === fileId ? { ...f, ...patch } : f)) }
        )
      )
    },
    []
  )

  const markBatchDone = useCallback((batchId: string) => {
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, done: true } : b)))
    // Clean up persisted done/error entries
    clearDoneFiles()
  }, [])

  // ── core upload runner (works for both new and resumed batches) ─────────────
  const runBatch = useCallback(
    async (
      batchId: string,
      queuedItems: QueuedFile[],
      onComplete?: (uploaded: number, total: number) => void
    ) => {
      let uploadedCount = 0
      let cursor = 0

      const workers = Array.from(
        { length: Math.min(CONCURRENCY, queuedItems.length) },
        async () => {
          while (true) {
            const idx = cursor++
            if (idx >= queuedItems.length) break

            const item = queuedItems[idx]

            // Mark as uploading in both DB and React state
            await updateFileInQueue(item.id, { status: 'uploading', progress: 5 })
            updateFile(batchId, item.id, { status: 'uploading', progress: 5 })

            const ok = await uploadBlob(item.blob, item.filename, item.folder, async (pct) => {
              await updateFileInQueue(item.id, { progress: pct })
              updateFile(batchId, item.id, { progress: pct })
            })

            if (ok) {
              uploadedCount++
              await updateFileInQueue(item.id, { status: 'done', progress: 100 })
              updateFile(batchId, item.id, { status: 'done', progress: 100 })
              // Remove from persisted queue so it won't re-upload on next refresh
              await removeFileFromQueue(item.id)
            } else {
              await updateFileInQueue(item.id, { status: 'error' })
              updateFile(batchId, item.id, { status: 'error', error: 'Upload failed' })
            }
          }
        }
      )

      await Promise.all(workers)
      markBatchDone(batchId)
      onComplete?.(uploadedCount, queuedItems.length)
    },
    [updateFile, markBatchDone]
  )

  // ── on mount: resume any pending uploads from IndexedDB ────────────────────
  useEffect(() => {
    ;(async () => {
      const pending = await getPendingFiles()
      if (pending.length === 0) return

      // Group by batchId
      const byBatch = pending.reduce<Record<string, QueuedFile[]>>((acc, f) => {
        if (!acc[f.batchId]) acc[f.batchId] = []
        acc[f.batchId].push(f)
        return acc
      }, {})

      for (const [batchId, items] of Object.entries(byBatch)) {
        const collectionName = items[0].batchCollectionName

        // Reconstruct the React batch state
        const fileItems: FileUploadItem[] = items.map((f) => ({
          id: f.id,
          name: f.filename,
          status: 'pending' as FileUploadStatus,
          progress: 0,
        }))

        setBatches((prev) => [
          {
            id: batchId,
            collectionName,
            files: fileItems,
            startedAt: items[0].addedAt,
            done: false,
          },
          ...prev,
        ])

        // Reset status to pending before re-running
        for (const item of items) {
          await updateFileInQueue(item.id, { status: 'pending', progress: 0 })
        }

        runBatch(batchId, items)
      }
    })()
  }, [runBatch])

  // ── start a new batch upload ────────────────────────────────────────────────
  const startBatchUpload = useCallback(
    (
      collectionName: string,
      folder: string,
      files: File[],
      onComplete?: (uploaded: number, total: number) => void
    ): string => {
      const batchId = 'batch-' + Date.now()

      // Build React state items
      const fileItems: FileUploadItem[] = files.map((f, i) => ({
        id: batchId + '-file-' + i,
        name: f.name,
        status: 'pending',
        progress: 0,
      }))

      setBatches((prev) => [
        { id: batchId, collectionName, files: fileItems, startedAt: Date.now(), done: false },
        ...prev,
      ])

      // Compress → persist → run (all async, non-blocking)
      ;(async () => {
        const queuedItems: QueuedFile[] = []

        // Compress and store in IndexedDB in parallel before starting uploads
        await Promise.all(
          files.map(async (file, i) => {
            const id = fileItems[i].id
            try {
              const blob = await compressToBlob(file)
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
              }
              queuedItems[i] = qf
            } catch {
              updateFile(batchId, id, { status: 'error', error: 'Compression failed' })
            }
          })
        )

        // Persist the whole batch to IndexedDB (survive page refresh)
        const valid = queuedItems.filter(Boolean)
        if (valid.length > 0) await queueFiles(valid)

        // Now run uploads
        runBatch(batchId, valid, onComplete)
      })()

      return batchId
    },
    [runBatch, updateFile]
  )

  const dismissBatch = useCallback((batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId))
  }, [])

  return (
    <UploadContext.Provider value={{ batches, startBatchUpload, dismissBatch, isUploading }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used inside <UploadProvider>')
  return ctx
}
