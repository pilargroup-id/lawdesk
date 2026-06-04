import { useEffect, useMemo, useState } from 'react'

import DataTable, {
  DataTableIdentity,
  DataTableStatus,
} from '../../components/table/DataTable.jsx'
import TimeLineMT from '../../components/timeline/TimeLineProject.jsx'
import {
  DEFAULT_PAGE_SIZE,
  EMPTY_DATE_RANGE,
  INITIAL_PROJECT_ROWS,
  PAGE_SIZE_OPTIONS,
  getFilteredProjectRows,
  getPaginationItems,
  getProjectEmptyMessage,
  getProjectPageRows,
  getProjectPaginationSummary,
  getStatusVariant,
} from '../../services/projects/DataTableProjects.js'
import { getProjectHistory } from '../../services/projects/Projects.js'
import ButtonHistoryPrj from '../../components/button/ButtonHistoryPrj.jsx'
import DialogHistoryPrj from '../../components/dialog/DialogHistoryPrj.jsx'

const columns = [
  {
    key: 'projectCode',
    header: 'Project',
    accessor: 'projectCode',
    cellStyle: { whiteSpace: 'nowrap', width: '11%' },
  },
  {
    key: 'projectName',
    header: 'Project',
    accessor: 'projectName',
    cellStyle: { minWidth: '260px' },
  },
  {
    key: 'requestDate',
    header: 'Request Date',
    accessor: 'requestDate',
    cellStyle: { minWidth: '130px' },
  },
  {
    key: 'requestor',
    header: 'Requestor',
    cellStyle: { minWidth: '150px' },
    render: (project) =>
      project.requestor && project.requestor !== '-'
        ? <DataTableIdentity title={project.requestor} />
        : '-',
  },
  {
    key: 'priority',
    header: 'Priority',
    accessor: 'priority',
    cellStyle: { whiteSpace: 'nowrap', width: '9%' },
  },
  {
    key: 'progress',
    header: 'Progress',
    cellStyle: { minWidth: '160px' },
    render: (project) => {
      const pct = Number(project.progressValue) || 0
      const isResolved = String(project.rawStatus || '').trim().toLowerCase() === 'resolved'
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
  {
    key: 'description',
    header: 'Description',
    accessor: 'description',
    cellStyle: { minWidth: '260px' },
  },
  {
    key: 'status',
    header: 'Status',
    cellStyle: { whiteSpace: 'nowrap', width: '10%' },
    render: (project) => (
      <DataTableStatus inline variant={getStatusVariant(project.status)}>
        {project.status}
      </DataTableStatus>
    ),
  },
]

// ProjectHistoryPanel removed as it's now in a dialog

function DataTableProjects({
  searchQuery = '',
  tableLabel = 'Projects table',
  dateRange = EMPTY_DATE_RANGE,
  statusFilter = '',
  projectRows = INITIAL_PROJECT_ROWS,
  isLoading = false,
  errorMessage = '',
  onRefresh,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // State for dialogs
  const [selectedProject, setSelectedProject] = useState(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const handleOpenHistory = (project) => {
    setSelectedProject(project)
    setIsHistoryOpen(true)
  }

  const filteredRows = useMemo(
    () => getFilteredProjectRows(projectRows, { searchQuery, dateRange, statusFilter }),
    [dateRange, projectRows, searchQuery, statusFilter],
  )
  const { totalPages, safeCurrentPage, rows, firstItem, lastItem } = useMemo(
    () => getProjectPageRows(filteredRows, currentPage, pageSize),
    [currentPage, filteredRows, pageSize],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange.endDate, dateRange.startDate, pageSize, searchQuery, statusFilter])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const pagination = {
    summary: getProjectPaginationSummary(firstItem, lastItem, filteredRows.length),
    currentPage: safeCurrentPage,
    totalPages,
    items: getPaginationItems(safeCurrentPage, totalPages),
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    pageSizeLabel: 'Tampilkan',
    pageSizeSuffix: 'baris',
    previousLabel: 'Sebelumnya',
    nextLabel: 'Berikutnya',
    ariaLabel: 'Projects pagination',
    pageSizeAriaLabel: 'Jumlah baris project per halaman',
    onPrevious: () => setCurrentPage((page) => Math.max(1, page - 1)),
    onNext: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
    onSelect: (page) => setCurrentPage(page),
    onPageSizeChange: (nextPageSize) => setPageSize(nextPageSize),
  }
  const emptyMessage = isLoading
    ? 'Memuat data project...'
    : errorMessage || getProjectEmptyMessage({ searchQuery, dateRange, statusFilter })

  return (
    <div className="mtickets-table-shell">
      <DataTable
        className="mtickets-table"
        rows={rows}
        columns={columns}
        getRowId={(project) => project.id ?? project.projectCode}
        tableLabel={tableLabel}
        detail={{
          columnLabel: 'Actions',
          buttonLabel: 'Detail',
          eyebrow: 'Project',
          title: (project) => [project.projectCode, project.projectName].filter(Boolean).join(' - '),
          description: () => null,
          headerActions: (project) => {
            return (
              <div className="users-table__accordion-actions" style={{ gap: '0.5rem' }}>
                <ButtonHistoryPrj onClick={() => handleOpenHistory(project)}>
                  History
                </ButtonHistoryPrj>
              </div>
            )
          },
          render: (project) => (
            <section className="users-table__detail-section users-table__detail-section--wide">
              <div className="users-table__detail-section-header">
                <p className="users-table__detail-section-eyebrow">Project Detail</p>
              </div>
              <div className="users-table__detail-content" style={{ padding: '0.5rem 0' }}>
                <p style={{ color: 'var(--text)', opacity: 0.8 }}>{project.description || 'Tidak ada deskripsi.'}</p>
              </div>
            </section>
          ),
        }}
        emptyMessage={emptyMessage}
        pagination={pagination}
      />
      <DialogHistoryPrj
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        project={selectedProject}
      />
    </div>
  )
}

export default DataTableProjects
