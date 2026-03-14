import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Briefcase, Mic, Trophy, Clock, TrendingUp, CheckCircle, XCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  StatCard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Progress,
} from '@/components/ui'
import { StatusBadge } from '@/components/ui/badges'
import { supabase, STATUS_LABELS, formatRelativeTime } from '@/lib/supabase'
import { Button } from '@/components/ui'

const FUNNEL_COLORS = ['#1a93ac', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#166534']

export default function Dashboard() {
  const [jobs,          setJobs]          = useState([])
  const [stats,         setStats]         = useState({ total:0, screened:0, interviewed:0, scored:0, rejected:0, onHold:0, interviewing:0, hired:0 })
  const [recentApps,    setRecentApps]    = useState([])
  const [topCandidates, setTopCandidates] = useState([])
  const [recentHires,   setRecentHires]   = useState([])
  const [latestJobApps, setLatestJobApps] = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    loadData().finally(() => setLoading(false))
    const iv = setInterval(loadData, 10000)
    return () => clearInterval(iv)
  }, [])

  async function loadData() {
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('job_id, title, seniority_level, status, company_name, created_at')
      .order('created_at', { ascending: false })
    const jobs = jobsData || []
    setJobs(jobs)

    const [
      { count: total }, { count: screened }, { count: interviewed },
      { count: scored }, { count: rejected }, { count: onHold },
      { count: interviewing }, { count: hired },
    ] = await Promise.all([
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true })
        .in('status', ['stage3_waiting','stage3_processing','interview_pending','interview_completed','scored','hired']),
      supabase.from('applications').select('*', { count: 'exact', head: true })
        .in('status', ['interview_completed','scored','hired']),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status','scored'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status','screen_rejected'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status','stage3_waiting'),
      supabase.from('applications').select('*', { count: 'exact', head: true })
        .in('status', ['interview_pending','interview_completed']),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status','hired'),
    ])

    setStats({
      total:       total       || 0,
      screened:    screened    || 0,
      interviewed: interviewed || 0,
      scored:      scored      || 0,
      rejected:    rejected    || 0,
      onHold:      onHold      || 0,
      interviewing:interviewing|| 0,
      hired:       hired       || 0,
    })

    const { data: recent } = await supabase
      .from('applications')
      .select('application_id, candidate_id, job_id, status, updated_at, candidates(full_name), jobs(title)')
      .order('updated_at', { ascending: false })
      .limit(8)
    setRecentApps(recent || [])

    if (jobs.length > 0) {
      const { data: latestApps } = await supabase
        .from('applications')
        .select('application_id, candidate_id, status, updated_at, candidates(full_name)')
        .eq('job_id', jobs[0].job_id)
        .order('updated_at', { ascending: false })
        .limit(5)
      setLatestJobApps(latestApps || [])

      const { data: topData } = await supabase
        .from('applications')
        .select('application_id, candidate_id, status, updated_at, candidates(full_name, seniority_level), stage2_results(total_score), interview_scores(final_composite)')
        .eq('job_id', jobs[0].job_id)
        .in('status', ['stage3_waiting','stage3_processing','interview_pending','interview_completed','scored','hired'])
        .order('updated_at', { ascending: false })
        .limit(5)
      setTopCandidates(topData || [])
    }

    const { data: hiresData } = await supabase
      .from('applications')
      .select('application_id, candidate_id, status, updated_at, candidates(full_name), jobs(title)')
      .eq('status', 'hired')
      .order('updated_at', { ascending: false })
      .limit(5)
    setRecentHires(hiresData || [])
  }

  const passRate      = stats.total > 0 ? Math.round((stats.screened / stats.total) * 100) : 0
  const totalScreened = stats.screened + stats.rejected
  const timeSaved     = Math.round(totalScreened * 5 / 60 * 10) / 10
  const latestJob     = jobs[0] || null

  const funnelData = [
    { name: 'Applied',      value: stats.total },
    { name: 'Shortlisted',  value: stats.screened },
    { name: 'Interviewing', value: stats.interviewing },
    { name: 'Scored',       value: stats.scored },
    { name: 'Hired',        value: stats.hired },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading dashboard…</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {jobs.length} active job{jobs.length !== 1 ? 's' : ''} · pipeline overview
          </p>
        </div>
        <Link to="/jobs/new">
          <Button size="sm">+ Post New Job</Button>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Applicants" value={stats.total}       icon={Users}      sub="All time" />
          <StatCard label="Shortlisted"       value={stats.screened}    icon={CheckCircle} sub={`${passRate}% pass rate`} trendUp={passRate > 30} />
          <StatCard label="Interviews Done"   value={stats.interviewed} icon={Mic}         sub="completed" />
          <StatCard label="Hired"             value={stats.hired}       icon={Trophy}      sub="final decisions" trendUp={stats.hired > 0} />
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Screened Out"  value={stats.rejected}     icon={XCircle}    trendUp={false} sub="hard rejected" />
          <StatCard label="On Hold"       value={stats.onHold}       icon={Clock}       sub="awaiting S3" />
          <StatCard label="Interviewing"  value={stats.interviewing} icon={Mic}         sub="in progress" />
          <StatCard label="Time Saved"    value={`${timeSaved}h`}    icon={TrendingUp}  sub="est. @5 min/review" trendUp />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Funnel Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Pipeline Funnel</CardTitle>
              <CardDescription>Candidate drop-off across all stages</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {funnelData.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i] || '#1a93ac'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Efficiency */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>AI Efficiency</CardTitle>
              <CardDescription>Acquisition breakdown · all jobs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Applied',      value: 100,                                                             color: '#1a93ac' },
                { label: 'Shortlisted',  value: stats.total > 0 ? Math.round(stats.screened/stats.total*100) : 0,  color: '#10b981' },
                { label: 'Rejected',     value: stats.total > 0 ? Math.round(stats.rejected/stats.total*100) : 0,  color: '#ef4444' },
                { label: 'On Hold',      value: stats.total > 0 ? Math.round(stats.onHold/stats.total*100) : 0,    color: '#f59e0b' },
                { label: 'Interviewing', value: stats.total > 0 ? Math.round(stats.interviewing/stats.total*100):0, color: '#8b5cf6' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-medium tabular-nums">{row.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${row.value}%`, background: row.color }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Jobs Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Jobs</CardTitle>
                  <CardDescription className="mt-1">{jobs.length} posting{jobs.length !== 1 ? 's' : ''}</CardDescription>
                </div>
                <Link to="/jobs/new">
                  <Button variant="outline" size="sm">+ New</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No jobs yet. <Link to="/jobs/new" className="text-brand underline">Post your first job</Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map(job => (
                      <TableRow key={job.job_id}>
                        <TableCell className="font-medium text-slate-900">{job.title}</TableCell>
                        <TableCell className="text-muted-foreground">{job.company_name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{job.seniority_level}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.status === 'open' ? 'success' : 'secondary'} className="capitalize">{job.status || 'open'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Link to={`/jobs/${job.job_id}`}>
                            <Button variant="ghost" size="sm" className="text-xs">View →</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>AI Activity</CardTitle>
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                  Live
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              {recentApps.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentApps.map(app => (
                    <div key={app.application_id} className="flex items-start gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-700 leading-snug">
                          <span className="font-medium">{app.candidates?.full_name || `#${app.candidate_id}`}</span>
                          {' '}
                          <StatusBadge status={app.status} />
                        </p>
                        {app.jobs?.title && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{app.jobs.title}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatRelativeTime(app.updated_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Candidates + Recent Hires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                Top Candidates
                {latestJob && <span className="font-normal text-muted-foreground ml-1">— {latestJob.title}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {topCandidates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No scored candidates yet</p>
              ) : (
                <div className="space-y-2">
                  {topCandidates.map((app, idx) => {
                    const score = app.interview_scores?.[0]?.final_composite ?? app.stage2_results?.[0]?.total_score
                    return (
                      <div key={app.application_id} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                        <span className="text-xs font-mono text-muted-foreground w-5 flex-shrink-0">#{idx + 1}</span>
                        <span className="text-sm font-medium text-slate-800 flex-1 truncate">
                          {app.candidates?.full_name || `Candidate #${app.candidate_id}`}
                        </span>
                        {score != null && (
                          <span className="text-xs font-mono font-semibold text-brand flex-shrink-0">
                            {Number(score).toFixed(1)}
                          </span>
                        )}
                        <StatusBadge status={app.status} />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Hires</CardTitle>
                {recentHires.length > 0 && (
                  <Badge variant="success">{recentHires.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentHires.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No hires yet</p>
              ) : (
                <div className="space-y-2">
                  {recentHires.map(hire => (
                    <div key={hire.application_id} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                      <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {hire.candidates?.full_name || `#${hire.candidate_id}`}
                        </p>
                        {hire.jobs?.title && (
                          <p className="text-xs text-muted-foreground truncate">{hire.jobs.title}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatRelativeTime(hire.updated_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
