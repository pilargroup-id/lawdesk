import { useEffect, useMemo, useState } from 'react'

import DataTable, {
  DataTableIdentity,
} from './DataTable.jsx'
import {
  DEFAULT_PAGE_SIZE,
  EMPTY_DATE_RANGE,
  PAGE_SIZE_OPTIONS,
  getPaginationItems,
  getTicketPageRows,
} from '../../services/my-tickets/DataTableMT.js'
import ButtonDetailPrj from '../button/ButtonDetailPrj.jsx'
import DialogTimelinePrjPerf from '../dialog/DialogTimelinePrjPerf.jsx'

const columns = [
  {
    key: 'developer',
    header: 'Developer',
    cellStyle: { minWidth: '200px' },
    render: (row) => (
      <DataTableIdentity title={row.developer_name} subtitle={`ID: ${row.developer_id}`} />
    ),
  },
  {
    key: 'projects_count',
    header: 'Projects',
    accessor: 'projects_count',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
  {
    key: 'total_tasks',
    header: 'Total Tasks',
    accessor: 'total_tasks',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
  {
    key: 'avg_progress_task',
    header: 'Avg. Progress',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '12%' },
    render: (row) => `${row.avg_progress_task}%`,
  },
  {
    key: 'open_touch_count',
    header: 'Open Touch',
    accessor: 'open_touch_count',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
  {
    key: 'resolved_touch_count',
    header: 'Resolved Touch',
    accessor: 'resolved_touch_count',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
  {
    key: 'late_touch_count',
    header: 'Late Touch',
    accessor: 'late_touch_count',
    cellStyle: { whiteSpace: 'nowrap', textAlign: 'center', width: '10%' },
  },
]

function DataTableTeamPerformance({
  searchQuery = '',
  tableLabel = 'Developer Project Summary table',
  dateRange = EMPTY_DATE_RANGE,
  rows = [],
  isLoading = false,
  setRows,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedDeveloper, setSelectedDeveloper] = useState(null)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)

  const handleDetailClick = (row) => {
    setSelectedDeveloper(row)
    setIsTimelineOpen(true)
  }

  const memoizedColumns = useMemo(() => [
    ...columns,
    {
      key: 'action',
      header: 'Action',
      cellStyle: { whiteSpace: 'nowrap', width: '1%' },
      render: (row) => (
        <ButtonDetailPrj 
          variant="detail" 
          onClick={() => handleDetailClick(row)} 
          aria-label={`Lihat detail ${row.developer_name}`}
        />
      ),
    },
  ], [])

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return rows

    return rows.filter((row) =>
      row.developer_name?.toLowerCase().includes(normalizedQuery)
    )
  }, [rows, searchQuery])

  const { totalPages, safeCurrentPage, rows: pageRows, firstItem, lastItem } = useMemo(
    () => getTicketPageRows(filteredRows, currentPage, pageSize),
    [currentPage, filteredRows, pageSize],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize, searchQuery])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const pagination = {
    summary: `${firstItem}-${lastItem} dari ${filteredRows.length} developer`,
    currentPage: safeCurrentPage,
    totalPages,
    items: getPaginationItems(safeCurrentPage, totalPages),
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    pageSizeLabel: 'Tampilkan',
    pageSizeSuffix: 'baris',
    previousLabel: 'Sebelumnya',
    nextLabel: 'Berikutnya',
    ariaLabel: 'Developer summary pagination',
    pageSizeAriaLabel: 'Jumlah baris per halaman',
    onPrevious: () => setCurrentPage((page) => Math.max(1, page - 1)),
    onNext: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
    onSelect: (page) => setCurrentPage(page),
    onPageSizeChange: (nextPageSize) => setPageSize(nextPageSize),
  }

  return (
    <div className="mtickets-table-shell">
      <DataTable
        className="mtickets-table"
        rows={pageRows}
        columns={memoizedColumns}
        getRowId={(row) => row.developer_id}
        tableLabel={tableLabel}
        emptyMessage={isLoading ? 'Memuat data...' : 'Belum ada data untuk ditampilkan.'}
        pagination={pagination}
      />

      <DialogTimelinePrjPerf
        isOpen={isTimelineOpen}
        eyebrow="Developer Performance"
        title={`Timeline ${selectedDeveloper?.developer_name || ''}`}
        items={selectedDeveloper?.timeline || []}
        onClose={() => setIsTimelineOpen(false)}
      />
    </div>
  )
}

export default DataTableTeamPerformance
