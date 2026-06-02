import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, XClose } from '../template/TemplateIcons.jsx'

const pulseKeyframes = `
  @keyframes icon-pulse {
    0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.35); }
    50%  { transform: scale(1.08); box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); }
    100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
  }
  @keyframes icon-spin-in {
    0%   { opacity: 0; transform: scale(0.6) rotate(-20deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
`

function DialogValidationAddFB({
  isOpen = false,
  onClose,
  message = 'Silakan berikan feedback terlebih dahulu pada ticket yang sudah selesai.',
}) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  const dialogNode = (
    <>
      <style>{pulseKeyframes}</style>

      <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
        <div
          className="dashboard-popup dashboard-popup--small"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-validation-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="dashboard-popup__header">
            <div>
              <p className="dashboard-popup__eyebrow">Validasi</p>
              <h2 className="dashboard-popup__title" id="dialog-validation-title">
                Feedback Diperlukan
              </h2>
            </div>
            <button
              type="button"
              className="dashboard-popup__close"
              aria-label="Tutup dialog"
              onClick={onClose}
            >
              <XClose size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="dashboard-popup__body">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.25rem 0 0.5rem', gap: '1rem' }}>

              {/* Animated icon */}
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(234, 179, 8, 0.12)',
                  border: '1.5px solid rgba(234, 179, 8, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#eab308',
                  animation: 'icon-spin-in 0.35s ease both, icon-pulse 2.4s ease 0.4s infinite',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={28} />
              </div>

              {/* Message */}
              <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', color: 'var(--color-text-secondary)', maxWidth: '300px', margin: 0 }}>
                {message}
              </p>

              {/* Helper hint */}
              <div
                style={{
                  width: '100%',
                  background: 'rgba(234, 179, 8, 0.06)',
                  border: '1px solid rgba(234, 179, 8, 0.18)',
                  borderRadius: '8px',
                  padding: '0.625rem 0.875rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: '#eab308', fontSize: '0.75rem', marginTop: '1px', flexShrink: 0 }}>ℹ</span>
                <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: '1.5', color: 'var(--color-text-tertiary, #6b7280)' }}>
                  Ticket yang berstatus <strong style={{ color: 'var(--color-text-secondary)' }}>Selesai</strong> memerlukan penilaian sebelum Anda dapat menambahkan feedback baru.
                </p>
              </div>
            </div>
          </div>

          {/* ── Actions — button kecil, rata kanan ── */}
          <div className="dashboard-popup__actions" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="dashboard-popup__button dashboard-popup__button--primary"
              style={{ paddingInline: '1.25rem', paddingBlock: '0.5rem', fontSize: '0.875rem' }}
              onClick={onClose}
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogValidationAddFB