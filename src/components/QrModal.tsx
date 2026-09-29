import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { QR_PORTFOLIO_URL } from '../config/qrConfig'
import { useBrand } from './site/brand'
import { IconClose, IconDownload, IconPrint } from './site/icons'

type QrModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function QrModal({ isOpen, onClose }: QrModalProps) {
  const { officer, logo, motto } = useBrand()
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const displayUrl = QR_PORTFOLIO_URL.replace(/^https?:\/\//, '')

  const downloadQrCode = () => {
    const canvas = document.getElementById('qr-modal-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'colonel-badasu-portfolio-qr.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(QR_PORTFOLIO_URL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link', QR_PORTFOLIO_URL)
    }
  }

  return (
    <>
      <div className="qm">
        <div className="dim" onClick={onClose} aria-hidden="true" />
        <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
          <div className="dl">
            <div>
              <img src={logo} alt={`${officer.force} crest`} />
              <h2 id="qr-modal-title">{officer.rank} {officer.name}</h2>
              <p>Share the official portfolio. The code opens the welcome page on any phone camera.</p>
            </div>
            <div className="motto">{motto}</div>
          </div>
          <div className="dr2">
            <button className="x" type="button" onClick={onClose} aria-label="Close dialog" ref={closeRef}>
              <IconClose size={18} strokeWidth={2.2} />
            </button>
            <span className="tag"><i />Scan to visit this portfolio</span>
            <div className="qrbox">
              <QRCodeCanvas
                id="qr-modal-canvas"
                value={QR_PORTFOLIO_URL}
                size={428}
                level="H"
                bgColor="#ffffff"
                fgColor="#0b0f0c"
                aria-label="QR code linking to the portfolio welcome page"
                role="img"
              />
            </div>
            <div className="qurl">
              <span>{displayUrl}</span>
              <button type="button" onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</button>
            </div>
            <div className="qacts">
              <button className="btn btn-green" type="button" onClick={downloadQrCode}>
                <IconDownload size={18} />
                Download QR Code
              </button>
              <button className="btn btn-line" type="button" onClick={() => window.print()}>
                <IconPrint size={18} />
                Print QR Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only layout, placed directly under <body> so it survives the #root print reset */}
      {createPortal(
        <div className="print-only-layout" aria-hidden="true">
          <h1>{officer.rank} {officer.name}</h1>
          <p>Scan to visit the official portfolio</p>
          <div className="pq">
            <QRCodeCanvas value={QR_PORTFOLIO_URL} size={340} level="H" marginSize={1} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <div className="pu">{QR_PORTFOLIO_URL}</div>
        </div>,
        document.body
      )}
    </>
  )
}
