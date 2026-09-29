import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ImageIcon, Loader2, Maximize2, Plus, Trash2, UploadCloud, X } from 'lucide-react'
import { resolveImageUrl } from '../../utils/imageResolver'
import { deleteCloudinaryImageIfUnused } from '../../services/imageManager'
import { usePortfolio } from '../../context/PortfolioContext'
import { useUpload } from '../../context/UploadContext'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { adminFetch } from '../../services/adminApi'
import {
  deleteGalleryCollectionFromFirestore,
  deleteGalleryImageFromFirestore,
  fetchFirestoreGalleryImages
} from '../../services/galleryFirestore'

export interface CollectionItem {
  slug: string
  name: string
  count: number
  coverImage?: { thumbnailUrl: string; alt: string }
}

export interface CollectionImage {
  id: string
  publicId: string
  title: string
  alt: string
  thumbnailUrl: string
  largeUrl: string
  /** Small tile served by /api/gallery; older Firestore records only have thumbnailUrl. */
  gridUrl?: string
}

interface CollectionDetailModalProps {
  collection: CollectionItem | null
  onClose: () => void
  onCollectionUpdated?: () => void
}

type GalleryPage = { images?: CollectionImage[]; nextCursor?: string }

const pad2 = (n: number) => String(n).padStart(2, '0')

