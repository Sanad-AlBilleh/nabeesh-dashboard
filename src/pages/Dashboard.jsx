import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Users, Calendar, FileText, Clock, TrendingUp,
  UserPlus, ClipboardCheck, Pen, Star, ArrowRight,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import KPICard from '../components/KPICard'
import PipelineFunnel from '../components/PipelineFunnel'
import Badge from '../components/Badge'
import { PageLoader } from '../components/LoadingSpinner'

const MOCK_STATS = {
  active_jobs: 14,
  jobs_change: 3,
  total_candidates: 847,
  candidates_change: 42,
  interviews_this_week: 23,
  interviews_change: 5,
  pending_offers: 7,
  offers_change: -1,
  avg_time_to_hire: 18,
  time_change: -2,
  hire_rate: 68,
  hire_rate_change: 4,
}

const PIPELINE = [
  { stage: 'Applied', count: 847 },
  { stage: 'Screened', count: 412 },
  { stage: 'Interviewed', count: 198 },
  { stage: 'Shortlisted', count: 87 },
  { stage: 'Offered', count: 34 },
  { stage: 'Hired', count: 23 },
]

const SOURCES = [
  { name: 'LinkedIn', value: 38, color: '#60a5fa' },
  { name: 'Indeed', value: 27, color: '#818cf8' },
  { name: 'Direct', value: 19, color: '#34d399' },
  { name: 'ZipRecruiter', value: 11, color: '#fbbf24' },
  { name: 'Other', value: 5, color: '#71717a' },
]

const ACTIVITY = [
  { id: 1, type: 'application', message: 'Marcus Johnson applied for Senior Backend Engineer', time: '2 min ago', link: '/candidates/1', color: 'var(--info)' },
  { id: 2, type: 'assessment', message: 'Sarah Chen completed Big Five Personality Assessment', time: '18 min ago', link: '/assessments', color: 'var(--accent)' },
  { id: 3, type: 'offer', message: 'Ahmed Al-Rashid signed the offer letter for Product Designer', time: '1 hr ago', link: '/offers', color: 'var(--success)' },
  { id: 4, type: 'interview', message: 'AI interview scheduled for Priya Patel — Data Scientist', time: '2 hrs ago', link: '/interviews', color: 'var(--warning)' },
  { id: 5, type: 'shortlist', message: 'Elena Vasquez shortlisted for Head of Marketing', time: '3 hrs ago', link: '/candidates/5', color: 'var(--accent)' },
  { id: 6, type: 'application', message: 'Liam O\'Brien applied for DevOps Engineer', time: '4 hrs ago', link: '/candidates/6', color: 'var(--info)' },
  { id: 7, type: 'assessment', message: 'Jordan Lee completed Cognitive Aptitude Test — Score: 82', time: '5 hrs ago', link: '/assessments', color: 'var(--accent)' },
  { id: 8, type: 'job', message: 'Job "Frontend Engineer" published to LinkedIn & Indeed', time: 'Yesterday', link: '/jobs', color: 'var(--success)' },
]

const activityIcons = {
  application: UserPlus,
  assessment: ClipboardCheck,
  offer: Star,
  interview: Calendar,
  shortlist: Star,
  job: Briefcase,
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  if (loading) return <Layout><PageLoader /></Layout>

  const stats = MOCK_STATS

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        subtitle="Command center — real-time overview of your hiring pipeline"
      />

      <div style={{ padding: '20px 28px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <KPICard
            icon={Briefcase}
            label="Active Jobs"
            value={stats.active_jobs}
            trend={stats.jobs_change}
            trendLabel="this week"
            color="var(--accent)"
          />
          <KPICard
            icon={Users}
            label="Total Candidates"
            value={stats.total_candidates.toLocaleString()}
            trend={stats.candidates_change}
            trendLabel="new this week"
            color="var(--info)"
          />
          <KPICard
            icon={Calendar}
            label="Interviews This Week"
            value={stats.interviews_this_week}
            trend={stats.interviews_change}
            trendLabel="vs last week"
            color="var(--warning)"
          />
          <KPICard
            icon={FileText}
            label="Pending Offers"
            value={stats.pending_offers}
            trend={stats.offers_change}
            trendLabel="vs last week"
            color="var(--success)"
          />
          <KPICard
            icon={Clock}
            label="Avg Time-to-Hire"
            value={`${stats.avg_time_to_hire}d`}
            trend={stats.time_change}
            trendLabel="days change"
            color="var(--text-secondary)"
          />
          <KPICard
            icon={TrendingUp}
            label="Hire Rate"
            value={`${stats.hire_rate}%`}
            trend={stats.hire_rate_change}
            trendLabel="vs last month"
            color="var(--success)"
          />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>
          {/* Pipeline funnel */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Hiring Pipeline</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>All active jobs combined</p>
              </div>
              <Link to="/analytics" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                Full report <ArrowRight size={12} />
              </Link>
            </div>
            <PipelineFunnel data={PIPELINE} />
          </div>

          {/* Source distribution */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Candidate Sources</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Distribution by channel</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={SOURCES}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {SOURCES.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Share']}
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {SOURCES.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {s.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
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
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 24 hours</span>
          </div>
          <div>
            {ACTIVITY.map((event, idx) => {
              const Icon = activityIcons[event.type] || Pen
              return (
                <Link
                  key={event.id}
                  to={event.link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: idx < ACTIVITY.length - 1 ? '1px solid var(--border)' : 'none',
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
                    background: `${event.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={14} color={event.color} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{event.message}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'Geist Mono, monospace' }}>
                    {event.time}
                  </span>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
