import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Printer } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { QR_PORTFOLIO_URL } from '../config/qrConfig'
import { officer } from '../data/officerData'

type QrModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function QrModal({ isOpen, onClose }: QrModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  if (!isOpen) return null

  const downloadQrCode = () => {
    const canvas = document.getElementById('qr-modal-canvas') as HTMLCanvasElement
    if (!canvas) return
    const pngUrl = canvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = 'colonel-badasu-portfolio-qr.png'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const printQrCode = () => {
    window.print()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  // We mount the overlay inside a portal or inline. Inline is fine, but print layout uses portal.
  return (
    <>
      <div 
        className="qr-modal-overlay" 
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        <div className="qr-modal" ref={modalRef}>
          <button 
            className="qr-modal__close-btn" 
            type="button" 
            aria-label="Close modal" 
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
          
          <h2 id="qr-modal-title" className="qr-modal__title">{officer.rank} {officer.name}</h2>
          <p className="qr-modal__subtitle">Scan to visit this portfolio</p>
          
          <div className="qr-modal__code-container">
            <QRCodeCanvas
              id="qr-modal-canvas"
              value={QR_PORTFOLIO_URL}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <p className="qr-modal__url">{QR_PORTFOLIO_URL}</p>

          <div className="qr-modal__actions">
            <button className="btn btn--primary" type="button" onClick={downloadQrCode}>
              <Download size={16} aria-hidden="true" /> Download QR Code
            </button>
            <button className="btn btn--secondary" type="button" onClick={printQrCode}>
              <Printer size={16} aria-hidden="true" /> Print QR Code
            </button>
            <button className="btn btn--text" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Portal for print-only layout placed directly under document.body */}
      {createPortal(
        <div className="print-only-layout" aria-hidden="true">
          <div className="print-layout-content">
            <h1 className="print-title">{officer.rank.toUpperCase()} {officer.name.toUpperCase()}</h1>
            <p className="print-description">Scan to visit the official portfolio</p>
            <div className="print-qr-code">
              <QRCodeCanvas
                value={QR_PORTFOLIO_URL}
                size={340}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p className="print-url">{QR_PORTFOLIO_URL}</p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
