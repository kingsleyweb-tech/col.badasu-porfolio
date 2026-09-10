import React, { useState } from 'react'
import { UploadCloud, Trash2, CheckCircle2, Loader2 } from 'lucide-react'

export const GalleryAdmin: React.FC = () => {
  const [collectionName, setCollectionName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  const [existingCollections, setExistingCollections] = useState([
    { name: 'Field Reconnaissance & Tactical Surveys', slug: 'recce', count: 14 },
    { name: 'Military Honors & Ceremonies', slug: 'military', count: 45 },
    { name: 'Tactical Expeditions & Field Adventures', slug: 'adventure', count: 32 },
    { name: 'ECOWAS Peace Support Operations', slug: 'ecowas', count: 28 },
    { name: 'Ghana Boundary Commission Services', slug: 'boundary', count: 41 }
  ])

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleBatchUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!collectionName || selectedFiles.length === 0) {
      setMessage('Please enter a collection name and select images.')
      return
    }

    setUploading(true)
    setProgress(5)
    setMessage('Uploading batch images to Cloudinary...')

    try {
      const folderSlug = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const reader = new FileReader()
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64Data,
            folder: folderSlug,
            filename: file.name
          })
        })

        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
      }

      setExistingCollections((prev) => [
        { name: collectionName, slug: folderSlug, count: selectedFiles.length },
        ...prev
      ])

      setMessage(`Successfully uploaded ${selectedFiles.length} photos to collection "${collectionName}"!`)
      setCollectionName('')
      setSelectedFiles([])
    } catch {
      setMessage('An error occurred during Cloudinary bulk upload.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Military Journey & Gallery Management</h1>
          <p>Create gallery collections and bulk upload multiple photos directly to Cloudinary.</p>
        </div>
      </div>

      {message && (
        <div className="admin-alert is-success">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button type="button" className="admin-alert__close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="admin-dashboard-grid">
        {/* Bulk Upload Form */}
        <div className="admin-dashboard-main">
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Bulk Image Uploader (5 to 100+ Images)</h3>
            </div>

            <form onSubmit={handleBatchUpload} className="admin-form">
              <div className="admin-form-group">
                <label>Collection Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tactical Reconnaissance 2026"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  required
                />
              </div>

              <div className="admin-dropzone">
                <UploadCloud size={40} className="admin-dropzone__icon" />
                <strong>Select Multiple Images (5, 20, 50, 100+)</strong>
                <p>Click to browse or drag and drop image files</p>
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
                  <strong>Selected {selectedFiles.length} images for bulk upload:</strong>
                  <div className="admin-file-chips-scroll">
                    {selectedFiles.map((file, i) => (
                      <span key={i} className="admin-file-chip">
                        {file.name}
                      </span>
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
                    <span>Uploading Batch...</span>
                  </>
                ) : (
                  <span>Upload Collection to Cloudinary</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Collections List */}
        <div className="admin-dashboard-sidebar">
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Gallery Collections</h3>
            </div>

            <div className="admin-collection-list-vertical">
              {existingCollections.map((col, idx) => (
                <div key={idx} className="admin-collection-row">
                  <div>
                    <strong>{col.name}</strong>
                    <small>{col.count} photographs</small>
                  </div>
                  <button
                    type="button"
                    className="admin-icon-btn is-danger"
                    onClick={() => {
                      if (window.confirm(`Delete collection "${col.name}"?`)) {
                        setExistingCollections(existingCollections.filter((_, i) => i !== idx))
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