export const CollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  collection,
  onClose,
  onCollectionUpdated
}) => {
  const { data } = usePortfolio()
  const { startBatchUpload } = useUpload()
  const [images, setImages] = useState<CollectionImage[]>([])
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingCollection, setDeletingCollection] = useState<boolean>(false)
  const [photoToDelete, setPhotoToDelete] = useState<CollectionImage | null>(null)
  const [showDeleteCollectionConfirm, setShowDeleteCollectionConfirm] = useState<boolean>(false)

  // First page from Cloudinary, merged with any Firestore-only records (no duplicates)
  const fetchCollectionImages = useCallback(async () => {
    if (!collection) return
    setLoading(true)
    setError(null)
    try {
      const [res, fsImages] = await Promise.all([
        adminFetch(`/api/gallery?collection=${encodeURIComponent(collection.slug)}&fresh=1`).catch(() => null),
        fetchFirestoreGalleryImages(collection.slug).catch(() => [])
      ])

      let page: GalleryPage = {}
      if (res && res.ok) page = await res.json()

      const imgMap = new Map<string, CollectionImage>()
      ;(page.images || []).forEach((img) => imgMap.set(img.publicId || img.id, img))
      fsImages.forEach((fsi) => {
        if (!imgMap.has(fsi.publicId) && !imgMap.has(fsi.id)) {
          imgMap.set(fsi.publicId || fsi.id, {
            id: fsi.id,
            publicId: fsi.publicId,
            title: fsi.title,
            alt: fsi.alt,
            thumbnailUrl: fsi.thumbnailUrl,
            largeUrl: fsi.largeUrl
          })
        }
      })

      setImages(Array.from(imgMap.values()))
      setNextCursor(page.nextCursor)
      if (!res || !res.ok) {
        if (imgMap.size === 0) setError('Failed to load collection photos. Please check the network connection.')
      }
    } catch {
      setError('Failed to load collection photos. Please check the network connection.')
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    if (collection) fetchCollectionImages()
  }, [collection, fetchCollectionImages])

  const loadMore = async () => {
    if (!collection || !nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await adminFetch(`/api/gallery?collection=${encodeURIComponent(collection.slug)}&cursor=${encodeURIComponent(nextCursor)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const page: GalleryPage = await res.json()
      setImages((prev) => {
        const seen = new Set(prev.map((img) => img.publicId || img.id))
        return [...prev, ...(page.images || []).filter((img) => !seen.has(img.publicId || img.id))]
      })
      setNextCursor(page.nextCursor)
    } catch {
      setToastMessage({ text: 'Could not load more photographs. Try again.', type: 'error' })
    } finally {
      setLoadingMore(false)
    }
  }

  // Escape closes the preview first, then the collection; body scroll is locked while open
  const previewOpen = previewIndex !== null
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (photoToDelete || showDeleteCollectionConfirm) return
      if (e.key === 'Escape') {
        if (previewOpen) setPreviewIndex(null)
        else onClose()
      }
      if (previewOpen && e.key === 'ArrowRight') setPreviewIndex((i) => (i === null ? i : (i + 1) % images.length))
      if (previewOpen && e.key === 'ArrowLeft') setPreviewIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [previewOpen, images.length, onClose, photoToDelete, showDeleteCollectionConfirm])

  if (!collection) return null

  const executeDeleteEntireCollection = async () => {
    setDeletingCollection(true)
    setToastMessage(null)
    try {
      // 1. Delete Cloudinary folder and images
      await adminFetch('/api/delete-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: collection.name, slug: collection.slug })
      }).catch(() => null)

      // 2. Delete Firestore collection & image docs permanently
      await deleteGalleryCollectionFromFirestore(collection.slug)

      setShowDeleteCollectionConfirm(false)
      if (onCollectionUpdated) onCollectionUpdated()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setToastMessage({ text: `Failed to delete collection: ${message}`, type: 'error' })
      setDeletingCollection(false)
      setShowDeleteCollectionConfirm(false)
    }
  }

  // Upload through the controlled sequential queue
  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    startBatchUpload(collection.name, collection.slug, files, (uploaded, total) => {
      setToastMessage({ text: `Added ${uploaded} of ${total} photo(s) to "${collection.name}".`, type: 'success' })
      fetchCollectionImages()
      if (onCollectionUpdated) onCollectionUpdated()
    })
    e.target.value = ''
  }

  const executeDeletePhoto = async (image: CollectionImage | null) => {
    if (!image) return
    setDeletingId(image.id)
    setToastMessage(null)
    try {
      await deleteCloudinaryImageIfUnused(image.publicId, data)
      await deleteGalleryImageFromFirestore(image.id, collection.slug)
      setImages((prev) => prev.filter((img) => img.id !== image.id && img.publicId !== image.publicId))
      setToastMessage({ text: `Photo deleted from "${collection.name}".`, type: 'success' })
      setPhotoToDelete(null)
      setPreviewIndex(null)
      if (onCollectionUpdated) onCollectionUpdated()
    } catch {
      setToastMessage({ text: 'Could not delete photo. Check network or credentials.', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const total = Math.max(collection.count || 0, images.length)
  const preview = previewIndex !== null ? images[previewIndex] : null

  return createPortal(
    <div className="ad-cm-scrim" onClick={onClose}>
      <div className="ad-cm" role="dialog" aria-modal="true" aria-labelledby="cm-title" onClick={(e) => e.stopPropagation()}>
        <header className="ad-cm-hd">
          <div className="ttl">
            <span className="ad-pill g">Collection</span>
            <h2 id="cm-title">{collection.name}</h2>
            <p>
              {loading ? 'Loading photographs…' : `Showing ${images.length} of ${total} photo${total === 1 ? '' : 's'}`}
              <span> · /gallery/{collection.slug}</span>
            </p>
          </div>
          <div className="acts">
            <label className="ad-b g">
              <UploadCloud size={16} />
              Add photos
              <input type="file" multiple accept="image/*" onChange={handleAddPhotos} className="sr-only" />
            </label>
            <button type="button" className="ad-b red" onClick={() => setShowDeleteCollectionConfirm(true)} disabled={deletingCollection}>
              {deletingCollection ? <Loader2 size={15} className="admin-spinner" /> : <Trash2 size={15} />}
              <span className="lbl-long">{deletingCollection ? 'Deleting…' : 'Delete collection'}</span>
            </button>
            <button type="button" className="ad-icb x" onClick={onClose} aria-label="Close collection">
              <X size={18} />
            </button>
          </div>
        </header>

        {toastMessage && (
          <div className={`ad-alert ${toastMessage.type === 'error' ? 'err' : 'ok'} ad-cm-toast`} role="status">
            {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toastMessage.text}</span>
            <button type="button" className="x" onClick={() => setToastMessage(null)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="ad-cm-body">
          {loading ? (
            <div className="ad-cm-grid" aria-busy="true">
              {Array.from({ length: 12 }, (_, i) => <div key={i} className="ad-cm-tile skel" />)}
            </div>
          ) : error ? (
            <div className="ad-empty col">
              <AlertCircle size={36} />
              <b>{error}</b>
              <button type="button" className="ad-b l" onClick={fetchCollectionImages}>Retry</button>
            </div>
          ) : images.length === 0 ? (
            <div className="ad-empty col">
              <ImageIcon size={44} />
              <b>No photos in this collection yet</b>
              <span>Use “Add photos” above to upload images.</span>
            </div>
          ) : (
            <>
              <div className="ad-cm-grid">
                {images.map((img, i) => (
                  <PhotoTile
                    key={img.id}
                    image={img}
                    index={i}
                    deleting={deletingId === img.id}
                    onOpen={() => setPreviewIndex(i)}
                    onDelete={() => setPhotoToDelete(img)}
                  />
                ))}
              </div>
              {nextCursor && (
                <div className="ad-cm-more">
                  <button type="button" className="ad-b l" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? <Loader2 size={15} className="admin-spinner" /> : <Plus size={15} />}
                    {loadingMore ? 'Loading…' : `Load more photographs (${total - images.length} left)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {preview && previewIndex !== null && (
        <div className="ad-cm-pv" onClick={(e) => { e.stopPropagation(); setPreviewIndex(null) }} role="dialog" aria-label="Photo preview">
          <div className="bar" onClick={(e) => e.stopPropagation()}>
            <span>{pad2(previewIndex + 1)} / {pad2(images.length)}</span>
            <div className="acts">
              <button type="button" className="ad-b sm red" onClick={() => setPhotoToDelete(preview)}>
                <Trash2 size={14} /> Delete
              </button>
              <button type="button" className="ad-icb" onClick={() => setPreviewIndex(null)} aria-label="Close preview">
                <X size={18} />
              </button>
            </div>
          </div>
          <img key={preview.id} src={resolveImageUrl(preview.largeUrl)} alt={preview.alt} onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button type="button" className="nav prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex - 1 + images.length) % images.length) }}>
                <ChevronLeft size={22} />
              </button>
              <button type="button" className="nav next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex + 1) % images.length) }}>
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDeleteModal
          isOpen={!!photoToDelete}
          title="Delete Photo"
          itemName={photoToDelete?.title}
          message="Are you sure you want to permanently delete this photo? This action cannot be undone."
          isLoading={deletingId === photoToDelete?.id}
          onConfirm={() => executeDeletePhoto(photoToDelete)}
          onClose={() => setPhotoToDelete(null)}
        />
        <ConfirmDeleteModal
          isOpen={showDeleteCollectionConfirm}
          title="Delete Entire Collection"
          itemName={collection.name}
          message={`This will permanently delete "${collection.name}" and ALL photos inside it. This action cannot be undone.`}
          isLoading={deletingCollection}
          onConfirm={executeDeleteEntireCollection}
          onClose={() => setShowDeleteCollectionConfirm(false)}
        />
      </div>
    </div>,
    document.body
  )
}

/** One photo tile: shimmer until loaded, placeholder if the URL fails. */
function PhotoTile({ image, index, deleting, onOpen, onDelete }: {
  image: CollectionImage
  index: number
  deleting: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const src = resolveImageUrl(image.gridUrl || image.thumbnailUrl)

  return (
    <div className={`ad-cm-tile ${loaded ? 'is-loaded' : 'skel'} ${deleting ? 'is-busy' : ''}`}>
      <button type="button" className="open" onClick={onOpen} aria-label={`Preview photo ${index + 1}`}>
        {failed ? (
          <span className="none"><ImageIcon size={26} /></span>
        ) : (
          <img src={src} alt={image.alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(true) }} />
        )}
        <span className="zoom" aria-hidden="true"><Maximize2 size={15} /></span>
      </button>
      <div className="ft">
        <span title={image.title}>Photo {pad2(index + 1)}</span>
        <button type="button" className="del" onClick={onDelete} disabled={deleting} aria-label={`Delete photo ${index + 1}`}>
          {deleting ? <Loader2 size={14} className="admin-spinner" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  )
}
