import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit2, XCircle, Briefcase, MapPin, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import { SkeletonTable } from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'

const MOCK_JOBS = [
  { id: '1', title: 'Senior Backend Engineer', location: 'San Francisco, CA', location_type: 'hybrid', employment_type: 'full-time', status: 'published', application_count: 47, seniority: 'senior', created_at: '2026-02-15', distributions: ['indeed', 'linkedin', 'ziprecruiter'] },
  { id: '2', title: 'Product Designer', location: 'Remote', location_type: 'remote', employment_type: 'full-time', status: 'published', application_count: 31, seniority: 'mid', created_at: '2026-02-20', distributions: ['linkedin', 'indeed'] },
  { id: '3', title: 'Head of Marketing', location: 'New York, NY', location_type: 'onsite', employment_type: 'full-time', status: 'published', application_count: 24, seniority: 'lead', created_at: '2026-02-22', distributions: ['linkedin'] },
  { id: '4', title: 'Data Scientist', location: 'Austin, TX', location_type: 'hybrid', employment_type: 'full-time', status: 'draft', application_count: 0, seniority: 'mid', created_at: '2026-03-01', distributions: [] },
  { id: '5', title: 'DevOps Engineer', location: 'Remote', location_type: 'remote', employment_type: 'contract', status: 'published', application_count: 19, seniority: 'mid', created_at: '2026-03-05', distributions: ['indeed', 'ziprecruiter'] },
  { id: '6', title: 'Frontend Engineer', location: 'Seattle, WA', location_type: 'hybrid', employment_type: 'full-time', status: 'published', application_count: 38, seniority: 'mid', created_at: '2026-03-08', distributions: ['linkedin', 'indeed'] },
  { id: '7', title: 'Customer Success Manager', location: 'Chicago, IL', location_type: 'onsite', employment_type: 'full-time', status: 'closed', application_count: 56, seniority: 'mid', created_at: '2026-01-10', distributions: ['linkedin', 'indeed', 'glassdoor'] },
  { id: '8', title: 'iOS Engineer', location: 'Remote', location_type: 'remote', employment_type: 'full-time', status: 'draft', application_count: 0, seniority: 'senior', created_at: '2026-03-14', distributions: [] },
  { id: '9', title: 'Sales Executive', location: 'Boston, MA', location_type: 'hybrid', employment_type: 'full-time', status: 'published', application_count: 12, seniority: 'senior', created_at: '2026-03-10', distributions: ['linkedin'] },
  { id: '10', title: 'ML Engineer', location: 'San Francisco, CA', location_type: 'hybrid', employment_type: 'full-time', status: 'published', application_count: 29, seniority: 'senior', created_at: '2026-03-12', distributions: ['linkedin', 'indeed'] },
]

const PLATFORM_LABELS = { indeed: 'IN', linkedin: 'LI', ziprecruiter: 'ZR', glassdoor: 'GD' }
const PLATFORM_COLORS = { indeed: '#818cf8', linkedin: '#60a5fa', ziprecruiter: '#34d399', glassdoor: '#fbbf24' }

export default function Jobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openMenu, setOpenMenu] = useState(null)

  useEffect(() => {
    setTimeout(() => { setJobs(MOCK_JOBS); setLoading(false) }, 600)
  }, [])

  const filtered = jobs.filter(j => {
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.location.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = { all: jobs.length, published: jobs.filter(j => j.status === 'published').length, draft: jobs.filter(j => j.status === 'draft').length, closed: jobs.filter(j => j.status === 'closed').length }

  return (
    <Layout>
      <PageHeader
        title="Jobs"
        subtitle={`${counts.published} active · ${counts.draft} draft · ${counts.closed} closed`}
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
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
            {['all', 'published', 'draft', 'closed'].map(s => (
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
                filtered.map(job => (
                  <tr
                    key={job.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{job.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{job.seniority}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 12 }}>{job.location}</span>
                      </div>
                      <Badge status={job.location_type} size="xs" style={{ marginTop: 3 }} />
                    </td>
                    <td>
                      <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{job.employment_type}</span>
                    </td>
                    <td>
                      <Badge status={job.status} dot />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={12} color="var(--text-muted)" />
                        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {job.application_count}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {job.distributions.length === 0 ? (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                        ) : (
                          job.distributions.map(d => (
                            <span key={d} style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              background: `${PLATFORM_COLORS[d]}20`,
                              color: PLATFORM_COLORS[d],
                              border: `1px solid ${PLATFORM_COLORS[d]}35`,
                            }}>
                              {PLATFORM_LABELS[d]}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>
                        {format(new Date(job.created_at), 'MMM d')}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <ActionBtn title="View applications" onClick={() => navigate(`/jobs/${job.id}`)}>
                          <Eye size={13} />
                        </ActionBtn>
                        <ActionBtn title="Edit" onClick={() => navigate(`/jobs/${job.id}/edit`)}>
                          <Edit2 size={13} />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
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
