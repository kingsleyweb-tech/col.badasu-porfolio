import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  UploadCloud, CheckCircle2, Loader2, RefreshCw, ImageIcon,
  AlertCircle, FolderOpen, Zap, X, Image as ImageIcon2, Trash2
} from 'lucide-react'
import { CollectionDetailModal, type CollectionItem } from '../components/CollectionDetailModal'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { resolveImageUrl } from '../../utils/imageResolver'
import { useUpload } from '../../context/UploadContext'
import { deleteGalleryCollectionFromFirestore, fetchFirestoreCollections, fetchDeletedCollectionSlugs } from '../../services/galleryFirestore'
import { adminFetch } from '../../services/adminApi'

interface PreviewFile {
  file: File
  previewUrl: string
}

export const GalleryAdmin: React.FC = () => {
  const { startBatchUpload } = useUpload()

  const [collectionName, setCollectionName] = useState('')
  const [description, setDescription] = useState('')
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [justStarted, setJustStarted] = useState(false)
  const objectUrlsRef = useRef<string[]>([])

  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionItem | null>(null)

  // Revoke object URLs when component unmounts
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  // Auto-dismiss toast alert after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Retry helper: tries fetchFn up to maxAttempts times with exponential backoff
  const fetchWithRetry = async (fetchFn: () => Promise<Response | null>, maxAttempts = 3): Promise<Response | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetchFn()
        if (res && res.ok) return res
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400 * attempt))
        }
      } catch {
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400 * attempt))
        }
      }
    }
    return null
  }

  const fetchCollections = useCallback(async () => {
    setLoadingCollections(true)
    setCollectionsError(null)

    // Capture whether we already had data BEFORE this fetch attempt.
    // This must be read synchronously before any await.
    let hadDataBeforeFetch = false
    setCollections((prev) => {
      hadDataBeforeFetch = prev.length > 0
      return prev // no change — just reading
    })

    try {
      // Fetch Firestore data immediately (fast), and deleted collection slugs set
      const [fsCols, deletedSlugs] = await Promise.all([
        fetchFirestoreCollections().catch(() => []),
        fetchDeletedCollectionSlugs().catch(() => new Set<string>())
      ])

      // Map initial Firestore collections
      const colMap = new Map<string, CollectionItem>()
      fsCols.forEach((fc) => {
        const normSlug = fc.slug.toLowerCase()
        if (!deletedSlugs.has(normSlug)) {
          colMap.set(fc.slug, {
            slug: fc.slug,
            name: fc.name,
            count: fc.count,
            coverImage: fc.coverImage
          })
        }
      })
      if (colMap.size > 0) {
        setCollections(Array.from(colMap.values()))
        hadDataBeforeFetch = true
      }

      // Retry Cloudinary API up to 3 times for live collections
      const res = await fetchWithRetry(() => fetch('/api/gallery?fresh=1'), 1)

      let apiCols: CollectionItem[] = []
      if (res && res.ok) {
        const data = await res.json().catch(() => ({}))
        apiCols = data.collections || []
      }

      // Merge Cloudinary collections with Firestore, filtering out deleted ones
      const merged = new Map<string, CollectionItem>()
      apiCols.forEach((c) => {
        const normSlug = c.slug.toLowerCase()
        if (!deletedSlugs.has(normSlug)) {
          merged.set(c.slug, c)
        }
      })

      fsCols.forEach((fc) => {
        const normSlug = fc.slug.toLowerCase()
        if (!deletedSlugs.has(normSlug)) {
          if (!merged.has(fc.slug)) {
            merged.set(fc.slug, {
              slug: fc.slug,
              name: fc.name,
              count: fc.count,
              coverImage: fc.coverImage
            })
          } else {
            const existing = merged.get(fc.slug)!
            if (fc.count > (existing.count || 0)) {
              existing.count = fc.count
            }
          }
        }
      })

      const final = Array.from(merged.values())
      // Nothing from Cloudinary or Firestore and the photo API failed: report it instead of "no collections"
      if (!res && final.length === 0) {
        throw new Error('Photo library unavailable')
      }
      setCollections(final)
      setCollectionsError(null)
    } catch (err) {
      console.warn('[GalleryAdmin] Error fetching collections:', err)
      // Only show the error if we genuinely have no data to show.
      // If we already loaded collections before this refresh attempt, keep them visible.
      if (!hadDataBeforeFetch) {
        setCollectionsError('Could not load collections from Cloudinary right now. It may be limiting requests; try Refresh in a few minutes.')
      }
    } finally {
      setLoadingCollections(false)
    }
  }, [])



  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  // Complete & Persistent Collection Deletion
  const executeDeleteCollection = async (col: CollectionItem | null) => {
    if (!col) return
    setDeletingSlug(col.slug)
    setMessage(null)

    try {
      // 1. Delete Cloudinary folder and assets
      const res = await adminFetch('/api/delete-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: col.name, slug: col.slug })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.warn('Cloudinary collection delete response warning:', err.error)
      }

      // 2. Delete all Firestore records and collection document permanently
      await deleteGalleryCollectionFromFirestore(col.slug)

      // 3. Refresh UI & local state immediately
      setCollections((prev) => prev.filter((item) => item.slug !== col.slug && item.name !== col.name))
      setMessage(`Collection "${col.name}" was permanently deleted.`)
      setMessageType('success')
      setCollectionToDelete(null)
      if (selectedCollection?.slug === col.slug) {
        setSelectedCollection(null)
      }
      fetchCollections()
    } catch (err: any) {
      setMessage(`Failed to delete collection: ${err.message || 'Unknown error'}`)
      setMessageType('error')
    } finally {
      setDeletingSlug(null)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith('image/'))
    const previews: PreviewFile[] = imageFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      objectUrlsRef.current.push(previewUrl)
      return { file, previewUrl }
    })
    setPreviewFiles((prev) => [...prev, ...previews])
  }

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    addFiles(Array.from(e.dataTransfer.files))
  }

  const removePreview = (index: number) => {
    setPreviewFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const clearAll = () => {
    previewFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPreviewFiles([])
  }

  const handleBatchUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!collectionName.trim() || previewFiles.length === 0) {
      setMessage('Please enter a collection name and select at least one image.')
      setMessageType('error')
      return
    }

    const folderSlug = collectionName
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Trigger controlled sequential 1-by-1 upload
    startBatchUpload(
      collectionName.trim(),
      folderSlug,
      previewFiles.map((p) => p.file),
      (uploaded, total) => {
        setMessage(`Successfully uploaded ${uploaded} of ${total} photos to "${collectionName}"!`)
        setMessageType('success')
        setTimeout(() => fetchCollections(), 1500)
      }
    )

    setCollectionName('')
    setDescription('')
    clearAll()
    setJustStarted(true)
    setTimeout(() => setJustStarted(false), 5000)
  }

  const totalSize = previewFiles.reduce((sum, p) => sum + p.file.size, 0)
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="ad-page">
      <div className="ad-ph">
        <div className="t">
          <span className="ic"><ImageIcon2 size={26} /></span>
          <div>
            <h1>Gallery</h1>
            <p>Create collections and upload photographs. Images are compressed and uploaded one after another, and each is saved the moment it finishes.</p>
          </div>
        </div>
        <button type="button" className="ad-b l" onClick={fetchCollections} disabled={loadingCollections}>
          <RefreshCw size={15} className={loadingCollections ? 'admin-spinner' : ''} />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`ad-alert ${messageType === 'error' ? 'err' : 'ok'}`} role={messageType === 'error' ? 'alert' : 'status'}>
          {messageType === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message}</span>
          <button type="button" className="x" onClick={() => setMessage(null)} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      {justStarted && (
        <div className="ad-alert info" role="status">
          <Zap size={18} />
          <span>
            <strong>Upload started.</strong> Photographs upload one by one and save as they finish. You can keep working; progress shows in the corner.
          </span>
        </div>
      )}

      <div className="ad-card">
        <div className="hd">
          <div>
            <h3>Create a new collection</h3>
            <p>Sequential queue · auto-compress · immediate save</p>
          </div>
          {previewFiles.length > 0 && (
            <span className="ad-pill gold">{previewFiles.length} selected · {formatSize(totalSize)}</span>
          )}
        </div>

        <form onSubmit={handleBatchUpload} className="ad-gal-new">
          <div className="fields">
            <div>
              <label className="ad-lbl" htmlFor="col-name">Collection name *</label>
              <input
                id="col-name"
                className="ad-field"
                type="text"
                placeholder="e.g. ECOWAS Summit 2026"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="ad-lbl" htmlFor="col-desc">Description (optional)</label>
              <textarea
                id="col-desc"
                className="ad-field"
                placeholder="Brief description about this collection…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <button type="submit" className="ad-b g" disabled={previewFiles.length === 0}>
              <UploadCloud size={16} />
              {previewFiles.length > 0 ? `Create collection · upload ${previewFiles.length}` : 'Create collection'}
            </button>
          </div>

          <div>
            <label className="ad-drop" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
              <span className="i"><UploadCloud size={28} /></span>
              <b>Drop photographs here or click to choose</b>
              <small>JPG, PNG, WEBP · optimised automatically before upload</small>
              <input type="file" multiple accept="image/*" onChange={handleFileSelection} className="sr-only" />
            </label>

            {previewFiles.length > 0 && (
              <>
                <div className="ad-q">
                  {previewFiles.map((pf, i) => (
                    <div key={pf.previewUrl} title={pf.file.name}>
                      <img src={pf.previewUrl} alt={pf.file.name} />
                      <button type="button" className="rm" onClick={() => removePreview(i)} aria-label={`Remove ${pf.file.name}`}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="ad-link danger" onClick={clearAll}>Clear all</button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="ad-card">
        <div className="hd">
          <div>
            <h3>Collections</h3>
            <p>Open a collection to add, reorder or delete photographs.</p>
          </div>
          {!loadingCollections && <span className="ad-pill g">{collections.length} collection{collections.length !== 1 ? 's' : ''}</span>}
        </div>

        {loadingCollections && collections.length === 0 ? (
          <div className="ad-empty"><Loader2 size={20} className="admin-spinner" /> Loading gallery collections…</div>
        ) : collectionsError ? (
          <div className="ad-alert err"><AlertCircle size={16} /><span>{collectionsError}</span></div>
        ) : collections.length === 0 ? (
          <div className="ad-empty col">
            <ImageIcon size={40} />
            <b>No collections yet</b>
            <span>Use the form above to create your first photo collection.</span>
          </div>
        ) : (
          <div className="ad-cols">
            {collections.map((col) => (
              <div className="col" key={col.slug}>
                <button type="button" className="cv" onClick={() => setSelectedCollection(col)} aria-label={`Manage ${col.name}`}>
                  {col.coverImage ? (
                    <img src={resolveImageUrl(col.coverImage.thumbnailUrl)} alt="" loading="lazy" />
                  ) : (
                    <span className="none"><ImageIcon size={32} /></span>
                  )}
                  <span className="ad-pill g">{col.count} {col.count === 1 ? 'photo' : 'photos'}</span>
                </button>
                <div className="bd">
                  <b>{col.name}</b>
                  <small>/gallery/{col.slug}</small>
                  <div className="ac">
                    <button type="button" className="ad-b sm g" onClick={() => setSelectedCollection(col)}>
                      <FolderOpen size={13} />
                      Manage
                    </button>
                    <a className="ad-b sm l" href={`/gallery/${col.slug}`} target="_blank" rel="noopener noreferrer">View</a>
                    <button
                      type="button"
                      className="ad-b sm red"
                      onClick={() => setCollectionToDelete(col)}
                      disabled={deletingSlug === col.slug}
                    >
                      {deletingSlug === col.slug ? <Loader2 size={13} className="admin-spinner" /> : <Trash2 size={13} />}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCollection && (
        <CollectionDetailModal
          collection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
          onCollectionUpdated={fetchCollections}
        />
      )}

      {/* Confirmation modal before deletion */}
      <ConfirmDeleteModal
        isOpen={!!collectionToDelete}
        title="Delete Collection"
        itemName={collectionToDelete?.name}
        message="This will permanently delete this collection and its images. This action cannot be undone."
        isLoading={!!deletingSlug}
        onConfirm={() => executeDeleteCollection(collectionToDelete)}
        onClose={() => setCollectionToDelete(null)}
      />
    </div>
  )
}
