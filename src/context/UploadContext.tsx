import React, { createContext, useContext, useState, useCallback } from 'react'

export type FileUploadStatus = 'pending' | 'uploading' | 'done' | 'error'

export interface FileUploadItem {
  id: string
  name: string
  status: FileUploadStatus
  progress: number // 0-100
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
  ) => string // returns batch id
  dismissBatch: (batchId: string) => void
  isUploading: boolean
}

const UploadContext = createContext<UploadContextValue | null>(null)

const CONCURRENCY = 4 // upload 4 images in parallel

/** Compress an image file using canvas before uploading — reduces size by 40-70% */
async function compressImage(file: File, maxSizePx = 1800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        // Scale down if larger than maxSizePx
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
        // Use JPEG for photos, preserve PNG only for tiny files
        const outputType = file.type === 'image/png' && file.size < 200_000 ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(outputType, quality))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
  })
}

/** Upload a single file to /api/upload, returns true on success */
async function uploadOne(
  file: File,
  folder: string,
  onProgress: (pct: number) => void
): Promise<boolean> {
  try {
    onProgress(10)
    const base64 = await compressImage(file)
    onProgress(40)

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64, folder, filename: file.name }),
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

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<BatchUpload[]>([])

  const isUploading = batches.some((b) => !b.done)

  const updateFileStatus = useCallback(
    (batchId: string, fileId: string, patch: Partial<FileUploadItem>) => {
      setBatches((prev) =>
        prev.map((b) =>
          b.id !== batchId
            ? b
            : {
                ...b,
                files: b.files.map((f) => (f.id === fileId ? { ...f, ...patch } : f)),
              }
        )
      )
    },
    []
  )

  const markBatchDone = useCallback((batchId: string) => {
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, done: true } : b)))
  }, [])

  const startBatchUpload = useCallback(
    (
      collectionName: string,
      folder: string,
      files: File[],
      onComplete?: (uploaded: number, total: number) => void
    ): string => {
      const batchId = 'batch-' + Date.now()
      const fileItems: FileUploadItem[] = files.map((f, i) => ({
        id: batchId + '-file-' + i,
        name: f.name,
        status: 'pending',
        progress: 0,
      }))

      const batch: BatchUpload = {
        id: batchId,
        collectionName,
        files: fileItems,
        startedAt: Date.now(),
        done: false,
      }

      setBatches((prev) => [batch, ...prev])

      // Run uploads with CONCURRENCY limit asynchronously
      ;(async () => {
        let uploadedCount = 0
        let cursor = 0

        const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
          while (true) {
            const idx = cursor++
            if (idx >= files.length) break

            const file = files[idx]
            const fileId = fileItems[idx].id

            updateFileStatus(batchId, fileId, { status: 'uploading', progress: 5 })

            const ok = await uploadOne(file, folder, (pct) => {
              updateFileStatus(batchId, fileId, { progress: pct })
            })

            if (ok) {
              uploadedCount++
              updateFileStatus(batchId, fileId, { status: 'done', progress: 100 })
            } else {
              updateFileStatus(batchId, fileId, { status: 'error', progress: 0, error: 'Failed' })
            }
          }
        })

        await Promise.all(workers)
        markBatchDone(batchId)
        onComplete?.(uploadedCount, files.length)
      })()

      return batchId
    },
    [updateFileStatus, markBatchDone]
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
