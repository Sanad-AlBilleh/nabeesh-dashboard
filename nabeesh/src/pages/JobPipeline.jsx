import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Play, Zap, ChevronRight } from 'lucide-react'
import { supabase, pipelineUrl, gradeColor, STATUS_LABELS, STATUS_COLORS, formatRelativeTime } from '@/lib/supabase'
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Button, Badge, Progress,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui'
import { StatusBadge, GradeBadge } from '@/components/ui/badges'
import { cn } from '@/lib/utils'

const STAGE_DEFS = [
  {
    key: 'applied', name: 'Applied', short: 'Applied',
    description: 'Candidate submitted their application. No AI processing has started yet.',
    passStatuses: [], failStatuses: [],
  },
  {
    key: 's1', name: 'Stage 1', short: 'AI Screen',
    description: 'The AI scans each resume and checks basic qualification match. Candidates who clearly do not meet minimum criteria are rejected automatically.',
    passStatuses: ['stage3_waiting','stage3_processing','interview_pending','interview_completed','scored','hired'],
    failStatuses: ['screen_rejected'],
  },
  {
    key: 's2', name: 'Stage 2', short: 'Deep Analysis',
    description: 'Top candidates receive a detailed AI evaluation across skills match, experience depth, career trajectory, and role alignment. A numeric total_score is assigned.',
    passStatuses: ['stage3_waiting','stage3_processing','interview_pending','interview_completed','scored','hired'],
    failStatuses: [],
  },
  {
    key: 's3', name: 'Stage 3', short: 'LLM Ranking',
    description: 'Top-scoring candidates are ranked using four AI-evaluated dimensions: Trajectory, Growth, Achievement Quality, and Consistency.',
    passStatuses: ['interview_pending','interview_completed','scored','hired'],
    failStatuses: ['rejected'],
  },
  {
    key: 'interview', name: 'Interview', short: 'Interview',
    description: 'Candidates who passed Stage 3 are invited to an AI-conducted voice interview. The AI asks structured questions and generates a performance assessment.',
    passStatuses: ['interview_completed','scored','hired'],
    failStatuses: [],
  },
  {
    key: 'scored', name: 'Final Score', short: 'Final Score',
    description: 'A final composite score combines Stage 2 analysis, Stage 3 profile grades, and interview performance into a definitive ranking.',
    passStatuses: ['scored','hired'],
    failStatuses: ['rejected'],
  },
]

