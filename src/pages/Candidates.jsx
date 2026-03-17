import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Filter, X, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import ScoreBar from '../components/ScoreBar'
import SearchInput from '../components/SearchInput'
import EmptyState from '../components/EmptyState'
import { SkeletonTable } from '../components/LoadingSpinner'
import { fetchCandidates, deriveStage, STAGE_LABELS, STAGE_ORDER } from '../lib/db'
import { useAuth } from '../lib/auth'

export default function Candidates() {
  const navigate = useNavigate()
  const { company } = useAuth()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState([])
  const [scoreRange, setScoreRange] = useState([0, 100])
  const [sortCol, setSortCol] = useState('applied_at')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState(new Set())
  const [filterOpen, setFilterOpen] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    if (!company?.id) {
      setLoading(false)
      return
    }
    fetchCandidates(company.id)
      .then(data => {
        setRows(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Candidates fetch error:', err)
        setError(err.message || 'Failed to load candidates')
        setLoading(false)
      })
  }, [company?.id])

  const filtered = useMemo(() => {
    let d = rows.filter(row => {
      const c = row.candidates || {}
      const fullName = c.full_name || ''
      const email = c.email || ''
      const skills = c.skills || []
      const score = row.stage2_results?.total_score ?? null
      const stage = deriveStage(row.status, row.pipeline_stage)

      const matchSearch = !search
        || fullName.toLowerCase().includes(search.toLowerCase())
        || email.toLowerCase().includes(search.toLowerCase())
        || skills.some(s => s.toLowerCase().includes(search.toLowerCase()))

      const matchStage = stageFilter.length === 0 || stageFilter.includes(stage)

      const matchScore = score === null
        ? true
        : score >= scoreRange[0] && score <= scoreRange[1]

      return matchSearch && matchStage && matchScore
    })

    d.sort((a, b) => {
      let av, bv
      if (sortCol === 'full_name') {
        av = a.candidates?.full_name || ''
        bv = b.candidates?.full_name || ''
      } else if (sortCol === 'composite_score') {
        av = a.stage2_results?.total_score ?? -1
        bv = b.stage2_results?.total_score ?? -1
      } else if (sortCol === 'stage') {
        av = deriveStage(a.status, a.pipeline_stage)
        bv = deriveStage(b.status, b.pipeline_stage)
      } else if (sortCol === 'applied_at') {
        av = a.applied_at || ''
        bv = b.applied_at || ''
      } else {
        av = a[sortCol] ?? ''
        bv = b[sortCol] ?? ''
      }
      if (av == null || av === '') return 1
      if (bv == null || bv === '') return -1
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
    return d
  }, [rows, search, stageFilter, scoreRange, sortCol, sortDir])

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function toggleFilter(arr, setArr, val) {
    setArr(a => a.includes(val) ? a.filter(x => x !== val) : [...a, val])
  }

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const activeFilterCount = stageFilter.length

  if (!company?.id) {
    return (
      <Layout>
        <PageHeader title="Candidates" subtitle="No company configured" />
        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No company is configured for your account.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader
        title="Candidates"
        subtitle={loading ? 'Loading…' : `${rows.length} total · ${filtered.length} matching filters`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, skills..." width={280} />
            <button
              onClick={() => setFilterOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px',
                background: filterOpen ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Filter size={13} /> Filters
              {activeFilterCount > 0 && (
                <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Sidebar filters */}
        {filterOpen && (
          <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '16px 14px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
            <FilterSection title="Pipeline Stage">
              {STAGE_ORDER.map(key => (
                <FilterChip
                  key={key}
                  label={STAGE_LABELS[key]}
                  active={stageFilter.includes(key)}
                  onClick={() => toggleFilter(stageFilter, setStageFilter, key)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Score Range">
              <div style={{ padding: '4px 0', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{scoreRange[0]}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{scoreRange[1]}</span>
                </div>
                <input
                  type="range" min={0} max={100} value={scoreRange[0]}
                  onChange={e => setScoreRange([+e.target.value, scoreRange[1]])}
                  style={{ width: '100%', marginBottom: 4, background: 'transparent' }}
                />
                <input
                  type="range" min={0} max={100} value={scoreRange[1]}
                  onChange={e => setScoreRange([scoreRange[0], +e.target.value])}
                  style={{ width: '100%', background: 'transparent' }}
                />
              </div>
            </FilterSection>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setStageFilter([]); setScoreRange([0, 100]) }}
                style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--danger)', fontSize: 12, marginTop: 8, cursor: 'pointer' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          {loading ? (
            <SkeletonTable />
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>
            </div>
          ) : (
            <>
              {selected.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(129,140,248,0.08)', borderBottom: '1px solid rgba(129,140,248,0.2)' }}>
                  <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{selected.size} selected</span>
                  <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: 'none' }}>
                    <X size={12} /> Clear
                  </button>
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        style={{ width: 14, height: 14 }}
                        onChange={() => {
                          if (selected.size === paged.length) setSelected(new Set())
                          else setSelected(new Set(paged.map(r => r.application_id)))
                        }}
                        checked={paged.length > 0 && selected.size === paged.length}
                      />
                    </th>
                    <SortTh col="full_name" label="Name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh col="job_title" label="Applied For" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh col="composite_score" label="Score" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh col="stage" label="Stage" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <th>Seniority</th>
                    <SortTh col="applied_at" label="Applied" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <th style={{ width: 60 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ border: 'none', padding: 0 }}>
                        <EmptyState
                          icon={Users}
                          title="No candidates found"
                          description={rows.length === 0
                            ? 'No applications have been submitted yet.'
                            : 'Adjust your filters to see more candidates.'}
                        />
                      </td>
                    </tr>
                  ) : (
                    paged.map(row => {
                      const c = row.candidates || {}
                      const appId = row.application_id
                      const fullName = c.full_name || '—'
                      const email = c.email || ''
                      const skills = c.skills || []
                      const seniority = c.seniority_level || '—'
                      const score = row.stage2_results?.total_score ?? null
                      const stage = deriveStage(row.status, row.pipeline_stage)
                      const stageLabel = STAGE_LABELS[stage] || stage
                      const jobTitle = row.jobs?.title || '—'
                      const appliedAt = row.applied_at

                      return (
                        <tr key={appId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/candidates/${appId}`)}>
                          <td onClick={e => { e.stopPropagation(); toggleSelect(appId) }}>
                            <input type="checkbox" checked={selected.has(appId)} onChange={() => {}} style={{ width: 14, height: 14 }} />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                              }}>
                                {fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fullName}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {jobTitle}
                          </td>
                          <td style={{ minWidth: 110 }}>
                            {score !== null
                              ? <ScoreBar score={score} height={4} />
                              : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                            }
                          </td>
                          <td>
                            <Badge label={stageLabel} status={stage} />
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{seniority}</span>
                          </td>
                          <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>
                            {appliedAt ? format(new Date(appliedAt), 'MMM d') : '—'}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/candidates/${appId}`)}
                              style={{
                                padding: '3px 8px', background: 'transparent',
                                border: '1px solid var(--border)', borderRadius: 4,
                                color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        style={{
                          width: 28, height: 28, borderRadius: 5,
                          background: i === page ? 'var(--accent)' : 'transparent',
                          border: '1px solid',
                          borderColor: i === page ? 'var(--accent)' : 'var(--border)',
                          color: i === page ? '#fff' : 'var(--text-muted)',
                          fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

function SortTh({ col, label, sortCol, sortDir, onSort }) {
  const active = sortCol === col
  return (
    <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => onSort(col)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? sortDir === 'asc' ? <ChevronUp size={11} color="var(--accent)" /> : <ChevronDown size={11} color="var(--accent)" />
          : <ChevronsUpDown size={11} color="var(--text-muted)" />}
      </div>
    </th>
  )
}

function FilterSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{title}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {children}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        background: active ? 'rgba(129,140,248,0.15)' : 'var(--bg-secondary)',
        border: `1px solid ${active ? 'rgba(129,140,248,0.4)' : 'var(--border)'}`,
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  )
}
