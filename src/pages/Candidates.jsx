import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Filter, X, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import ScoreBar from '../components/ScoreBar'
import SearchInput from '../components/SearchInput'
import EmptyState from '../components/EmptyState'
import { SkeletonTable } from '../components/LoadingSpinner'

const MOCK_CANDIDATES = [
  { id: '1', name: 'Marcus Johnson', email: 'marcus@email.com', job_title: 'Senior Backend Engineer', composite_score: 87, stage: 'shortlisted', source: 'linkedin', last_activity: '2026-03-15', assessment_status: 'completed', skills: ['Node.js', 'PostgreSQL', 'AWS'] },
  { id: '2', name: 'Sarah Chen', email: 'sarah@email.com', job_title: 'Product Designer', composite_score: 79, stage: 'interview', source: 'indeed', last_activity: '2026-03-14', assessment_status: 'completed', skills: ['Figma', 'UX Research', 'Prototyping'] },
  { id: '3', name: 'Ahmed Al-Rashid', email: 'ahmed@email.com', job_title: 'Senior Backend Engineer', composite_score: 72, stage: 'screening', source: 'direct', last_activity: '2026-03-13', assessment_status: 'pending', skills: ['Python', 'Django', 'Redis'] },
  { id: '4', name: 'Priya Patel', email: 'priya@email.com', job_title: 'Data Scientist', composite_score: 68, stage: 'applied', source: 'linkedin', last_activity: '2026-03-12', assessment_status: 'not_sent', skills: ['Python', 'ML', 'TensorFlow'] },
  { id: '5', name: 'Jordan Lee', email: 'jordan@email.com', job_title: 'Senior Backend Engineer', composite_score: 91, stage: 'shortlisted', source: 'ziprecruiter', last_activity: '2026-03-11', assessment_status: 'completed', skills: ['Go', 'Kubernetes', 'gRPC'] },
  { id: '6', name: 'Emma Wilson', email: 'emma@email.com', job_title: 'Frontend Engineer', composite_score: 55, stage: 'applied', source: 'indeed', last_activity: '2026-03-13', assessment_status: 'not_sent', skills: ['React', 'TypeScript'] },
  { id: '7', name: 'Liam O\'Brien', email: 'liam@email.com', job_title: 'DevOps Engineer', composite_score: 63, stage: 'screening', source: 'direct', last_activity: '2026-03-10', assessment_status: 'pending', skills: ['Terraform', 'AWS', 'Docker'] },
  { id: '8', name: 'Sofia Martinez', email: 'sofia@email.com', job_title: 'Head of Marketing', composite_score: 44, stage: 'rejected', source: 'indeed', last_activity: '2026-03-08', assessment_status: 'not_sent', skills: ['SEO', 'Content', 'Analytics'] },
  { id: '9', name: 'Elena Vasquez', email: 'elena@email.com', job_title: 'Head of Marketing', composite_score: 83, stage: 'interview', source: 'linkedin', last_activity: '2026-03-14', assessment_status: 'completed', skills: ['Brand Strategy', 'Growth', 'GTM'] },
  { id: '10', name: 'Wei Zhang', email: 'wei@email.com', job_title: 'ML Engineer', composite_score: 88, stage: 'shortlisted', source: 'linkedin', last_activity: '2026-03-15', assessment_status: 'completed', skills: ['PyTorch', 'MLOps', 'Python'] },
  { id: '11', name: 'Isabella Romano', email: 'isabella@email.com', job_title: 'iOS Engineer', composite_score: 76, stage: 'interview', source: 'direct', last_activity: '2026-03-13', assessment_status: 'completed', skills: ['Swift', 'UIKit', 'SwiftUI'] },
  { id: '12', name: 'Noah Thompson', email: 'noah@email.com', job_title: 'Sales Executive', composite_score: 69, stage: 'screening', source: 'linkedin', last_activity: '2026-03-12', assessment_status: 'pending', skills: ['SaaS Sales', 'Salesforce', 'Negotiation'] },
  { id: '13', name: 'Aisha Kofi', email: 'aisha@email.com', job_title: 'Product Designer', composite_score: 82, stage: 'shortlisted', source: 'indeed', last_activity: '2026-03-14', assessment_status: 'completed', skills: ['Figma', 'Design Systems', 'Accessibility'] },
  { id: '14', name: 'Diego Herrera', email: 'diego@email.com', job_title: 'Frontend Engineer', composite_score: 71, stage: 'screening', source: 'ziprecruiter', last_activity: '2026-03-11', assessment_status: 'pending', skills: ['Vue.js', 'CSS', 'Performance'] },
  { id: '15', name: 'Yuki Tanaka', email: 'yuki@email.com', job_title: 'Data Scientist', composite_score: 93, stage: 'offered', source: 'linkedin', last_activity: '2026-03-15', assessment_status: 'completed', skills: ['R', 'Statistics', 'Visualization'] },
]

