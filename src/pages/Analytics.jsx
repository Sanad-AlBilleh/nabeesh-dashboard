import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import PipelineFunnel from '../components/PipelineFunnel'
import { PageLoader } from '../components/LoadingSpinner'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { STAGE_LABELS, STAGE_ORDER, deriveStage } from '../lib/db'

const TOOLTIP_STYLE = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }

// Custom label for pie chart segments
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
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

export default function Analytics() {
  const { company } = useAuth()
  const [dateRange, setDateRange] = useState('6m')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Real data states
  const [pipelineData, setPipelineData] = useState([])
  const [assessmentData, setAssessmentData] = useState([])
  const [assessmentStats, setAssessmentStats] = useState({ completed: 0, pending: 0, total: 0 })
  const [kpiStats, setKpiStats] = useState({
    totalApplications: 0,
    totalHires: 0,
    hireRate: '0%',
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [scoreHistogram, setScoreHistogram] = useState([])

  useEffect(() => {
    if (!company?.id) {
      setLoading(false)
      return
    }
    loadAnalytics(company.id)
  }, [company?.id])

  async function loadAnalytics(companyId) {
    setLoading(true)
    setError(null)
    try {
      // Fetch all applications with stage data
      const { data: apps, error: appsErr } = await supabase
        .from('applications')
        .select(`
          application_id, status, pipeline_stage, applied_at,
          jobs!inner(job_id, company_id),
          stage2_results(total_score)
        `)
        .eq('jobs.company_id', companyId)
        .order('applied_at', { ascending: false })
      if (appsErr) throw appsErr

      const allApps = apps || []

      // KPI stats
      const totalApplications = allApps.length
      const totalHires = allApps.filter(a => a.status === 'hired').length
      const hireRate = totalApplications > 0
        ? `${((totalHires / totalApplications) * 100).toFixed(1)}%`
        : '0%'
      setKpiStats({ totalApplications, totalHires, hireRate })

      // Pipeline funnel
      const stageCounts = {}
      for (const key of STAGE_ORDER) stageCounts[key] = 0
      for (const a of allApps) {
        const s = deriveStage(a.status, a.pipeline_stage)
        stageCounts[s] = (stageCounts[s] || 0) + 1
      }
      setPipelineData(STAGE_ORDER.map(key => ({
        stage: STAGE_LABELS[key],
        count: stageCounts[key] ?? 0,
      })))

      // Monthly hires vs applications (last 6 months)
      const now = new Date()
      const months = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
          month: d.toLocaleString('default', { month: 'short' }),
          year: d.getFullYear(),
          monthNum: d.getMonth(),
          hires: 0,
          applications: 0,
        })
      }
      for (const a of allApps) {
        if (!a.applied_at) continue
        const d = new Date(a.applied_at)
        const entry = months.find(m => m.year === d.getFullYear() && m.monthNum === d.getMonth())
        if (entry) {
          entry.applications++
          if (a.status === 'hired') entry.hires++
        }
      }
      setMonthlyData(months)

      // Score histogram from stage2_results
      const RANGES = [
        { range: '0-10', min: 0, max: 10 },
        { range: '10-20', min: 10, max: 20 },
        { range: '20-30', min: 20, max: 30 },
        { range: '30-40', min: 30, max: 40 },
        { range: '40-50', min: 40, max: 50 },
        { range: '50-60', min: 50, max: 60 },
        { range: '60-70', min: 60, max: 70 },
        { range: '70-80', min: 70, max: 80 },
        { range: '80-90', min: 80, max: 90 },
        { range: '90-100', min: 90, max: 101 },
      ]
      const histCounts = RANGES.map(r => ({ ...r, count: 0 }))
      for (const a of allApps) {
        const score = a.stage2_results?.total_score
        if (score == null) continue
        const bucket = histCounts.find(r => score >= r.min && score < r.max)
        if (bucket) bucket.count++
      }
      setScoreHistogram(histCounts)

      // Assessment completion: get job IDs, then query interviews
      const jobIds = [...new Set(allApps.map(a => a.jobs?.job_id).filter(Boolean))]
      if (jobIds.length > 0) {
        const { data: interviews, error: intErr } = await supabase
          .from('interviews')
          .select('status, job_id')
          .in('job_id', jobIds)
        if (intErr) throw intErr

        const total = (interviews || []).length
        const completed = (interviews || []).filter(i => i.status === 'completed').length
        const pending = total - completed
        setAssessmentStats({ completed, pending, total })
        setAssessmentData([
          { name: 'Completed', value: completed },
          { name: 'Pending', value: pending },
        ])
      } else {
        setAssessmentStats({ completed: 0, pending: 0, total: 0 })
        setAssessmentData([{ name: 'Completed', value: 0 }, { name: 'Pending', value: 0 }])
      }
    } catch (err) {
      console.error('Analytics error:', err)
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  if (error) {
    return (
      <Layout>
        <PageHeader title="Analytics" subtitle="Pipeline performance, hiring trends, and source effectiveness" />
        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>
        </div>
      </Layout>
    )
  }

  if (!company?.id) {
    return (
      <Layout>
        <PageHeader title="Analytics" subtitle="Pipeline performance, hiring trends, and source effectiveness" />
        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No company configured for your account.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader
        title="Analytics"
        subtitle="Pipeline performance, hiring trends, and source effectiveness"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
              {[['1m', '1M'], ['3m', '3M'], ['6m', '6M'], ['1y', '1Y']].map(([val, lbl]) => (
                <button key={val} onClick={() => setDateRange(val)} style={{ padding: '6px 10px', background: dateRange === val ? 'var(--bg-tertiary)' : 'transparent', color: dateRange === val ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: dateRange === val ? 600 : 400 }}>{lbl}</button>
              ))}
            </div>
          </div>
        }
      />

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPI Summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Applications', value: kpiStats.totalApplications.toLocaleString(), color: 'var(--info)' },
            { label: 'Total Hires', value: kpiStats.totalHires.toLocaleString(), color: 'var(--success)' },
            { label: 'Hire Rate', value: kpiStats.hireRate, color: 'var(--accent)' },
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Row 1: Pipeline + Monthly Hires */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="Hiring Pipeline" subtitle="All stages, all jobs">
            <PipelineFunnel data={pipelineData} />
          </ChartCard>
          <ChartCard title="Monthly Hires vs Applications" subtitle="6-month trend">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar yAxisId="right" dataKey="applications" fill="#3f3f46" radius={[3, 3, 0, 0]} name="Applications" />
                <Bar yAxisId="left" dataKey="hires" fill="#34d399" radius={[3, 3, 0, 0]} name="Hires" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2: Score Distribution + Assessment Completion */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="Score Distribution" subtitle="Composite score histogram across all candidates">
            {scoreHistogram.every(b => b.count === 0) ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No score data available yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreHistogram} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {scoreHistogram.map((entry, i) => {
                      const pct = parseInt(entry.range.split('-')[0])
                      const color = pct >= 80 ? '#34d399' : pct >= 60 ? '#818cf8' : pct >= 40 ? '#fbbf24' : '#f87171'
                      return <Cell key={i} fill={color} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Assessment Completion Rate Pie Chart */}
          <ChartCard title="AI Assessment Completion Rate" subtitle="Candidates who completed their AI video assessment">
            {assessmentStats.total === 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No interview data available yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ flex: '0 0 200px', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assessmentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        labelLine={false}
                        label={PieLabel}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Total Sent</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
                      {assessmentStats.total}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Completed</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
                      {assessmentStats.completed}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Pending</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#71717a', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
                      {assessmentStats.pending}
                    </div>
                  </div>
                  {assessmentStats.total > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>
                        {Math.round((assessmentStats.completed / assessmentStats.total) * 100)}%
                      </span>
                      {' '}completion rate
                    </div>
                  )}
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </Layout>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
