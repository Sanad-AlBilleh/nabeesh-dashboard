import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Calendar, UserPlus, ArrowRight, Briefcase, XCircle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import KPICard from '../components/KPICard'
import PipelineFunnel from '../components/PipelineFunnel'
import { PageLoader } from '../components/LoadingSpinner'
import { fetchDashboardStats, STAGE_LABELS, STAGE_ORDER } from '../lib/db'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { format, formatDistanceToNow } from 'date-fns'


const TOOLTIP_STYLE = {
  background: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: 8,
  fontSize: 12,
}

function AssessmentPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Dashboard() {
  const { company } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assessmentStats, setAssessmentStats] = useState(null)
  const [assessmentLoading, setAssessmentLoading] = useState(true)

  useEffect(() => {
    if (!company?.id) {
      setLoading(false)
      setAssessmentLoading(false)
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

    // Fetch assessment completion stats
    async function fetchAssessmentStats() {
      try {
        const { data: jobs, error: jobsErr } = await supabase
          .from('jobs')
          .select('job_id')
          .eq('company_id', company.id)
        if (jobsErr) throw jobsErr

        const jobIds = (jobs || []).map(j => j.job_id)
        if (jobIds.length === 0) {
          setAssessmentStats({ completed: 0, pending: 0, total: 0 })
          setAssessmentLoading(false)
          return
        }

        const { data: interviews, error: intErr } = await supabase
          .from('interviews')
          .select('status, job_id')
          .in('job_id', jobIds)
        if (intErr) throw intErr

        const total = (interviews || []).length
        const completed = (interviews || []).filter(i => i.status === 'completed').length
        const pending = total - completed
        setAssessmentStats({ completed, pending, total })
      } catch (err) {
        console.error('Assessment stats error:', err)
        setAssessmentStats({ completed: 0, pending: 0, total: 0 })
      } finally {
        setAssessmentLoading(false)
      }
    }
    fetchAssessmentStats()
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

        {/* Assessment Completion Rate */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '20px',
          marginBottom: 24,
        }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>AI Assessment Completion Rate</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Percentage of candidates who completed their AI video assessment
            </p>
          </div>

          {assessmentLoading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: 24, height: 24,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : assessmentStats?.total === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No interview data available yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ flex: '0 0 220px', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: assessmentStats?.completed ?? 0 },
                        { name: 'Pending', value: assessmentStats?.pending ?? 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      dataKey="value"
                      labelLine={false}
                      label={AssessmentPieLabel}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#71717a" />
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [`${value} candidates`, name]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total Sent</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
                    {assessmentStats?.total ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Completed</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
                    {assessmentStats?.completed ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Pending</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#71717a', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
                    {assessmentStats?.pending ?? 0}
                  </div>
                </div>
                {assessmentStats?.total > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>
                      {Math.round((assessmentStats.completed / assessmentStats.total) * 100)}%
                    </span>
                    {' '}completion rate
                  </div>
                )}
              </div>
            </div>
          )}
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
