/**
 * Persistent upload queue backed by IndexedDB.
 * Stores compressed file blobs so uploads can be resumed after page refresh.
 */

const DB_NAME = 'colonel-upload-queue'
const DB_VERSION = 1
const STORE = 'uploads'

export type QueuedFileStatus = 'pending' | 'uploading' | 'done' | 'error' | 'cancelled'

export interface QueuedFile {
  id: string
  batchId: string
  batchCollectionName: string
  folder: string
  filename: string
  blob: Blob // compressed image blob stored in IndexedDB
  status: QueuedFileStatus
  progress: number
  addedAt: number
  error?: string
  order?: number
}

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => {
      _db = req.result
      resolve(_db)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function queueFiles(files: QueuedFile[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    files.forEach((f) => tx.objectStore(STORE).put(f))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function updateFileInQueue(id: string, patch: Partial<QueuedFile>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.get(id)
    req.onsuccess = () => {
      if (req.result) {
        store.put({ ...req.result, ...patch })
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingFiles(): Promise<QueuedFile[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const all: QueuedFile[] = req.result || []
      resolve(all.filter((f) => f.status === 'pending' || f.status === 'uploading'))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function removeFileFromQueue(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function removePendingBatchFromQueue(batchId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.getAll()
    req.onsuccess = () => {
      const items = (req.result || []).filter((f: QueuedFile) => f.batchId === batchId && f.status !== 'done')
      items.forEach((f: QueuedFile) => store.delete(f.id))
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearDoneFiles(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.getAll()
    req.onsuccess = () => {
      const done = (req.result || []).filter((f: QueuedFile) => f.status === 'done' || f.status === 'error' || f.status === 'cancelled')
      done.forEach((f: QueuedFile) => store.delete(f.id))
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
