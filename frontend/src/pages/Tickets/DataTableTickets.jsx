import { useEffect, useMemo, useState } from 'react'

import DialogVoidTickets from '../../components/dialog/DialogVoidTickets.jsx'
import DialogProgressTicket from '../../components/dialog/DialogProgressTicket.jsx'
import DialogHoldTicket from '../../components/dialog/DialogHoldTicket.jsx'
import DialogResolveTicket from '../../components/dialog/DialogResolveTicket.jsx'
import DataTable, { DataTableIdentity, DataTableStatus } from '../../components/table/DataTable.jsx'
import { XClose } from '../../components/template/TemplateIcons.jsx'
import ButtonVoidTickets from '../../components/button/ButtonVoidTickets.jsx'
import {
  DEFAULT_PAGE_SIZE,
  EMPTY_DATE_RANGE,
  INITIAL_TICKET_ROWS as DEFAULT_TICKET_ROWS,
  PAGE_SIZE_OPTIONS,
  getFilteredTicketRows,
  getPaginationItems,
  getStatusVariant,
  getTicketEmptyMessage,
  getTicketPageRows,
  getTicketPaginationSummary,
} from '../../services/my-tickets/DataTableMT.js'

import { formatTicketDate, formatTicketTimeWIB, getFeedbacks, normalizeTicket } from '../../services/tickets/Tickets.js'
import FeedbackRating from '../../components/rating/RatingFeedBack.jsx'
import ButtonHoldTickets from '../../components/button/ButtonHoldTickets.jsx'
import ButtonResolveTickets from '../../components/button/ButtonResolveTickets.jsx'
import ButtonProgressTickets from '../../components/button/ButtonProgressTickets.jsx'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ButtonHistoryTicket from '../../components/button/ButtonHistoryTicket.jsx'
import DialogTimelineTickets from '../../components/dialog/DialogTimelineTickets.jsx'

export const INITIAL_TICKET_ROWS = DEFAULT_TICKET_ROWS

