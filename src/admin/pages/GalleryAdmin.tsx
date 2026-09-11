import React, { useState, useEffect, useCallback } from 'react'
import { UploadCloud, CheckCircle2, Loader2, RefreshCw, ImageIcon, AlertCircle, FolderOpen, Zap } from 'lucide-react'
import { CollectionDetailModal, type CollectionItem } from '../components/CollectionDetailModal'
import { resolveImageUrl } from '../../utils/imageResolver'
import { useUpload } from '../../context/UploadContext'

export const GalleryAdmin: React.FC = () => {
  const { startBatchUpload } = useUpload()

  const [collectionName, setCollectionName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [justStarted, setJustStarted] = useState(false)

  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null)

  const fetchCollections = useCallback(async () => {
    setLoadingCollections(true)
    setCollectionsError(null)
    try {
      const res = await fetch('/api/gallery')
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      setCollections(data.collections || [])
    } catch {
      setCollectionsError('Could not load collections from Cloudinary. Check your API credentials.')
    } finally {
      setLoadingCollections(false)
    }
  }, [])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    setSelectedFiles(files)
  }

  const handleBatchUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!collectionName.trim() || selectedFiles.length === 0) {
      setMessage('Please enter a collection name and select at least one image.')
      setMessageType('error')
      return
    }

    const folderSlug = collectionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Fire-and-forget — global context handles progress tracking
    startBatchUpload(collectionName, folderSlug, selectedFiles, (uploaded, total) => {
      setMessage(`Successfully uploaded ${uploaded} of ${total} photos to "${collectionName}"!`)
      setMessageType('success')
      setTimeout(() => fetchCollections(), 2000)
    })

    // Reset form immediately so user can navigate away
    setCollectionName('')
    setDescription('')
    setSelectedFiles([])
    setJustStarted(true)
    setTimeout(() => setJustStarted(false), 3000)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Gallery Management</h1>
          <p>Upload, organize and manage your photo collections from Cloudinary. Click any collection to view, add or delete photos.</p>
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
          <button type="button" className="admin-alert__close" onClick={() => setMessage(null)}>x</button>
        </div>
      )}

      {justStarted && (
        <div className="admin-alert is-success" style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1e40af' }}>
          <Zap size={18} />
          <span>
            <strong>Upload started!</strong> You can freely navigate to other pages — the upload will continue in the background and show progress in the bottom-right corner.
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
                Parallel upload · navigate freely
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
                  rows={3}
                />
              </div>

              <div
                className="admin-dropzone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <UploadCloud size={40} className="admin-dropzone__icon" />
                <strong>Select multiple images</strong>
                <p>or drag and drop here</p>
                <small style={{ color: 'var(--admin-text-muted)' }}>
                  Supports JPG, PNG, WEBP. Auto-compressed for fast upload.
                </small>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelection}
                  className="admin-dropzone__input"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="admin-file-summary">
                  <strong>Selected {selectedFiles.length} images:</strong>
                  <div className="admin-file-chips-scroll">
                    {selectedFiles.map((file, i) => (
                      <span key={i} className="admin-file-chip">{file.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn--primary admin-btn-block">
                <UploadCloud size={18} />
                <span>UPLOAD COLLECTION</span>
              </button>

              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textAlign: 'center', margin: '8px 0 0' }}>
                Images are compressed & uploaded in parallel (4 at a time). You can navigate away anytime.
              </p>
            </form>
          </div>
        </div>

        {/* Right: Live Collections from Cloudinary */}
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
                <span>Loading collections from Cloudinary...</span>
              </div>
            ) : collectionsError ? (
              <div style={{ padding: '16px', background: 'rgba(220,38,38,0.08)', borderRadius: '8px', color: '#ef4444', fontSize: '14px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {collectionsError}
              </div>
            ) : collections.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p>No collections found in Cloudinary.</p>
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
                          style={{
                            width: '52px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            flexShrink: 0,
                            border: '1px solid var(--admin-border)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '52px', height: '40px', borderRadius: '6px',
                          background: 'var(--admin-bg-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
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

                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCollection(col)
                      }}
                      style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px' }}
                    >
                      <FolderOpen size={14} />
                      <span>Manage</span>
                    </button>
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
    </div>
  )
}
