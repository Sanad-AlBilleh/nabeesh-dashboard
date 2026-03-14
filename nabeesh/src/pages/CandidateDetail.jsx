import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, User, Briefcase, GraduationCap, MapPin } from 'lucide-react'
import { supabase, gradeColor } from '@/lib/supabase'
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Button, Badge, Progress,
} from '@/components/ui'
import { GradeBadge } from '@/components/ui/badges'
import { cn } from '@/lib/utils'

function ScoreRow({ label, value, max = 100 }) {
  const pct   = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-mono font-semibold text-slate-800">{Number(value).toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TimelineItem({ done, active, rejected, title, detail }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          done     ? 'bg-green-500 border-green-500' :
          rejected ? 'bg-red-400 border-red-400' :
          active   ? 'bg-brand border-brand' :
          'bg-white border-slate-200',
        )}>
          {done     && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 12 12"><path d="M2 6l3 3 5-5"/></svg>}
          {rejected && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6"/></svg>}
        </div>
        <div className="w-px flex-1 bg-slate-100 mt-1" />
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        {detail && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{detail}</p>}
      </div>
    </div>
  )
}

export default function CandidateDetail() {
  const { jobId, candidateId } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [app,  setApp]  = useState(null)
  const [s1,   setS1]   = useState(null)
  const [s2,   setS2]   = useState(null)
  const [s3,   setS3]   = useState(null)
  const [interview, setInterview] = useState(null)
  const [scores,    setScores]    = useState(null)

  useEffect(() => { loadAll() }, [candidateId, jobId])

  async function loadAll() {
    const [cand, appRes, s1Res, s2Res, s3Res, ivRes, scRes] = await Promise.all([
      supabase.from('candidates').select('*, candidate_experiences(*), candidate_projects(*)').eq('candidate_id', candidateId).single(),
      supabase.from('applications').select('*').eq('candidate_id', candidateId).eq('job_id', jobId).order('application_id', { ascending: false }).limit(1).single(),
      supabase.from('stage1_results').select('*').eq('candidate_id', candidateId).eq('job_id', jobId).order('id', { ascending: false }).limit(1),
      supabase.from('stage2_results').select('*').eq('candidate_id', candidateId).eq('job_id', jobId).order('id', { ascending: false }).limit(1),
      supabase.from('stage3_results').select('*').eq('candidate_id', candidateId).eq('job_id', jobId).order('id', { ascending: false }).limit(1),
      supabase.from('interviews').select('*').eq('candidate_id', candidateId).eq('job_id', jobId).order('interview_id', { ascending: false }).limit(1),
      supabase.from('interview_scores').select('*').eq('candidate_id', candidateId).eq('job_id', jobId).order('score_id', { ascending: false }).limit(1),
    ])
    setCandidate(cand.data)
    setApp(appRes.data)
    setS1(s1Res.data?.[0])
    setS2(s2Res.data?.[0])
    setS3(s3Res.data?.[0])
    setInterview(ivRes.data?.[0])
    setScores(scRes.data?.[0])
  }

  if (!candidate) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm text-muted-foreground">Loading candidate…</p>
    </div>
  )

  const exps  = candidate.candidate_experiences || []
  const projs = candidate.candidate_projects || []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white">
        <Link to={`/jobs/${jobId}`}>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-slate-900 truncate">{candidate.full_name}</h1>
          <p className="text-xs text-muted-foreground capitalize">
            {candidate.seniority_level} · {candidate.years_relevant_experience} years · {candidate.city || 'N/A'}
          </p>
        </div>
        {scores && (
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Final Score</p>
            <p className="text-xl font-semibold font-mono text-brand">{Number(scores.final_composite).toFixed(1)}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">
            {/* Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.professional_summary && (
                  <p className="text-sm text-slate-700 leading-relaxed">{candidate.professional_summary}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {candidate.city && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{candidate.city}</span>
                  )}
                  {candidate.highest_degree && (
                    <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{candidate.highest_degree}</span>
                  )}
                  {candidate.major && (
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{candidate.major}</span>
                  )}
                </div>

                {/* Skills */}
                {(candidate.skills || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(candidate.skills || []).map(s => (
                        <span key={s} className="inline-flex items-center rounded-full bg-brand-50 text-brand px-2.5 py-0.5 text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-md p-2.5">
                    <p className="text-muted-foreground mb-0.5">University</p>
                    <p className="font-medium text-slate-700">{candidate.university || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-md p-2.5">
                    <p className="text-muted-foreground mb-0.5">Major</p>
                    <p className="font-medium text-slate-700">{candidate.major || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Journey */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Pipeline Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  <TimelineItem
                    done={!!s1 && s1.passed}
                    rejected={!!s1 && !s1.passed}
                    title="Stage 1 — Hard Filters"
                    detail={s1 ? (s1.passed ? `✓ ${s1.skills_matched_count} skills matched` : `✗ ${(s1.elimination_reasons||[]).join(', ')}`) : 'Pending'}
                  />
                  <TimelineItem
                    done={!!s2}
                    title="Stage 2 — Quantitative Scoring"
                    detail={s2 ? `Score: ${Number(s2.total_score).toFixed(1)}/100` : 'Pending'}
                  />
                  <TimelineItem
                    done={!!s3 && s3.passed}
                    rejected={!!s3 && !s3.passed}
                    title="Stage 3 — LLM Evaluation"
                    detail={s3 ? (s3.passed ? `✓ T:${s3.trajectory_grade} G:${s3.growth_grade} A:${s3.achievement_quality_grade} C:${s3.consistency_grade}` : `✗ ${(s3.fail_reasons||[]).join(', ')}`) : 'Pending'}
                  />
                  <TimelineItem
                    done={interview?.status === 'completed'}
                    active={interview?.status === 'pending'}
                    title="Stage 5 — Interview"
                    detail={interview ? (
                      interview.status === 'completed' ? `✓ Completed (${Math.round(interview.duration_seconds/60)} min)` :
                      interview.status === 'pending' ? '🎤 Interview link available' :
                      interview.status
                    ) : 'Pending'}
                  />
                  <TimelineItem
                    done={!!scores}
                    title="Stage 6 — Final Assessment"
                    detail={scores ? `Score: ${Number(scores.final_composite).toFixed(1)}/100` : 'Pending'}
                  />
                </div>

                {interview?.status === 'pending' && (
                  <div className="mt-3">
                    <a href={interview.interview_link} target="_blank" rel="noopener">
                      <Button size="sm" className="w-full">🎤 Start Interview</Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experiences */}
            {exps.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle>Experience</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {exps.map((exp, i) => (
                    <div key={i} className="border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-slate-800">{exp.title}</p>
                        <span className="text-xs text-muted-foreground">{exp.duration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{exp.company}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">
            {/* Stage 2 Breakdown */}
            {s2 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Stage 2 — Score Breakdown</CardTitle>
                  <CardDescription>Quantitative AI evaluation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScoreRow label="Skills Match"           value={s2.skills_match_score}          max={20} />
                  <ScoreRow label="Experience Relevance"   value={s2.experience_relevance_score}   max={50} />
                  <ScoreRow label="Education Relevance"    value={s2.education_relevance_score}    max={10} />
                  <ScoreRow label="Project Portfolio"      value={s2.project_portfolio_score}      max={10} />
                  <ScoreRow label="Seniority Fit"          value={s2.seniority_fit_score}          max={10} />
                  <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-semibold">
                    <span>Total</span>
                    <span className="font-mono text-brand">{Number(s2.total_score).toFixed(1)}/100</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stage 3 Grades */}
            {s3 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Stage 3 — LLM Evaluation</CardTitle>
                  <CardDescription>AI-assessed profile dimensions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'trajectory',          label: 'Trajectory' },
                    { key: 'growth',              label: 'Growth' },
                    { key: 'achievement_quality', label: 'Achievement Quality' },
                    { key: 'consistency',         label: 'Consistency' },
                  ].map(d => (
                    <div key={d.key} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-slate-800">{d.label}</span>
                        <GradeBadge grade={s3[`${d.key}_grade`]} />
                      </div>
                      {s3[`${d.key}_rationale`] && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{s3[`${d.key}_rationale`]}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Stage 6 Assessment */}
            {scores && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Stage 6 — Interview Assessment</CardTitle>
                  <CardDescription>AI evaluation of interview performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Grade mini-cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Profile Consistency', grade: scores.profile_consistency_grade },
                      { label: 'Motivation & Fit',    grade: scores.motivation_fit_grade },
                      { label: 'Composure',           grade: scores.composure_grade },
                    ].map(item => (
                      <div key={item.label} className="text-center bg-slate-50 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1.5 leading-snug">{item.label}</p>
                        <GradeBadge grade={item.grade} />
                      </div>
                    ))}
                  </div>

                  {/* Score bars */}
                  <div className="space-y-3">
                    <ScoreRow label="Relevance"     value={scores.relevance_avg}     max={4} />
                    <ScoreRow label="Depth"         value={scores.depth_avg}         max={4} />
                    <ScoreRow label="Accuracy"      value={scores.accuracy_avg}      max={4} />
                    <ScoreRow label="Communication" value={scores.communication_avg} max={4} />
                  </div>

                  {/* Behavioral Flags */}
                  {scores.behavioral_flags?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Behavioral Flags</p>
                      <div className="space-y-1.5">
                        {scores.behavioral_flags.map((f, i) => (
                          <div key={i} className={cn(
                            'rounded-md px-3 py-2 text-xs',
                            f.severity === 'major' ? 'bg-red-50 border border-red-100 text-red-800' : 'bg-yellow-50 border border-yellow-100 text-yellow-800',
                          )}>
                            <span className="font-semibold capitalize">{f.type.replace(/_/g, ' ')}</span>
                            {f.detail && <span className="ml-2 opacity-80">{f.detail}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {scores.assessment_summary && (
                    <div className="bg-brand-50 border border-brand-100 rounded-md p-3">
                      <p className="text-xs font-semibold text-brand mb-1.5">AI Assessment Summary</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{scores.assessment_summary}</p>
                    </div>
                  )}

                  {/* Final composite */}
                  <div className="bg-slate-50 rounded-md p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Final Composite Score</p>
                    <p className="text-4xl font-semibold font-mono text-brand">{Number(scores.final_composite).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      S2: {Number(scores.stage2_score||0).toFixed(0)} × 25% + S3: {Number(scores.stage3_score||0).toFixed(0)} × 25% + S6: {Number(scores.stage6_score||0).toFixed(0)} × 50%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transcript */}
            {interview?.formatted_transcript && (
              <Card>
                <CardHeader className="pb-3"><CardTitle>Interview Transcript</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {interview.formatted_transcript.split('\n\n').map((turn, i) => {
                      const isAI = turn.startsWith('AI:')
                      const text = turn.replace(/^(AI|Candidate): "/, '').replace(/"$/, '')
                      return (
                        <div key={i}>
                          <p className={cn(
                            'text-xs font-semibold mb-1',
                            isAI ? 'text-brand' : 'text-slate-500',
                          )}>
                            {isAI ? 'Nabeesh AI' : candidate.full_name}
                          </p>
                          <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
