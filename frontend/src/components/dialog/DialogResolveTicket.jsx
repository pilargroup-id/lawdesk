import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import api from '../../services/api.js'
import { XClose } from '../template/TemplateIcons.jsx'

function DialogResolveTicket({
  isOpen = false,
  ticket = null,
  onClose,
  onSuccess,
}) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen && ticket) {
      setNotes('')
      setErrorMessage('')
    }
  }, [isOpen, ticket])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    if (!ticket?.id) return

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const payload = {
        status: 'resolved',
        progres_percent: 100,
        description: notes.trim(),
      }

      const response = await api.put(`/ticket/${ticket.id}`, payload)

      onSuccess?.(response?.data?.data || response?.data || response)
      onClose?.()
    } catch (err) {
      console.error('Failed to resolve ticket:', err)
      setErrorMessage(
        err?.data?.message || err?.response?.data?.message || err?.message || 'Gagal menyelesaikan ticket.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const dialogNode = (
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup register-user-popup mtickets-create-popup"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Ticket Update</p>
            <h2 className="dashboard-popup__title">
              Resolve Ticket: {ticket?.ticketCode || ticket?.id}
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

        <div className="dashboard-popup__body">
          <div className="register-user-popup__form">
            <div className="register-user-popup__grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="ticket-resolve-notes">
                  Resolution Notes
                </label>
                <textarea
                  id="ticket-resolve-notes"
                  className="register-user-popup__input master-project-popup__textarea"
                  style={{ minHeight: '120px' }}
                  placeholder="Berikan catatan penyelesaian ticket..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--template-fg-muted)', marginTop: '0.5rem' }}>
            ✓ Progress akan otomatis diset ke 100% saat resolve.
          </p>

          {errorMessage && (
            <p
              style={{
                color: '#ef4444',
                fontSize: '0.85rem',
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '6px',
              }}
            >
              {errorMessage}
            </p>
          )}
        </div>

        <div className="dashboard-popup__actions">
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : 'Resolve Ticket'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogResolveTicket
