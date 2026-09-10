import React, { useState, useEffect, useCallback } from 'react'
import { UploadCloud, CheckCircle2, Loader2, RefreshCw, ImageIcon, AlertCircle } from 'lucide-react'

interface Collection {
  slug: string
  name: string
  count: number
  coverImage?: {
    thumbnailUrl: string
    alt: string
  }
}

export const GalleryAdmin: React.FC = () => {
  const [collectionName, setCollectionName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const [collections, setCollections] = useState<Collection[]>([])
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)

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

  const handleBatchUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!collectionName.trim() || selectedFiles.length === 0) {
      setMessage('Please enter a collection name and select at least one image.')
      setMessageType('error')
      return
    }

    setUploading(true)
    setProgress(0)
    setMessage(null)

    try {
      const folderSlug = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      let uploadedCount = 0

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const reader = new FileReader()
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64Data, folder: folderSlug, filename: file.name })
        })

        if (res.ok) uploadedCount++
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
      }

      setMessage(`Successfully uploaded ${uploadedCount} of ${selectedFiles.length} photos to "${collectionName}"!`)
      setMessageType('success')
      setCollectionName('')
      setDescription('')
      setSelectedFiles([])
      setTimeout(() => fetchCollections(), 1500)
    } catch {
      setMessage('An error occurred during upload. Please try again.')
      setMessageType('error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Gallery Management</h1>
          <p>Upload, organize and manage your photo collections from Cloudinary.</p>
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

      <div className="admin-dashboard-grid">
        {/* Left: Upload Form */}
        <div className="admin-dashboard-main">
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Create New Collection</h3>
              <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                Upload multiple images and create a collection.
              </span>
            </div>

            <form onSubmit={handleBatchUpload} className="admin-form">
              <div className="admin-form-group">
                <label>Collection Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Military Journey"
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
                <small style={{ color: 'var(--admin-text-muted)' }}>Supports JPG, PNG, WEBP. Max 10MB each</small>
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

              {uploading && (
                <div className="admin-progress-container">
                  <div className="admin-progress-bar" style={{ width: `${progress}%` }} />
                  <span>Uploading to Cloudinary ({progress}%)...</span>
                </div>
              )}

              <button type="submit" className="btn btn--primary admin-btn-block" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 size={18} className="admin-spinner" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>UPLOAD COLLECTION</span>
                )}
              </button>
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
                  {collections.length} collection{collections.length !== 1 ? 's' : ''} on Cloudinary
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
                  <div key={col.slug} className="admin-collection-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      {col.coverImage ? (
                        <img
                          src={col.coverImage.thumbnailUrl}
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
                        <strong style={{ display: 'block', fontSize: '13px', lineHeight: '1.3', whiteSpace: 'normal' }}>
                          {col.name}
                        </strong>
                        <small style={{ color: 'var(--admin-text-muted)' }}>{col.count} images</small>
                      </div>
                    </div>
                    <a
                      href={`/gallery/${col.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-icon-btn"
                      title="View on site"
                      style={{ flexShrink: 0, textDecoration: 'none' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