export default function Candidates() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState([])
  const [sourceFilter, setSourceFilter] = useState([])
  const [assessmentFilter, setAssessmentFilter] = useState('')
  const [scoreRange, setScoreRange] = useState([0, 100])
  const [sortCol, setSortCol] = useState('composite_score')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState(new Set())
  const [filterOpen, setFilterOpen] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const filtered = useMemo(() => {
    let d = MOCK_CANDIDATES.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
      const matchStage = stageFilter.length === 0 || stageFilter.includes(c.stage)
      const matchSource = sourceFilter.length === 0 || sourceFilter.includes(c.source)
      const matchAssessment = !assessmentFilter || c.assessment_status === assessmentFilter
      const matchScore = c.composite_score >= scoreRange[0] && c.composite_score <= scoreRange[1]
      return matchSearch && matchStage && matchSource && matchAssessment && matchScore
    })
    d.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
    return d
  }, [search, stageFilter, sourceFilter, assessmentFilter, scoreRange, sortCol, sortDir])

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

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronsUpDown size={11} color="var(--text-muted)" />
    return sortDir === 'asc' ? <ChevronUp size={11} color="var(--accent)" /> : <ChevronDown size={11} color="var(--accent)" />
  }

  const stages = ['applied', 'screening', 'interview', 'shortlisted', 'offered', 'hired', 'rejected']
  const sources = ['linkedin', 'indeed', 'direct', 'ziprecruiter', 'other']

  return (
    <Layout>
      <PageHeader
        title="Candidates"
        subtitle={`${MOCK_CANDIDATES.length} total · ${filtered.length} matching filters`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, skills..." width={280} />
            <button
              onClick={() => setFilterOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: filterOpen ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13 }}
            >
              <Filter size={13} /> Filters {(stageFilter.length + sourceFilter.length + (assessmentFilter ? 1 : 0)) > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>{stageFilter.length + sourceFilter.length + (assessmentFilter ? 1 : 0)}</span>}
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Sidebar filters */}
        {filterOpen && (
          <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '16px 14px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
            <FilterSection title="Stage">
              {stages.map(s => (
                <FilterChip key={s} label={s} active={stageFilter.includes(s)} onClick={() => toggleFilter(stageFilter, setStageFilter, s)} />
              ))}
            </FilterSection>
            <FilterSection title="Source">
              {sources.map(s => (
                <FilterChip key={s} label={s} active={sourceFilter.includes(s)} onClick={() => toggleFilter(sourceFilter, setSourceFilter, s)} />
              ))}
            </FilterSection>
            <FilterSection title="Assessment">
              {[['', 'All'], ['completed', 'Completed'], ['pending', 'Pending'], ['not_sent', 'Not Sent']].map(([val, lbl]) => (
                <FilterChip key={val} label={lbl} active={assessmentFilter === val} onClick={() => setAssessmentFilter(val)} />
              ))}
            </FilterSection>
            <FilterSection title="Score Range">
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{scoreRange[0]}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{scoreRange[1]}</span>
                </div>
                <input type="range" min={0} max={100} value={scoreRange[0]} onChange={e => setScoreRange([+e.target.value, scoreRange[1]])} style={{ width: '100%', marginBottom: 4, background: 'transparent' }} />
                <input type="range" min={0} max={100} value={scoreRange[1]} onChange={e => setScoreRange([scoreRange[0], +e.target.value])} style={{ width: '100%', background: 'transparent' }} />
              </div>
            </FilterSection>
            {(stageFilter.length + sourceFilter.length + (assessmentFilter ? 1 : 0)) > 0 && (
              <button
                onClick={() => { setStageFilter([]); setSourceFilter([]); setAssessmentFilter(''); setScoreRange([0, 100]) }}
                style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--danger)', fontSize: 12, marginTop: 8 }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(129,140,248,0.08)', borderBottom: '1px solid rgba(129,140,248,0.2)' }}>
              <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{selected.size} selected</span>
              <button style={{ padding: '4px 10px', background: 'var(--success)', color: '#fff', borderRadius: 5, fontSize: 12 }}>Shortlist</button>
              <button style={{ padding: '4px 10px', background: 'var(--danger)', color: '#fff', borderRadius: 5, fontSize: 12 }}>Reject</button>
              <button style={{ padding: '4px 10px', background: 'var(--accent)', color: '#fff', borderRadius: 5, fontSize: 12 }}>Send Assessment</button>
              <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Clear
              </button>
            </div>
          )}

          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" style={{ width: 14, height: 14 }} onChange={() => {
                    if (selected.size === paged.length) setSelected(new Set())
                    else setSelected(new Set(paged.map(c => c.id)))
                  }} checked={paged.length > 0 && selected.size === paged.length} />
                </th>
                <SortTh col="name" label="Name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="job_title" label="Applied For" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="composite_score" label="Score" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="stage" label="Stage" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="source" label="Source" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th>Assessment</th>
                <SortTh col="last_activity" label="Last Activity" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th style={{ width: 60 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ border: 'none', padding: 0 }}>
                    <EmptyState icon={Users} title="No candidates found" description="Adjust your filters or wait for new applications." />
                  </td>
                </tr>
              ) : (
                paged.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/candidates/${c.id}`)}>
                    <td onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => {}} style={{ width: 14, height: 14 }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.job_title}</td>
                    <td style={{ minWidth: 110 }}>
                      <ScoreBar score={c.composite_score} height={4} />
                    </td>
                    <td><Badge status={c.stage} /></td>
                    <td><Badge status={c.source} size="xs" /></td>
                    <td>
                      <Badge
                        label={c.assessment_status === 'not_sent' ? 'Not Sent' : c.assessment_status}
                        variant={c.assessment_status === 'completed' ? 'success' : c.assessment_status === 'pending' ? 'warning' : 'default'}
                        size="xs"
                      />
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>
                      {format(new Date(c.last_activity), 'MMM d')}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', fontSize: 11 }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
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
                  <button key={i} onClick={() => setPage(i)} style={{ width: 28, height: 28, borderRadius: 5, background: i === page ? 'var(--accent)' : 'transparent', border: '1px solid', borderColor: i === page ? 'var(--accent)' : 'var(--border)', color: i === page ? '#fff' : 'var(--text-muted)', fontSize: 12 }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
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
        textTransform: 'capitalize',
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  )
}
