import React, { useState } from 'react'
import { Upload, Trash2, RefreshCw, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { resolveImageUrl } from '../../utils/imageResolver'
import { uploadImageToCloudinary, deleteCloudinaryImageIfUnused } from '../../services/imageManager'
import { usePortfolio } from '../../context/PortfolioContext'

interface ImageReplacerProps {
  label: string
  currentUrl: string
  folder?: string
  aspectRatioHint?: string
  onImageReplaced: (newUrl: string, publicId: string) => Promise<void>
  onImageDeleted?: () => Promise<void>
  disabled?: boolean
}

export const ImageReplacer: React.FC<ImageReplacerProps> = ({
  label,
  currentUrl,
  folder = 'uploads',
  aspectRatioHint = 'Recommended: High resolution PNG/JPG',
  onImageReplaced,
  onImageDeleted,
  disabled = false
}) => {
  const { data } = usePortfolio()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 15MB.')
      return
    }

    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
  }

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setErrorMsg(null)
  }

  const handleReplaceAndSave = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const oldUrl = currentUrl

    try {
      // 1. Upload to Cloudinary
      const uploadRes = await uploadImageToCloudinary(selectedFile, folder)
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Failed to upload image to Cloudinary.')
      }

      // 2. Update Firestore & Context state with new image URL
      await onImageReplaced(uploadRes.url, uploadRes.publicId)

      // 3. Clean up old Cloudinary image if unused elsewhere
      if (oldUrl && oldUrl !== uploadRes.url) {
        await deleteCloudinaryImageIfUnused(oldUrl, data)
      }

      setSuccessMsg('Image replaced & saved permanently.')
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err: any) {
      setErrorMsg(err.message || 'Image replacement failed. Existing image preserved.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!onImageDeleted) return
    setIsUploading(true)
    setErrorMsg(null)
    const oldUrl = currentUrl
    try {
      await onImageDeleted()
      if (oldUrl) {
        await deleteCloudinaryImageIfUnused(oldUrl, data)
      }
      setSuccessMsg('Image reference removed permanently.')
      setShowConfirmDelete(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove image.')
    } finally {
      setIsUploading(false)
    }
  }

  const activeDisplayUrl = previewUrl || (currentUrl ? resolveImageUrl(currentUrl) : '')

  return (
    <div className="admin-card" style={{ marginBottom: '20px' }}>
      <div className="admin-card__header">
        <div>
          <h3>{label}</h3>
          <p>{aspectRatioHint}</p>
        </div>
        {currentUrl && onImageDeleted && !previewUrl && (
          <button
            type="button"
            className="admin-icon-btn is-danger"
            onClick={() => setShowConfirmDelete(true)}
            disabled={disabled || isUploading}
            title="Delete current image"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="admin-status-card" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b', marginBottom: '16px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="admin-status-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', marginBottom: '16px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Image Preview & Replacement Box */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) 1fr', gap: '20px', alignItems: 'center' }}>
        {/* Preview Frame */}
        <div
          style={{
            position: 'relative',
            height: '180px',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#f8fafc',
            border: previewUrl ? '2px solid #0e5c3e' : '1px solid #e2e8f0',
            display: 'flex',
            align-items: 'center',
            justify-content: 'center'
          }}
        >
          {activeDisplayUrl ? (
            <img
              src={activeDisplayUrl}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <ImageIcon size={36} style={{ margin: '0 auto 6px auto', display: 'block' }} />
              <span style={{ fontSize: '0.8rem' }}>No image set</span>
            </div>
          )}

          {previewUrl && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                background: '#0e5c3e',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px'
              }}
            >
              NEW PREVIEW
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!previewUrl ? (
            <div>
              <label className="btn btn--secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} />
                <span>Select New Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={disabled || isUploading}
                />
              </label>
              {currentUrl && (
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', wordBreak: 'break-all' }}>
                  <strong>Current:</strong> {currentUrl}
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleReplaceAndSave}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 size={16} className="admin-spinner" /> : <Upload size={16} />}
                <span>{isUploading ? 'Uploading & Replacing...' : 'Replace & Save Image'}</span>
              </button>

              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleCancel}
                disabled={isUploading}
              >
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showConfirmDelete && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            background: '#fff5f5',
            border: '1px solid #feb2b2',
            borderRadius: '8px',
            display: 'flex',
            align-items: 'center',
            justify-content: 'space-between',
            gap: '16px'
          }}
        >
          <div>
            <strong style={{ color: '#9b2c2c', fontSize: '0.875rem' }}>Confirm Image Deletion</strong>
            <p style={{ fontSize: '0.8rem', color: '#742a2a', margin: '2px 0 0 0' }}>
              Are you sure you want to remove this image reference? This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn--sm"
              style={{ background: '#e53e3e', color: '#ffffff' }}
              onClick={handleDelete}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 size={14} className="admin-spinner" /> : 'Yes, Delete'}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setShowConfirmDelete(false)}
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
