import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { SkeletonTable } from './LoadingSpinner'
import EmptyState from './EmptyState'

export default function DataTable({
  columns,
  data = [],
  loading = false,
  pageSize = 20,
  selectable = false,
  onRowClick,
  emptyMessage = 'No data found',
  emptyDescription,
  emptyIcon,
  rowKey = 'id',
}) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(new Set())

  function handleSort(col) {
    if (!col.sortable) return
    if (sortCol === col.key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col.key)
      setSortDir('asc')
    }
    setPage(0)
  }

  const sorted = useMemo(() => {
    if (!sortCol) return data
    return [...data].sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortCol, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  function toggleAll() {
    if (selected.size === paged.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paged.map(r => r[rowKey])))
    }
  }

  function toggleRow(id) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.size === paged.length}
                    onChange={toggleAll}
                    style={{ width: 14, height: 14, cursor: 'pointer' }}
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => handleSort(col)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.sortable && (
                      <span style={{ color: sortCol === col.key ? 'var(--accent)' : 'var(--text-muted)', display: 'flex' }}>
                        {sortCol === col.key
                          ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          : <ChevronsUpDown size={12} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={8} cols={columns.length + (selectable ? 1 : 0)} />
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ border: 'none', padding: 0 }}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyMessage}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              paged.map(row => (
                <tr
                  key={row[rowKey]}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(row[rowKey])}
                        onChange={() => toggleRow(row[rowKey])}
                        style={{ width: 14, height: 14, cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} style={{ maxWidth: col.maxWidth || 'none' }}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <PaginationBtn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft size={14} />
            </PaginationBtn>
            {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
              let pageNum = i
              if (totalPages > 7) {
                if (page < 4) pageNum = i
                else if (page > totalPages - 5) pageNum = totalPages - 7 + i
                else pageNum = page - 3 + i
              }
              return (
                <PaginationBtn
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  active={pageNum === page}
                >
                  {pageNum + 1}
                </PaginationBtn>
              )
            })}
            <PaginationBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
              <ChevronRight size={14} />
            </PaginationBtn>
          </div>
        </div>
      )}
    </div>
  )
}

function PaginationBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 6px',
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 500,
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
      }}
    >
      {children}
    </button>
  )
}
