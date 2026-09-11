import React from 'react'
import { CheckCircle2, X, AlertCircle, Loader2, UploadCloud } from 'lucide-react'
import { useUpload, type BatchUpload } from '../../context/UploadContext'

function OverallProgress(batch: BatchUpload) {
  const total = batch.files.length
  if (total === 0) return 0
  const sum = batch.files.reduce((acc, f) => acc + f.progress, 0)
  return Math.round(sum / total)
}

export const GlobalUploadToast: React.FC = () => {
  const { batches, dismissBatch } = useUpload()

  // Only show batches that are in progress or recently finished
  const visible = batches.filter((b) => {
    if (!b.done) return true
    // Keep finished batches visible for 8 seconds
    return Date.now() - b.startedAt < 60_000
  })

  if (visible.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99998,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
        width: 'calc(100vw - 40px)',
      }}
    >
      {visible.map((batch) => {
        const overall = OverallProgress(batch)
        const doneCount = batch.files.filter((f) => f.status === 'done').length
        const errorCount = batch.files.filter((f) => f.status === 'error').length
        const total = batch.files.length
        const uploadingCount = batch.files.filter((f) => f.status === 'uploading').length

        return (
          <div
            key={batch.id}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              animation: 'slideInRight 0.3s ease',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px 10px',
                background: batch.done ? '#f0fdf4' : '#eff6ff',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: batch.done ? '#16a34a' : '#2563eb',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {batch.done ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <UploadCloud size={18} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {batch.collectionName}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                  {batch.done
                    ? `${doneCount} uploaded${errorCount > 0 ? `, ${errorCount} failed` : ''}`
                    : `${doneCount}/${total} done · ${uploadingCount} uploading`}
                </div>
              </div>
              {batch.done && (
                <button
                  type="button"
                  onClick={() => dismissBatch(batch.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '4px',
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Overall progress bar */}
            <div style={{ padding: '10px 14px 6px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                  color: '#64748b',
                  marginBottom: '5px',
                  fontWeight: 600,
                }}
              >
                <span>{batch.done ? 'Complete' : 'Uploading to Cloudinary...'}</span>
                <span style={{ color: batch.done ? '#16a34a' : '#2563eb', fontWeight: 700 }}>
                  {overall}%
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  background: '#e2e8f0',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: overall + '%',
                    background: batch.done
                      ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                      : 'linear-gradient(90deg, #2563eb, #60a5fa)',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Per-file list (max 5 shown) */}
            <div style={{ padding: '4px 14px 12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {batch.files.slice(0, 6).map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.72rem',
                    color: '#475569',
                  }}
                >
                  {/* Status icon */}
                  {file.status === 'done' && <CheckCircle2 size={12} style={{ color: '#16a34a', flexShrink: 0 }} />}
                  {file.status === 'error' && <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />}
                  {file.status === 'uploading' && <Loader2 size={12} style={{ color: '#2563eb', flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
                  {file.status === 'pending' && (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                  )}

                  {/* Filename */}
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: file.status === 'error' ? '#ef4444' : '#475569',
                    }}
                  >
                    {file.name}
                  </span>

                  {/* Mini progress */}
                  {file.status === 'uploading' && (
                    <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>
                      {file.progress}%
                    </span>
                  )}
                  {file.status === 'done' && (
                    <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  )}
                </div>
              ))}
              {batch.files.length > 6 && (
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', paddingLeft: '20px' }}>
                  +{batch.files.length - 6} more files...
                </div>
              )}
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
