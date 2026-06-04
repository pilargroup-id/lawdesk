import { createPortal } from 'react-dom'
import { XClose } from '../template/TemplateIcons.jsx'
import { DataTableStatus } from '../table/DataTable.jsx'

// ─── Formatters ────────────────────────────────────────────────────────────────

const DATE_FMT = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

const TIME_FMT = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
})

function fmtDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return DATE_FMT.format(d)
}

function fmtTime(value) {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return `${TIME_FMT.format(d)} WIB`
}

// ─── Status helpers ────────────────────────────────────────────────────────────

function getVariant(status) {
  const s = String(status ?? '').trim().toLowerCase()
  if (s === 'created' || s === 'waiting') return 'pending'
  if (s === 'in progress' || s === 'assigned') return 'active'
  if (s === 'resolved') return 'active'
  if (s === 'feedback') return 'app'
  if (s === 'void') return 'inactive'
  if (s === 'hold' || s === 'pending') return 'inactive'
  return 'pending'
}

// ─── Build timeline from ticket if ticket.timeline is empty ───────────────────

function buildFallbackTimeline(ticket) {
  if (!ticket) return []
  const items = []

  if (ticket.requestDateValue) {
    items.push({
      status: 'Created',
      title: 'Ticket Dibuat',
      detail: ticket.problem && ticket.problem !== '-' ? ticket.problem : 'Permintaan ticket dikirim.',
      timestamp: ticket.requestDateValue,
    })
  }

  if (ticket.startDateValue) {
    items.push({
      status: 'In Progress',
      title: 'Penanganan Dimulai',
      detail:
        ticket.supportName && ticket.supportName !== '-'
          ? `Ditangani oleh: ${ticket.supportName}`
          : 'Ticket mulai dikerjakan.',
      timestamp: ticket.startDateValue,
    })
  }

  const rawStatus = String(ticket.rawStatus || ticket.status || '').trim().toLowerCase()

  if (rawStatus === 'hold') {
    items.push({
      status: 'Hold',
      title: 'Di-Hold',
      detail: ticket.notes && ticket.notes !== '-' ? ticket.notes : null,
      timestamp: ticket.lastUpdatedValue,
    })
  }

  if (rawStatus === 'resolved' && ticket.endDateValue) {
    items.push({
      status: 'Resolved',
      title: 'Ticket Selesai',
      detail: ticket.timeSpent && ticket.timeSpent !== '-' ? `Durasi: ${ticket.timeSpent}` : null,
      timestamp: ticket.endDateValue,
    })
  }

  if (rawStatus === 'void' && ticket.endDateValue) {
    items.push({
      status: 'Void',
      title: 'Ticket Dibatalkan',
      detail: ticket.notes && ticket.notes !== '-' ? ticket.notes : null,
      timestamp: ticket.endDateValue,
    })
  }

  if (rawStatus === 'feedback' && ticket.endDateValue) {
    items.push({
      status: 'Feedback',
      title: 'Menunggu Feedback',
      detail: null,
      timestamp: ticket.endDateValue,
    })
  }

  // Sort ascending
  return items
    .filter((item) => item.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

// ─── Single Timeline Item ──────────────────────────────────────────────────────

function TimelineItem({ item, isFirst, isLast }) {
  const variant = getVariant(item.status)
  const dateStr = fmtDate(item.timestamp)
  const timeStr = fmtTime(item.timestamp)

  return (
    <div className="mtickets-timeline__item" role="listitem">
      {/* timestamp col */}
      <div className="mtickets-timeline__time">
        <p className="mtickets-timeline__day">{dateStr ?? '—'}</p>
        <p className="mtickets-timeline__hour">{timeStr ?? ''}</p>
      </div>

      {/* rail */}
      <div className="mtickets-timeline__rail" aria-hidden="true">
        <span
          className={`mtickets-timeline__connector${isFirst ? ' mtickets-timeline__connector--hidden' : ''}`}
        />
        <span className={`mtickets-timeline__dot mtickets-timeline__dot--${variant}`} />
        <span
          className={`mtickets-timeline__connector${isLast ? ' mtickets-timeline__connector--hidden' : ''}`}
        />
      </div>

      {/* content */}
      <div className="mtickets-timeline__content">
        <DataTableStatus inline variant={variant}>
          {item.status ?? 'Status'}
        </DataTableStatus>
        {item.title ? <h4 className="mtickets-timeline__title">{item.title}</h4> : null}
        {item.detail ? (
          <p className="mtickets-timeline__description">{item.detail}</p>
        ) : null}
      </div>
    </div>
  )
}

// ─── Dialog ────────────────────────────────────────────────────────────────────

function DialogTimelineTickets({ isOpen = false, ticket = null, onClose }) {
  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  const ticketCode = ticket?.ticketCode ?? ticket?.ticket_code ?? ticket?.id ?? '—'

  // Gunakan ticket.timeline jika ada, fallback ke build manual
  const items =
    Array.isArray(ticket?.timeline) && ticket.timeline.length > 0
      ? ticket.timeline
      : buildFallbackTimeline(ticket)

  const dialogNode = (
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup mtickets-timeline-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-timeline-ticket-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '95vw' }}
      >
        {/* Header */}
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Ticket Timeline</p>
            <h2 className="dashboard-popup__title" id="dialog-timeline-ticket-title">
              {ticketCode}
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

        {/* Body */}
        <div
          className="dashboard-popup__body mtickets-timeline-popup__body"
          style={{ maxHeight: '65vh', overflowY: 'auto', padding: '1.5rem 2rem' }}
        >
          {/* Info summary */}
          {ticket && (
            <div
              style={{
                background: 'var(--template-surface-2, #f3f4f6)',
                borderRadius: '10px',
                padding: '0.875rem 1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              {ticket.requestor && ticket.requestor !== '-' && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--template-fg-muted)' }}>
                  <strong>Requestor:</strong> {ticket.requestor}
                </p>
              )}
              {ticket.supportName && ticket.supportName !== '-' && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--template-fg-muted)' }}>
                  <strong>Support:</strong> {ticket.supportName}
                </p>
              )}
              {ticket.category && ticket.category !== '-' && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--template-fg-muted)' }}>
                  <strong>Kategori:</strong> {ticket.category}
                </p>
              )}
              {ticket.status && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--template-fg-muted)' }}>
                  <strong>Status saat ini:</strong> {ticket.status}
                  {ticket.progresPercent !== undefined && ticket.progresPercent !== null
                    ? ` — ${ticket.progresPercent}%`
                    : ''}
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          {items.length === 0 ? (
            <p className="mtickets-timeline__empty">Belum ada riwayat aktivitas untuk tiket ini.</p>
          ) : (
            <div
              className="mtickets-timeline"
              role="list"
              aria-label={`Timeline tiket ${ticketCode}`}
            >
              {items.map((item, idx) => (
                <TimelineItem
                  key={item.id ?? `${item.status}-${idx}`}
                  item={item}
                  isFirst={idx === 0}
                  isLast={idx === items.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dashboard-popup__actions">
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogTimelineTickets
