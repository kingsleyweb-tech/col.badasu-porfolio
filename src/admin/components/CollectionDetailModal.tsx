import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Trash2, UploadCloud, Loader2, CheckCircle2, AlertCircle, ImageIcon, Eye, X } from 'lucide-react'
import { resolveImageUrl } from '../../utils/imageResolver'
import { deleteCloudinaryImageIfUnused } from '../../services/imageManager'
import { usePortfolio } from '../../context/PortfolioContext'
import { useUpload } from '../../context/UploadContext'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
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
}

interface CollectionDetailModalProps {
  collection: CollectionItem | null
  onClose: () => void
  onCollectionUpdated?: () => void
}

export const CollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  collection,
  onClose,
  onCollectionUpdated
}) => {
  const { data } = usePortfolio()
  const { startBatchUpload } = useUpload()
  const [images, setImages] = useState<CollectionImage[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Toast Alert Notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Fullscreen Preview Lightbox
  const [previewImage, setPreviewImage] = useState<CollectionImage | null>(null)

  // Deleting Image & Collection State
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingCollection, setDeletingCollection] = useState<boolean>(false)
  const [photoToDelete, setPhotoToDelete] = useState<CollectionImage | null>(null)
  const [showDeleteCollectionConfirm, setShowDeleteCollectionConfirm] = useState<boolean>(false)

  // Fetch images from Cloudinary + Firestore
  const fetchCollectionImages = useCallback(async () => {
    if (!collection) return
    setLoading(true)
    setError(null)
    try {
      const [res, fsImages] = await Promise.all([
        fetch(`/api/gallery?collection=${encodeURIComponent(collection.slug)}`).catch(() => null),
        fetchFirestoreGalleryImages(collection.slug).catch(() => [])
      ])

      let apiImages: CollectionImage[] = []
      if (res && res.ok) {
        const data = await res.json()
        apiImages = data.images || []
      }

      // Merge Cloudinary images with Firestore images (prevent duplicates)
      const imgMap = new Map<string, CollectionImage>()
      apiImages.forEach((img) => imgMap.set(img.publicId || img.id, img))

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
    } catch {
      setError('Failed to load collection photos. Please check network connection.')
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    if (collection) {
      fetchCollectionImages()
    }
  }, [collection, fetchCollectionImages])

  if (!collection) return null

  // REQUIREMENT 12 & 13 & 15: Complete Collection Deletion
  const executeDeleteEntireCollection = async () => {
    if (!collection) return

    setDeletingCollection(true)
    setToastMessage(null)

    try {
      // 1. Delete Cloudinary folder and images
      await fetch('/api/delete-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: collection.name, slug: collection.slug })
      }).catch(() => null)

      // 2. Delete Firestore collection & image docs permanently
      await deleteGalleryCollectionFromFirestore(collection.slug)

      setShowDeleteCollectionConfirm(false)
      if (onCollectionUpdated) onCollectionUpdated()
      onClose()
    } catch (err: any) {
      setToastMessage({ text: `Failed to delete collection: ${err.message || 'Unknown error'}`, type: 'error' })
      setDeletingCollection(false)
      setShowDeleteCollectionConfirm(false)
    }
  }

  // Handle Photo Upload using Controlled Sequential Queue
  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)

    startBatchUpload(
      collection.name,
      collection.slug,
      files,
      (uploaded, total) => {
        setToastMessage({
          text: `Successfully added ${uploaded} of ${total} photo(s) to "${collection.name}"!`,
          type: 'success'
        })
        fetchCollectionImages()
        if (onCollectionUpdated) onCollectionUpdated()
      }
    )

    e.target.value = ''
  }

  // Handle Photo Deletion
  const executeDeletePhoto = async (image: CollectionImage | null) => {
    if (!image) return
    setDeletingId(image.id)
    setToastMessage(null)

    try {
      // Delete Cloudinary asset if unused
      await deleteCloudinaryImageIfUnused(image.publicId, data)
      // Delete Firestore document
      await deleteGalleryImageFromFirestore(image.id, collection.slug)

      setImages((prev) => prev.filter((img) => img.id !== image.id && img.publicId !== image.publicId))
      setToastMessage({ text: `Photo successfully deleted from "${collection.name}".`, type: 'success' })
      setPhotoToDelete(null)
      if (onCollectionUpdated) onCollectionUpdated()
    } catch {
      setToastMessage({ text: 'Could not delete photo. Check network or credentials.', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '1080px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            backgroundColor: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.4rem 0.75rem',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {collection.name}
              </h2>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                {images.length} photo{images.length !== 1 ? 's' : ''} in collection
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Add Photo Button */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.125rem',
                backgroundColor: '#1f5c3a',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <UploadCloud size={16} />
              <span>Add Photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddPhotos}
                style={{ display: 'none' }}
              />
            </label>

            {/* Delete Collection Button */}
            <button
              type="button"
              onClick={() => setShowDeleteCollectionConfirm(true)}
              disabled={deletingCollection}
              title="Delete this entire collection"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.875rem',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: deletingCollection ? 'not-allowed' : 'pointer'
              }}
            >
              {deletingCollection ? <Loader2 size={16} className="admin-spinner" /> : <Trash2 size={16} />}
              <span>{deletingCollection ? 'Deleting...' : 'Delete Collection'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toast Alert Notification */}
        {toastMessage && (
          <div
            style={{
              padding: '0.875rem 1.75rem',
              backgroundColor: toastMessage.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: toastMessage.type === 'error' ? '#dc2626' : '#16a34a',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Modal Body: Image Grid */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', color: '#64748b', gap: '0.75rem' }}>
              <Loader2 size={24} className="admin-spinner" />
              <span>Loading collection photos...</span>
            </div>
          ) : error ? (
            <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '12px', textAlign: 'center' }}>
              <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
              <p>{error}</p>
              <button onClick={fetchCollectionImages} className="btn btn--secondary btn--sm" style={{ marginTop: '0.75rem' }}>
                Retry
              </button>
            </div>
          ) : images.length === 0 ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>
              <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <h3 style={{ color: '#0f172a', fontSize: '1.125rem' }}>No photos in this collection yet</h3>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Use the "Add Photos" button above to upload images.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {images.map((img) => {
                const isDeleting = deletingId === img.id
                return (
                  <div
                    key={img.id}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      opacity: isDeleting ? 0.5 : 1,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '150px', backgroundColor: '#e2e8f0' }}>
                      <img
                        src={resolveImageUrl(img.thumbnailUrl)}
                        alt={img.alt}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* Image Action Buttons Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(15, 23, 42, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          opacity: 0,
                          transition: 'opacity 0.2s ease-in-out'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '0')}
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewImage(img)}
                          title="Preview full photo"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPhotoToDelete(img)}
                          disabled={isDeleting}
                          title="Delete photo"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isDeleting ? <Loader2 size={16} className="admin-spinner" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: '#334155',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={img.title}
                      >
                        {img.title}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPhotoToDelete(img)}
                        disabled={isDeleting}
                        title="Delete photo"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Full Photo Preview Modal */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={28} />
          </button>
          <img
            src={resolveImageUrl(previewImage.largeUrl)}
            alt={previewImage.title}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!photoToDelete}
        title="Delete Photo"
        itemName={photoToDelete?.title}
        message="Are you sure you want to permanently delete this photo? This action cannot be undone."
        isLoading={deletingId === photoToDelete?.id}
        onConfirm={() => executeDeletePhoto(photoToDelete)}
        onClose={() => setPhotoToDelete(null)}
      />

      {/* Delete Entire Collection Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteCollectionConfirm}
        title="Delete Entire Collection"
        itemName={collection?.name}
        message={`This will permanently delete "${collection?.name}" and ALL photos inside it. This action cannot be undone.`}
        isLoading={deletingCollection}
        onConfirm={executeDeleteEntireCollection}
        onClose={() => setShowDeleteCollectionConfirm(false)}
      />
    </div>
  )
}