export default function JobPipeline() {
  const { jobId }           = useParams()
  const [job,        setJob]        = useState(null)
  const [apps,       setApps]       = useState([])
  const [logs,       setLogs]       = useState([])
  const [funnel,     setFunnel]     = useState({ applied:0, s1:0, s2:0, s3:0, interview:0, scored:0 })
  const [injecting,  setInjecting]  = useState(false)
  const [promoting,  setPromoting]  = useState(false)
  const [selectedStage, setSelectedStage] = useState(null)
  const [stageTab,   setStageTab]   = useState('pass')
  const logRef = useRef(null)

  useEffect(() => {
    loadJob(); loadApps()
    const iv = setInterval(loadApps, 5000)
    return () => clearInterval(iv)
  }, [jobId])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  function addLog(msg, type = 'info') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(p => [...p.slice(-100), { time, msg, type }])
  }

  async function loadJob() {
    const { data } = await supabase.from('jobs').select('*').eq('job_id', jobId).single()
    setJob(data)
  }

  async function loadApps() {
    const { data } = await supabase.from('applications')
      .select(`
        application_id, candidate_id, job_id, status, pipeline_stage, updated_at,
        candidates(full_name, skills, seniority_level, years_relevant_experience),
        stage2_results(total_score),
        stage3_results(trajectory_grade, growth_grade, achievement_quality_grade, consistency_grade, stage3_score, passed),
        interviews(interview_id, status, interview_link, duration_seconds),
        interview_scores(stage6_score, final_composite, assessment_summary)
      `)
      .eq('job_id', jobId)
      .order('updated_at', { ascending: false })

    const appData = data || []
    setApps(appData)

    const f = { applied: appData.length, s1:0, s2:0, s3:0, interview:0, scored:0 }
    for (const a of appData) {
      const s = a.status
      if (['screening','stage3_waiting','stage3_processing','interview_pending','interview_completed','scored'].includes(s)) f.s1++
      if (['stage3_waiting','stage3_processing','interview_pending','interview_completed','scored'].includes(s)) f.s2++
      if (['interview_pending','interview_completed','scored'].includes(s)) f.s3++
      if (['interview_completed','scored'].includes(s)) f.interview++
      if (s === 'scored') f.scored++
    }
    setFunnel(f)
  }

  async function injectSynthetic() {
    setInjecting(true)
    addLog('Injecting synthetic candidates...', 'stage')
    const synthetic = [
      { full_name:'Sara Al-Rashid',  skills:['Python','SQL','REST APIs','Docker','AWS'],       seniority_level:'junior', years_relevant_experience:3, highest_degree:'bachelor', major:'Computer Science',    city:'Amman',  willing_to_relocate:'yes', professional_summary:'Backend developer focused on scalable API design.' },
      { full_name:'Khalid Nasser',   skills:['Node.js','PostgreSQL','REST APIs','TypeScript'], seniority_level:'mid',    years_relevant_experience:4, highest_degree:'bachelor', major:'Software Engineering', city:'Amman',  willing_to_relocate:'no',  professional_summary:'Full-stack engineer with backend focus.' },
      { full_name:'Nour Haddad',     skills:['Python','Django','PostgreSQL','Redis','Docker'], seniority_level:'mid',    years_relevant_experience:5, highest_degree:'masters',  major:'Computer Science',    city:'Beirut', willing_to_relocate:'yes', professional_summary:'Senior backend engineer specializing in distributed systems.' },
      { full_name:'Ahmad Zahra',     skills:['Java','Spring Boot','MySQL'],                    seniority_level:'junior', years_relevant_experience:2, highest_degree:'bachelor', major:'Information Technology',city:'Amman', willing_to_relocate:'no',  professional_summary:'Java developer with enterprise experience.' },
      { full_name:'Lina Khoury',     skills:['Python','Flask','MongoDB','REST APIs'],          seniority_level:'entry',  years_relevant_experience:1, highest_degree:'bachelor', major:'Computer Science',    city:'Amman',  willing_to_relocate:'yes', professional_summary:'Recent grad passionate about backend development.' },
    ]
    for (const c of synthetic) {
      addLog(`Creating candidate: ${c.full_name}`, 'info')
      const { data: cand, error: cErr } = await supabase.from('candidates').insert(c).select().single()
      if (cErr) { addLog(`Error creating ${c.full_name}: ${cErr.message}`, 'error'); continue }
      await supabase.from('candidate_experiences').insert({
        candidate_id: cand.candidate_id,
        title: c.seniority_level === 'entry' ? 'Junior Developer' : 'Software Engineer',
        company: ['TechCo','DataSoft','CloudBase','AppWorks','DevHub'][Math.floor(Math.random()*5)],
        duration: `${2024-c.years_relevant_experience}-2024`, job_type:'full-time',
        responsibilities:['Developed REST APIs','Wrote unit tests','Participated in code reviews'],
        achievements: c.years_relevant_experience >= 3 ? ['Reduced API response time by 30%'] : [],
        sort_order: 1,
      })
      await supabase.from('candidate_projects').insert({
        candidate_id: cand.candidate_id,
        name:'API Gateway', description:'Built a centralized API gateway for microservices communication', sort_order:1,
      })
      addLog(`Applying ${c.full_name} to job...`, 'stage')
      const { error: aErr } = await supabase.from('applications').insert({ candidate_id: cand.candidate_id, job_id: Number(jobId), status:'applied' })
      if (aErr) addLog(`Error applying: ${aErr.message}`, 'error')
      else addLog(`${c.full_name} applied — pipeline triggered`, 'success')
      await new Promise(r => setTimeout(r, 500))
    }
    addLog('All synthetic candidates injected. Pipeline processing...', 'success')
    setInjecting(false)
    setTimeout(loadApps, 3000)
  }

  async function promoteStage3() {
    setPromoting(true)
    addLog('Triggering Stage 3 promotion for top candidates...', 'stage')
    try {
      const res  = await fetch(`${pipelineUrl}/api/trigger-stage3`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ job_id: Number(jobId), top_percent: 0.5 }),
      })
      const data = await res.json()
      addLog(`Stage 3: ${data.num_activated||0} candidates promoted out of ${data.num_waiting||0} waiting`, 'success')
    } catch (err) {
      addLog(`Stage 3 promotion failed: ${err.message}`, 'error')
    }
    setPromoting(false)
    setTimeout(loadApps, 5000)
  }

  // helpers
  const getS2Score  = a => { const s2 = a.stage2_results;    if (Array.isArray(s2) && s2.length) return Number(s2[0].total_score||0).toFixed(1); return null }
  const getComposite= a => { const sc = a.interview_scores; if (Array.isArray(sc) && sc.length) return Number(sc[0].final_composite||0).toFixed(1); return null }
  const getInterviewLink = a => { const iv = a.interviews; if (Array.isArray(iv) && iv.length) return iv[0]; return null }
  const getS3Grade  = a => {
    const s3 = a.stage3_results
    if (Array.isArray(s3) && s3.length) return { t:s3[0].trajectory_grade, g:s3[0].growth_grade, a:s3[0].achievement_quality_grade, c:s3[0].consistency_grade }
    return null
  }
  const getStageCount = k => ({ applied:funnel.applied, s1:funnel.s1, s2:funnel.s2, s3:funnel.s3, interview:funnel.interview, scored:funnel.scored }[k]||0)
  function getStageCandidates(key, tab) {
    const def = STAGE_DEFS.find(s => s.key === key)
    if (!def) return []
    if (key === 'applied') return apps
    const statuses = tab === 'pass' ? def.passStatuses : def.failStatuses
    return apps.filter(a => statuses.includes(a.status))
  }

  if (!job) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm text-muted-foreground">Loading job…</p>
    </div>
  )

  const selectedDef    = selectedStage ? STAGE_DEFS.find(s => s.key === selectedStage) : null
  const isApplied      = selectedStage === 'applied'
  const hasNoFail      = selectedDef && selectedDef.failStatuses.length === 0 && !isApplied
  const passCount      = selectedDef ? (isApplied ? apps.length : apps.filter(a => selectedDef.passStatuses.includes(a.status)).length) : 0
  const failCount      = selectedDef ? apps.filter(a => selectedDef.failStatuses.includes(a.status)).length : 0
  const detailCandidates = selectedDef ? getStageCandidates(selectedStage, stageTab) : []

  const pipelineProgress = [
    { label:'Applied → S1',        from: funnel.applied,    to: funnel.s1 },
    { label:'S1 → S2',             from: funnel.s1,         to: funnel.s2 },
    { label:'S2 → S3',             from: funnel.s2,         to: funnel.s3 },
    { label:'S3 → Interview',      from: funnel.s3,         to: funnel.interview },
    { label:'Interview → Scored',  from: funnel.interview,  to: funnel.scored },
  ]

  const logColors = { info:'text-slate-400', success:'text-green-400', error:'text-red-400', stage:'text-brand' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-900 truncate">{job.title}</h1>
            <p className="text-xs text-muted-foreground">
              {job.company_name} · {job.seniority_level} · {job.job_city || 'Remote'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={injectSynthetic} disabled={injecting}>
            <Zap className="h-3.5 w-3.5" />
            {injecting ? 'Injecting…' : 'Inject Candidates'}
          </Button>
          <Button size="sm" onClick={promoteStage3} disabled={promoting}>
            <Play className="h-3.5 w-3.5" />
            {promoting ? 'Promoting…' : 'Promote to Stage 3'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stage Navigator */}
        <Card className="overflow-hidden">
          <div className="flex divide-x divide-slate-100">
            {STAGE_DEFS.map((stage, i) => {
              const count  = getStageCount(stage.key)
              const active = selectedStage === stage.key
              return (
                <button
                  key={stage.key}
                  onClick={() => setSelectedStage(active ? null : stage.key)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-4 px-2 text-center transition-colors',
                    active ? 'bg-brand-50 border-b-2 border-brand' : 'hover:bg-slate-50 border-b-2 border-transparent',
                  )}
                >
                  <span className={cn('text-xs font-medium leading-tight', active ? 'text-brand' : 'text-slate-500')}>
                    {stage.short}
                  </span>
                  <span className={cn(
                    'text-lg font-semibold tabular-nums leading-none',
                    active ? 'text-brand' : 'text-slate-800',
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Stage Detail */}
        {selectedDef && (
          <Card>
            <div className="flex divide-x divide-slate-100">
              {/* Description + mini stats */}
              <div className="w-72 flex-shrink-0 p-5 bg-slate-50 rounded-l-lg">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{selectedDef.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{selectedDef.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border border-slate-100 rounded-md p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Passed</p>
                    <p className={cn('text-xl font-semibold tabular-nums', isApplied ? 'text-slate-800' : 'text-green-600')}>
                      {isApplied ? apps.length : passCount}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-md p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Rejected</p>
                    <p className={cn('text-xl font-semibold tabular-nums', (isApplied||hasNoFail) ? 'text-slate-300' : 'text-red-500')}>
                      {(isApplied || hasNoFail) ? '—' : failCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Candidate list */}
              <div className="flex-1 min-w-0">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-4">
                  {isApplied ? (
                    <span className="py-3 text-xs font-semibold text-brand border-b-2 border-brand mr-4">All Applicants</span>
                  ) : (
                    <>
                      <button
                        onClick={() => setStageTab('pass')}
                        className={cn('py-3 text-xs font-semibold border-b-2 mr-4 transition-colors',
                          stageTab === 'pass' ? 'text-brand border-brand' : 'text-slate-400 border-transparent hover:text-slate-600')}
                      >
                        Passed
                      </button>
                      <button
                        onClick={() => setStageTab('fail')}
                        className={cn('py-3 text-xs font-semibold border-b-2 transition-colors',
                          stageTab === 'fail' ? 'text-red-500 border-red-500' : 'text-slate-400 border-transparent hover:text-slate-600')}
                      >
                        Rejected
                      </button>
                    </>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {detailCandidates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No candidates at this stage</p>
                  ) : (
                    detailCandidates.map(c => {
                      const s2   = getS2Score(c)
                      const comp = getComposite(c)
                      return (
                        <div key={c.application_id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <div className="flex-1 min-w-0">
                            <Link to={`/jobs/${jobId}/candidate/${c.candidate_id}`} className="text-sm font-medium text-slate-900 hover:text-brand transition-colors">
                              {c.candidates?.full_name || `#${c.candidate_id}`}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.candidates?.seniority_level} · {c.candidates?.years_relevant_experience}yr
                            </p>
                          </div>
                          <StatusBadge status={c.status} />
                          {s2   && <span className="text-xs font-mono text-slate-600">S2: <span className="font-semibold text-slate-800">{s2}</span></span>}
                          {comp && <span className="text-xs font-mono font-bold text-brand">{comp}</span>}
                          <Link to={`/jobs/${jobId}/candidate/${c.candidate_id}`}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Log + Pipeline Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Log */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                <CardTitle>AI Pipeline Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={logRef}
                className="h-48 overflow-y-auto rounded-md bg-slate-950 p-3 font-mono text-xs space-y-1"
              >
                {logs.length === 0 && <span className="text-slate-500">Pipeline logs will appear here…</span>}
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-slate-500 flex-shrink-0">{l.time}</span>
                    <span className={logColors[l.type] || 'text-slate-300'}>{l.msg}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Pipeline Conversion</CardTitle>
              <CardDescription>Stage-by-stage pass rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipelineProgress.map(row => {
                const pct = row.from > 0 ? Math.round(row.to / row.from * 100) : 0
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="font-mono font-semibold text-slate-700">{row.to}/{row.from} ({pct}%)</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Candidates</CardTitle>
                <CardDescription className="mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>S2 Score</TableHead>
                  <TableHead>S3 Grades</TableHead>
                  <TableHead>Interview</TableHead>
                  <TableHead>Composite</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                      No applications yet. Use "Inject Candidates" to test the pipeline.
                    </TableCell>
                  </TableRow>
                )}
                {apps.map(a => {
                  const s3 = getS3Grade(a)
                  const iv = getInterviewLink(a)
                  const s2 = getS2Score(a)
                  const comp = getComposite(a)
                  return (
                    <TableRow key={a.application_id}>
                      <TableCell>
                        <p className="font-medium text-slate-900 text-sm">{a.candidates?.full_name || `#${a.candidate_id}`}</p>
                        <p className="text-xs text-muted-foreground capitalize">{a.candidates?.seniority_level} · {a.candidates?.years_relevant_experience}yr</p>
                      </TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-slate-700">{s2 || '—'}</span>
                      </TableCell>
                      <TableCell>
                        {s3 ? (
                          <div className="flex gap-1">
                            {[s3.t, s3.g, s3.a, s3.c].map((g, i) => <GradeBadge key={i} grade={g} />)}
                          </div>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {iv ? (
                          iv.status === 'pending' ? (
                            <a href={iv.interview_link} target="_blank" rel="noopener">
                              <Button variant="outline" size="sm">Start</Button>
                            </a>
                          ) : (
                            <Badge variant="success" className="capitalize">
                              {iv.status}{iv.duration_seconds ? ` (${Math.round(iv.duration_seconds/60)}m)` : ''}
                            </Badge>
                          )
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={cn('font-mono text-sm font-semibold', comp ? 'text-brand' : 'text-muted-foreground')}>
                          {comp || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link to={`/jobs/${jobId}/candidate/${a.candidate_id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">View →</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
