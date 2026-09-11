import React from 'react'
import {
  CheckCircle2, X, AlertCircle, Loader2, UploadCloud,
  Minimize2, Maximize2, Ban, RotateCcw, Zap
} from 'lucide-react'
import { useUpload, type BatchUpload } from '../../context/UploadContext'

function calculateOverallProgress(batch: BatchUpload): number {
  const total = batch.files.length
  if (total === 0) return 0
  const sum = batch.files.reduce((acc, f) => acc + (f.progress || 0), 0)
  return Math.round(sum / total)
}

export const GlobalUploadToast: React.FC = () => {
  const { batches, cancelBatchUpload, toggleMinimize, retryFailedInBatch, dismissBatch } = useUpload()

  const visibleBatches = batches.filter((b) => {
    if (!b.done) return true
    // Keep finished/cancelled batches visible for 60 seconds unless dismissed
    return Date.now() - b.startedAt < 60_000
  })

  if (visibleBatches.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99998,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '420px',
        width: 'calc(100vw - 32px)',
        pointerEvents: 'none' // allow click-through around modal
      }}
    >
      {visibleBatches.map((batch) => {
        const overall = calculateOverallProgress(batch)
        const total = batch.files.length
        const doneCount = batch.files.filter((f) => f.status === 'done').length
        const errorCount = batch.files.filter((f) => f.status === 'error').length
        const cancelledCount = batch.files.filter((f) => f.status === 'cancelled').length
        const activeFile = batch.files.find((f) => f.status === 'uploading') || batch.files[batch.activeFileIndex]
        const isRunning = !batch.done && !batch.cancelled

        // ── MINIMIZED VIEW ──────────────────────────────────────────────────
        if (batch.isMinimized) {
          return (
            <div
              key={batch.id}
              onClick={() => toggleMinimize(batch.id)}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '10px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'slideInUp 0.25s ease-out',
                transition: 'transform 0.2s, box-shadow 0.2s',
                alignSelf: 'flex-end'
              }}
              className="admin-minimized-toast"
              title="Click to expand upload progress"
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: batch.done
                    ? '#16a34a'
                    : batch.cancelled
                    ? '#ea580c'
                    : '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {batch.done ? (
                  <CheckCircle2 size={16} color="#fff" />
                ) : batch.cancelled ? (
                  <AlertCircle size={16} color="#fff" />
                ) : (
                  <UploadCloud size={16} color="#fff" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>↑ Uploading {doneCount}/{total}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>({overall}%)</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: '#334155', borderRadius: '99px', marginTop: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${overall}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                      borderRadius: '99px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              <Maximize2 size={15} style={{ opacity: 0.7, flexShrink: 0 }} />
            </div>
          )
        }

        // ── EXPANDED FULL PROGRESS PANEL ────────────────────────────────────
        return (
          <div
            key={batch.id}
            style={{
              pointerEvents: 'auto',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.35)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Panel Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: batch.done
                  ? (errorCount > 0 ? '#fff7ed' : '#f0fdf4')
                  : '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: batch.done
                      ? (errorCount > 0 ? '#f97316' : '#16a34a')
                      : '#1f5c3a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {batch.done ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <UploadCloud size={18} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {batch.collectionName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {isRunning && `Uploading ${doneCount + 1} of ${total}`}
                    {batch.done && !batch.cancelled && `Completed (${doneCount}/${total})`}
                    {batch.cancelled && `Cancelled (${doneCount}/${total} saved)`}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Minimize & Cancel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => toggleMinimize(batch.id)}
                  title="Minimize progress panel"
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Minimize2 size={13} />
                  <span>Minimize</span>
                </button>

                {isRunning && (
                  <button
                    type="button"
                    onClick={() => cancelBatchUpload(batch.id)}
                    title="Cancel remaining uploads"
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      color: '#dc2626',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Ban size={13} />
                    <span>Cancel</span>
                  </button>
                )}

                {batch.done && (
                  <button
                    type="button"
                    onClick={() => dismissBatch(batch.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Active Image Progress Section (REQUIREMENT 3: PER-IMAGE PROGRESS) */}
            {isRunning && activeFile && (
              <div style={{ padding: '14px 16px 8px', backgroundColor: '#fcfcfd' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      maxWidth: '240px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={activeFile.name}
                  >
                    Current: {activeFile.name}
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1f5c3a' }}>
                    {activeFile.progress}%
                  </span>
                </div>

                {/* Current Image Progress Bar */}
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${activeFile.progress}%`,
                      background: 'linear-gradient(90deg, #1f5c3a, #22c55e)',
                      borderRadius: '99px',
                      transition: 'width 0.2s ease-out'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Loader2 size={11} className="admin-spinner" style={{ color: '#1f5c3a' }} />
                    {activeFile.stageText || 'Uploading...'}
                  </span>
                  {batch.uploadSpeedText && (
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{batch.uploadSpeedText}</span>
                  )}
                </div>
              </div>
            )}

            {/* Overall Collection Progress Bar */}
            <div style={{ padding: '10px 16px 8px', borderTop: isRunning ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                <span>Overall Progress</span>
                <span style={{ color: batch.done ? '#16a34a' : '#1f5c3a', fontWeight: 700 }}>{overall}%</span>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${overall}%`,
                    background: batch.done ? '#16a34a' : '#1f5c3a',
                    borderRadius: '99px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              {/* Counts Summary */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ {doneCount} completed</span>
                <span>• {total - doneCount - errorCount - cancelledCount} remaining</span>
                {errorCount > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>✕ {errorCount} failed</span>}
              </div>
            </div>

            {/* Completion Summary & Retry Button */}
            {batch.done && (
              <div style={{ padding: '10px 16px 14px', backgroundColor: errorCount > 0 ? '#fff7ed' : '#f0fdf4', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: errorCount > 0 ? '#c2410c' : '#166534', marginBottom: errorCount > 0 ? '8px' : 0 }}>
                  {errorCount === 0 && !batch.cancelled && `✓ Upload Complete! ${doneCount} of ${total} images saved successfully.`}
                  {errorCount > 0 && `Completed with errors: ${doneCount} saved, ${errorCount} failed.`}
                  {batch.cancelled && `Upload cancelled. ${doneCount} completed images remain saved.`}
                </div>

                {errorCount > 0 && (
                  <button
                    type="button"
                    onClick={() => retryFailedInBatch(batch.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Retry Failed Images</span>
                  </button>
                )}
              </div>
            )}

            {/* Per-File List Snippet */}
            <div style={{ padding: '6px 16px 12px', maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', background: '#fafafa' }}>
              {batch.files.slice(0, 5).map((file) => (
                <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem' }}>
                  {file.status === 'done' && <CheckCircle2 size={12} style={{ color: '#16a34a', flexShrink: 0 }} />}
                  {file.status === 'error' && <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />}
                  {file.status === 'uploading' && <Zap size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                  {file.status === 'pending' && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />}
                  {file.status === 'cancelled' && <Ban size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />}

                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: file.status === 'error' ? '#ef4444' : file.status === 'done' ? '#166534' : '#475569'
                    }}
                  >
                    {file.name}
                  </span>

                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {file.status === 'done' ? '✓ Saved' : file.status === 'error' ? 'Failed' : file.status === 'cancelled' ? 'Cancelled' : `${file.progress}%`}
                  </span>
                </div>
              ))}
              {batch.files.length > 5 && (
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', paddingLeft: '20px' }}>
                  +{batch.files.length - 5} more images in queue...
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
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .admin-minimized-toast:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  )
}
