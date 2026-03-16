import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit2, ChevronLeft, MapPin, Clock, Users, ExternalLink, CheckCircle, XCircle, AlertCircle, BarChart2 } from 'lucide-react'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import ScoreBar from '../components/ScoreBar'
import PipelineFunnel from '../components/PipelineFunnel'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const MOCK_JOB = {
  id: '1',
  title: 'Senior Backend Engineer',
  status: 'published',
  location: 'San Francisco, CA',
  location_type: 'hybrid',
  employment_type: 'full-time',
  seniority_level: 'senior',
  salary_min: 140000,
  salary_max: 180000,
  currency: 'USD',
  created_at: '2026-02-15',
  description: 'We are looking for a Senior Backend Engineer to join our core infrastructure team. You will design and build scalable, high-performance systems that process millions of events per day.',
  required_skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS'],
}

const MOCK_APPLICATIONS = [
  { id: '1', name: 'Marcus Johnson', email: 'marcus@email.com', score: 87, stage: 'shortlisted', source: 'linkedin', applied_at: '2026-03-10' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@email.com', score: 79, stage: 'interview', source: 'indeed', applied_at: '2026-03-09' },
  { id: '3', name: 'Ahmed Al-Rashid', email: 'ahmed@email.com', score: 72, stage: 'screening', source: 'direct', applied_at: '2026-03-11' },
  { id: '4', name: 'Priya Patel', email: 'priya@email.com', score: 68, stage: 'applied', source: 'linkedin', applied_at: '2026-03-12' },
  { id: '5', name: 'Jordan Lee', email: 'jordan@email.com', score: 91, stage: 'shortlisted', source: 'ziprecruiter', applied_at: '2026-03-08' },
  { id: '6', name: 'Emma Wilson', email: 'emma@email.com', score: 55, stage: 'applied', source: 'indeed', applied_at: '2026-03-13' },
  { id: '7', name: 'Liam O\'Brien', email: 'liam@email.com', score: 63, stage: 'screening', source: 'direct', applied_at: '2026-03-10' },
  { id: '8', name: 'Sofia Martinez', email: 'sofia@email.com', score: 44, stage: 'rejected', source: 'indeed', applied_at: '2026-03-07' },
]

const MOCK_DISTRIBUTIONS = [
  { platform: 'LinkedIn', status: 'posted', url: 'https://linkedin.com/jobs/1234', posted_at: '2026-02-15' },
  { platform: 'Indeed', status: 'posted', url: 'https://indeed.com/job/5678', posted_at: '2026-02-15' },
  { platform: 'ZipRecruiter', status: 'failed', url: null, posted_at: null, error: 'Account not connected' },
]

const PIPELINE = [
  { stage: 'Applied', count: 47 },
  { stage: 'Screened', count: 24 },
  { stage: 'Interviewed', count: 12 },
  { stage: 'Shortlisted', count: 6 },
  { stage: 'Offered', count: 2 },
  { stage: 'Hired', count: 1 },
]

const SOURCE_DATA = [
  { source: 'LinkedIn', count: 22 },
  { source: 'Indeed', count: 14 },
  { source: 'Direct', count: 7 },
  { source: 'ZipRecruiter', count: 4 },
]

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('applications')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())

  useEffect(() => { setTimeout(() => setLoading(false), 600) }, [])

  if (loading) return <Layout><PageLoader /></Layout>

  const job = MOCK_JOB
  const applications = MOCK_APPLICATIONS

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const tabs = ['applications', 'distribution', 'analytics']

  return (
    <Layout>
      <PageHeader
        title={job.title}
        breadcrumb="Jobs"
        subtitle={`${job.location} · ${job.location_type} · ${job.employment_type} · $${job.salary_min?.toLocaleString()}–$${job.salary_max?.toLocaleString()}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/jobs')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
              <ChevronLeft size={13} /> Back
            </button>
            <button onClick={() => navigate(`/jobs/${id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}>
              <Edit2 size={13} /> Edit
            </button>
            <Badge status={job.status} dot size="md" />
          </div>
        }
      />

      {/* Tab nav */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', gap: 0 }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              borderRadius: 0,
              textTransform: 'capitalize',
              marginBottom: -1,
              transition: 'all 0.1s',
            }}
          >
            {t}
            {t === 'applications' && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 10 }}>{applications.length}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* Applications Tab */}
        {tab === 'applications' && (
          <>
            {selected.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{selected.size} selected</span>
                <button style={{ padding: '4px 10px', background: 'var(--success)', color: '#fff', borderRadius: 5, fontSize: 12 }}>Shortlist All</button>
                <button style={{ padding: '4px 10px', background: 'var(--danger)', color: '#fff', borderRadius: 5, fontSize: 12 }}>Reject All</button>
                <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--text-muted)', fontSize: 12 }}>Clear</button>
              </div>
            )}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><input type="checkbox" style={{ width: 14, height: 14 }} /></th>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Stage</th>
                    <th>Source</th>
                    <th>Applied</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/candidates/${app.id}`)}>
                      <td onClick={e => { e.stopPropagation(); toggleSelect(app.id) }}>
                        <input type="checkbox" checked={selected.has(app.id)} onChange={() => {}} style={{ width: 14, height: 14 }} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                            {app.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{app.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <ScoreBar score={app.score} height={5} />
                      </td>
                      <td><Badge status={app.stage} /></td>
                      <td><Badge status={app.source} size="xs" /></td>
                      <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>{format(new Date(app.applied_at), 'MMM d')}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <SmallBtn title="View" onClick={() => navigate(`/candidates/${app.id}`)} color="var(--info)">View</SmallBtn>
                          <SmallBtn title="Shortlist" onClick={() => {}} color="var(--success)">✓</SmallBtn>
                          <SmallBtn title="Reject" onClick={() => {}} color="var(--danger)">✗</SmallBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Distribution Tab */}
        {tab === 'distribution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 600 }}>
            {MOCK_DISTRIBUTIONS.map(d => (
              <div key={d.platform} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                  {d.platform[0]}{d.platform[1]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{d.platform}</div>
                  {d.error && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>{d.error}</div>}
                  {d.posted_at && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Posted {format(new Date(d.posted_at), 'MMM d, yyyy')}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {d.status === 'posted' && <><CheckCircle size={15} color="var(--success)" /> <span style={{ fontSize: 12, color: 'var(--success)' }}>Posted</span></>}
                  {d.status === 'failed' && <><XCircle size={15} color="var(--danger)" /> <span style={{ fontSize: 12, color: 'var(--danger)' }}>Failed</span></>}
                  {d.status === 'pending' && <><AlertCircle size={15} color="var(--warning)" /> <span style={{ fontSize: 12, color: 'var(--warning)' }}>Pending</span></>}
                  {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', display: 'flex' }}><ExternalLink size={13} /></a>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Pipeline Funnel</h4>
              <PipelineFunnel data={PIPELINE} />
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Applications by Source</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SOURCE_DATA} layout="vertical" barSize={16}>
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="source" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function SmallBtn({ children, onClick, title, color }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${color}40`, borderRadius: 4, color, fontSize: 11, fontWeight: 600 }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}18` }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}
