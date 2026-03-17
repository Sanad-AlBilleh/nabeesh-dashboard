import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Edit2, ChevronLeft, MapPin, Briefcase, DollarSign,
  CheckCircle, XCircle, AlertCircle, ExternalLink,
  BarChart2, Columns, Users, Play,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import PipelineFunnel from '../components/PipelineFunnel'
import { PageLoader } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { fetchJobPipelineCandidates, STAGE_ORDER, STAGE_LABELS } from '../lib/queries/jobKanban'
import { triggerStage3 } from '../lib/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(fullName) {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function scoreColor(score) {
  if (score == null) return 'var(--text-muted)'
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function scoreBg(score) {
  if (score == null) return 'rgba(113,113,122,0.15)'
  if (score >= 75) return 'rgba(34,197,94,0.15)'
  if (score >= 50) return 'rgba(245,158,11,0.15)'
  return 'rgba(239,68,68,0.15)'
}

function relativeDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

function formatSalary(min, max, currency = 'USD') {
  if (!min && !max) return null
  const fmt = (n) => n ? `$${(n / 1000).toFixed(0)}k` : null
  const minStr = fmt(min)
  const maxStr = fmt(max)
  if (minStr && maxStr) return `${minStr}–${maxStr}`
  return minStr || maxStr
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ['#4f46e5', 'rgba(79,70,229,0.18)'],
  ['#0891b2', 'rgba(8,145,178,0.18)'],
  ['#059669', 'rgba(5,150,105,0.18)'],
  ['#d97706', 'rgba(217,119,6,0.18)'],
  ['#7c3aed', 'rgba(124,58,237,0.18)'],
  ['#db2777', 'rgba(219,39,119,0.18)'],
]

function avatarPalette(name) {
  if (!name) return AVATAR_COLORS[0]
  const code = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[code]
}

// ─── Candidate Card ──────────────────────────────────────────────────────────

