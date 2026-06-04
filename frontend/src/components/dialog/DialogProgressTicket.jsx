import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import api from '../../services/api.js'
import { XClose } from '../template/TemplateIcons.jsx'
import SliderProgressTicket from '../slider/SliderProgressTicket.jsx'

function DialogProgressTicket({
  isOpen = false,
  ticket = null,
  onClose,
  onSuccess,
}) {
  const [progressPercent, setProgressPercent] = useState(0)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen && ticket) {
      setProgressPercent(Number(ticket.progresPercent) || 0)
      setDescription('')
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
      const rawStatus = String(ticket.rawStatus || ticket.status || '').trim().toLowerCase()
      const isWaiting = rawStatus === 'waiting'
      const isHold = rawStatus === 'hold' || rawStatus === 'pending'

      // Tentukan status berdasarkan kondisi saat ini
      let newStatus = 'in_progress'
      if (isWaiting) newStatus = 'in_progress'
      else if (isHold) newStatus = 'in_progress'

      const payload = {
        status: newStatus,
        progres_percent: progressPercent,
      }

      if (description.trim()) {
        payload.notes = description.trim()
      }

      const response = await api.put(`/ticket/${ticket.id}`, payload)

      onSuccess?.(response?.data?.data || response?.data || response)
      onClose?.()
    } catch (err) {
      console.error('Failed to update ticket progress:', err)
      setErrorMessage(
        err?.data?.message || err?.response?.data?.message || err?.message || 'Gagal memperbarui progress ticket.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const rawStatus = String(ticket?.rawStatus || ticket?.status || '').trim().toLowerCase()
  const isWaiting = rawStatus === 'waiting'
  const isHold = rawStatus === 'hold' || rawStatus === 'pending'

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
              {isWaiting ? 'Start' : isHold ? 'Continue' : 'Update Progress'}: {ticket?.ticketCode || ticket?.id}
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
                <label className="register-user-popup__label" htmlFor="ticket-progress-percent">
                  Progress Pengerjaan
                  <span style={{ marginLeft: '0.5rem', color: 'var(--template-fg-muted)', fontWeight: 400 }}>
                    ({progressPercent}%)
                  </span>
                </label>
                <div style={{ padding: '1.5rem 0.5rem 0.5rem' }}>
                  <SliderProgressTicket
                    value={progressPercent}
                    onChange={(_, newValue) => setProgressPercent(newValue)}
                  />
                </div>
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="ticket-progress-notes">
                  Notes (opsional)
                </label>
                <textarea
                  id="ticket-progress-notes"
                  className="register-user-popup__input master-project-popup__textarea"
                  style={{ minHeight: '100px' }}
                  placeholder="Apa yang telah dikerjakan?..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

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
            {isSubmitting
              ? 'Menyimpan...'
              : isWaiting
                ? 'Start Ticket'
                : isHold
                  ? 'Continue Ticket'
                  : 'Update Progress'
            }
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogProgressTicket
