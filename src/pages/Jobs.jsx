import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit2, XCircle, Briefcase, MapPin, Users, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import { SkeletonTable } from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const PLATFORM_LABELS = { indeed: 'IN', linkedin: 'LI', ziprecruiter: 'ZR', glassdoor: 'GD' }
const PLATFORM_COLORS = { indeed: '#818cf8', linkedin: '#60a5fa', ziprecruiter: '#34d399', glassdoor: '#fbbf24' }

export default function Jobs() {
  const navigate = useNavigate()
  const { company } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (!company?.id) return
    fetchJobs()
  }, [company?.id])

  async function fetchJobs() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          job_id, title, status, employment_type, is_remote,
          job_city, job_country, seniority_level, salary_min, salary_max, salary_currency,
          created_at,
          applications(count),
          job_distributions(platform, status, posted_at)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setJobs(data || [])
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getLocation(job) {
    if (job.is_remote) return 'Remote'
    return [job.job_city, job.job_country].filter(Boolean).join(', ') || ''
  }

  function getLocationType(job) {
    if (job.is_remote) return 'remote'
    return 'onsite'
  }

  function getApplicationCount(job) {
    return job.applications?.[0]?.count || 0
  }

  function getDistributions(job) {
    if (!job.job_distributions || job.job_distributions.length === 0) return []
    return job.job_distributions.map(d => d.platform?.toLowerCase()).filter(Boolean)
  }

  function getSalaryDisplay(job) {
    if (!job.salary_min && !job.salary_max) return null
    const currency = job.salary_currency || 'USD'
    const fmt = (n) => n ? n.toLocaleString() : null
    if (job.salary_min && job.salary_max) {
      return `${currency} ${fmt(job.salary_min)} - ${fmt(job.salary_max)}`
    }
    return `${currency} ${fmt(job.salary_min || job.salary_max)}`
  }

  const filtered = jobs.filter(j => {
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    const loc = getLocation(j)
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || loc.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = {
    all: jobs.length,
    open: jobs.filter(j => j.status === 'open').length,
    published: jobs.filter(j => j.status === 'published').length,
    draft: jobs.filter(j => j.status === 'draft').length,
    closed: jobs.filter(j => j.status === 'closed').length,
  }

  // Determine which status tabs to show based on data
  const statusTabs = ['all', 'open', 'published', 'draft', 'closed'].filter(
    s => s === 'all' || counts[s] > 0
  )

  return (
    <Layout>
      <PageHeader
        title="Jobs"
        subtitle={`${counts.open + counts.published} active · ${counts.draft} draft · ${counts.closed} closed`}
        actions={
          <Link to="/jobs/new">
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
            }}>
              <Plus size={15} /> Create Job
            </button>
          </Link>
        }
      />

      <div style={{ padding: '16px 28px' }}>
        {/* Error state */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 16 }}>
            <AlertCircle size={14} color="var(--danger)" />
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>Failed to load jobs: {error}</span>
            <button onClick={fetchJobs} style={{ marginLeft: 'auto', padding: '4px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-secondary)', fontSize: 12 }}>Retry</button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
            {statusTabs.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 14px',
                  background: statusFilter === s ? 'var(--bg-tertiary)' : 'transparent',
                  color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: statusFilter === s ? 600 : 400,
                  textTransform: 'capitalize',
                  borderRadius: 0,
                }}
              >
                {s} {counts[s] !== undefined && <span style={{ opacity: 0.6 }}>({counts[s]})</span>}
              </button>
            ))}
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search jobs..." width={260} />
        </div>

        {/* Table */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Applications</th>
                <th>Platforms</th>
                <th>Created</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={8} cols={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ border: 'none', padding: 0 }}>
                    <EmptyState icon={Briefcase} title="No jobs found" description="Create a job to start recruiting candidates." action={
                      <Link to="/jobs/new">
                        <button style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 13 }}>
                          Create Job
                        </button>
                      </Link>
                    } />
                  </td>
                </tr>
              ) : (
                filtered.map(job => {
                  const location = getLocation(job)
                  const locationType = getLocationType(job)
                  const appCount = getApplicationCount(job)
                  const distributions = getDistributions(job)

                  return (
                    <tr
                      key={job.job_id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/jobs/${job.job_id}`)}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{job.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{job.seniority_level}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--text-muted)" />
                          <span style={{ fontSize: 12 }}>{location || '—'}</span>
                        </div>
                        <Badge status={locationType} size="xs" style={{ marginTop: 3 }} />
                      </td>
                      <td>
                        <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{job.employment_type || '—'}</span>
                      </td>
                      <td>
                        <Badge status={job.status} dot />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Users size={12} color="var(--text-muted)" />
                          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {appCount}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {distributions.length === 0 ? (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          ) : (
                            distributions.map(d => (
                              <span key={d} style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                                background: `${PLATFORM_COLORS[d] || '#71717a'}20`,
                                color: PLATFORM_COLORS[d] || '#71717a',
                                border: `1px solid ${PLATFORM_COLORS[d] || '#71717a'}35`,
                              }}>
                                {PLATFORM_LABELS[d] || d.slice(0, 2).toUpperCase()}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>
                          {job.created_at ? format(new Date(job.created_at), 'MMM d') : '—'}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <ActionBtn title="View applications" onClick={() => navigate(`/jobs/${job.job_id}`)}>
                            <Eye size={13} />
                          </ActionBtn>
                          <ActionBtn title="Edit" onClick={() => navigate(`/jobs/${job.job_id}/edit`)}>
                            <Edit2 size={13} />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

function ActionBtn({ children, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 5,
        color: 'var(--text-muted)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {children}
    </button>
  )
}
