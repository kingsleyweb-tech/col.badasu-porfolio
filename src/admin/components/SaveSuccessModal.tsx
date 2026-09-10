import React, { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

interface SaveSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  autoHideMs?: number
}

export const SaveSuccessModal: React.FC<SaveSuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Save Successful',
  message = 'Your changes have been saved and applied to the live website.',
  autoHideMs = 3500
}) => {
  useEffect(() => {
    if (isOpen && autoHideMs > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, autoHideMs)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoHideMs, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}
        >
          <CheckCircle2 size={32} />
        </div>

        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 0.5rem 0'
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            margin: 0,
            lineHeight: '1.5'
          }}
        >
          {message}
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: '1.5rem',
            padding: '0.625rem 1.75rem',
            backgroundColor: '#1f5c3a',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#16432b')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1f5c3a')}
        >
          Done
        </button>
      </div>
    </div>
  )
}