const columns = [
  {
    key: 'namaPembuat',
    header: 'nama pembuat',
    accessor: 'namaPembuat',
    cellStyle: { minWidth: '170px' },
    render: (ticket) =>
      ticket.requestor && ticket.requestor !== '-'
        ? <DataTableIdentity title={ticket.requestor} />
        : '-',
  },
  {
    key: 'requestDate',
    header: 'request date',
    cellStyle: { minWidth: '140px' },
    render: (ticket) => (
      <div className="stacked-date">
        <div className="stacked-date__date">{formatTicketDate(ticket.requestDateValue)}</div>
        <div className="stacked-date__time" style={{ fontSize: '0.85em', opacity: 0.8 }}>
          {formatTicketTimeWIB(ticket.requestDateValue)}
        </div>
      </div>
    ),
  },
  {
    key: 'category',
    header: 'category & status',
    accessor: 'category',
    cellStyle: { minWidth: '250px' },
    render: (ticket) => {
      const isUnready = ticket.statusDocument === 'unready'
      const docVariant = isUnready ? 'inactive' : (ticket.statusDocument === 'ready' ? 'active' : 'inactive')
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
          <div>{ticket.category || '-'}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <DataTableStatus inline variant={getStatusVariant(ticket.status)}>
              {ticket.status}
            </DataTableStatus>
            {ticket.statusDocument && ticket.statusDocument !== '-' && (
              <DataTableStatus inline variant={docVariant}>
                {isUnready && <span style={{ marginRight: '4px' }}>⚠️</span>}
                Doc: {ticket.statusDocument}
              </DataTableStatus>
            )}
          </div>
        </div>
      )
    },
  },
  {
    key: 'problem',
    header: 'Requesst',
    accessor: 'problem',
    cellStyle: { minWidth: '260px' },
  },
  {
    key: 'supportName',
    header: 'support name',
    accessor: 'supportName',
    cellStyle: { minWidth: '180px' },
    render: (ticket) =>
      ticket.supportName && ticket.supportName !== '-'
        ? <DataTableIdentity title={ticket.supportName} />
        : '-',
  },
  {
    key: 'progresPercent',
    header: 'progress',
    cellStyle: { minWidth: '160px' },
    render: (ticket) => {
      const pct = Number(ticket.progresPercent) || 0
      const rawStatus = String(ticket.rawStatus || '').trim().toLowerCase()
      const isResolved = rawStatus === 'resolved'
      const displayPct = isResolved ? 100 : pct
      const color = displayPct >= 100
        ? '#2a9d8f'
        : displayPct >= 50
          ? '#f4a261'
          : '#e76f51'

      return (
        <div style={{ minWidth: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--template-fg-muted)' }}>
              {isResolved ? 'Selesai' : 'Pengerjaan'}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
              {displayPct}%
            </span>
          </div>
          <div style={{
            height: '6px',
            borderRadius: '999px',
            background: '#e5e7eb',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${displayPct}%`,
              borderRadius: '999px',
              background: displayPct >= 100
                ? 'linear-gradient(90deg, #2a9d8f, #38c2b2)'
                : displayPct >= 50
                  ? 'linear-gradient(90deg, #f4a261, #e9c46a)'
                  : 'linear-gradient(90deg, #e76f51, #f4a261)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )
    },
  },
]

function TicketFeedbackPanel({ ticket }) {
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFeedback() {
      try {
        const data = await getFeedbacks()
        const list = data?.list || []
        // Use a more flexible match: check ticket_id (number/string) and ticket_code
        const found = list.find(
          (f) =>
            String(f.ticket_id) === String(ticket.id) ||
            f.ticket_code === ticket.ticketCode ||
            f.ticket_code === ticket.id,
        )
        setFeedback(found)
      } catch (error) {
        console.error('Failed to load feedback:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFeedback()
  }, [ticket.id, ticket.ticketCode])

  return (
    <section className="users-table__detail-section users-table__detail-section--wide">
      <div className="users-table__detail-section-header">
        <p className="users-table__detail-section-eyebrow">Feedback</p>
      </div>
      {isLoading ? (
        <p className="users-table__detail-empty">Memuat feedback...</p>
      ) : feedback ? (
        <div
          className="ticket-feedback"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <div className="ticket-feedback__item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong style={{ color: 'var(--template-fg-muted)' }}>Rating:</strong>{' '}
            <FeedbackRating value={Number(feedback.rating)} />
          </div>
          <div className="ticket-feedback__item">
            {/* <strong style={{ color: 'var(--template-fg-muted)' }}></strong>{' '} */}
            <p style={{ marginTop: '0.25rem', color: 'var(--template-fg-primary)' }}>
              {feedback.description || feedback.comment || '-'}
            </p>
          </div>
        </div>
      ) : (
        <p className="users-table__detail-empty">Belum ada feedback untuk tiket ini.</p>
      )}
    </section>
  )
}

function DataTableTickets({
  searchQuery = '',
  tableLabel = 'Tickets Overview table',
  dateRange = EMPTY_DATE_RANGE,
  statusFilter = '',
  ticketRows = INITIAL_TICKET_ROWS,
  isLoading = false,
  errorMessage = '',
  refreshVersion = 0,
  setTicketRows,
  refreshData,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [activeActionDialog, setActiveActionDialog] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const filteredRows = useMemo(
    () => getFilteredTicketRows(ticketRows, { searchQuery, dateRange, statusFilter }),
    [dateRange, searchQuery, statusFilter, ticketRows],
  )
  const { totalPages, safeCurrentPage, rows, firstItem, lastItem } = useMemo(
    () => getTicketPageRows(filteredRows, currentPage, pageSize),
    [currentPage, filteredRows, pageSize],
  )
  const selectedTicketName =
    selectedTicket?.ticketCode ?? selectedTicket?.userName ?? selectedTicket?.id ?? 'ticket ini'
  const dialogTicket = selectedTicket ? { name: selectedTicketName } : null

  const openActionDialog = (dialogType, ticket) => {
    setSelectedTicket(ticket)
    setActiveActionDialog(dialogType)
  }

  const closeActionDialog = () => {
    setActiveActionDialog(null)
    setSelectedTicket(null)
  }

  const updateTicketStatus = (ticketId, updatedTicket) => {
    if (ticketId && typeof setTicketRows === 'function') {
      setTicketRows((currentRows) =>
        currentRows.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, ...updatedTicket }
            : ticket,
        ),
      )
    }

    // Refresh global data to update counts etc
    refreshData?.()
    closeActionDialog()
  }

  const handleProgressSuccess = (updatedData) => {
    if (updatedData) {
      updateTicketStatus(selectedTicket.id, normalizeTicket(updatedData))
    } else {
      updateTicketStatus(selectedTicket.id, { rawStatus: 'in_progress', status: 'In Progress' })
    }
  }

  const handleHoldSuccess = (updatedData) => {
    if (updatedData) {
      updateTicketStatus(selectedTicket.id, normalizeTicket(updatedData))
    } else {
      updateTicketStatus(selectedTicket.id, { rawStatus: 'hold', status: 'Hold' })
    }
  }

  const handleResolveSuccess = (updatedData) => {
    if (updatedData) {
      updateTicketStatus(selectedTicket.id, normalizeTicket(updatedData))
    } else {
      updateTicketStatus(selectedTicket.id, { rawStatus: 'resolved', status: 'Resolved', progresPercent: 100 })
    }
  }

  const handleVoidConfirm = (updatedData) => {
    if (updatedData) {
      updateTicketStatus(selectedTicket.id, normalizeTicket(updatedData))
    } else {
      updateTicketStatus(selectedTicket.id, { rawStatus: 'void', status: 'Void' })
    }
  }


  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange.endDate, dateRange.startDate, pageSize, refreshVersion, searchQuery, statusFilter])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const pagination = {
    summary: getTicketPaginationSummary(firstItem, lastItem, filteredRows.length),
    currentPage: safeCurrentPage,
    totalPages,
    items: getPaginationItems(safeCurrentPage, totalPages),
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    pageSizeLabel: 'Tampilkan',
    pageSizeSuffix: 'baris',
    previousLabel: 'Sebelumnya',
    nextLabel: 'Berikutnya',
    ariaLabel: 'Tickets pagination',
    pageSizeAriaLabel: 'Jumlah baris ticket per halaman',
    onPrevious: () => setCurrentPage((page) => Math.max(1, page - 1)),
    onNext: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
    onSelect: (page) => setCurrentPage(page),
    onPageSizeChange: (nextPageSize) => setPageSize(nextPageSize),
  }
  const emptyMessage = isLoading
    ? 'Memuat data ticket...'
    : errorMessage || getTicketEmptyMessage({ searchQuery, dateRange, statusFilter })

  return (
    <div className="mtickets-table-shell">
      <DataTable
        className="mtickets-table"
        rows={rows}
        columns={columns}
        getRowId={(ticket) => ticket.id ?? ticket.ticketCode}
        tableLabel={tableLabel}
        detail={{
          columnLabel: 'Action',
          buttonLabel: 'Detail',
          eyebrow: 'Ticket',
          title: (ticket) => ticket.ticketCode || ticket.id,
          description: (ticket) => ticket.problem,
          headerActions: (ticket) => {
            console.log('Rendering header actions for ticket:', ticket.id || ticket.ticketCode)
            const rawStatusVal = ticket.rawStatus || ticket.status || ''
            const statusClean = String(rawStatusVal).trim().toLowerCase()
            const isWaiting = statusClean === 'waiting'
            const isHold = statusClean === 'hold' || statusClean === 'pending'
            const isInProgress = statusClean === 'in_progress' || statusClean === 'in progress'
            const isVoid = statusClean === 'void'
            const isResolved = statusClean === 'resolved'
            const isUnready = ticket.statusDocument === 'unready'

            return (
              <div className="users-table__accordion-actions" style={{ gap: '0.5rem' }}>
                {!(isResolved || isVoid) && (
                  <>
                    {(isWaiting || isHold || isInProgress) && (
                      <ButtonProgressTickets
                        tone="warning"
                        disabled={isUnready}
                        title={isUnready ? 'Status Document Unready' : ''}
                        onClick={(event) => {
                          event.stopPropagation()
                          openActionDialog('progress', ticket)
                        }}
                      >
                        <PlayArrowIcon fontSize="small" />
                        {isWaiting ? ' Start' : isHold ? ' Continue' : ' Progress'}
                      </ButtonProgressTickets>
                    )}
                    {isInProgress && (
                      <ButtonHoldTickets
                        tone="danger"
                        disabled={isUnready}
                        onClick={(event) => {
                          event.stopPropagation()
                          openActionDialog('hold', ticket)
                        }}
                      >
                        <PauseIcon fontSize="small" /> Hold
                      </ButtonHoldTickets>
                    )}
                    {isInProgress && (
                      <ButtonResolveTickets
                        tone="default"
                        disabled={isUnready}
                        onClick={(event) => {
                          event.stopPropagation()
                          openActionDialog('resolve', ticket)
                        }}
                      >
                        <CheckCircleOutlinedIcon fontSize="small" /> Resolve
                      </ButtonResolveTickets>
                    )}
                    <ButtonVoidTickets
                      tone="danger"
                      disabled={isVoid}
                      onClick={(event) => {
                        event.stopPropagation()
                        openActionDialog('void', ticket)
                      }}
                    >
                      <XClose size={16} /> Void
                    </ButtonVoidTickets>
                  </>
                )}
                <ButtonHistoryTicket
                  tone="default"
                  onClick={(event) => {
                    event.stopPropagation()
                    openActionDialog('history', ticket)
                  }}
                >
                  History
                </ButtonHistoryTicket>
              </div>
            )
          },
          render: (ticket) => <TicketFeedbackPanel ticket={ticket} />,
        }}
        emptyMessage={emptyMessage}
        pagination={pagination}
      />

      <DialogProgressTicket
        isOpen={activeActionDialog === 'progress'}
        ticket={selectedTicket}
        onClose={closeActionDialog}
        onSuccess={handleProgressSuccess}
      />

      <DialogHoldTicket
        isOpen={activeActionDialog === 'hold'}
        ticket={selectedTicket}
        onClose={closeActionDialog}
        onSuccess={handleHoldSuccess}
      />

      <DialogResolveTicket
        isOpen={activeActionDialog === 'resolve'}
        ticket={selectedTicket}
        onClose={closeActionDialog}
        onSuccess={handleResolveSuccess}
      />

      <DialogVoidTickets
        isOpen={activeActionDialog === 'void'}
        eyebrow="Void Ticket"
        title={`Void ${selectedTicketName}`}
        ticket={selectedTicket}
        description={
          <>
            Apakah Anda yakin ingin mengubah <strong>{selectedTicketName}</strong> menjadi void?
          </>
        }
        secondaryDescription="Status ticket akan diperbarui menjadi Void pada tabel aktif."
        confirmLabel="Void"
        onClose={closeActionDialog}
        onConfirm={handleVoidConfirm}
      />

      <DialogTimelineTickets
        isOpen={activeActionDialog === 'history'}
        ticket={selectedTicket}
        onClose={closeActionDialog}
      />
    </div>
  )
}

export default DataTableTickets
