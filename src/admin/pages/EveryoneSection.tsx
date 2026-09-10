import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Save,
  FileText,
  ImageIcon,
  Clock,
  Circle,
  Plus,
  MoreVertical,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  Sliders,
  Settings,
  CheckCircle2,
  Loader2,
  Image as ImageFileIcon
} from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const EveryoneSection: React.FC = () => {
  const { updatePortfolio } = usePortfolio()
  const [activeTab, setActiveTab] = useState<'collections' | 'all' | 'history'>('collections')

  // Create Collection Form state
  const [collectionName, setCollectionName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [savingGlobal, setSavingGlobal] = useState(false)

  // Default demo collections matching Reference Image 1
  const [collections, setCollections] = useState([
    {
      slug: 'military-journey',
      name: 'Military Journey',
      count: 45,
      cover: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_600/colonel-badasu/site/hero/a1'
    },
    {
      slug: 'leadership',
      name: 'Leadership',
      count: 32,
      cover: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_600/colonel-badasu/site/hero/a4'
    },
    {
      slug: 'awards-decorations',
      name: 'Awards & Decorations',
      count: 28,
      cover: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_600/colonel-badasu/site/hero/a5'
    },
    {
      slug: 'official-events',
      name: 'Official Events',
      count: 41,
      cover: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_600/colonel-badasu/site/hero/graduation'
    },
    {
      slug: 'training-education',
      name: 'Training & Education',
      count: 36,
      cover: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_600/colonel-badasu/site/hero/ecowas'
    },
    {
      slug: 'personal-gallery',
      name: 'Personal Gallery',
      count: 22,
      cover: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_600/colonel-badasu/site/hero/tv3'
    },
    {
      slug: 'recce',
      name: 'Field Reconnaissance & Tactical Surveys',
      count: 14,
      cover: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_600/colonel-badasu/site/hero/boundary'
    }
  ])

  // Recent Images matching Reference Image 1
  const recentImages = [
    { name: 'IMG_20250815_1423.jpg', date: 'Aug 15, 2025', url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_400/colonel-badasu/site/hero/a1' },
    { name: 'IMG_20250814_1110.jpg', date: 'Aug 14, 2025', url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_400/colonel-badasu/site/hero/a4' },
    { name: 'IMG_20250810_0945.jpg', date: 'Aug 10, 2025', url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_400/colonel-badasu/site/hero/a5' },
    { name: 'IMG_20250802_1732.jpg', date: 'Aug 2, 2025', url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_400/colonel-badasu/site/hero/graduation' },
    { name: 'IMG_20250728_1201.jpg', date: 'Jul 28, 2025', url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_400/colonel-badasu/site/hero/ecowas' }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const handleUploadCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!collectionName.trim()) {
      setStatusMessage('Please enter a collection name.')
      return
    }

    setUploading(true)
    setStatusMessage('Uploading images to Cloudinary...')
    setUploadProgress(10)

    try {
      let uploadedCount = selectedFiles.length || 1
      let uploadedCover = 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_600/colonel-badasu/site/hero/a1'

      // Upload files via /api/upload
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const reader = new FileReader()

        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        const base64Data = await base64Promise

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64Data,
            folder: collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            filename: file.name
          })
        })

        if (res.ok) {
          const resData = await res.json()
          if (i === 0 && resData.url) {
            uploadedCover = resData.thumbnailUrl || resData.url
          }
        }
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 90))
      }

      setUploadProgress(100)

      // Add to collections list
      const newSlug = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const newCol = {
        slug: newSlug,
        name: collectionName,
        count: uploadedCount,
        cover: uploadedCover
      }

      setCollections((prev) => [newCol, ...prev])
      setStatusMessage(`Collection "${collectionName}" successfully created with ${uploadedCount} photos!`)
      setCollectionName('')
      setDescription('')
      setSelectedFiles([])
    } catch {
      setStatusMessage('Failed to upload images. Please check connection.')
    } finally {
      setUploading(false)
    }
  }

  const handleGlobalSave = async () => {
    setSavingGlobal(true)
    await updatePortfolio({})
    setTimeout(() => {
      setSavingGlobal(false)
      setStatusMessage('All portfolio changes saved and published live!')
    }, 600)
  }

  return (
    <div className="admin-page">
      {/* Top Header Banner */}
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <Users size={24} />
          </div>
          <div>
            <h1>Everyone Section</h1>
            <p>Manage all the content that appears on the website. Update information, images and settings from here. Changes will reflect on the live site immediately.</p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--primary admin-save-btn"
          onClick={handleGlobalSave}
          disabled={savingGlobal}
        >
          {savingGlobal ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{savingGlobal ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="admin-alert is-success" style={{ marginBottom: '24px' }}>
          <CheckCircle2 size={18} />
          <span>{statusMessage}</span>
          <button type="button" className="admin-alert__close" onClick={() => setStatusMessage(null)}>×</button>
        </div>
      )}

      {/* 4 Stat Cards Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon is-blue">
            <FileText size={20} />
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__title">Total Sections</span>
            <strong className="admin-stat-card__value">12</strong>
            <small className="admin-stat-card__meta">Website sections</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon is-green">
            <ImageIcon size={20} />
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__title">Images in Gallery</span>
            <strong className="admin-stat-card__value">238</strong>
            <small className="admin-stat-card__meta">Across 8 collections</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon is-purple">
            <Clock size={20} />
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__title">Last Updated</span>
            <strong className="admin-stat-card__value">Today, 2:45 PM</strong>
            <small className="admin-stat-card__meta">By Colonel Badasu</small>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon is-teal">
            <Circle size={20} />
          </div>
          <div className="admin-stat-card__content">
            <span className="admin-stat-card__title">Website Status</span>
            <strong className="admin-stat-card__value" style={{ color: '#16a34a' }}>● Live</strong>
            <small className="admin-stat-card__meta">All changes are published</small>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Gallery Management + Recent Images), Right Column (Create Collection + Quick Actions) */}
      <div className="admin-dashboard-grid">
        {/* Left Column */}
        <div className="admin-dashboard-main">
          {/* Gallery Management Card */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <ImageIcon size={20} className="text-emerald-600" />
                <div>
                  <h3>Gallery Management</h3>
                  <p>Upload, organize and manage your photo collections.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => document.getElementById('collection-form-scroll')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Plus size={16} />
                <span>Create Collection</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
              <button
                type="button"
                className={`admin-tab ${activeTab === 'collections' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('collections')}
              >
                Collections
              </button>
              <button
                type="button"
                className={`admin-tab ${activeTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Images
              </button>
              <button
                type="button"
                className={`admin-tab ${activeTab === 'history' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Upload History
              </button>
            </div>

            {/* Collection Grid */}
            <div className="admin-collection-grid">
              {collections.map((col) => (
                <div key={col.slug} className="admin-collection-card">
                  <div className="admin-collection-card__media">
                    <img src={col.cover} alt={col.name} />
                    <button type="button" className="admin-collection-card__menu" aria-label="Collection menu">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div className="admin-collection-card__body">
                    <strong>{col.name}</strong>
                    <span>{col.count} images</span>
                  </div>
                </div>
              ))}

              {/* Create New Collection Empty Card */}
              <div
                className="admin-collection-card is-create"
                onClick={() => document.getElementById('collection-form-scroll')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <div className="admin-collection-card__create-icon">
                  <Plus size={24} />
                </div>
                <strong>Create New Collection</strong>
              </div>
            </div>
          </div>

          {/* Recent Images Card */}
          <div className="admin-card" style={{ marginTop: '24px' }}>
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <ImageIcon size={20} />
                <div>
                  <h3>Recent Images</h3>
                  <p>Latest images uploaded to your gallery.</p>
                </div>
              </div>
              <Link to="/admin/gallery" className="admin-link">
                <span>View All</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="admin-recent-images-grid">
              {recentImages.map((img, idx) => (
                <div key={idx} className="admin-recent-image-card">
                  <div className="admin-recent-image-card__frame">
                    <img src={img.url} alt={img.name} />
                    <button type="button" className="admin-recent-image-card__menu">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <div className="admin-recent-image-card__body">
                    <strong>{img.name}</strong>
                    <small>{img.date}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="admin-dashboard-sidebar" id="collection-form-scroll">
          {/* Create New Collection Form */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3>Create New Collection</h3>
                <p>Upload multiple images and create a collection.</p>
              </div>
            </div>

            <form onSubmit={handleUploadCollection} className="admin-form">
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

              {/* Multi-Image Drag & Drop Area */}
              <div
                className="admin-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <UploadCloud size={36} className="admin-dropzone__icon" />
                <strong>Select multiple images</strong>
                <p>or drag and drop here</p>
                <small>Supports JPG, PNG, WEBP. Max 10MB each</small>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="admin-dropzone__input"
                  onChange={handleFileChange}
                />
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="admin-file-preview-list">
                  <div className="admin-file-preview-header">
                    <strong>Selected Images ({selectedFiles.length})</strong>
                    <button type="button" onClick={() => setSelectedFiles([])} className="admin-link-danger">
                      Clear All
                    </button>
                  </div>
                  <div className="admin-file-preview-chips">
                    {selectedFiles.slice(0, 5).map((f, i) => (
                      <div key={i} className="admin-file-chip">
                        <ImageFileIcon size={14} />
                        <span>{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {selectedFiles.length > 5 && (
                      <span className="admin-file-chip-more">+{selectedFiles.length - 5} more files</span>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="admin-progress-container">
                  <div className="admin-progress-bar" style={{ width: `${uploadProgress}%` }} />
                  <span>Uploading to Cloudinary... {uploadProgress}%</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn--primary admin-btn-block"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="admin-spinner" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload Collection</span>
                )}
              </button>
            </form>
          </div>

          {/* Quick Actions Card */}
          <div className="admin-card" style={{ marginTop: '24px' }}>
            <div className="admin-card__header">
              <h3>Quick Actions</h3>
            </div>

            <div className="admin-quick-actions-list">
              <Link to="/admin/hero" className="admin-quick-action-item">
                <div className="admin-quick-action-item__icon">
                  <Sliders size={18} />
                </div>
                <div className="admin-quick-action-item__body">
                  <strong>Edit Hero Section</strong>
                  <p>Update your main banner and introduction</p>
                </div>
                <ChevronRight size={16} />
              </Link>

              <Link to="/admin/settings" className="admin-quick-action-item">
                <div className="admin-quick-action-item__icon">
                  <ImageIcon size={18} />
                </div>
                <div className="admin-quick-action-item__body">
                  <strong>Update Logo</strong>
                  <p>Change the website logo in the header</p>
                </div>
                <ChevronRight size={16} />
              </Link>

              <Link to="/admin/settings" className="admin-quick-action-item">
                <div className="admin-quick-action-item__icon">
                  <Settings size={18} />
                </div>
                <div className="admin-quick-action-item__body">
                  <strong>Manage Site Settings</strong>
                  <p>General settings and preferences</p>
                </div>
                <ChevronRight size={16} />
              </Link>

              <a href="/" target="_blank" rel="noopener noreferrer" className="admin-quick-action-item">
                <div className="admin-quick-action-item__icon">
                  <ExternalLink size={18} />
                </div>
                <div className="admin-quick-action-item__body">
                  <strong>View Live Website</strong>
                  <p>Open your portfolio in a new tab</p>
                </div>
                <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
