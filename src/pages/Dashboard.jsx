import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Calendar, UserPlus, ArrowRight, Briefcase, XCircle,
} from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import KPICard from '../components/KPICard'
import PipelineFunnel from '../components/PipelineFunnel'
import { PageLoader } from '../components/LoadingSpinner'
import { fetchDashboardStats, STAGE_LABELS, STAGE_ORDER } from '../lib/db'
import { useAuth } from '../lib/auth'
import { format, formatDistanceToNow } from 'date-fns'

export default function Dashboard() {
  const { company } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!company?.id) {
      setLoading(false)
      return
    }
    fetchDashboardStats(company.id)
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Dashboard stats error:', err)
        setError(err.message || 'Failed to load dashboard data')
        setLoading(false)
      })
  }, [company?.id])

  if (loading) return <Layout><PageLoader /></Layout>

  if (error) {
    return (
      <Layout>
        <PageHeader title="Dashboard" subtitle="Command center" />
        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>
        </div>
      </Layout>
    )
  }

  if (!company?.id) {
    return (
      <Layout>
        <PageHeader title="Dashboard" subtitle="Command center" />
        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No company configured for your account.</p>
        </div>
      </Layout>
    )
  }

  const total = stats?.total ?? 0
  const stageCounts = stats?.stageCounts ?? {}
  const rejected = stats?.rejected ?? 0
  const screened = total - rejected
  const awaitingInterview = stageCounts.video_interview ?? 0
  const recent = stats?.recent ?? []

  // Build pipeline funnel data in stage order
  const pipelineData = STAGE_ORDER.map(key => ({
    stage: STAGE_LABELS[key],
    count: stageCounts[key] ?? 0,
  }))

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        subtitle="Command center — real-time overview of your hiring pipeline"
      />

      <div style={{ padding: '20px 28px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <KPICard
            icon={Users}
            label="Total Candidates"
            value={total.toLocaleString()}
            color="var(--info)"
          />
          <KPICard
            icon={Calendar}
            label="Awaiting Interview"
            value={awaitingInterview}
            color="var(--warning)"
          />
          <KPICard
            icon={UserPlus}
            label="Screened"
            value={screened.toLocaleString()}
            color="var(--success)"
          />
          <KPICard
            icon={XCircle}
            label="Rejected"
            value={rejected.toLocaleString()}
            color="var(--danger)"
          />
        </div>

        {/* Pipeline funnel */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '20px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Hiring Pipeline</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>All stages combined</p>
            </div>
            <Link to="/candidates" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <PipelineFunnel data={pipelineData} />
        </div>

        {/* Recent Activity Feed */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Applications</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Latest {recent.length}</span>
          </div>

          {recent.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No recent applications yet.</p>
            </div>
          ) : (
            <div>
              {recent.map((app, idx) => {
                const candidateName = app.candidates?.full_name || `Application #${app.application_id}`
                const skills = app.candidates?.skills || []
                const appliedAt = app.applied_at
                  ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })
                  : '—'
                const appliedDate = app.applied_at
                  ? format(new Date(app.applied_at), 'MMM d')
                  : '—'

                return (
                  <Link
                    key={app.application_id}
                    to={`/candidates/${app.application_id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 20px',
                      borderBottom: idx < recent.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(96,165,250,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <UserPlus size={14} color="var(--info)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {candidateName} applied
                      </span>
                      {skills.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {skills.slice(0, 4).join(' · ')}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'Geist Mono, monospace' }}>
                      {appliedDate}
                    </span>
                    <ArrowRight size={13} color="var(--text-muted)" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
