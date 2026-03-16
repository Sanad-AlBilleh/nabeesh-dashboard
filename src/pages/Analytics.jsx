import React, { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import PipelineFunnel from '../components/PipelineFunnel'

const PIPELINE_DATA = [
  { stage: 'Applied', count: 847 },
  { stage: 'Screened', count: 412 },
  { stage: 'Interviewed', count: 198 },
  { stage: 'Shortlisted', count: 87 },
  { stage: 'Offered', count: 34 },
  { stage: 'Hired', count: 23 },
]

const SOURCE_DATA = [
  { name: 'LinkedIn', count: 318, hired: 11, color: '#60a5fa' },
  { name: 'Indeed', count: 229, hired: 7, color: '#818cf8' },
  { name: 'Direct', count: 161, hired: 3, color: '#34d399' },
  { name: 'ZipRecruiter', count: 93, hired: 2, color: '#fbbf24' },
  { name: 'Other', count: 46, hired: 0, color: '#71717a' },
]

const TIME_TO_HIRE = [
  { month: 'Oct', days: 24 },
  { month: 'Nov', days: 22 },
  { month: 'Dec', days: 26 },
  { month: 'Jan', days: 21 },
  { month: 'Feb', days: 19 },
  { month: 'Mar', days: 18 },
]

const SCORE_HISTOGRAM = [
  { range: '0-10', count: 12 },
  { range: '10-20', count: 18 },
  { range: '20-30', count: 24 },
  { range: '30-40', count: 38 },
  { range: '40-50', count: 67 },
  { range: '50-60', count: 112 },
  { range: '60-70', count: 148 },
  { range: '70-80', count: 187 },
  { range: '80-90', count: 156 },
  { range: '90-100', count: 85 },
]

const HIRE_BY_STAGE = [
  { stage: 'CV Score', avg: 74 },
  { stage: 'Phone Screen', avg: 68 },
  { stage: 'Assessment', avg: 79 },
  { stage: 'Interview', avg: 83 },
]

const TOP_SOURCES = [
  { source: 'LinkedIn', candidates: 318, hired: 11, rate: '3.5%', avgScore: 72 },
  { source: 'Indeed', candidates: 229, hired: 7, rate: '3.1%', avgScore: 68 },
  { source: 'Direct', candidates: 161, hired: 3, rate: '1.9%', avgScore: 75 },
  { source: 'ZipRecruiter', candidates: 93, hired: 2, rate: '2.2%', avgScore: 65 },
  { source: 'Other', candidates: 46, hired: 0, rate: '0%', avgScore: 61 },
]

const MONTHLY_HIRES = [
  { month: 'Oct', hires: 3, applications: 121 },
  { month: 'Nov', hires: 4, applications: 138 },
  { month: 'Dec', hires: 2, applications: 98 },
  { month: 'Jan', hires: 5, applications: 156 },
  { month: 'Feb', hires: 6, applications: 172 },
  { month: 'Mar', hires: 3, applications: 162 },
]

const TOOLTIP_STYLE = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }

export default function Analytics() {
  const [dateRange, setDateRange] = useState('6m')
  const [jobFilter, setJobFilter] = useState('all')

  return (
    <Layout>
      <PageHeader
        title="Analytics"
        subtitle="Pipeline performance, hiring trends, and source effectiveness"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} style={{ width: 'auto', padding: '7px 12px', fontSize: 12 }}>
              <option value="all">All Jobs</option>
              <option value="1">Senior Backend Engineer</option>
              <option value="2">Product Designer</option>
              <option value="3">Head of Marketing</option>
            </select>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Applications', value: '847', change: '+12%', color: 'var(--info)' },
            { label: 'Total Hires', value: '23', change: '+18%', color: 'var(--success)' },
            { label: 'Avg Time-to-Hire', value: '18d', change: '-3d', color: 'var(--warning)' },
            { label: 'Hire Rate', value: '2.7%', change: '+0.4%', color: 'var(--accent)' },
            { label: 'Avg Composite Score', value: '71', change: '+3', color: 'var(--text-secondary)' },
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>{kpi.change} vs prev period</div>
            </div>
          ))}
        </div>

        {/* Row 1: Pipeline + Monthly Hires */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="Hiring Pipeline" subtitle="All stages, all jobs">
            <PipelineFunnel data={PIPELINE_DATA} />
          </ChartCard>
          <ChartCard title="Monthly Hires vs Applications" subtitle="6-month trend">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_HIRES} barSize={20}>
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

        {/* Row 2: Time to Hire + Score Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="Time-to-Hire Trend" subtitle="Average days from application to hire">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={TIME_TO_HIRE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={[10, 30]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} days`, 'Avg Time-to-Hire']} />
                <Line type="monotone" dataKey="days" stroke="#818cf8" strokeWidth={2.5} dot={{ fill: '#818cf8', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Score Distribution" subtitle="Composite score histogram across all candidates">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SCORE_HISTOGRAM} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                {SCORE_HISTOGRAM.map((entry, i) => null)}
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {SCORE_HISTOGRAM.map((entry, i) => {
                    const pct = parseInt(entry.range.split('-')[0])
                    const color = pct >= 80 ? '#34d399' : pct >= 60 ? '#818cf8' : pct >= 40 ? '#fbbf24' : '#f87171'
                    return <Cell key={i} fill={color} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Source + Avg Score per Stage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="Source of Hire" subtitle="Applications and conversion by channel">
            <div style={{ marginBottom: 10 }}>
              {SOURCE_DATA.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 90 }}>{s.name}</span>
                  <div style={{ flex: 1, height: 5, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.count / 847) * 100}%`, height: '100%', background: s.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'var(--text-primary)', minWidth: 28, textAlign: 'right' }}>{s.count}</span>
                  <span style={{ fontSize: 11, color: s.hired > 0 ? 'var(--success)' : 'var(--text-muted)', minWidth: 50, textAlign: 'right' }}>{s.hired} hired</span>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="Average Score by Stage" subtitle="Dropoff analysis through the pipeline">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={HIRE_BY_STAGE} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="stage" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}/100`, 'Avg Score']} />
                <Bar dataKey="avg" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top Sources Table */}
        <ChartCard title="Top Performing Sources" subtitle="Ranked by hire rate">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Source</th>
                <th>Candidates</th>
                <th>Hired</th>
                <th>Hire Rate</th>
                <th>Avg Score</th>
                <th>Score Bar</th>
              </tr>
            </thead>
            <tbody>
              {TOP_SOURCES.map((s, i) => (
                <tr key={s.source}>
                  <td style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{s.source}</td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13 }}>{s.candidates}</td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--success)', fontWeight: 600 }}>{s.hired}</td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--accent)' }}>{s.rate}</td>
                  <td style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 700, color: s.avgScore >= 70 ? 'var(--success)' : 'var(--warning)' }}>{s.avgScore}</td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ height: 5, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${s.avgScore}%`, height: '100%', background: s.avgScore >= 70 ? 'var(--success)' : 'var(--warning)', borderRadius: 2 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
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
