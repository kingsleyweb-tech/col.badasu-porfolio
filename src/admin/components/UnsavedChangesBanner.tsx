import React from 'react'
import { AlertTriangle, Save, RotateCcw } from 'lucide-react'

interface UnsavedChangesBannerProps {
  isDirty: boolean
  onSave?: () => void
  onReset?: () => void
  isSaving?: boolean
}

export const UnsavedChangesBanner: React.FC<UnsavedChangesBannerProps> = ({
  isDirty,
  onSave,
  onReset,
  isSaving = false
}) => {
  if (!isDirty) return null

  return (
    <div
      style={{
        backgroundColor: '#fffbebfb',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '0.875rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.08)',
        animation: 'fadeIn 0.2s ease-in-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#b45309' }}>
        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          You have unsaved changes on this page.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving}
            style={{
              padding: '0.4rem 0.875rem',
              backgroundColor: '#ffffff',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <RotateCcw size={14} />
            <span>Discard</span>
          </button>
        )}

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            style={{
              padding: '0.4rem 1rem',
              backgroundColor: '#1f5c3a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
