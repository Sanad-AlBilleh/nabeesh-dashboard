import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Mail, Phone, MapPin, Download, Send, Star, XCircle,
  Calendar, ClipboardList, MessageSquare, FileText, Clock,
  CheckCircle, AlertCircle, Circle, Info, ChevronDown, ChevronUp,
  Brain, Eye, Video, BarChart3, Zap, Shield, Heart, Target,
  Activity, TrendingUp, User, Bot, AlertTriangle, Sparkles,
  BookOpen, Play, ExternalLink,
} from 'lucide-react'
import {
  RadarChart as RechartsRadar, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import ScoreBar from '../components/ScoreBar'
import ScoreCircle from '../components/ScoreCircle'
import TranscriptViewer from '../components/TranscriptViewer'
import VideoPlayer from '../components/VideoPlayer'
import FacialAnalysisCard from '../components/FacialAnalysisCard'
import ActionUnitBreakdown from '../components/ActionUnitBreakdown'
import EmotionTimeline from '../components/EmotionTimeline'
import EmptyState from '../components/EmptyState'
import { PageLoader } from '../components/LoadingSpinner'
import { fetchApplication, deriveStage, STAGE_LABELS, STAGE_ORDER } from '../lib/db'

const gradeColors = {
  'A+': '#34d399', 'A': '#34d399', 'A-': '#34d399',
  'B+': '#60a5fa', 'B': '#818cf8', 'B-': '#818cf8',
  'C+': '#fbbf24', 'C': '#fbbf24',
  'D': '#fb923c', 'F': '#f87171',
}

const STAGE_META = [
  {
    key: 'applied',
    title: 'Applied',
    icon: FileText,
    description: 'Candidate submitted their application and CV.',
    methodology: 'CV uploaded → parsed with AI → resume data extracted and stored.',
  },
  {
    key: 'hard_filters',
    title: 'Hard Filters',
    icon: Shield,
    description: 'Automated keyword and skill matching against mandatory job requirements.',
    methodology: 'Required skills checked → experience years verified → education level validated → elimination if any hard requirement unmet.',
  },
  {
    key: 'semantic_similarity',
    title: 'Semantic Similarity',
    icon: Brain,
    description: 'Embedding-based similarity scoring between CV and job description.',
    methodology: 'CV embedded with text-embedding-3-large → cosine similarity vs job description → skills/experience/education sub-scores → candidates ranked by total score.',
  },
  {
    key: 'llm_evaluation',
    title: 'LLM Evaluation',
    icon: Bot,
    description: 'Multi-dimensional career trajectory assessment via 3-LLM jury.',
    methodology: 'Jury of 3 LLMs evaluates: career trajectory, growth pattern, achievement quality, consistency → majority vote on pass/fail → grade A–F on each dimension.',
  },
  {
    key: 'video_interview',
    title: 'Video Interview + Analysis',
    icon: Video,
    description: 'AI-conducted video interview with real-time facial expression analysis.',
    methodology: 'Retell AI conducts structured interview → transcript scored on relevance/depth/accuracy/communication → facial landmarks analyzed for confidence, engagement, stress tolerance → composite score.',
  },
  {
    key: 'hired',
    title: 'Hired',
    icon: CheckCircle,
    description: 'Candidate accepted the offer and joined the company.',
    methodology: 'Offer sent → signed → onboarding initiated.',
  },
]

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
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
      } catch (err) {
        setError(err.message || 'Failed to load candidate data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) return <Layout><PageLoader /></Layout>

  if (error || !application) {
    return (
      <Layout>
        <PageHeader
          title="Candidate"
          breadcrumb="Candidates"
          actions={
            <button
              onClick={() => navigate('/candidates')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
            >
              <ChevronLeft size={13} /> Back
            </button>
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
  const currentTitle = [c.seniority_level, job?.title].filter(Boolean).join(' — ')

  const tabs = ['overview', 'pipeline', 'interview', 'facial analysis', 'documents']

  return (
    <Layout>
      <PageHeader
        title={c.full_name || 'Candidate'}
        breadcrumb="Candidates"
        subtitle={[currentTitle, job?.title && `Applied for ${job.title}`].filter(Boolean).join(' · ')}
        actions={
          <button
            onClick={() => navigate('/candidates')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
          >
            <ChevronLeft size={13} /> Back
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Left column */}
        <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
          {/* Profile header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {(c.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{c.full_name}</h2>
                <Badge label={STAGE_LABELS[currentStage] || currentStage} status={currentStage} />
                {c.source && <Badge status={c.source} size="xs" />}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {c.email && <InfoChip icon={Mail} text={c.email} />}
                {c.phone && <InfoChip icon={Phone} text={c.phone} />}
                {location && <InfoChip icon={MapPin} text={location} />}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'center' }}>
              {compositeScore !== null && <ScoreCircle score={compositeScore} size={70} label="Overall" />}
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <ScoreBar score={semanticScore ?? 0} label="Semantic" height={6} />
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={llmScore ?? 0} label="LLM Eval" height={6} />
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={interviewScore ?? 0} label="Interview" height={6} />
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={facialScore ?? 0} label="Facial" height={6} />
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', gap: 0 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 14px',
                background: 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: tab === t ? 600 : 400,
                borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                borderRadius: 0,
                marginBottom: -1,
                textTransform: 'capitalize',
                transition: 'all 0.1s',
                cursor: 'pointer',
                border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: 2,
                borderBottomColor: tab === t ? 'var(--accent)' : 'transparent',
              }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px 24px' }}>
            {tab === 'overview' && (
              <OverviewTab
                candidate={c}
                job={job}
                application={application}
                stage1={stage1}
                stage2={stage2}
                stage3={stage3}
                interviewScores={interviewScores}
              />
            )}
            {tab === 'pipeline' && (
              <PipelineTab
                application={application}
                stage1={stage1}
                stage2={stage2}
                stage3={stage3}
                interview={interview}
                interviewScores={interviewScores}
                facialAnalysis={facialAnalysis}
                currentStage={currentStage}
              />
            )}
            {tab === 'interview' && (
              <InterviewTab
                interview={interview}
                interviewScores={interviewScores}
              />
            )}
            {tab === 'facial analysis' && (
              <FacialAnalysisTab facialAnalysis={facialAnalysis} />
            )}
            {tab === 'documents' && (
              <DocumentsTab candidate={c} />
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick Stats */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Quick Stats</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatRow icon={Clock} label="Applied" value={application.applied_at ? new Date(application.applied_at).toLocaleDateString() : '--'} />
              <StatRow icon={Target} label="Stage" value={STAGE_LABELS[currentStage] || currentStage} />
              <StatRow icon={Activity} label="Experience" value={c.years_relevant_experience != null ? `${c.years_relevant_experience}y` : '--'} />
              <StatRow icon={BookOpen} label="Degree" value={c.highest_degree || '--'} />
              {interview?.duration_seconds && (
                <StatRow icon={Video} label="Interview" value={`${Math.round(interview.duration_seconds / 60)} min`} />
              )}
              {stage2?.rank && (
                <StatRow icon={Star} label="Rank" value={`#${stage2.rank}`} />
              )}
            </div>
          </div>

          {/* Skills */}
          {c.skills && c.skills.length > 0 && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {c.skills.map(s => (
                  <span key={s} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, background: 'rgba(129,140,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(129,140,248,0.2)', fontWeight: 500 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CV Link */}
          {c.cv_file_url && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Documents</p>
              <a
                href={c.cv_file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}
              >
                <Download size={13} /> View CV
              </a>
            </div>
          )}

          {/* LinkedIn */}
          {c.linkedin_url && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
              <a
                href={c.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}
              >
                <ExternalLink size={13} /> LinkedIn Profile
              </a>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

// ─── Overview Tab ──────────────────────────────────────────────
function OverviewTab({ candidate: c, job, application, stage1, stage2, stage3, interviewScores }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary */}
      {c.professional_summary && (
        <Section title="Professional Summary" icon={Sparkles}>
          <div style={{
            padding: '14px 16px',
            background: 'rgba(129,140,248,0.05)',
            border: '1px solid rgba(129,140,248,0.15)',
            borderRadius: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.professional_summary}</p>
          </div>
        </Section>
      )}

      {/* Skills */}
      {c.skills && c.skills.length > 0 && (
        <Section title="Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.skills.map(s => (
              <span key={s} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, background: 'rgba(129,140,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(129,140,248,0.2)', fontWeight: 500 }}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Score Breakdown */}
      <Section title="Score Breakdown">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <ScoreCard label="Hard Filters" score={stage1?.passed === true ? 100 : stage1?.passed === false ? 0 : null} icon={Shield} description={stage1 ? (stage1.passed ? 'Passed all hard requirements' : `Failed: ${(stage1.elimination_reasons || []).slice(0,2).join(', ')}`) : 'Not yet evaluated'} />
          <ScoreCard label="Semantic Similarity" score={stage2?.total_score ?? null} icon={Brain} description="CV-to-job embedding similarity" />
          <ScoreCard label="LLM Evaluation" score={stage3?.stage3_score ?? null} icon={Bot} description="Career trajectory assessment" />
          <ScoreCard label="Video Interview" score={interviewScores?.stage6_score ?? null} icon={Video} description="Interview performance score" />
        </div>
      </Section>

      {/* Education */}
      {(c.university || c.highest_degree || c.major) && (
        <Section title="Education" icon={BookOpen}>
          <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
            {c.highest_degree && (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.highest_degree}{c.major ? ` in ${c.major}` : ''}</div>
            )}
            {c.university && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.university}</div>
            )}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {c.certifications && c.certifications.length > 0 && (
        <Section title="Certifications">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {c.certifications.map((cert, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                {cert}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {c.languages && c.languages.length > 0 && (
        <Section title="Languages">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.languages.map(lang => (
              <span key={lang} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {lang}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Application info */}
      <Section title="Application Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <InfoRow label="Applied for" value={job?.title || '—'} />
          <InfoRow label="Status" value={application.status} />
          <InfoRow label="Applied at" value={application.applied_at ? new Date(application.applied_at).toLocaleDateString() : '—'} />
          {application.updated_at && <InfoRow label="Updated" value={new Date(application.updated_at).toLocaleDateString()} />}
        </div>
      </Section>
    </div>
  )
}

// ─── Pipeline Tab ──────────────────────────────────────────────
function PipelineTab({ application, stage1, stage2, stage3, interview, interviewScores, facialAnalysis, currentStage }) {
  const [expandedInfo, setExpandedInfo] = useState({})

  // Build status for each stage
  function getStageData(stageKey, index) {
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
      case 'video_interview':
        if (!interview) return { done: false, passed: null, score: null, data: null }
        const intScore = interviewScores?.stage6_score ?? interviewScores?.final_composite ?? null
        const done = ['completed', 'scored'].includes(interview.status)
        return { done, passed: done && intScore != null ? intScore >= 50 : null, score: intScore, data: interview }
      case 'hired':
        return { done: application.status === 'hired', passed: application.status === 'hired', score: null, data: null }
      default:
        return { done: false, passed: null, score: null, data: null }
    }
  }

  function stageStatusStyle(done, passed) {
    if (!done) return { color: '#52525b', label: 'Pending', bg: 'var(--bg-tertiary)' }
    if (passed === true) return { color: '#34d399', label: 'Pass', bg: 'rgba(52,211,153,0.1)' }
    if (passed === false) return { color: '#f87171', label: 'Failed', bg: 'rgba(248,113,113,0.1)' }
    return { color: '#fbbf24', label: 'In Progress', bg: 'rgba(251,191,36,0.1)' }
  }

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stage progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {STAGE_META.map((meta, i) => {
          const sd = getStageData(meta.key, i)
          const status = stageStatusStyle(sd.done, sd.passed)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                height: 4, width: '100%', borderRadius: 2,
                background: status.color,
                opacity: sd.done ? 1 : 0.2,
              }} />
              <span style={{ fontSize: 9, color: status.color, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}>
                {i + 1}
              </span>
            </div>
          )
        })}
      </div>

      {/* Stage cards */}
      {STAGE_META.map((meta, i) => {
        const sd = getStageData(meta.key, i)
        const status = stageStatusStyle(sd.done, sd.passed)
        const StageIcon = meta.icon
        const isInfoExpanded = expandedInfo[i]

        return (
          <div key={i} style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${status.color}30`,
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            {/* Stage header */}
            <div style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: status.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <StageIcon size={16} color={status.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Stage {i + 1}: {meta.title}
                  </span>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: status.color, fontWeight: 600 }}>{status.label}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {sd.score != null && <ScoreCircle score={sd.score} size={42} label="" />}
              </div>
            </div>

            {/* Info toggle */}
            <button
              onClick={() => setExpandedInfo(prev => ({ ...prev, [i]: !prev[i] }))}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: 'rgba(129,140,248,0.03)',
                border: 'none', borderBottom: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
              }}
            >
              <Info size={11} />
              <span>How this stage works</span>
              {isInfoExpanded
                ? <ChevronUp size={11} style={{ marginLeft: 'auto' }} />
                : <ChevronDown size={11} style={{ marginLeft: 'auto' }} />}
            </button>

            {isInfoExpanded && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(129,140,248,0.03)',
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
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evaluation Method</span>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>
                    {meta.methodology}
                  </p>
                </div>
              </div>
            )}

            {/* Stage content */}
            <div style={{ padding: '14px 16px' }}>
              {meta.key === 'applied' && <AppliedStageContent application={application} />}
              {meta.key === 'hard_filters' && <HardFiltersContent stage1={stage1} />}
              {meta.key === 'semantic_similarity' && <SemanticSimilarityContent stage2={stage2} />}
              {meta.key === 'llm_evaluation' && <LLMEvaluationContent stage3={stage3} />}
              {meta.key === 'video_interview' && <VideoInterviewContent interview={interview} interviewScores={interviewScores} />}
              {meta.key === 'hired' && <HiredContent application={application} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AppliedStageContent({ application }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <MiniStat label="Applied At" value={application.applied_at ? new Date(application.applied_at).toLocaleString() : '--'} isText />
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

function SemanticSimilarityContent({ stage2 }) {
  if (!stage2) return <PendingMessage />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Total Score" value={stage2.total_score != null ? Math.round(stage2.total_score) : '--'} suffix="/100" />
        <MiniStat label="Skills" value={stage2.skills_match_score != null ? Math.round(stage2.skills_match_score) : '--'} suffix="/100" />
        <MiniStat label="Experience" value={stage2.experience_relevance_score != null ? Math.round(stage2.experience_relevance_score) : '--'} suffix="/100" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MiniStat label="Education" value={stage2.education_relevance_score != null ? Math.round(stage2.education_relevance_score) : '--'} suffix="/100" />
        <MiniStat label="Rank" value={stage2.rank != null ? `#${stage2.rank}` : '--'} isText />
      </div>
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

function LLMEvaluationContent({ stage3 }) {
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
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: gradeColors[g.grade] || 'var(--text-primary)',
                fontFamily: 'Geist Mono, monospace',
              }}>{g.grade}</span>
            </div>
            {g.rationale && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{g.rationale}</p>
            )}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Status" value={interview.status || '--'} isText />
        <MiniStat label="Duration" value={interview.duration_seconds ? `${Math.round(interview.duration_seconds / 60)} min` : '--'} isText />
        <MiniStat label="Score" value={interviewScores?.stage6_score != null ? Math.round(interviewScores.stage6_score) : '--'} suffix={interviewScores?.stage6_score != null ? '/100' : ''} />
      </div>
      {interview.status === 'pending' && interview.interview_link && (
        <a
          href={interview.interview_link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 16px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Play size={14} /> Start Interview
        </a>
      )}
      {interview.video_url && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 6 }}>
          <Play size={13} color="var(--accent)" />
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>Video recording available</span>
        </div>
      )}
    </div>
  )
}

function HiredContent({ application }) {
  if (application.status !== 'hired') return <PendingMessage message="Not yet hired" />
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6 }}>
      <CheckCircle size={14} color="#34d399" />
      <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>Candidate has been hired</span>
    </div>
  )
}

// ─── Interview Tab ─────────────────────────────────────────────
function InterviewTab({ interview, interviewScores }) {
  const [showTranscript, setShowTranscript] = useState(true)

  if (!interview) {
    return <EmptyState icon={Video} title="No Interview Data" description="Interview has not been conducted yet." />
  }

  const transcriptText = interview.formatted_transcript || ''
  const videoUrl = interview.video_url || null
  const questionScores = interviewScores?.question_scores || null
  const behavioralFlags = interviewScores?.behavioral_flags || []
  const fillerAnalysis = interviewScores?.filler_word_analysis || null
  const assessmentSummary = interviewScores?.assessment_summary || null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Start interview link if pending */}
      {interview.status === 'pending' && interview.interview_link && (
        <div style={{ padding: '16px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            The interview has been scheduled and is ready to begin.
          </p>
          <a
            href={interview.interview_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            <Play size={14} /> Start Interview
          </a>
        </div>
      )}

      {/* Video player */}
      {videoUrl && (
        <Section title="Recording" icon={Video}>
          <VideoPlayer src={videoUrl} />
        </Section>
      )}

      {/* Scores */}
      {interviewScores && (
        <Section title="Interview Scores" icon={BarChart3}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
            <MiniStat label="Stage 6 Score" value={interviewScores.stage6_score != null ? Math.round(interviewScores.stage6_score) : '--'} suffix="/100" />
            <MiniStat label="Final Composite" value={interviewScores.final_composite != null ? Math.round(interviewScores.final_composite) : '--'} suffix="/100" />
            <MiniStat label="Relevance Avg" value={interviewScores.relevance_avg != null ? Math.round(interviewScores.relevance_avg * 10) / 10 : '--'} suffix="/5" />
            <MiniStat label="Depth Avg" value={interviewScores.depth_avg != null ? Math.round(interviewScores.depth_avg * 10) / 10 : '--'} suffix="/5" />
            <MiniStat label="Accuracy Avg" value={interviewScores.accuracy_avg != null ? Math.round(interviewScores.accuracy_avg * 10) / 10 : '--'} suffix="/5" />
            <MiniStat label="Communication" value={interviewScores.communication_avg != null ? Math.round(interviewScores.communication_avg * 10) / 10 : '--'} suffix="/5" />
          </div>

          {/* Soft evaluations */}
          {[
            { label: 'Profile Consistency', grade: interviewScores.profile_consistency_grade, rationale: interviewScores.profile_consistency_rationale },
            { label: 'Motivation & Fit', grade: interviewScores.motivation_fit_grade, rationale: interviewScores.motivation_fit_rationale },
            { label: 'Composure', grade: interviewScores.composure_grade, rationale: interviewScores.composure_rationale },
          ].filter(g => g.grade).map(g => (
            <div key={g.label} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: g.rationale ? 4 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{g.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: gradeColors[g.grade] || 'var(--accent)', fontFamily: 'Geist Mono, monospace' }}>
                  {g.grade}
                </span>
              </div>
              {g.rationale && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{g.rationale}</p>
              )}
            </div>
          ))}

          {/* Assessment summary */}
          {assessmentSummary && <AISummaryBox text={assessmentSummary} />}
        </Section>
      )}

      {/* Behavioral flags */}
      {Array.isArray(behavioralFlags) && behavioralFlags.length > 0 && (
        <Section title="Behavioral Flags" icon={AlertTriangle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {behavioralFlags.map((flag, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6 }}>
                <AlertTriangle size={13} color="var(--danger)" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {typeof flag === 'string' ? flag : (flag.description || JSON.stringify(flag))}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Transcript */}
      {transcriptText && (
        <Section title="Transcript" icon={MessageSquare}>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
              padding: '6px 12px', background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
            }}
          >
            {showTranscript ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showTranscript ? 'Hide transcript' : 'Show transcript'}
          </button>
          {showTranscript && (
            <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
              <pre style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'Geist Mono, monospace' }}>
                {transcriptText}
              </pre>
            </div>
          )}
        </Section>
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
        description="Facial analysis processing will begin after the interview recording is uploaded."
      />
    )
  }

  const fa = facialAnalysis

  const metrics = [
    { key: 'confidence_score', label: 'Confidence', icon: Shield, description: 'Overall confidence level demonstrated through facial expressions, eye contact, and composure.' },
    { key: 'engagement_score', label: 'Engagement', icon: Target, description: 'Level of active attention and interest shown throughout the interview.' },
    { key: 'stress_tolerance_score', label: 'Stress Tolerance', icon: Activity, description: 'Ability to maintain composure under challenging questions.' },
    { key: 'communication_style_score', label: 'Communication Style', icon: MessageSquare, description: 'Non-verbal communication effectiveness and expressiveness.' },
    { key: 'authenticity_score', label: 'Authenticity', icon: Heart, description: 'Congruence between verbal and non-verbal cues suggesting genuine responses.' },
  ]

  const bigFiveFacial = [
    { label: 'Openness', value: fa.facial_openness },
    { label: 'Conscientiousness', value: fa.facial_conscientiousness },
    { label: 'Extraversion', value: fa.facial_extraversion },
    { label: 'Agreeableness', value: fa.facial_agreeableness },
    { label: 'Neuroticism', value: fa.facial_neuroticism },
  ].filter(x => x.value != null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        padding: '16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 10,
      }}>
        <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Eye size={24} color="var(--text-muted)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Facial Analysis Results</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            AI-powered analysis of facial expressions, micro-expressions, and behavioral cues during interview.
            {fa.frames_analyzed && ` ${fa.frames_analyzed} frames analyzed.`}
          </div>
        </div>
        {fa.overall_score != null && (
          <ScoreCircle score={Math.round(fa.overall_score)} size={72} label="Overall" />
        )}
      </div>

      {/* Composite Scores */}
      <Section title="Composite Scores" icon={BarChart3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {metrics.map(m => {
            const score = fa[m.key]
            if (score == null) return null
            return (
              <FacialAnalysisCard
                key={m.key}
                label={m.label}
                score={Math.round(score)}
                description={m.description}
                icon={m.icon}
              />
            )
          })}
        </div>
      </Section>

      {/* Big Five from Facial */}
      {bigFiveFacial.length > 0 && (
        <Section title="Personality from Facial Analysis" icon={Brain}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bigFiveFacial.map(b => (
              <div key={b.label} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{b.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: b.value >= 70 ? 'var(--success)' : b.value >= 40 ? 'var(--accent)' : 'var(--warning)' }}>
                    {Math.round(b.value)}/100
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${b.value}%`, height: '100%', background: b.value >= 70 ? 'var(--success)' : b.value >= 40 ? 'var(--accent)' : 'var(--warning)', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Emotion Timeline */}
      {fa.timeline_data && (
        <Section title="Emotion Timeline" icon={TrendingUp}>
          <EmotionTimeline data={fa.timeline_data} height={250} />
        </Section>
      )}

      {/* Key Moments */}
      {fa.key_moments && fa.key_moments.length > 0 && (
        <Section title="Key Moments" icon={Zap}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fa.key_moments.map((moment, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}>
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
        </Section>
      )}

      {/* Action Unit Breakdown */}
      {fa.action_unit_averages && (
        <Section title="" icon={null}>
          <ActionUnitBreakdown data={fa.action_unit_averages} />
        </Section>
      )}

      {/* AI Summary */}
      {fa.ai_summary && (
        <Section title="AI Narrative Summary" icon={Sparkles}>
          <div style={{
            padding: '16px',
            background: 'rgba(129,140,248,0.05)',
            border: '1px solid rgba(129,140,248,0.15)',
            borderRadius: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {fa.ai_summary}
            </p>
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Documents Tab ─────────────────────────────────────────────
function DocumentsTab({ candidate: c }) {
  const documents = []

  if (c.cv_file_url) {
    documents.push({ name: 'Resume / CV', url: c.cv_file_url, type: 'PDF', icon: FileText })
  }

  if (c.linkedin_url) {
    documents.push({ name: 'LinkedIn Profile', url: c.linkedin_url, type: 'URL', icon: User })
  }

  if (documents.length === 0) {
    return <EmptyState icon={FileText} title="No Documents" description="No documents available for this candidate." />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {documents.map((doc, i) => {
        const DocIcon = doc.icon
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DocIcon size={18} color="var(--accent)" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{doc.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.type}</div>
              </div>
            </div>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-secondary)',
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              <Download size={13} /> {doc.type === 'URL' ? 'Open' : 'Download'}
            </a>
          </div>
        )
      })}
    </div>
  )
}

// ─── Helper Components ──────────────────────────────────────────

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
      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{value}</span>
    </div>
  )
}

function Section({ title, children, icon: Icon }) {
  return (
    <div>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          {Icon && <Icon size={13} color="var(--text-muted)" />}
          <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h4>
        </div>
      )}
      {children}
    </div>
  )
}

function StatRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={12} color="var(--text-muted)" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace', textTransform: 'capitalize' }}>
        {value}
      </span>
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

function ScoreCard({ label, score, icon: Icon, description }) {
  if (score == null) {
    return (
      <div style={{
        padding: '14px 16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 12,
        opacity: 0.5,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="var(--text-muted)" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <ScoreCircle score={Math.round(score)} size={46} label="" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
      </div>
    </div>
  )
}

function AISummaryBox({ text }) {
  if (!text) return null
  return (
    <div style={{
      padding: '10px 12px',
      background: 'rgba(129,140,248,0.04)',
      border: '1px solid rgba(129,140,248,0.12)',
      borderRadius: 6,
      marginTop: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <Sparkles size={10} color="var(--accent)" />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Summary</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{text}</p>
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