function CandidateCard({ app, onClick }) {
  const candidate = app.candidates || {}
  const scoreRow = Array.isArray(app.stage2_results)
    ? app.stage2_results[0]
    : app.stage2_results
  const rawScore = scoreRow?.total_score
  const score = rawScore != null ? Math.round(rawScore * (rawScore <= 1 ? 100 : 1)) : null
  const skills = Array.isArray(candidate.skills) ? candidate.skills : []
  const visibleSkills = skills.slice(0, 3)
  const [fg, bg] = avatarPalette(candidate.full_name)

  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      {/* Top row: avatar + name + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: bg,
          border: `1.5px solid ${fg}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: fg,
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}>
          {getInitials(candidate.full_name)}
        </div>

        {/* Name + date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {candidate.full_name || 'Unknown'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {relativeDate(app.applied_at)}
          </div>
        </div>

        {/* Score badge */}
        {score != null && (
          <div style={{
            background: scoreBg(score),
            color: scoreColor(score),
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 5,
            letterSpacing: '0.02em',
            flexShrink: 0,
          }}>
            {score}%
          </div>
        )}
      </div>

      {/* Seniority */}
      {candidate.seniority_level && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Briefcase size={11} color="var(--text-muted)" />
          <span style={{ textTransform: 'capitalize' }}>{candidate.seniority_level}</span>
        </div>
      )}

      {/* Awaiting LLM eval badge */}
      {app.status === 'stage3_waiting' && (
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          background: 'rgba(245,158,11,0.12)',
          color: '#f59e0b',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
        }}>
          ⏳ Awaiting LLM Evaluation
        </div>
      )}

      {/* Skills */}
      {visibleSkills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {visibleSkills.map((skill, i) => (
            <span key={i} style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 7px',
              background: 'rgba(99,102,241,0.1)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 4,
            }}>
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 7px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}>
              +{skills.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Kanban Column ───────────────────────────────────────────────────────────

const STAGE_ACCENT = {
  applied:         { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  hard_filters:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
  semantic:        { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
  llm_evaluation:  { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  video_interview: { color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)' },
  hired:           { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)'   },
}

function KanbanColumn({ stageKey, cards, onCardClick, onPromote, promoting }) {
  const label = STAGE_LABELS[stageKey]
  const accent = STAGE_ACCENT[stageKey] || STAGE_ACCENT.applied
  const count = cards.length
  const hasWaiting = stageKey === 'llm_evaluation' && cards.some(a => (a.status || '') === 'stage3_waiting')

  return (
    <div style={{
      minWidth: 280,
      width: 280,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      flexShrink: 0,
    }}>
      {/* Column header */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        borderRadius: '10px 10px 0 0',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {/* Stage color dot */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: accent.color,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text-primary)',
          flex: 1,
          letterSpacing: '0.01em',
        }}>
          {label}
        </span>
        {/* Count badge */}
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          background: accent.bg,
          color: accent.color,
          border: `1px solid ${accent.border}`,
          padding: '1px 7px',
          borderRadius: 10,
          minWidth: 22,
          textAlign: 'center',
        }}>
          {count}
        </span>
      </div>

      {/* Promote button for stage3_waiting candidates */}
      {hasWaiting && (
        <button
          onClick={(e) => { e.stopPropagation(); onPromote?.() }}
          disabled={promoting}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            padding: '8px 12px',
            background: promoting ? 'rgba(99,102,241,0.1)' : 'rgba(34,197,94,0.12)',
            color: promoting ? 'var(--text-muted)' : '#22c55e',
            border: `1px solid ${promoting ? 'var(--border)' : 'rgba(34,197,94,0.3)'}`,
            borderTop: 'none',
            borderBottom: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: promoting ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Play size={12} />
          {promoting ? 'Promoting…' : 'Promote to LLM Evaluation'}
        </button>
      )}

      {/* Top accent bar */}
      <div style={{ height: 2, background: accent.color, opacity: 0.6 }} />

      {/* Cards container */}
      <div style={{
        background: 'rgba(17,17,19,0.5)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 120,
        flex: 1,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 280px)',
      }}>
        {count === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 12px',
            color: 'var(--text-muted)',
            fontSize: 12,
            gap: 6,
            opacity: 0.6,
          }}>
            <Users size={18} color="var(--text-muted)" />
            <span>No candidates</span>
          </div>
        ) : (
          cards.map(app => (
            <CandidateCard
              key={app.application_id}
              app={app}
              onClick={() => onCardClick(app.application_id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Pipeline Board Tab ──────────────────────────────────────────────────────

function PipelineBoardTab({ jobId }) {
  const navigate = useNavigate()
  const [columns, setColumns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [promoting, setPromoting] = useState(false)

  async function handlePromote() {
    setPromoting(true)
    try {
      await triggerStage3(jobId)
      // Refresh board
      const { columns: fresh } = await fetchJobPipelineCandidates(jobId)
      setColumns(fresh)
    } catch (err) {
      console.error('Promote failed:', err)
      alert('Failed to promote candidates: ' + (err.message || 'Unknown error'))
    } finally {
      setPromoting(false)
    }
  }

  useEffect(() => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    fetchJobPipelineCandidates(jobId)
      .then(({ columns }) => {
        setColumns(columns)
        setLoading(false)
      })
      .catch(err => {
        console.error('Kanban fetch error:', err)
        setError(err.message || 'Failed to load pipeline data')
        setLoading(false)
      })
  }, [jobId])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        Loading pipeline…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#ef4444', fontSize: 13 }}>
        {error}
      </div>
    )
  }

  const totalCandidates = columns
    ? STAGE_ORDER.reduce((sum, s) => sum + (columns[s]?.length || 0), 0)
    : 0

  return (
    <div>
      {/* Board summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-muted)', fontSize: 12 }}>
        <Users size={13} />
        <span>{totalCandidates} total candidate{totalCandidates !== 1 ? 's' : ''} across {STAGE_ORDER.length} stages</span>
      </div>

      {/* Horizontal scrolling board */}
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 16,
        alignItems: 'flex-start',
        // Custom scrollbar styling via pseudoelements won't work inline;
        // this is a best-effort on the container.
      }}>
        {STAGE_ORDER.map(stageKey => (
          <KanbanColumn
            key={stageKey}
            stageKey={stageKey}
            cards={columns?.[stageKey] || []}
            onCardClick={(applicationId) => navigate(`/candidates/${applicationId}`)}
            onPromote={handlePromote}
            promoting={promoting}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Distribution Tab ────────────────────────────────────────────────────────

function DistributionTab({ jobId }) {
  const [distributions, setDistributions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!jobId) return
    supabase
      .from('job_distributions')
      .select('*')
      .eq('job_id', jobId)
      .then(({ data }) => { setDistributions(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [jobId])

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>Loading…</div>

  if (!distributions.length) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        No job distributions configured yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 600 }}>
      {distributions.map(d => (
        <div key={d.platform} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 18px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent)',
          }}>
            {d.platform[0]}{d.platform[1]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{d.platform}</div>
            {d.error && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{d.error}</div>}
            {d.posted_at && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Posted {format(new Date(d.posted_at), 'MMM d, yyyy')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {d.status === 'posted'  && <><CheckCircle  size={15} color="#22c55e" /><span style={{ fontSize: 12, color: '#22c55e'  }}>Posted</span></>}
            {d.status === 'failed'  && <><XCircle      size={15} color="#ef4444" /><span style={{ fontSize: 12, color: '#ef4444'  }}>Failed</span></>}
            {d.status === 'pending' && <><AlertCircle  size={15} color="#f59e0b" /><span style={{ fontSize: 12, color: '#f59e0b'  }}>Pending</span></>}
            {d.url && (
              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Analytics Tab ───────────────────────────────────────────────────────────

function AnalyticsTab({ columns }) {
  const pipelineData = STAGE_ORDER.map(s => ({
    stage: STAGE_LABELS[s],
    count: columns?.[s]?.length || 0,
  }))

  // Source breakdown from raw cards
  const sourceMap = {}
  if (columns) {
    for (const stage of STAGE_ORDER) {
      for (const app of (columns[stage] || [])) {
        const src = app.candidates?.source || 'Unknown'
        sourceMap[src] = (sourceMap[src] || 0) + 1
      }
    }
  }
  const sourceData = Object.entries(sourceMap).map(([source, count]) => ({ source, count }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Pipeline Funnel</h4>
        <PipelineFunnel data={pipelineData} />
      </div>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Applications by Source</h4>
        {sourceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sourceData} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="source" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
            No source data available
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function JobDetail() {
  const { id: jobId } = useParams()
  const navigate = useNavigate()

  const [tab, setTab] = useState('pipeline')
  const [job, setJob] = useState(null)
  const [jobLoading, setJobLoading] = useState(true)
  const [jobError, setJobError] = useState(null)

  // Kanban columns state (lifted so Analytics tab can use it)
  const [columns, setColumns] = useState(null)

  // Load job metadata
  useEffect(() => {
    if (!jobId) return
    setJobLoading(true)
    setJobError(null)

    supabase
      .from('jobs')
      .select('*')
      .eq('job_id', jobId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Job fetch error:', error)
          setJobError(error.message || 'Failed to load job')
        } else {
          setJob(data)
        }
        setJobLoading(false)
      })
  }, [jobId])

  // Load kanban data once (shared between Pipeline and Analytics tabs)
  useEffect(() => {
    if (!jobId) return
    fetchJobPipelineCandidates(jobId)
      .then(({ columns }) => setColumns(columns))
      .catch(err => console.error('Pipeline fetch error:', err))
  }, [jobId])

  const TABS = [
    { key: 'pipeline',     label: 'Pipeline Board', icon: <Columns size={13} /> },
    { key: 'distribution', label: 'Distribution',   icon: <ExternalLink size={13} /> },
    { key: 'analytics',    label: 'Analytics',      icon: <BarChart2 size={13} /> },
  ]

  // Subtitle parts for the header
  const subtitleParts = []
  if (job?.location)         subtitleParts.push(job.location)
  if (job?.location_type)    subtitleParts.push(job.location_type)
  if (job?.employment_type)  subtitleParts.push(job.employment_type)
  const salary = formatSalary(job?.salary_min, job?.salary_max, job?.currency)
  if (salary)                subtitleParts.push(salary)

  if (jobLoading) return <Layout><PageLoader /></Layout>

  if (jobError) {
    return (
      <Layout>
        <div style={{ padding: 32, color: '#ef4444', fontSize: 14 }}>
          Error loading job: {jobError}
        </div>
      </Layout>
    )
  }

  const totalCandidates = columns
    ? STAGE_ORDER.reduce((sum, s) => sum + (columns[s]?.length || 0), 0)
    : null

  return (
    <Layout>
      <PageHeader
        title={job?.title || 'Job Detail'}
        breadcrumb="Jobs"
        subtitle={subtitleParts.join(' · ')}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/jobs')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={13} /> Back
            </button>
            <button
              onClick={() => navigate(`/jobs/${jobId}/edit`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Edit2 size={13} /> Edit
            </button>
            {job?.status && <Badge status={job.status} dot size="md" />}
          </div>
        }
      />

      {/* Tab navigation */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
        display: 'flex',
        gap: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              background: 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
              borderRadius: 0,
              marginBottom: -1,
              cursor: 'pointer',
              transition: 'all 0.1s',
              whiteSpace: 'nowrap',
            }}
          >
            {t.icon}
            {t.label}
            {t.key === 'pipeline' && totalCandidates != null && (
              <span style={{
                marginLeft: 2,
                fontSize: 11,
                background: 'var(--bg-tertiary)',
                padding: '1px 6px',
                borderRadius: 10,
                color: 'var(--text-secondary)',
              }}>
                {totalCandidates}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px 28px', minHeight: 400 }}>
        {tab === 'pipeline' && (
          <PipelineBoardTab jobId={jobId} />
        )}
        {tab === 'distribution' && (
          <DistributionTab jobId={jobId} />
        )}
        {tab === 'analytics' && (
          <AnalyticsTab columns={columns} />
        )}
      </div>
    </Layout>
  )
}
