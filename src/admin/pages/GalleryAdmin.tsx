import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  UploadCloud, CheckCircle2, Loader2, RefreshCw, ImageIcon,
  AlertCircle, FolderOpen, Zap, X, Image as ImageIcon2, Trash2
} from 'lucide-react'
import { CollectionDetailModal, type CollectionItem } from '../components/CollectionDetailModal'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { resolveImageUrl } from '../../utils/imageResolver'
import { useUpload } from '../../context/UploadContext'
import { deleteGalleryCollectionFromFirestore, fetchFirestoreCollections } from '../../services/galleryFirestore'

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

  const fetchCollections = useCallback(async () => {
    setLoadingCollections(true)
    setCollectionsError(null)
    try {
      // Fetch from both Cloudinary API and Firestore for completeness
      const [res, fsCols] = await Promise.all([
        fetch('/api/gallery').catch(() => null),
        fetchFirestoreCollections().catch(() => [])
      ])

      let apiCols: CollectionItem[] = []
      if (res && res.ok) {
        const data = await res.json()
        apiCols = data.collections || []
      }

      // Merge Cloudinary collections with Firestore collections
      const colMap = new Map<string, CollectionItem>()
      apiCols.forEach((c) => colMap.set(c.slug, c))

      fsCols.forEach((fc) => {
        if (!colMap.has(fc.slug)) {
          colMap.set(fc.slug, {
            slug: fc.slug,
            name: fc.name,
            count: fc.count,
            coverImage: fc.coverImage
          })
        } else {
          // Sync count if higher in Firestore
          const existing = colMap.get(fc.slug)!
          if (fc.count > (existing.count || 0)) {
            existing.count = fc.count
          }
        }
      })

      setCollections(Array.from(colMap.values()))
    } catch {
      setCollectionsError('Could not load collections. Check your network or API credentials.')
    } finally {
      setLoadingCollections(false)
    }
  }, [])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  // REQUIREMENT 12 & 13 & 15: Complete & Persistent Collection Deletion
  const executeDeleteCollection = async (col: CollectionItem | null) => {
    if (!col) return
    setDeletingSlug(col.slug)
    setMessage(null)

    try {
      // 1. Delete Cloudinary folder and assets
      const res = await fetch('/api/delete-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: col.name, slug: col.slug })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.warn('Cloudinary collection delete response warning:', err.error)
      }

      // 2. REQUIREMENT 15 & 16: Delete all Firestore records and collection document permanently!
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Gallery Management</h1>
          <p>Upload, organize and manage your photo collections with sequential uploads and instant saving.</p>
        </div>
        <button
          type="button"
          className="btn btn--outline"
          onClick={fetchCollections}
          disabled={loadingCollections}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={16} className={loadingCollections ? 'admin-spinner' : ''} />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`admin-alert ${messageType === 'error' ? 'is-error' : 'is-success'}`}>
          {messageType === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message}</span>
          <button type="button" className="admin-alert__close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {justStarted && (
        <div className="admin-alert is-success" style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1e40af' }}>
          <Zap size={18} />
          <span>
            <strong>Sequential Upload started!</strong> Images process one by one with immediate saving. You can minimize the progress panel and continue browsing.
          </span>
        </div>
      )}

      <div className="admin-dashboard-grid">
        {/* Left: Upload Form */}
        <div className="admin-dashboard-main">
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Create New Collection</h3>
              <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={13} style={{ color: '#f59e0b' }} />
                Sequential Queue · Auto-Compress · Immediate Save
              </span>
            </div>

            <form onSubmit={handleBatchUpload} className="admin-form">
              <div className="admin-form-group">
                <label>Collection Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Field Operations"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Description (optional)</label>
                <textarea
                  placeholder="Brief description about this collection..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Drop Zone */}
              <div
                className="admin-dropzone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <UploadCloud size={36} className="admin-dropzone__icon" />
                <strong>Click to select or drag images here</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
                  JPG, PNG, WEBP — auto-optimized for fast sequential upload
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelection}
                  className="admin-dropzone__input"
                />
              </div>

              {/* Image Preview Grid */}
              {previewFiles.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                      {previewFiles.length} image{previewFiles.length !== 1 ? 's' : ''} selected
                      <span style={{ fontWeight: 400, color: '#64748b', marginLeft: '6px' }}>
                        ({formatSize(totalSize)} total)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={clearAll}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.78rem',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: '2px 6px',
                      }}
                    >
                      Clear all
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: '10px',
                      maxHeight: '340px',
                      overflowY: 'auto',
                      padding: '4px',
                    }}
                  >
                    {previewFiles.map((pf, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          aspectRatio: '1',
                        }}
                      >
                        <img
                          src={pf.previewUrl}
                          alt={pf.file.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(15,23,42,0.7)',
                            color: '#fff',
                            fontSize: '9px',
                            padding: '3px 5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {pf.file.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePreview(i)}
                          title="Remove this image"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            padding: 0,
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}

                    <label
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: '#f8fafc',
                        aspectRatio: '1',
                        color: '#64748b',
                        fontSize: '11px',
                        gap: '4px',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <ImageIcon2 size={20} />
                      <span>Add more</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelection}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn--primary admin-btn-block"
                disabled={previewFiles.length === 0}
              >
                <UploadCloud size={18} />
                <span>
                  UPLOAD {previewFiles.length > 0 ? `${previewFiles.length} IMAGES` : 'COLLECTION'}
                </span>
              </button>

              <p style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', textAlign: 'center', margin: '6px 0 0' }}>
                Images upload one by one with live per-image progress and background saving
              </p>
            </form>
          </div>
        </div>

        {/* Right: Live Collections List */}
        <div className="admin-dashboard-sidebar">
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Gallery Collections</h3>
              {!loadingCollections && (
                <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                  {collections.length} collection{collections.length !== 1 ? 's' : ''} (Click to manage)
                </span>
              )}
            </div>

            {loadingCollections ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px 0', color: 'var(--admin-text-muted)' }}>
                <Loader2 size={20} className="admin-spinner" />
                <span>Loading collections...</span>
              </div>
            ) : collectionsError ? (
              <div style={{ padding: '16px', background: 'rgba(220,38,38,0.08)', borderRadius: '8px', color: '#ef4444', fontSize: '14px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {collectionsError}
              </div>
            ) : collections.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p>No collections found.</p>
              </div>
            ) : (
              <div className="admin-collection-list-vertical">
                {collections.map((col) => (
                  <div
                    key={col.slug}
                    className="admin-collection-row"
                    onClick={() => setSelectedCollection(col)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      {col.coverImage ? (
                        <img
                          src={resolveImageUrl(col.coverImage.thumbnailUrl)}
                          alt={col.coverImage.alt}
                          style={{ width: '52px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, border: '1px solid var(--admin-border)' }}
                        />
                      ) : (
                        <div style={{ width: '52px', height: '40px', borderRadius: '6px', background: 'var(--admin-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ImageIcon size={18} style={{ opacity: 0.4 }} />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: '13px', lineHeight: '1.3', whiteSpace: 'normal', color: '#0f172a' }}>
                          {col.name}
                        </strong>
                        <small style={{ color: 'var(--admin-text-muted)' }}>{col.count} images • Click to edit</small>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedCollection(col) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', fontSize: '12px' }}
                      >
                        <FolderOpen size={14} />
                        <span>Manage</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCollectionToDelete(col)
                        }}
                        disabled={deletingSlug === col.slug}
                        title="Delete collection permanently"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          fontSize: '12px',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: deletingSlug === col.slug ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {deletingSlug === col.slug ? (
                          <Loader2 size={13} className="admin-spinner" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCollection && (
        <CollectionDetailModal
          collection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
          onCollectionUpdated={fetchCollections}
        />
      )}

      {/* REQUIREMENT 14: Confirmation modal before deletion */}
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
