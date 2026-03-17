import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Mail, Phone, MapPin, Download, Send, Star, XCircle,
  Calendar, ClipboardList, MessageSquare, FileText, Clock,
  CheckCircle, AlertCircle, Circle, Info, ChevronDown, ChevronUp,
  Brain, Eye, Video, BarChart3, Zap, Shield, Heart, Target,
  Activity, TrendingUp, User, Bot, AlertTriangle, Sparkles,
  BookOpen, Play, ExternalLink, Layers, BarChart2, Award,
  UserCheck, Layout as LayoutIcon, BarChartHorizontal,
} from 'lucide-react'
import {
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Cell, ReferenceLine,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import ScoreBar from '../components/ScoreBar'
import ScoreCircle from '../components/ScoreCircle'
import EmptyState from '../components/EmptyState'
import { PageLoader } from '../components/LoadingSpinner'
import EmotionTimeline from '../components/EmotionTimeline'
import FacialAnalysisCard from '../components/FacialAnalysisCard'
import ActionUnitBreakdown from '../components/ActionUnitBreakdown'
import PersonalityRadar from '../components/RadarChart'
import { fetchApplication, deriveStage, STAGE_LABELS, STAGE_ORDER } from '../lib/db'
import { supabase } from '../lib/supabase'
import { triggerStage3 } from '../lib/api'

// ─── Constants ─────────────────────────────────────────────────

const gradeColors = {
  'A+': '#34d399', 'A': '#34d399', 'A-': '#34d399',
  'B+': '#60a5fa', 'B': '#818cf8', 'B-': '#818cf8',
  'C+': '#fbbf24', 'C': '#fbbf24',
  'D': '#fb923c', 'F': '#f87171',
}

const STAGE_META = [
  {
    key: 'applied', title: 'Applied', icon: FileText,
    description: 'Candidate submitted their application and CV.',
    methodology: 'CV uploaded → parsed with AI → resume data extracted and stored.',
  },
  {
    key: 'hard_filters', title: 'Hard Filters', icon: Shield,
    description: 'Automated keyword and skill matching against mandatory job requirements.',
    methodology: 'Required skills checked → experience years verified → education level validated → elimination if any hard requirement unmet.',
  },
  {
    key: 'semantic_similarity', title: 'Semantic Similarity', icon: Brain,
    description: 'Embedding-based similarity scoring between CV and job description.',
    methodology: 'CV embedded with text-embedding-3-large → cosine similarity vs job description → skills/experience/education sub-scores → candidates ranked.',
  },
  {
    key: 'llm_evaluation', title: 'LLM Evaluation', icon: Bot,
    description: 'Multi-dimensional career trajectory assessment via 3-LLM jury.',
    methodology: 'Jury of 3 LLMs evaluates: career trajectory, growth pattern, achievement quality, consistency → majority vote on pass/fail → grade A–F.',
  },
  {
    key: 'video_interview', title: 'Video Interview + Analysis', icon: Video,
    description: 'AI-conducted video interview with real-time facial expression analysis.',
    methodology: 'Retell AI conducts structured interview → transcript scored on relevance/depth/accuracy/communication → facial landmarks analyzed.',
  },
  {
    key: 'hired', title: 'Hired', icon: CheckCircle,
    description: 'Candidate accepted the offer and joined the company.',
    methodology: 'Offer sent → signed → onboarding initiated.',
  },
]

// Left sidebar nav items
const NAV_ITEMS = [
  { key: 'summary',        label: 'Summary',            icon: LayoutIcon },
  { key: 'pipeline',       label: 'Pipeline',           icon: Layers },
  { key: 'ai_assessment',  label: 'AI Assessment Score', icon: Brain },
  { key: 'resume',         label: 'Resume',             icon: FileText },
  { key: 'full_profile',   label: 'Full Profile',       icon: User },
  { key: 'schedule',       label: 'Schedule Interview', icon: Calendar },
  { key: 'facial',         label: 'Facial Analysis',    icon: Eye },
  { key: 'body_language',  label: 'Body Language',      icon: Activity },
  { key: 'distribution',   label: 'Score Distribution', icon: BarChart2 },
]

// Build histogram buckets [0,10), [10,20), …, [90,100]
function buildHistogram(scores) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${i * 10 + 10}`,
    min: i * 10,
    max: i * 10 + 10,
    count: 0,
  }))
  for (const s of scores) {
    if (s == null) continue
    const idx = Math.min(9, Math.floor(s / 10))
    buckets[idx].count++
  }
  return buckets
}

function getCandidateBucket(score) {
  if (score == null) return -1
  return Math.min(9, Math.floor(score / 10))
}

// ─── Main Component ────────────────────────────────────────────

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('summary')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [application, setApplication] = useState(null)
  const [candidate, setCandidate] = useState(null)
  const [job, setJob] = useState(null)
  const [stage1, setStage1] = useState(null)
  const [stage2, setStage2] = useState(null)
  const [stage3, setStage3] = useState(null)
  const [interview, setInterview] = useState(null)
  const [interviewScores, setInterviewScores] = useState(null)
  const [facialAnalysis, setFacialAnalysis] = useState(null)
  const [experiences, setExperiences] = useState([])
  const [projects, setProjects] = useState([])

  // Score distribution data
  const [distLoading, setDistLoading] = useState(false)
  const [allStage2Scores, setAllStage2Scores] = useState([])
  const [allInterviewScores, setAllInterviewScores] = useState([])
  const [allFacialScores, setAllFacialScores] = useState([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchApplication(id)
        setApplication(result.application)
        setCandidate(result.candidate)
        setJob(result.job)
        setStage1(result.stage1)
        setStage2(result.stage2)
        setStage3(result.stage3)
        setInterview(result.interview)
        setInterviewScores(result.interviewScores)
        setFacialAnalysis(result.facialAnalysis)

        // Fetch experiences and projects in parallel
        const candidateId = result.candidate?.candidate_id
        if (candidateId) {
          const [expRes, projRes] = await Promise.all([
            supabase.from('candidate_experiences').select('*').eq('candidate_id', candidateId).order('start_date', { ascending: false }),
            supabase.from('candidate_projects').select('*').eq('candidate_id', candidateId),
          ])
          setExperiences(expRes.data || [])
          setProjects(projRes.data || [])
        }
      } catch (err) {
        setError(err.message || 'Failed to load candidate data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  // Load distributions when distribution tab is active
  useEffect(() => {
    if (activeNav !== 'distribution' || !job?.job_id) return
    if (allStage2Scores.length > 0) return // already loaded
    async function loadDistributions() {
      setDistLoading(true)
      try {
        const [s2Res, intRes] = await Promise.all([
          supabase.from('stage2_results').select('total_score, application_id').eq('job_id', job.job_id),
          supabase.from('interview_scores').select('stage6_score, final_composite, application_id').eq('job_id', job.job_id),
        ])
        setAllStage2Scores(s2Res.data || [])
        setAllInterviewScores(intRes.data || [])

        // Facial scores via interviews
        const { data: jobInterviews } = await supabase
          .from('interviews')
          .select('interview_id')
          .eq('job_id', job.job_id)
        if (jobInterviews && jobInterviews.length > 0) {
          const interviewIds = jobInterviews.map(i => i.interview_id)
          const { data: facialData } = await supabase
            .from('facial_analysis_results')
            .select('overall_score, interview_id')
            .in('interview_id', interviewIds)
          setAllFacialScores(facialData || [])
        }
      } catch (e) {
        console.error('Error loading distributions:', e)
      } finally {
        setDistLoading(false)
      }
    }
    loadDistributions()
  }, [activeNav, job])

  if (loading) return <Layout><PageLoader /></Layout>

  if (error || !application) {
    return (
      <Layout>
        <PageHeader
          title="Candidate"
          breadcrumb="Candidates"
          actions={
            <BackButton onClick={() => navigate('/candidates')} />
          }
        />
        <EmptyState icon={AlertCircle} title="Error Loading Candidate" description={error || 'Application not found'} />
      </Layout>
    )
  }

  const c = candidate || {}
  const currentStage = deriveStage(application.status, application.pipeline_stage)
  const semanticScore = stage2?.total_score ?? null
  const llmScore = stage3?.stage3_score ?? null
  const interviewScore = interviewScores?.stage6_score ?? null
  const facialScore = facialAnalysis?.overall_score ?? null
  const compositeScore = interviewScores?.final_composite ?? semanticScore ?? null
  const location = [c.city, c.country].filter(Boolean).join(', ')

  return (
    <Layout>
      <PageHeader
        title={c.full_name || 'Candidate'}
        breadcrumb="Candidates"
        subtitle={job?.title ? `Applied for ${job.title}` : undefined}
        actions={<BackButton onClick={() => navigate('/candidates')} />}
      />

      {/* Two-column layout: sidebar + content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

        {/* ── Left Sidebar Nav ── */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {/* Mini profile */}
          <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8,
            }}>
              {(c.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 3 }}>
              {c.full_name || '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              {[c.seniority_level, job?.title].filter(Boolean).join(' · ')}
            </div>
            {compositeScore !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ScoreCircle score={Math.round(compositeScore)} size={36} label="" />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Overall</span>
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav style={{ padding: '10px 10px', flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = activeNav === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveNav(item.key)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 10px',
                    marginBottom: 2,
                    borderRadius: 7,
                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
          <div style={{ padding: '24px 28px', maxWidth: 900 }}>
            {activeNav === 'summary' && (
              <SummaryTab
                candidate={c}
                job={job}
                application={application}
                stage1={stage1}
                stage2={stage2}
                stage3={stage3}
                interviewScores={interviewScores}
                facialAnalysis={facialAnalysis}
                currentStage={currentStage}
                semanticScore={semanticScore}
                llmScore={llmScore}
                interviewScore={interviewScore}
                facialScore={facialScore}
                compositeScore={compositeScore}
                location={location}
              />
            )}
            {activeNav === 'pipeline' && (
              <PipelineTab
                application={application}
                stage1={stage1}
                stage2={stage2}
                stage3={stage3}
                interview={interview}
                interviewScores={interviewScores}
                facialAnalysis={facialAnalysis}
                currentStage={currentStage}
                onRefresh={() => {
                  fetchApplication(id).then(result => {
                    setApplication(result.application)
                    setCandidate(result.candidate)
                    setJob(result.job)
                    setStage1(result.stage1)
                    setStage2(result.stage2)
                    setStage3(result.stage3)
                    setInterview(result.interview)
                    setInterviewScores(result.interviewScores)
                    setFacialAnalysis(result.facialAnalysis)
                  }).catch(err => console.error('Refresh failed:', err))
                }}
              />
            )}
            {activeNav === 'ai_assessment' && (
              <AIAssessmentTab
                interview={interview}
                interviewScores={interviewScores}
              />
            )}
            {activeNav === 'resume' && (
              <ResumeTab candidate={c} />
            )}
            {activeNav === 'full_profile' && (
              <FullProfileTab
                candidate={c}
                experiences={experiences}
                projects={projects}
              />
            )}
            {activeNav === 'schedule' && (
              <ScheduleTab interview={interview} />
            )}
            {activeNav === 'facial' && (
              <FacialAnalysisTab facialAnalysis={facialAnalysis} />
            )}
            {activeNav === 'body_language' && (
              <BodyLanguageTab
                facialAnalysis={facialAnalysis}
                interviewScores={interviewScores}
              />
            )}
            {activeNav === 'distribution' && (
              <ScoreDistributionTab
                loading={distLoading}
                candidate={c}
                application={application}
                stage2={stage2}
                stage3={stage3}
                interviewScores={interviewScores}
                facialAnalysis={facialAnalysis}
                allStage2Scores={allStage2Scores}
                allInterviewScores={allInterviewScores}
                allFacialScores={allFacialScores}
              />
            )}
          </div>
        </main>
      </div>
    </Layout>
  )
}

// ─── Summary Tab ──────────────────────────────────────────────

function SummaryTab({
  candidate: c, job, application, stage1, stage2, stage3,
  interviewScores, facialAnalysis, currentStage,
  semanticScore, llmScore, interviewScore, facialScore, compositeScore, location,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Candidate header card */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {(c.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{c.full_name || '—'}</h2>
            <Badge label={STAGE_LABELS[currentStage] || currentStage} status={currentStage} />
            {c.source && <Badge status={c.source} size="xs" />}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
            {c.email && <InfoChip icon={Mail} text={c.email} />}
            {c.phone && <InfoChip icon={Phone} text={c.phone} />}
            {location && <InfoChip icon={MapPin} text={location} />}
          </div>
        </div>
        {compositeScore !== null && (
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <ScoreCircle score={Math.round(compositeScore)} size={72} label="Overall Fit" />
          </div>
        )}
      </div>

      {/* Quick stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard icon={Calendar} label="Applied" value={application.applied_at ? new Date(application.applied_at).toLocaleDateString() : '—'} />
        <StatCard icon={Target} label="Current Stage" value={STAGE_LABELS[currentStage] || currentStage} />
        <StatCard icon={Activity} label="Experience" value={c.years_relevant_experience != null ? `${c.years_relevant_experience} yrs` : '—'} />
        <StatCard icon={BookOpen} label="Degree" value={c.highest_degree || '—'} />
        <StatCard icon={Award} label="Seniority" value={c.seniority_level || '—'} />
      </div>

      {/* Key score breakdown */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <SectionTitle title="Score Breakdown" icon={BarChart3} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <ScoreBar score={semanticScore ?? 0} label="Semantic" height={7} />
          <ScoreBar score={llmScore ?? 0} label="LLM Eval" height={7} />
          <ScoreBar score={interviewScore ?? 0} label="Interview" height={7} />
          <ScoreBar score={facialScore ?? 0} label="Facial" height={7} />
        </div>
      </div>

      {/* Professional Summary */}
      {c.professional_summary && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Professional Summary" icon={Sparkles} />
          <div style={{
            marginTop: 12, padding: '14px 16px',
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75 }}>{c.professional_summary}</p>
          </div>
        </div>
      )}

      {/* Top skills */}
      {c.skills && c.skills.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Top Skills" icon={Zap} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {c.skills.map(s => (
              <span key={s} style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 12,
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(99,102,241,0.2)',
                fontWeight: 500,
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Promote to Stage 3 Button ─────────────────────────────────

function PromoteToStage3Button({ jobId, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  async function handlePromote() {
    setLoading(true)
    setError(null)
    try {
      const result = await triggerStage3(jobId)
      console.log('Stage 3 triggered:', result)
      setDone(true)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Failed to trigger Stage 3')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{
        padding: '12px 16px',
        background: 'rgba(34,197,94,0.1)',
        border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: 8,
        color: '#22c55e',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}>
        ✓ Stage 3 (LLM Evaluation) triggered successfully. Processing in background.
      </div>
    )
  }

  return (
    <div style={{
      padding: '16px',
      background: 'rgba(99,102,241,0.08)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        This candidate passed Semantic Similarity and is waiting for LLM Evaluation (Stage 3).
      </div>
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
      )}
      <button
        onClick={handlePromote}
        disabled={loading}
        style={{
          padding: '9px 18px',
          background: loading ? 'var(--bg-tertiary)' : 'var(--accent)',
          color: loading ? 'var(--text-muted)' : '#fff',
          border: 'none',
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
          transition: 'all 0.15s ease',
        }}
      >
        {loading ? 'Triggering Stage 3…' : 'Promote to LLM Evaluation'}
      </button>
    </div>
  )
}

// ─── Pipeline Tab ──────────────────────────────────────────────

function PipelineTab({ application, stage1, stage2, stage3, interview, interviewScores, facialAnalysis, currentStage, onRefresh }) {
  const [expandedInfo, setExpandedInfo] = useState({})

  function getStageData(stageKey) {
    switch (stageKey) {
      case 'applied':
        return { done: true, passed: true, score: null, data: null }
      case 'hard_filters':
        if (!stage1) return { done: false, passed: null, score: null, data: null }
        return { done: true, passed: stage1.passed, score: stage1.skills_matched_count, data: stage1 }
      case 'semantic_similarity':
        if (!stage2) return { done: false, passed: null, score: null, data: null }
        return { done: true, passed: stage2.passed, score: stage2.total_score, data: stage2 }
      case 'llm_evaluation':
        if (!stage3) return { done: false, passed: null, score: null, data: null }
        return { done: true, passed: stage3.passed, score: stage3.stage3_score, data: stage3 }
      case 'video_interview': {
        if (!interview) return { done: false, passed: null, score: null, data: null }
        const intScore = interviewScores?.stage6_score ?? interviewScores?.final_composite ?? null
        const done = ['completed', 'scored'].includes(interview.status)
        return { done, passed: done && intScore != null ? intScore >= 50 : null, score: intScore, data: interview }
      }
      case 'hired':
        return { done: application.status === 'hired', passed: application.status === 'hired', score: null, data: null }
      default:
        return { done: false, passed: null, score: null, data: null }
    }
  }

  function stageStatus(done, passed) {
    if (!done) return { color: '#52525b', label: 'Pending', bg: 'var(--bg-tertiary)' }
    if (passed === true) return { color: '#34d399', label: 'Pass', bg: 'rgba(52,211,153,0.1)' }
    if (passed === false) return { color: '#f87171', label: 'Failed', bg: 'rgba(248,113,113,0.1)' }
    return { color: '#fbbf24', label: 'In Progress', bg: 'rgba(251,191,36,0.1)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {STAGE_META.map((meta, i) => {
          const sd = getStageData(meta.key)
          const st = stageStatus(sd.done, sd.passed)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                height: 4, width: '100%', borderRadius: 2,
                background: st.color,
                opacity: sd.done ? 1 : 0.2,
              }} />
              <span style={{ fontSize: 9, color: st.color, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                {i + 1}
              </span>
            </div>
          )
        })}
      </div>

      {/* Stage cards */}
      {STAGE_META.map((meta, i) => {
        const sd = getStageData(meta.key)
        const st = stageStatus(sd.done, sd.passed)
        const StageIcon = meta.icon
        const expanded = expandedInfo[i]

        return (
          <div key={i} style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${st.color}28`,
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: st.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <StageIcon size={16} color={st.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Stage {i + 1}: {meta.title}
                  </span>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</span>
                </div>
              </div>
              {sd.score != null && <ScoreCircle score={Math.round(sd.score)} size={44} label="" />}
            </div>

            {/* Info toggle */}
            <button
              onClick={() => setExpandedInfo(prev => ({ ...prev, [i]: !prev[i] }))}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: 'rgba(99,102,241,0.03)',
                border: 'none', borderBottom: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
              }}
            >
              <Info size={11} />
              <span>How this stage works</span>
              {expanded ? <ChevronUp size={11} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={11} style={{ marginLeft: 'auto' }} />}
            </button>

            {expanded && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(99,102,241,0.03)',
                borderBottom: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                  {meta.description}
                </p>
                <div style={{
                  padding: '8px 10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Method</span>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>
                    {meta.methodology}
                  </p>
                </div>
              </div>
            )}

            {/* Stage content */}
            <div style={{ padding: '14px 16px' }}>
              {meta.key === 'applied' && (
                <MiniStat label="Applied At" value={application.applied_at ? new Date(application.applied_at).toLocaleString() : '--'} isText />
              )}
              {meta.key === 'hard_filters' && <HardFiltersContent stage1={stage1} />}
              {meta.key === 'semantic_similarity' && <SemanticContent stage2={stage2} />}
              {meta.key === 'llm_evaluation' && (
                <>
                  {application?.status === 'stage3_waiting' && (
                    <PromoteToStage3Button
                      jobId={application.job_id}
                      onSuccess={onRefresh}
                    />
                  )}
                  <LLMContent stage3={stage3} />
                </>
              )}
              {meta.key === 'video_interview' && <VideoInterviewContent interview={interview} interviewScores={interviewScores} />}
              {meta.key === 'hired' && (
                application.status === 'hired'
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6 }}>
                      <CheckCircle size={14} color="#34d399" />
                      <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>Candidate has been hired</span>
                    </div>
                  : <PendingMessage message="Not yet hired" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HardFiltersContent({ stage1 }) {
  if (!stage1) return <PendingMessage />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MiniStat label="Result" value={stage1.passed ? 'Passed' : 'Failed'} isText />
        <MiniStat label="Skills Matched" value={stage1.skills_matched_count ?? '--'} isText />
      </div>
      {stage1.skill_matches && stage1.skill_matches.length > 0 && (
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Matched Skills</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {stage1.skill_matches.map((s, i) => (
              <span key={i} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {stage1.elimination_reasons && stage1.elimination_reasons.length > 0 && (
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Elimination Reasons</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {stage1.elimination_reasons.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4 }}>
                <AlertTriangle size={11} color="var(--danger)" />
                <span style={{ fontSize: 12, color: 'var(--danger)' }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SemanticContent({ stage2 }) {
  if (!stage2) return <PendingMessage />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <MiniStat label="Total Score" value={stage2.total_score != null ? Math.round(stage2.total_score) : '--'} suffix="/100" />
        <MiniStat label="Skills" value={stage2.skills_match_score != null ? Math.round(stage2.skills_match_score) : '--'} suffix="/100" />
        <MiniStat label="Experience" value={stage2.experience_relevance_score != null ? Math.round(stage2.experience_relevance_score) : '--'} suffix="/100" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <MiniStat label="Education" value={stage2.education_relevance_score != null ? Math.round(stage2.education_relevance_score) : '--'} suffix="/100" />
        <MiniStat label="Projects" value={stage2.project_portfolio_score != null ? Math.round(stage2.project_portfolio_score) : '--'} suffix="/100" />
        <MiniStat label="Seniority Fit" value={stage2.seniority_fit_score != null ? Math.round(stage2.seniority_fit_score) : '--'} suffix="/100" />
      </div>
      {stage2.rank != null && <MiniStat label="Rank" value={`#${stage2.rank}`} isText />}
      {stage2.passed !== null && stage2.passed !== undefined && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 5,
          background: stage2.passed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${stage2.passed ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          fontSize: 12, fontWeight: 700,
          color: stage2.passed ? '#34d399' : '#f87171',
        }}>
          {stage2.passed ? <CheckCircle size={13} /> : <XCircle size={13} />}
          {stage2.passed ? 'Passed to next stage' : 'Did not advance'}
        </div>
      )}
    </div>
  )
}

function LLMContent({ stage3 }) {
  if (!stage3) return <PendingMessage />
  const grades = [
    { label: 'Trajectory', grade: stage3.trajectory_grade, rationale: stage3.trajectory_rationale },
    { label: 'Growth', grade: stage3.growth_grade, rationale: stage3.growth_rationale },
    { label: 'Achievement', grade: stage3.achievement_quality_grade, rationale: stage3.achievement_quality_rationale },
    { label: 'Consistency', grade: stage3.consistency_grade, rationale: stage3.consistency_rationale },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MiniStat label="LLM Score" value={stage3.stage3_score != null ? Math.round(stage3.stage3_score) : '--'} suffix="/100" />
        <MiniStat label="Result" value={stage3.passed ? 'Passed' : 'Failed'} isText />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {grades.map(g => g.grade && (
          <div key={g.label} style={{ padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: g.rationale ? 4 : 0 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{g.label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: gradeColors[g.grade] || 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>{g.grade}</span>
            </div>
            {g.rationale && <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{g.rationale}</p>}
          </div>
        ))}
      </div>
      {stage3.fail_reasons && stage3.fail_reasons.length > 0 && (
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fail Reasons</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {stage3.fail_reasons.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4 }}>
                <AlertTriangle size={11} color="var(--danger)" />
                <span style={{ fontSize: 12, color: 'var(--danger)' }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VideoInterviewContent({ interview, interviewScores }) {
  if (!interview) return <PendingMessage message="Video interview not yet conducted" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <MiniStat label="Status" value={interview.status || '--'} isText />
        <MiniStat label="Duration" value={interview.duration_seconds ? `${Math.round(interview.duration_seconds / 60)} min` : '--'} isText />
        <MiniStat label="Score" value={interviewScores?.stage6_score != null ? Math.round(interviewScores.stage6_score) : '--'} suffix={interviewScores?.stage6_score != null ? '/100' : ''} />
      </div>
      {interview.status === 'pending' && interview.interview_link && (
        <a href={interview.interview_link} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 16px', background: 'var(--accent)', color: '#fff',
          borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none', width: 'fit-content',
        }}>
          <Play size={14} /> Start Interview
        </a>
      )}
    </div>
  )
}

// ─── AI Assessment Score Tab ───────────────────────────────────

function AIAssessmentTab({ interview, interviewScores }) {
  if (!interview) {
    return <EmptyState icon={Video} title="No Interview Data" description="Interview has not been conducted yet." />
  }

  const qs = interviewScores?.question_scores || []
  const behavioralFlags = interviewScores?.behavioral_flags || []
  const fillerAnalysis = interviewScores?.filler_word_analysis || null
  const assessmentSummary = interviewScores?.assessment_summary || null

  const dimAvgs = [
    { label: 'Relevance', value: interviewScores?.relevance_avg, suffix: '/5' },
    { label: 'Depth', value: interviewScores?.depth_avg, suffix: '/5' },
    { label: 'Accuracy', value: interviewScores?.accuracy_avg, suffix: '/5' },
    { label: 'Communication', value: interviewScores?.communication_avg, suffix: '/5' },
  ]

  const overallGrades = [
    { label: 'Profile Consistency', grade: interviewScores?.profile_consistency_grade, rationale: interviewScores?.profile_consistency_rationale },
    { label: 'Motivation & Fit', grade: interviewScores?.motivation_fit_grade, rationale: interviewScores?.motivation_fit_rationale },
    { label: 'Composure', grade: interviewScores?.composure_grade, rationale: interviewScores?.composure_rationale },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Interview overview */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <SectionTitle title="Interview Overview" icon={Video} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
          <MiniStat label="Status" value={interview.status || '--'} isText />
          <MiniStat label="Duration" value={interview.duration_seconds ? `${Math.round(interview.duration_seconds / 60)} min` : '--'} isText />
          <MiniStat label="Overall Score" value={interviewScores?.stage6_score != null ? Math.round(interviewScores.stage6_score) : '--'} suffix={interviewScores?.stage6_score != null ? '/100' : ''} />
        </div>
      </div>

      {/* Dimension averages */}
      {interviewScores && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Dimension Averages" icon={BarChart3} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 14 }}>
            {dimAvgs.map(d => (
              <div key={d.label} style={{ padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{d.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>
                  {d.value != null ? (Math.round(d.value * 10) / 10) : '—'}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{d.suffix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-question scores */}
      {qs.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Question-Level Scores" icon={ClipboardList} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {qs.map((q, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>
                    Q{i + 1}: {q.question || q.question_text || '—'}
                  </div>
                  {q.total_score != null && (
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: q.total_score >= 4 ? 'var(--success)' : q.total_score >= 2.5 ? 'var(--accent)' : 'var(--warning)',
                      fontFamily: 'Geist Mono, monospace', flexShrink: 0,
                    }}>
                      {Math.round(q.total_score * 10) / 10}/5
                    </span>
                  )}
                </div>
                {(q.relevance != null || q.depth != null || q.accuracy != null || q.communication != null) && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { l: 'Relevance', v: q.relevance },
                      { l: 'Depth', v: q.depth },
                      { l: 'Accuracy', v: q.accuracy },
                      { l: 'Communication', v: q.communication },
                    ].filter(x => x.v != null).map(x => (
                      <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{x.l}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>{x.v}/5</span>
                      </div>
                    ))}
                  </div>
                )}
                {q.feedback && <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 6 }}>{q.feedback}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall grades */}
      {overallGrades.some(g => g.grade) && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Overall Grades" icon={Award} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {overallGrades.filter(g => g.grade).map(g => (
              <div key={g.label} style={{ padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: g.rationale ? 6 : 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{g.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: gradeColors[g.grade] || 'var(--accent)', fontFamily: 'Geist Mono, monospace' }}>{g.grade}</span>
                </div>
                {g.rationale && <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{g.rationale}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment summary */}
      {assessmentSummary && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Assessment Summary" icon={Sparkles} />
          <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75 }}>{assessmentSummary}</p>
          </div>
        </div>
      )}

      {/* Behavioral flags */}
      {Array.isArray(behavioralFlags) && behavioralFlags.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Behavioral Flags" icon={AlertTriangle} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
            {behavioralFlags.map((flag, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6 }}>
                <AlertTriangle size={13} color="var(--danger)" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {typeof flag === 'string' ? flag : (flag.description || JSON.stringify(flag))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filler word analysis */}
      {fillerAnalysis && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Filler Word Analysis" icon={MessageSquare} />
          <div style={{ marginTop: 12 }}>
            {typeof fillerAnalysis === 'object' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(fillerAnalysis).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fillerAnalysis}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Resume Tab ────────────────────────────────────────────────

function ResumeTab({ candidate: c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* CV Download */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <SectionTitle title="Resume / CV" icon={FileText} />
        {c.cv_file_url ? (
          <a
            href={c.cv_file_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', marginTop: 14,
              background: 'var(--accent)', color: '#fff',
              borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <Download size={14} /> Download CV
          </a>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>No CV file available</p>
        )}
      </div>

      {/* Professional Summary */}
      {c.professional_summary && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Professional Summary" icon={Sparkles} />
          <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75 }}>{c.professional_summary}</p>
          </div>
        </div>
      )}

      {/* Education */}
      {(c.university || c.highest_degree || c.major) && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Education" icon={BookOpen} />
          <div style={{ marginTop: 12, padding: '14px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
            {c.highest_degree && (
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {c.highest_degree}{c.major ? ` in ${c.major}` : ''}
              </div>
            )}
            {c.university && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.university}</div>}
          </div>
        </div>
      )}

      {/* Certifications */}
      {c.certifications && c.certifications.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Certifications" icon={Award} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {c.certifications.map((cert, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                {cert}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Full Profile Tab ──────────────────────────────────────────

function FullProfileTab({ candidate: c, experiences, projects }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Personal details */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <SectionTitle title="Personal Information" icon={User} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          <InfoRow label="Full Name" value={c.full_name || '—'} />
          <InfoRow label="Email" value={c.email || '—'} />
          <InfoRow label="Phone" value={c.phone || '—'} />
          <InfoRow label="City" value={c.city || '—'} />
          <InfoRow label="Country" value={c.country || '—'} />
          <InfoRow label="Willing to Relocate" value={c.willing_to_relocate != null ? (c.willing_to_relocate ? 'Yes' : 'No') : '—'} />
          {c.linkedin_url && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>LinkedIn</span>
              <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={11} /> View Profile
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Professional summary */}
      {c.professional_summary && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Professional Summary" icon={Sparkles} />
          <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75 }}>{c.professional_summary}</p>
          </div>
        </div>
      )}

      {/* Skills */}
      {c.skills && c.skills.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Skills" icon={Zap} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {c.skills.map(s => (
              <span key={s} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 12, background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)', fontWeight: 500 }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {c.languages && c.languages.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Languages" icon={MessageSquare} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {c.languages.map(lang => (
              <span key={lang} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 12, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {c.certifications && c.certifications.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Certifications" icon={Award} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {c.certifications.map((cert, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                {cert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Experiences */}
      {experiences.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Work Experience" icon={TrendingUp} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {experiences.map((exp, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{exp.job_title || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginTop: 1 }}>{exp.company_name || '—'}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                    {exp.start_date || ''}{exp.end_date ? ` – ${exp.end_date}` : exp.is_current ? ' – Present' : ''}
                  </div>
                </div>
                {exp.location && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{exp.location}</div>}
                {exp.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Projects" icon={Layers} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {projects.map((proj, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{proj.project_name || proj.name || '—'}</div>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <ExternalLink size={11} /> View
                    </a>
                  )}
                </div>
                {proj.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>{proj.description}</p>}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {proj.technologies.map((t, j) => (
                      <span key={j} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Schedule Interview Tab ────────────────────────────────────

function ScheduleTab({ interview }) {
  if (!interview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Calendar size={24} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No Interview Scheduled</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
            No interview has been created for this candidate yet.
          </p>
        </div>
      </div>
    )
  }

  const isPending = interview.status === 'pending'
  const isCompleted = ['completed', 'scored'].includes(interview.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Interview info card */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <SectionTitle title="Interview Details" icon={Video} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          <InfoRow label="Status" value={interview.status || '—'} />
          {interview.created_at && <InfoRow label="Scheduled On" value={new Date(interview.created_at).toLocaleString()} />}
          {interview.completed_at && <InfoRow label="Completed At" value={new Date(interview.completed_at).toLocaleString()} />}
          {interview.duration_seconds && <InfoRow label="Duration" value={`${Math.round(interview.duration_seconds / 60)} minutes`} />}
        </div>
      </div>

      {isPending && interview.interview_link && (
        <div style={{
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12, padding: '20px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Interview Ready to Start</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            The interview has been scheduled and is ready to begin. Click the button below to start the AI-conducted interview.
          </p>
          <a
            href={interview.interview_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', background: 'var(--accent)', color: '#fff',
              borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <Play size={15} /> Start Interview
          </a>
        </div>
      )}

      {isCompleted && (
        <div style={{
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 12, padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CheckCircle size={18} color="#22c55e" />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>Interview Completed</div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The interview has been completed and results are available in the AI Assessment Score section.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Facial Analysis Tab ───────────────────────────────────────

function FacialAnalysisTab({ facialAnalysis }) {
  if (!facialAnalysis) {
    return (
      <EmptyState
        icon={Eye}
        title="Facial Analysis Pending"
        description="Facial analysis will begin after the interview recording is processed."
      />
    )
  }

  const fa = facialAnalysis

  const metrics = [
    { key: 'confidence_score', label: 'Confidence', icon: Shield },
    { key: 'engagement_score', label: 'Engagement', icon: Target },
    { key: 'stress_tolerance_score', label: 'Stress Tolerance', icon: Activity },
    { key: 'communication_style_score', label: 'Communication Style', icon: MessageSquare },
    { key: 'authenticity_score', label: 'Authenticity', icon: Heart },
  ]

  const bigFive = [
    { factor: 'Openness', score: fa.facial_openness },
    { factor: 'Conscientiousness', score: fa.facial_conscientiousness },
    { factor: 'Extraversion', score: fa.facial_extraversion },
    { factor: 'Agreeableness', score: fa.facial_agreeableness },
    { factor: 'Neuroticism', score: fa.facial_neuroticism },
  ].filter(x => x.score != null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '18px 20px', display: 'flex', gap: 18, alignItems: 'center',
      }}>
        <div style={{ width: 60, height: 60, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Eye size={24} color="var(--text-muted)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Facial Analysis Results</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            AI-powered analysis of facial expressions, micro-expressions, and behavioral cues.
            {fa.frames_analyzed && ` ${fa.frames_analyzed} frames analyzed.`}
          </div>
        </div>
        {fa.overall_score != null && <ScoreCircle score={Math.round(fa.overall_score)} size={72} label="Overall" />}
      </div>

      {/* Composite scores */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <SectionTitle title="Composite Scores" icon={BarChart3} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {metrics.map(m => {
            const score = fa[m.key]
            if (score == null) return null
            return (
              <FacialAnalysisCard
                key={m.key}
                label={m.label}
                score={Math.round(score)}
                icon={m.icon}
              />
            )
          })}
        </div>
      </div>

      {/* Big Five */}
      {bigFive.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Big Five Personality (from Facial)" icon={Brain} />
          <div style={{ marginTop: 14 }}>
            <PersonalityRadar data={bigFive} height={260} />
          </div>
        </div>
      )}

      {/* Emotion timeline */}
      {fa.timeline_data && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Emotion Timeline" icon={TrendingUp} />
          <div style={{ marginTop: 14 }}>
            <EmotionTimeline data={fa.timeline_data} height={250} />
          </div>
        </div>
      )}

      {/* Key moments */}
      {fa.key_moments && fa.key_moments.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Key Moments" icon={Zap} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {fa.key_moments.map((moment, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: 'var(--accent)', flexShrink: 0, minWidth: 40 }}>
                  {typeof moment.timestamp === 'number'
                    ? `${Math.floor(moment.timestamp / 60)}:${String(Math.floor(moment.timestamp % 60)).padStart(2, '0')}`
                    : moment.timestamp || '--'}
                </span>
                <p style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {moment.description || moment.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action unit breakdown */}
      {fa.action_unit_averages && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <ActionUnitBreakdown data={fa.action_unit_averages} />
        </div>
      )}

      {/* AI Summary */}
      {fa.ai_summary && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="AI Narrative Summary" icon={Sparkles} />
          <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{fa.ai_summary}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Body Language Tab ─────────────────────────────────────────

function BodyLanguageTab({ facialAnalysis, interviewScores }) {
  const fa = facialAnalysis
  if (!fa && !interviewScores) {
    return (
      <EmptyState
        icon={Activity}
        title="Body Language Data Unavailable"
        description="Body language analysis requires a completed interview with facial analysis."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Composure */}
      {interviewScores?.composure_grade && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Composure" icon={Shield} />
          <div style={{ marginTop: 14, padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Grade</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: gradeColors[interviewScores.composure_grade] || 'var(--accent)', fontFamily: 'Geist Mono, monospace' }}>
                {interviewScores.composure_grade}
              </div>
            </div>
            {interviewScores.composure_rationale && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 400 }}>{interviewScores.composure_rationale}</p>
            )}
          </div>
        </div>
      )}

      {/* Communication style & engagement from facial */}
      {fa && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Non-Verbal Communication" icon={MessageSquare} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {fa.communication_style_score != null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Communication Style</div>
                <ScoreBar score={Math.round(fa.communication_style_score)} label="" height={8} />
              </div>
            )}
            {fa.engagement_score != null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Engagement</div>
                <ScoreBar score={Math.round(fa.engagement_score)} label="" height={8} />
              </div>
            )}
            {fa.stress_tolerance_score != null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Stress Tolerance</div>
                <ScoreBar score={Math.round(fa.stress_tolerance_score)} label="" height={8} />
              </div>
            )}
            {fa.confidence_score != null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Confidence</div>
                <ScoreBar score={Math.round(fa.confidence_score)} label="" height={8} />
              </div>
            )}
            {fa.authenticity_score != null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Authenticity</div>
                <ScoreBar score={Math.round(fa.authenticity_score)} label="" height={8} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Engagement patterns timeline */}
      {fa?.timeline_data && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="Engagement Timeline" icon={TrendingUp} />
          <div style={{ marginTop: 14 }}>
            <EmotionTimeline data={fa.timeline_data} height={220} />
          </div>
        </div>
      )}

      {/* AI Summary relevant to body language */}
      {fa?.ai_summary && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <SectionTitle title="AI Behavioral Summary" icon={Sparkles} />
          <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{fa.ai_summary}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Score Distribution Tab ────────────────────────────────────

function ScoreDistributionTab({
  loading, candidate: c, application,
  stage2, stage3, interviewScores, facialAnalysis,
  allStage2Scores, allInterviewScores, allFacialScores,
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading distribution data…</div>
        </div>
      </div>
    )
  }

  const semanticScores = allStage2Scores.map(r => r.total_score).filter(s => s != null)
  const iScores = allInterviewScores.map(r => r.stage6_score).filter(s => s != null)
  const compositeScores = allInterviewScores.map(r => r.final_composite).filter(s => s != null)
  const faScores = allFacialScores.map(r => r.overall_score).filter(s => s != null)

  const thisSemantic = stage2?.total_score ?? null
  const thisInterview = interviewScores?.stage6_score ?? null
  const thisComposite = interviewScores?.final_composite ?? null
  const thisFacial = facialAnalysis?.overall_score ?? null

  const distributions = [
    { label: 'Semantic Score', scores: semanticScores, thisScore: thisSemantic, color: '#6366f1' },
    { label: 'Interview Score', scores: iScores, thisScore: thisInterview, color: '#22c55e' },
    { label: 'Composite Score', scores: compositeScores, thisScore: thisComposite, color: '#f59e0b' },
    { label: 'Facial Score', scores: faScores, thisScore: thisFacial, color: '#3b82f6' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={16} color="var(--accent)" />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Score Distribution</div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
          These histograms show how this candidate compares to all other applicants for the same job.
          The highlighted bar indicates where this candidate falls.
        </p>
      </div>

      {distributions.map(dist => (
        <DistributionChart key={dist.label} {...dist} />
      ))}
    </div>
  )
}

function DistributionChart({ label, scores, thisScore, color }) {
  if (scores.length === 0) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <SectionTitle title={label} icon={BarChart2} />
        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          No data available for this distribution
        </div>
      </div>
    )
  }

  const buckets = buildHistogram(scores)
  const thisBucket = getCandidateBucket(thisScore)
  const maxCount = Math.max(...buckets.map(b => b.count), 1)

  // Percentile
  let percentile = null
  if (thisScore != null && scores.length > 0) {
    const below = scores.filter(s => s < thisScore).length
    percentile = Math.round((below / scores.length) * 100)
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{scores.length} candidates</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {thisScore != null ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'Geist Mono, monospace' }}>
                {Math.round(thisScore)}
              </div>
              {percentile !== null && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Top {100 - percentile}% of candidates
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No score yet</div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
            formatter={(value, name) => [value, 'Candidates']}
            labelFormatter={(label) => `Score: ${label}`}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {buckets.map((bucket, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === thisBucket && thisScore != null ? color : '#3f3f46'}
                opacity={index === thisBucket && thisScore != null ? 1 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {thisScore != null && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            This candidate scored <strong style={{ color: 'var(--text-primary)' }}>{Math.round(thisScore)}</strong> — highlighted bar shows their bucket
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Helper Components ──────────────────────────────────────────

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '7px 12px', background: 'transparent',
        border: '1px solid var(--border)', borderRadius: 6,
        color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
      }}
    >
      <ChevronLeft size={13} /> Back
    </button>
  )
}

function InfoChip({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Icon size={12} color="var(--text-muted)" />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{text}</span>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function SectionTitle({ title, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {Icon && <Icon size={13} color="var(--text-muted)" />}
      <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </h4>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Icon size={12} color="var(--text-muted)" />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>{value}</span>
    </div>
  )
}

function MiniStat({ label, value, suffix = '', isText = false }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: isText ? 13 : 18,
        fontWeight: 700,
        color: 'var(--text-primary)',
        fontFamily: isText ? 'Geist, system-ui' : 'Geist Mono, monospace',
        textTransform: isText ? 'capitalize' : 'none',
      }}>
        {value}{!isText && suffix}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}

function PendingMessage({ message = 'This stage has not been completed yet' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: 6,
    }}>
      <Circle size={12} color="var(--text-muted)" />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{message}</span>
    </div>
  )
}
