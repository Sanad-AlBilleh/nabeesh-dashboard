import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Mail, Phone, MapPin, Download, Send, Star, XCircle,
  Calendar, ClipboardList, MessageSquare, FileText, Plus, Clock,
  CheckCircle, AlertCircle, Circle, Info, ChevronDown, ChevronUp,
  Brain, Eye, Mic, Video, BarChart3, Zap, Shield, Heart, Target,
  Activity, TrendingUp, User, Bot, AlertTriangle, Sparkles, Globe,
  BookOpen, Pen, Headphones, Play,
} from 'lucide-react'
import {
  RadarChart as RechartsRadar, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import ScoreBar from '../components/ScoreBar'
import ScoreCircle from '../components/ScoreCircle'
import PersonalityRadar from '../components/RadarChart'
import Timeline from '../components/Timeline'
import TranscriptViewer from '../components/TranscriptViewer'
import VideoPlayer from '../components/VideoPlayer'
import FacialAnalysisCard from '../components/FacialAnalysisCard'
import ActionUnitBreakdown from '../components/ActionUnitBreakdown'
import EmotionTimeline from '../components/EmotionTimeline'
import EmptyState from '../components/EmptyState'
import { PageLoader } from '../components/LoadingSpinner'
import {
  getCandidate, getAssessment, getInterview, getTranscript,
  getFacialAnalysis, getApplication, addNote, getNotes,
  shortlistApplication, rejectApplication,
} from '../lib/api'

const gradeColors = { 'A+': '#34d399', 'A': '#34d399', 'A-': '#34d399', 'B+': '#60a5fa', 'B': '#818cf8', 'B-': '#818cf8', 'C+': '#fbbf24', 'C': '#fbbf24', 'D': '#fb923c', 'F': '#f87171' }

const STAGE_META = [
  {
    key: 'cv_screening',
    title: 'CV Screening',
    icon: FileText,
    description: 'AI analyzes the candidate\'s resume against job requirements using embedding similarity and keyword matching.',
    methodology: 'Resume parsed \u2192 embedded with text-embedding-3-large \u2192 cosine similarity against job description \u2192 keyword overlap scoring \u2192 3-LLM jury vote on fit.',
  },
  {
    key: 'phone_screen',
    title: 'AI Phone Screen',
    icon: Phone,
    description: 'Automated voice screening via Retell AI to assess basic qualifications and communication.',
    methodology: 'AI conducts 5\u20137 minute voice conversation \u2192 transcript analyzed for relevance, clarity, and enthusiasm \u2192 3-LLM jury grades each answer.',
  },
  {
    key: 'assessment',
    title: 'Technical / Skills Assessment',
    icon: Brain,
    description: 'Cognitive aptitude, personality profiling, and language assessment.',
    methodology: 'IPIP-NEO-120 Big Five personality (reverse-scored, normalized 0\u2013100), cognitive test (correct count + percentile via error function), language MCQ + LLM writing evaluation \u2192 CEFR level.',
  },
  {
    key: 'interview',
    title: 'AI Interview',
    icon: Video,
    description: 'Full behavioral interview conducted by Nabeesh AI with video recording.',
    methodology: '15\u201320 minute voice interview \u2192 transcript analyzed per question \u2192 3-LLM jury evaluates technical depth, communication, problem-solving \u2192 composite grade.',
  },
  {
    key: 'recruiter_review',
    title: 'Recruiter Review',
    icon: User,
    description: 'Human recruiter reviews all AI-generated data and makes shortlist decision.',
    methodology: 'Recruiter examines composite scores, AI summaries, interview transcript, and assessment results to make a final shortlist/reject decision.',
  },
  {
    key: 'offer',
    title: 'Offer',
    icon: Send,
    description: 'Offer letter generated and sent via DocuSign for e-signature.',
    methodology: 'Offer parameters configured \u2192 letter generated from template \u2192 sent via DocuSign API \u2192 candidate signs electronically.',
  },
]

function getStageStatus(stage) {
  if (!stage) return { color: '#3f3f46', label: 'Pending', bg: 'var(--bg-tertiary)' }
  const s = stage.status?.toLowerCase()
  if (s === 'pass' || s === 'completed' || s === 'success') return { color: '#34d399', label: 'Pass', bg: 'rgba(52,211,153,0.1)' }
  if (s === 'fail' || s === 'failed' || s === 'rejected') return { color: '#f87171', label: 'Failed', bg: 'rgba(248,113,113,0.1)' }
  if (s === 'in-progress' || s === 'in_progress' || s === 'active') return { color: '#fbbf24', label: 'In Progress', bg: 'rgba(251,191,36,0.1)' }
  if (s === 'shortlisted') return { color: '#34d399', label: 'Shortlisted', bg: 'rgba(52,211,153,0.1)' }
  return { color: '#3f3f46', label: stage.status || 'Pending', bg: 'var(--bg-tertiary)' }
}

// Mock data fallback for the 15 demo candidates used on the Candidates list page.
// The list uses integer IDs ('1'-'15') which don't exist in the DB (which uses UUIDs),
// so CandidateDetail falls back to this data instead of showing "Candidate not found".
const MOCK_DETAILS = {
  '1':  { id:'1', name:'Marcus Johnson',   email:'marcus@email.com',    phone:'+1 415 555 0181', location:'San Francisco, CA', current_title:'Senior Backend Engineer',  applied_for:'Senior Backend Engineer',  stage:'shortlisted', source:'linkedin',    composite_score:87, cv_score:89, phone_screen_score:84, assessment_score:85, interview_score:88, skills:['Node.js','PostgreSQL','AWS','Redis','Docker'],        created_at:'2026-03-15', summary:'Marcus is a strong backend engineer with 7 years of experience in distributed systems. Excellent technical depth and communication. Jury consensus: strong hire.' },
  '2':  { id:'2', name:'Sarah Chen',        email:'sarah@email.com',     phone:'+1 650 555 0192', location:'New York, NY',       current_title:'Senior Product Designer',  applied_for:'Product Designer',         stage:'interview',   source:'indeed',      composite_score:79, cv_score:82, phone_screen_score:76, assessment_score:78, interview_score:80, skills:['Figma','UX Research','Prototyping','Design Systems','User Testing'], created_at:'2026-03-14', summary:'Sarah brings strong design thinking and a portfolio of high-impact product work. Good cultural fit. Jury recommends proceeding to final round.' },
  '3':  { id:'3', name:'Ahmed Al-Rashid',   email:'ahmed@email.com',     phone:'+1 312 555 0103', location:'Chicago, IL',        current_title:'Backend Engineer',         applied_for:'Senior Backend Engineer',  stage:'screening',   source:'direct',      composite_score:72, cv_score:70, phone_screen_score:73, assessment_score:71, interview_score:74, skills:['Python','Django','Redis','Celery','PostgreSQL'],      created_at:'2026-03-13', summary:'Ahmed has solid Python/Django experience. Some gaps in system design at scale. Borderline decision — jury split 2-1 in favour of proceeding.' },
  '4':  { id:'4', name:'Priya Patel',       email:'priya@email.com',     phone:'+1 206 555 0144', location:'Seattle, WA',        current_title:'Data Scientist',           applied_for:'Data Scientist',           stage:'applied',     source:'linkedin',    composite_score:68, cv_score:67, phone_screen_score:66, assessment_score:70, interview_score:null, skills:['Python','ML','TensorFlow','Scikit-learn','SQL'],      created_at:'2026-03-12', summary:'Priya has good fundamentals in ML but limited production deployment experience. Assessment not yet completed. Worth a phone screen.' },
  '5':  { id:'5', name:'Jordan Lee',        email:'jordan@email.com',    phone:'+1 512 555 0175', location:'Austin, TX',         current_title:'Staff Engineer',           applied_for:'Senior Backend Engineer',  stage:'shortlisted', source:'ziprecruiter',composite_score:91, cv_score:93, phone_screen_score:90, assessment_score:89, interview_score:92, skills:['Go','Kubernetes','gRPC','Terraform','AWS'],           created_at:'2026-03-11', summary:'Jordan is an exceptional systems engineer. Top performer in all evaluation stages. Jury unanimous: strong hire. Recommend fast-tracking to offer.' },
  '6':  { id:'6', name:'Emma Wilson',       email:'emma@email.com',      phone:'+1 617 555 0106', location:'Boston, MA',         current_title:'Frontend Developer',       applied_for:'Frontend Engineer',        stage:'applied',     source:'indeed',      composite_score:55, cv_score:54, phone_screen_score:56, assessment_score:53, interview_score:null, skills:['React','TypeScript','CSS','HTML'],                    created_at:'2026-03-13', summary:'Emma has 2 years of frontend experience. Strong in React but limited TypeScript depth. Assessment pending. Junior-to-mid level fit.' },
  '7':  { id:'7', name:"Liam O'Brien",      email:'liam@email.com',      phone:'+1 720 555 0137', location:'Denver, CO',         current_title:'DevOps Engineer',          applied_for:'DevOps Engineer',          stage:'screening',   source:'direct',      composite_score:63, cv_score:61, phone_screen_score:65, assessment_score:62, interview_score:null, skills:['Terraform','AWS','Docker','CI/CD','Prometheus'],      created_at:'2026-03-10', summary:'Liam has practical DevOps experience but mostly with smaller-scale systems. Good attitude. Jury lean is to progress to technical assessment.' },
  '8':  { id:'8', name:'Sofia Martinez',    email:'sofia@email.com',     phone:'+1 305 555 0148', location:'Miami, FL',          current_title:'Marketing Manager',        applied_for:'Head of Marketing',        stage:'rejected',    source:'indeed',      composite_score:44, cv_score:42, phone_screen_score:43, assessment_score:46, interview_score:null, skills:['SEO','Content','Analytics','Social Media'],          created_at:'2026-03-08', summary:'Sofia has B2C marketing experience but limited B2B SaaS exposure. Poor fit for this role. Jury unanimous: reject.' },
  '9':  { id:'9', name:'Elena Vasquez',     email:'elena@email.com',     phone:'+1 213 555 0169', location:'Los Angeles, CA',    current_title:'VP of Marketing',          applied_for:'Head of Marketing',        stage:'interview',   source:'linkedin',    composite_score:83, cv_score:85, phone_screen_score:82, assessment_score:81, interview_score:83, skills:['Brand Strategy','Growth','GTM','Demand Gen','HubSpot'],created_at:'2026-03-14', summary:'Elena is a seasoned marketing leader with 10+ years. Strong strategic thinking and track record of scaling B2B pipelines. Jury: strong recommend.' },
  '10': { id:'10',name:'Wei Zhang',         email:'wei@email.com',       phone:'+1 408 555 0110', location:'San Jose, CA',       current_title:'ML Engineer',              applied_for:'ML Engineer',              stage:'shortlisted', source:'linkedin',    composite_score:88, cv_score:90, phone_screen_score:87, assessment_score:86, interview_score:89, skills:['PyTorch','MLOps','Python','CUDA','Distributed Training'], created_at:'2026-03-15', summary:'Wei has deep expertise in production ML systems. Published 2 papers on efficient training. Jury unanimous: exceptional candidate, recommend offer.' },
  '11': { id:'11',name:'Isabella Romano',   email:'isabella@email.com',  phone:'+1 646 555 0111', location:'New York, NY',       current_title:'iOS Engineer',             applied_for:'iOS Engineer',             stage:'interview',   source:'direct',      composite_score:76, cv_score:77, phone_screen_score:75, assessment_score:74, interview_score:77, skills:['Swift','UIKit','SwiftUI','Core Data','Combine'],       created_at:'2026-03-13', summary:'Isabella has strong iOS fundamentals with 5 years of App Store experience. Good problem-solving in the interview. Jury leans towards shortlist.' },
  '12': { id:'12',name:'Noah Thompson',     email:'noah@email.com',      phone:'+1 347 555 0112', location:'New York, NY',       current_title:'Account Executive',        applied_for:'Sales Executive',          stage:'screening',   source:'linkedin',    composite_score:69, cv_score:68, phone_screen_score:70, assessment_score:67, interview_score:null, skills:['SaaS Sales','Salesforce','Negotiation','Outbound'],   created_at:'2026-03-12', summary:'Noah has 4 years of SaaS AE experience with a solid track record. Missed quota last year. Jury recommendation: proceed to full assessment.' },
  '13': { id:'13',name:'Aisha Kofi',        email:'aisha@email.com',     phone:'+1 415 555 0113', location:'San Francisco, CA',  current_title:'Product Designer',         applied_for:'Product Designer',         stage:'shortlisted', source:'indeed',      composite_score:82, cv_score:84, phone_screen_score:80, assessment_score:81, interview_score:83, skills:['Figma','Design Systems','Accessibility','Motion Design'], created_at:'2026-03-14', summary:'Aisha has exceptional design portfolio with a focus on accessibility. Strong systems thinker. Jury unanimous: shortlist and move to offer stage.' },
  '14': { id:'14',name:'Diego Herrera',     email:'diego@email.com',     phone:'+1 512 555 0114', location:'Austin, TX',         current_title:'Frontend Engineer',        applied_for:'Frontend Engineer',        stage:'screening',   source:'ziprecruiter',composite_score:71, cv_score:72, phone_screen_score:70, assessment_score:69, interview_score:null, skills:['Vue.js','CSS','Performance','Webpack','TypeScript'],   created_at:'2026-03-11', summary:'Diego has 4 years of Vue experience transitioning to React. Good CSS fundamentals, some performance optimization work. Jury: proceed to assessment.' },
  '15': { id:'15',name:'Yuki Tanaka',       email:'yuki@email.com',      phone:'+1 650 555 0115', location:'Palo Alto, CA',      current_title:'Senior Data Scientist',    applied_for:'Data Scientist',           stage:'offered',     source:'linkedin',    composite_score:93, cv_score:94, phone_screen_score:92, assessment_score:91, interview_score:94, skills:['R','Statistics','Visualization','Bayesian Modeling','Python'], created_at:'2026-03-15', summary:'Yuki is a world-class data scientist with a PhD and 3 publications. Perfect technical and cultural fit. Jury unanimous: offer extended.' },
}

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [note, setNote] = useState('')

  // Data state
  const [candidate, setCandidate] = useState(null)
  const [assessment, setAssessment] = useState(null)
  const [interview, setInterview] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [facialAnalysis, setFacialAnalysis] = useState(null)
  const [notes, setNotes] = useState([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await getCandidate(id)
        // API returns { status, data: { candidate, applications, ... } }
        const candidateData = res?.data?.candidate || res?.data || res
        setCandidate(candidateData)

        // Load related data in parallel, gracefully handling missing data
        const promises = []

        if (candidateData.assessment_id) {
          promises.push(
            getAssessment(candidateData.assessment_id).then(d => setAssessment(d?.data || d)).catch(() => null)
          )
        }

        if (candidateData.interview_id) {
          promises.push(
            getInterview(candidateData.interview_id).then(d => setInterview(d?.data || d)).catch(() => null)
          )
          promises.push(
            getTranscript(candidateData.interview_id).then(d => setTranscript(d?.data || d)).catch(() => null)
          )
          promises.push(
            getFacialAnalysis(candidateData.interview_id).then(d => setFacialAnalysis(d?.data || d)).catch(() => null)
          )
        }

        if (candidateData.application_id) {
          promises.push(
            getNotes(candidateData.application_id).then(d => setNotes(d?.data?.items || d?.data || d || [])).catch(() => [])
          )
        }

        await Promise.all(promises)
      } catch (err) {
        // Fall back to demo mock data for the 15 candidates shown on the Candidates page
        const mock = MOCK_DETAILS[id]
        if (mock) {
          setCandidate(mock)
        } else {
          setError(err.message || 'Failed to load candidate data')
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  async function handleAddNote() {
    if (!note.trim() || !candidate?.application_id) return
    try {
      await addNote(candidate.application_id, note.trim())
      setNote('')
      const updated = await getNotes(candidate.application_id).catch(() => [])
      setNotes(updated)
    } catch (e) {
      console.error('Failed to add note:', e)
    }
  }

  async function handleShortlist() {
    if (!candidate?.application_id) return
    try {
      await shortlistApplication(candidate.application_id)
      const updated = await getCandidate(id)
      setCandidate(updated)
    } catch (e) {
      console.error('Failed to shortlist:', e)
    }
  }

  async function handleReject() {
    if (!candidate?.application_id) return
    try {
      await rejectApplication(candidate.application_id, { reason: 'Rejected by recruiter' })
      const updated = await getCandidate(id)
      setCandidate(updated)
    } catch (e) {
      console.error('Failed to reject:', e)
    }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  if (error) {
    return (
      <Layout>
        <PageHeader title="Candidate" breadcrumb="Candidates" actions={
          <button onClick={() => navigate('/candidates')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <ChevronLeft size={13} /> Back
          </button>
        } />
        <EmptyState icon={AlertCircle} title="Error Loading Candidate" description={error} />
      </Layout>
    )
  }

  const c = candidate || {}
  const compositeScore = c.composite_score ?? c.overall_score ?? null
  const cvScore = c.cv_score ?? c.pipeline_stages?.[0]?.score ?? null
  const interviewScore = c.interview_score ?? interview?.composite_score ?? null
  const assessmentScore = c.assessment_score ?? assessment?.overall_score ?? null
  const facialScore = facialAnalysis?.overall_score ?? null

  const tabs = ['overview', 'pipeline', 'assessments', 'interview', 'facial analysis', 'documents']

  return (
    <Layout>
      <PageHeader
        title={c.name || 'Candidate'}
        breadcrumb="Candidates"
        subtitle={[c.current_title, c.applied_for && `Applied for ${c.applied_for}`].filter(Boolean).join(' \u00b7 ')}
        actions={
          <button onClick={() => navigate('/candidates')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <ChevronLeft size={13} /> Back
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Left column */}
        <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
          {/* Profile header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(c.name || '?').split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</h2>
                {c.stage && <Badge status={c.stage} />}
                {c.source && <Badge status={c.source} size="xs" />}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {c.email && <InfoChip icon={Mail} text={c.email} />}
                {c.phone && <InfoChip icon={Phone} text={c.phone} />}
                {c.location && <InfoChip icon={MapPin} text={c.location} />}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'center' }}>
              {compositeScore !== null && <ScoreCircle score={compositeScore} size={70} label="Overall" />}
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <ScoreBar score={cvScore ?? 0} label="CV Score" height={6} />
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={interviewScore ?? 0} label="Interview" height={6} />
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={assessmentScore ?? 0} label="Assessment" height={6} />
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={facialScore ?? 0} label="Facial" height={6} />
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', gap: 0 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 14px', background: 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: tab === t ? 600 : 400,
                borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                borderRadius: 0, marginBottom: -1, textTransform: 'capitalize',
                transition: 'all 0.1s', cursor: 'pointer', border: 'none',
                borderBottomStyle: 'solid', borderBottomWidth: 2,
                borderBottomColor: tab === t ? 'var(--accent)' : 'transparent',
              }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px 24px' }}>
            {tab === 'overview' && <OverviewTab candidate={c} assessment={assessment} interview={interview} />}
            {tab === 'pipeline' && <PipelineTab candidate={c} assessment={assessment} interview={interview} />}
            {tab === 'assessments' && <AssessmentsTab assessment={assessment} candidate={c} />}
            {tab === 'interview' && <InterviewTab interview={interview} transcript={transcript} candidate={c} />}
            {tab === 'facial analysis' && <FacialAnalysisTab facialAnalysis={facialAnalysis} assessment={assessment} />}
            {tab === 'documents' && <DocumentsTab candidate={c} assessment={assessment} />}
          </div>
        </div>

        {/* Right column */}
        <div style={{ overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Actions */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <ActionButton icon={Star} label="Shortlist" color="var(--success)" onClick={handleShortlist} />
              <ActionButton icon={Calendar} label="Schedule Interview" color="var(--info)" />
              <ActionButton icon={ClipboardList} label="Send Assessment" color="var(--accent)" />
              <ActionButton icon={FileText} label="Create Offer" color="var(--warning)" />
              <ActionButton icon={XCircle} label="Reject" color="var(--danger)" outline onClick={handleReject} />
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Quick Stats</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatRow icon={Clock} label="Interview Duration" value={interview?.duration ? `${Math.round(interview.duration / 60)} min` : interview?.total_time || '--'} />
              <StatRow icon={Calendar} label="Assessment Date" value={assessment?.completed_at ? new Date(assessment.completed_at).toLocaleDateString() : assessment?.created_at ? new Date(assessment.created_at).toLocaleDateString() : '--'} />
              <StatRow icon={Activity} label="Days in Pipeline" value={c.created_at ? `${Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)}d` : '--'} />
              <StatRow icon={Target} label="Stage" value={c.stage || c.current_stage || '--'} />
            </div>
          </div>

          {/* Quick Notes */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Quick Notes</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note about this candidate..."
              rows={3}
              style={{ resize: 'none', fontSize: 12, width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleAddNote}
              disabled={!note.trim()}
              style={{ marginTop: 8, width: '100%', padding: '7px', background: note.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: note.trim() ? 'pointer' : 'not-allowed', border: 'none' }}
            >
              Add Note
            </button>
            {notes && notes.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {notes.slice(0, 5).map((n, i) => (
                  <div key={n.id || i} style={{ padding: '6px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {n.content || n.text}
                    {n.created_at && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(n.created_at).toLocaleString()}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          {c.activity && c.activity.length > 0 && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Activity</p>
              <Timeline events={c.activity} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

// ─── Overview Tab ──────────────────────────────────────────────
function OverviewTab({ candidate: c, assessment, interview }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* AI Summary */}
      {(c.summary || c.ai_summary) && (
        <Section title="AI Summary" icon={Sparkles}>
          <div style={{
            padding: '14px 16px',
            background: 'rgba(129,140,248,0.05)',
            border: '1px solid rgba(129,140,248,0.15)',
            borderRadius: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.summary || c.ai_summary}</p>
          </div>
        </Section>
      )}

      {/* Skills */}
      {c.skills && c.skills.length > 0 && (
        <Section title="Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.skills.map(s => (
              <span key={s} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, background: 'rgba(129,140,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(129,140,248,0.2)', fontWeight: 500 }}>{s}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Score Overview */}
      <Section title="Score Breakdown">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <ScoreCard label="CV Screening" score={c.cv_score} icon={FileText} description="Resume-to-job fit analysis" />
          <ScoreCard label="Phone Screen" score={c.phone_screen_score} icon={Phone} description="Voice screening results" />
          <ScoreCard label="Assessment" score={c.assessment_score ?? assessment?.overall_score} icon={Brain} description="Cognitive + personality + language" />
          <ScoreCard label="Interview" score={c.interview_score ?? interview?.composite_score} icon={Video} description="Behavioral interview performance" />
        </div>
      </Section>

      {/* Experience */}
      {c.experience && c.experience.length > 0 && (
        <Section title="Experience">
          {c.experience.map((exp, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{exp.title}</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1 }}>{exp.company} {exp.period && `\u00b7 ${exp.period}`}</div>
                {exp.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{exp.description}</div>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {c.education && c.education.length > 0 && (
        <Section title="Education">
          {c.education.map((edu, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{edu.degree}</span> {edu.school && `\u2014 ${edu.school}`} {edu.year && `\u00b7 ${edu.year}`}
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

// ─── Pipeline Tab ──────────────────────────────────────────────
function PipelineTab({ candidate: c, assessment, interview }) {
  const [expandedInfo, setExpandedInfo] = useState({})
  const stages = c.pipeline_stages || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stage progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {STAGE_META.map((meta, i) => {
          const stage = stages[i]
          const status = getStageStatus(stage)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                height: 4, width: '100%', borderRadius: 2,
                background: status.color,
                opacity: stage?.status ? 1 : 0.2,
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
        const stage = stages[i] || {}
        const status = getStageStatus(stage)
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
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Stage {i + 1}: {meta.title}</span>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: status.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, color: status.color, fontWeight: 600 }}>{status.label}</span>
                </div>
                {stage.date && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                    {new Date(stage.date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {stage.score != null && <ScoreCircle score={stage.score} size={42} label="" />}
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
              {isInfoExpanded ? <ChevronUp size={11} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={11} style={{ marginLeft: 'auto' }} />}
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
              {/* Stage 1: CV Screening */}
              {i === 0 && (
                <CVStageContent stage={stage} candidate={c} />
              )}

              {/* Stage 2: Phone Screen */}
              {i === 1 && (
                <PhoneScreenContent stage={stage} candidate={c} />
              )}

              {/* Stage 3: Assessment */}
              {i === 2 && (
                <AssessmentStageContent stage={stage} assessment={assessment} />
              )}

              {/* Stage 4: Interview */}
              {i === 3 && (
                <InterviewStageContent stage={stage} interview={interview} candidate={c} />
              )}

              {/* Stage 5: Recruiter Review */}
              {i === 4 && (
                <RecruiterReviewContent stage={stage} candidate={c} />
              )}

              {/* Stage 6: Offer */}
              {i === 5 && (
                <OfferStageContent stage={stage} candidate={c} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CVStageContent({ stage, candidate: c }) {
  if (!stage?.score && !stage?.notes && !c.cv_score) {
    return <PendingMessage />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Score breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Overall CV" value={stage.score ?? c.cv_score ?? '--'} suffix="/100" />
        <MiniStat label="Keyword Match" value={stage.keyword_match ?? c.keyword_match_pct ?? '--'} suffix="%" />
        <MiniStat label="Embedding Sim." value={stage.embedding_similarity ?? c.embedding_similarity ?? '--'} suffix="%" />
      </div>

      {/* Jury verdict */}
      {(stage.jury_votes || c.jury_votes) && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>3-LLM Jury Verdict</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {(stage.jury_votes || c.jury_votes || []).map((vote, vi) => (
              <div key={vi} style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: vote === 'pass' || vote === true ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                color: vote === 'pass' || vote === true ? '#34d399' : '#f87171',
                border: `1px solid ${vote === 'pass' || vote === true ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                fontFamily: 'Geist Mono, monospace',
              }}>
                LLM {vi + 1}: {vote === 'pass' || vote === true ? 'PASS' : 'FAIL'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI summary */}
      {(stage.notes || stage.ai_summary) && (
        <AISummaryBox text={stage.notes || stage.ai_summary} />
      )}
    </div>
  )
}

function PhoneScreenContent({ stage, candidate: c }) {
  if (!stage?.score && !stage?.notes) {
    return <PendingMessage />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MiniStat label="Overall Score" value={stage.score ?? '--'} suffix="/100" />
        <MiniStat label="Jury Agreement" value={stage.jury_agreement ?? '--'} suffix="%" />
      </div>

      {/* Per-question grades */}
      {stage.question_grades && stage.question_grades.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question Grades</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {stage.question_grades.map((g, gi) => (
              <span key={gi} style={{
                padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: gradeColors[g] ? `${gradeColors[g]}20` : 'var(--bg-tertiary)',
                color: gradeColors[g] || 'var(--text-muted)',
                fontFamily: 'Geist Mono, monospace',
              }}>
                Q{gi + 1}: {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {(stage.notes || stage.ai_summary) && (
        <AISummaryBox text={stage.notes || stage.ai_summary} />
      )}
    </div>
  )
}

function AssessmentStageContent({ stage, assessment }) {
  if (!stage?.score && !stage?.notes && !assessment) {
    return <PendingMessage />
  }
  const bigFive = assessment?.big_five || assessment?.personality
  const cognitive = assessment?.cognitive
  const language = assessment?.language

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Overall" value={stage?.score ?? assessment?.overall_score ?? '--'} suffix="/100" />
        <MiniStat label="Cognitive" value={cognitive?.overall ?? cognitive?.percentile ?? '--'} suffix={cognitive?.percentile ? 'th %ile' : '/100'} />
        <MiniStat label="Language" value={language?.level ?? '--'} isText />
      </div>

      {/* Big Five mini bars */}
      {bigFive && Array.isArray(bigFive) && bigFive.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Big Five Preview</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {bigFive.slice(0, 5).map(b => (
              <ScoreBar key={b.factor || b.name} score={b.score || b.value || 0} label={b.factor || b.name} height={4} />
            ))}
          </div>
        </div>
      )}

      {(stage?.notes || stage?.ai_summary) && (
        <AISummaryBox text={stage.notes || stage.ai_summary} />
      )}
    </div>
  )
}

function InterviewStageContent({ stage, interview, candidate: c }) {
  if (!stage?.score && !stage?.notes && !interview && !c.interview_questions) {
    return <PendingMessage />
  }
  const questions = interview?.questions || c.interview_questions || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Composite" value={interview?.composite_score ?? stage?.score ?? c.interview_score ?? '--'} suffix="/100" />
        <MiniStat label="Questions" value={questions.length || '--'} isText />
        <MiniStat label="Duration" value={interview?.duration ? `${Math.round(interview.duration / 60)}m` : '--'} isText />
      </div>

      {/* Top 3 question grades */}
      {questions.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question Performance</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {questions.slice(0, 3).map((q, qi) => (
              <div key={qi} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: '#fff',
                  background: gradeColors[q.grade] || 'var(--accent)',
                  borderRadius: 3, padding: '1px 6px', flexShrink: 0,
                }}>{q.grade}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.question}
                </span>
                {q.score != null && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: gradeColors[q.grade] || 'var(--accent)', fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>
                    {q.score}
                  </span>
                )}
              </div>
            ))}
            {questions.length > 3 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                +{questions.length - 3} more questions
              </span>
            )}
          </div>
        </div>
      )}

      {/* Video link */}
      {(interview?.video_url || interview?.recording_url) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 6 }}>
          <Play size={13} color="var(--accent)" />
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>Video recording available</span>
        </div>
      )}

      {(stage?.notes || stage?.ai_summary) && (
        <AISummaryBox text={stage.notes || stage.ai_summary} />
      )}
    </div>
  )
}

function RecruiterReviewContent({ stage, candidate: c }) {
  if (!stage?.status || stage.status === 'pending') {
    return <PendingMessage message="Awaiting recruiter review" />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MiniStat label="Decision" value={stage.status === 'pass' || stage.status === 'shortlisted' ? 'Shortlisted' : stage.status === 'fail' || stage.status === 'rejected' ? 'Rejected' : stage.status} isText />
        <MiniStat label="Decided" value={stage.date ? new Date(stage.date).toLocaleDateString() : '--'} isText />
      </div>
      {stage.notes && (
        <div style={{ padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recruiter Notes</span>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>{stage.notes}</p>
        </div>
      )}
    </div>
  )
}

function OfferStageContent({ stage, candidate: c }) {
  if (!stage?.status || stage.status === 'pending') {
    return <PendingMessage message="Offer not yet generated" />
  }
  const offer = stage.offer_details || c.offer || {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Salary" value={offer.salary ? `$${Number(offer.salary).toLocaleString()}` : '--'} isText />
        <MiniStat label="Start Date" value={offer.start_date ? new Date(offer.start_date).toLocaleDateString() : '--'} isText />
        <MiniStat label="DocuSign" value={offer.docusign_status || stage.status || '--'} isText />
      </div>
      {(offer.offer_letter_url || stage.offer_url) && (
        <a
          href={offer.offer_letter_url || stage.offer_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 6, textDecoration: 'none' }}
        >
          <FileText size={13} color="var(--accent)" />
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>View offer letter</span>
        </a>
      )}
      {stage.notes && <AISummaryBox text={stage.notes} />}
    </div>
  )
}

// ─── Assessments Tab ───────────────────────────────────────────
function AssessmentsTab({ assessment, candidate: c }) {
  const bigFive = assessment?.big_five || assessment?.personality || c.big_five || []
  const cognitive = assessment?.cognitive || c.cognitive || []
  const language = assessment?.language || c.language || null

  const BIG_FIVE_INTERPRETATIONS = {
    Openness: { high: 'High openness suggests creativity, intellectual curiosity, and willingness to explore new approaches. Likely to innovate and adapt to changing requirements.', low: 'Lower openness may indicate preference for established methods and practical, concrete thinking.' },
    Conscientiousness: { high: 'High conscientiousness indicates strong organization, reliability, and self-discipline. Likely to meet deadlines and maintain high quality standards.', low: 'Lower conscientiousness may suggest flexibility but potential challenges with structure and follow-through.' },
    Extraversion: { high: 'High extraversion suggests strong communication skills, team energy, and comfort in collaborative environments.', low: 'Lower extraversion indicates preference for focused, independent work. May excel in deep-thinking roles.' },
    Agreeableness: { high: 'High agreeableness shows strong empathy, cooperation, and team orientation. Natural collaborator.', low: 'Lower agreeableness may indicate directness and willingness to challenge ideas. Can be valuable in critical roles.' },
    Neuroticism: { high: 'Higher neuroticism suggests emotional sensitivity. May benefit from structured support and clear expectations.', low: 'Low neuroticism indicates emotional stability and resilience under pressure. Handles stress well.' },
  }

  const COGNITIVE_INTERPRETATIONS = {
    'Problem Solving': 'Measures logical reasoning and ability to decompose complex problems into structured solutions.',
    'Numerical': 'Assesses quantitative reasoning, data interpretation, and mathematical aptitude.',
    'Verbal': 'Evaluates reading comprehension, vocabulary, and verbal reasoning ability.',
    'Logical': 'Tests pattern recognition and deductive reasoning capability.',
    'Pattern Recognition': 'Measures ability to identify patterns, sequences, and abstract relationships.',
    'Memory': 'Assesses working memory capacity and information retention.',
    'Attention': 'Measures sustained focus, selective attention, and resistance to distraction.',
  }

  if (!bigFive.length && !cognitive.length && !language) {
    return <EmptyState icon={Brain} title="No Assessment Data" description="Assessment has not been completed yet." />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Big Five Personality */}
      {bigFive.length > 0 && (
        <Section title="Big Five Personality" icon={Heart}>
          <PersonalityRadar data={bigFive} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {bigFive.map(b => {
              const factor = b.factor || b.name
              const score = b.score || b.value || 0
              const interp = BIG_FIVE_INTERPRETATIONS[factor]
              const description = interp ? (score >= 50 ? interp.high : interp.low) : null
              return (
                <div key={factor} style={{
                  padding: '12px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{factor}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--accent)' : 'var(--warning)' }}>
                        {score}/100
                      </span>
                      {b.percentile != null && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                          {b.percentile}th %ile
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${score}%`, height: '100%', background: score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--accent)' : 'var(--warning)', borderRadius: 2 }} />
                  </div>
                  {description && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Cognitive Aptitude */}
      {cognitive.length > 0 && (
        <Section title="Cognitive Aptitude" icon={Zap}>
          {/* Overall percentile */}
          {(assessment?.cognitive_percentile || assessment?.cognitive?.percentile) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
              padding: '14px 16px', background: 'rgba(129,140,248,0.05)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 8,
            }}>
              <ScoreCircle score={assessment.cognitive_percentile || assessment.cognitive?.percentile || 0} size={56} label="" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Overall Cognitive Percentile</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Scored higher than {assessment.cognitive_percentile || assessment.cognitive?.percentile || 0}% of test takers
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(Array.isArray(cognitive) ? cognitive : []).map(item => {
              const name = item.name || item.category
              const score = item.score || item.value || 0
              return (
                <div key={name} style={{
                  padding: '12px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}>
                  <ScoreBar score={score} label={name} height={8} />
                  {COGNITIVE_INTERPRETATIONS[name] && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                      {COGNITIVE_INTERPRETATIONS[name]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Language Proficiency */}
      {language && (
        <Section title="Language Proficiency" icon={Globe}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{
              padding: '16px 24px', background: 'rgba(129,140,248,0.1)',
              border: '1px solid rgba(129,140,248,0.25)', borderRadius: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', fontFamily: 'Geist Mono, monospace' }}>{language.level}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>CEFR Level</div>
              {language.score != null && (
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{language.score}/100</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {language.reading != null && (
                <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <ScoreBar score={language.reading} label="Reading" height={6} />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Comprehension of written technical and business content.</p>
                </div>
              )}
              {language.writing != null && (
                <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <ScoreBar score={language.writing} label="Writing" height={6} />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Clarity, grammar, and professional writing ability assessed by LLM evaluation.</p>
                </div>
              )}
              {language.listening != null && (
                <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <ScoreBar score={language.listening} label="Listening" height={6} />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Ability to understand spoken English in professional contexts.</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Interview Tab ─────────────────────────────────────────────
function InterviewTab({ interview, transcript, candidate: c }) {
  const [showTranscript, setShowTranscript] = useState(true)
  const questions = interview?.questions || c.interview_questions || []
  const transcriptData = transcript?.turns || transcript?.messages || (Array.isArray(transcript) ? transcript : c.transcript) || []
  const flags = interview?.behavioral_flags || c.behavioral_flags || []
  const fillerCount = interview?.filler_count ?? c.filler_count ?? 0
  const videoUrl = interview?.video_url || interview?.recording_url || null

  if (!questions.length && !transcriptData.length && !videoUrl) {
    return <EmptyState icon={Video} title="No Interview Data" description="Interview has not been conducted yet." />
  }

  // Response length distribution for chart
  const responseLengths = transcriptData
    .filter(t => t.speaker === 'Candidate' || t.speaker === 'candidate')
    .map((t, i) => ({
      question: `Q${i + 1}`,
      words: (t.text || '').split(/\s+/).length,
    }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Video Player */}
      {videoUrl && (
        <Section title="Recording" icon={Video}>
          <VideoPlayer src={videoUrl} />
        </Section>
      )}

      {/* Question Grades */}
      {questions.length > 0 && (
        <Section title="Question Grades" icon={BarChart3}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questions.map((q, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: '#fff',
                    background: gradeColors[q.grade] || 'var(--accent)',
                    borderRadius: 4, padding: '2px 7px', flexShrink: 0, marginTop: 1,
                  }}>{q.grade}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{q.question}</span>
                  {q.score != null && (
                    <span style={{ fontSize: 14, fontWeight: 700, color: gradeColors[q.grade] || 'var(--accent)', fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>{q.score}</span>
                  )}
                </div>
                {q.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 36, lineHeight: 1.5 }}>{q.notes}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Behavioral Analysis */}
      <Section title="Behavioral Analysis" icon={Activity}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: fillerCount > 20 ? 'var(--warning)' : 'var(--success)', fontFamily: 'Geist Mono, monospace' }}>{fillerCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Filler Words</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>{transcriptData.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Turns</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: flags.length > 3 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>{flags.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Behavioral Flags</div>
          </div>
        </div>

        {flags.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {flags.map((flag, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 10px', background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6,
              }}>
                <AlertTriangle size={13} color="var(--danger)" style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{flag.type}: </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{flag.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Response length distribution */}
        {responseLengths.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Response Length Distribution (words)</span>
            <div style={{ marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 4px 4px 0' }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={responseLengths}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="question" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#3f3f46" width={32} />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                    formatter={(value) => [`${value} words`, 'Length']}
                  />
                  <Bar dataKey="words" fill="#818cf8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Section>

      {/* Full Transcript */}
      {transcriptData.length > 0 && (
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
            <TranscriptViewer
              transcript={transcriptData}
              flags={flags}
              fillerCount={fillerCount}
            />
          )}
        </Section>
      )}
    </div>
  )
}

// ─── Facial Analysis Tab ───────────────────────────────────────
function FacialAnalysisTab({ facialAnalysis, assessment }) {
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
  const bigFiveAssessment = assessment?.big_five || assessment?.personality || []
  const bigFiveFacial = fa.big_five_facial || fa.personality_from_face || []

  // Prepare comparison data for radar chart
  const comparisonData = bigFiveFacial.map(bf => {
    const matchingAssessment = bigFiveAssessment.find(
      a => (a.factor || a.name) === (bf.factor || bf.name)
    )
    return {
      subject: bf.factor || bf.name,
      facial: bf.score || bf.value || 0,
      assessment: matchingAssessment ? (matchingAssessment.score || matchingAssessment.value || 0) : 0,
      fullMark: 100,
    }
  })

  const metrics = [
    { key: 'confidence', label: 'Confidence', icon: Shield, description: fa.confidence_description || 'Overall confidence level demonstrated through facial expressions, eye contact, and composure.' },
    { key: 'engagement', label: 'Engagement', icon: Target, description: fa.engagement_description || 'Level of active attention and interest shown throughout the interview.' },
    { key: 'stress_tolerance', label: 'Stress Tolerance', icon: Activity, description: fa.stress_description || 'Ability to maintain composure under challenging questions.' },
    { key: 'communication_style', label: 'Communication Style', icon: MessageSquare, description: fa.communication_description || 'Non-verbal communication effectiveness and expressiveness.' },
    { key: 'authenticity', label: 'Authenticity', icon: Heart, description: fa.authenticity_description || 'Congruence between verbal and non-verbal cues suggesting genuine responses.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with thumbnail and overall score */}
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        padding: '16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 10,
      }}>
        {fa.face_thumbnail_url ? (
          <img
            src={fa.face_thumbnail_url}
            alt="Face thumbnail"
            style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--border)' }}
          />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={24} color="var(--text-muted)" />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Facial Analysis Results</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            AI-powered analysis of facial expressions, micro-expressions, and behavioral cues during interview
          </div>
        </div>
        {fa.overall_score != null && (
          <ScoreCircle score={fa.overall_score} size={72} label="Overall" />
        )}
      </div>

      {/* Composite Scores */}
      <Section title="Composite Scores" icon={BarChart3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {metrics.map(m => {
            const score = fa[m.key] ?? fa[`${m.key}_score`] ?? null
            if (score == null) return null
            return (
              <FacialAnalysisCard
                key={m.key}
                label={m.label}
                score={score}
                description={m.description}
                icon={m.icon}
              />
            )
          })}
        </div>
      </Section>

      {/* Big Five Comparison */}
      {comparisonData.length > 0 && bigFiveAssessment.length > 0 && (
        <Section title="Big Five: Facial vs Assessment Comparison" icon={Brain}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px 8px',
          }}>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsRadar data={comparisonData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#3f3f46" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Radar name="Facial Analysis" dataKey="facial" stroke="#818cf8" fill="#818cf8" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Assessment" dataKey="assessment" stroke="#34d399" fill="#34d399" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
              </RechartsRadar>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 3, background: '#818cf8', borderRadius: 1 }} />
                Facial Analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 3, background: '#34d399', borderRadius: 1, borderTop: '1px dashed #34d399' }} />
                Assessment
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Emotion Timeline */}
      {(fa.timeline_data || fa.emotion_timeline) && (
        <Section title="Emotion Timeline" icon={TrendingUp}>
          <EmotionTimeline data={fa.timeline_data || fa.emotion_timeline} height={250} />
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
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: 'Geist Mono, monospace',
                  color: 'var(--accent)', flexShrink: 0, minWidth: 40,
                }}>
                  {typeof moment.timestamp === 'number'
                    ? `${Math.floor(moment.timestamp / 60)}:${String(Math.floor(moment.timestamp % 60)).padStart(2, '0')}`
                    : moment.timestamp || '--'}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {moment.description || moment.text}
                  </p>
                </div>
                {(moment.emotion || moment.emotion_badge) && (
                  <Badge
                    label={moment.emotion || moment.emotion_badge}
                    variant={
                      (moment.emotion || '').toLowerCase() === 'confidence' ? 'success'
                        : (moment.emotion || '').toLowerCase() === 'stress' ? 'danger'
                        : (moment.emotion || '').toLowerCase() === 'engagement' ? 'accent'
                        : 'default'
                    }
                    size="xs"
                  />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action Unit Breakdown */}
      {(fa.action_units || fa.au_values) && (
        <Section title="" icon={null}>
          <ActionUnitBreakdown data={fa.action_units || fa.au_values} />
        </Section>
      )}

      {/* AI Narrative Summary */}
      {(fa.narrative_summary || fa.ai_summary) && (
        <Section title="AI Narrative Summary" icon={Sparkles}>
          <div style={{
            padding: '16px',
            background: 'rgba(129,140,248,0.05)',
            border: '1px solid rgba(129,140,248,0.15)',
            borderRadius: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {fa.narrative_summary || fa.ai_summary}
            </p>
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Documents Tab ─────────────────────────────────────────────
function DocumentsTab({ candidate: c, assessment }) {
  const documents = []

  if (c.resume_url || c.cv_url) {
    documents.push({
      name: 'Resume / CV',
      url: c.resume_url || c.cv_url,
      type: 'PDF',
      icon: FileText,
      size: c.resume_size || null,
    })
  }

  if (c.offer_letter_url || c.offer?.offer_letter_url) {
    documents.push({
      name: 'Offer Letter',
      url: c.offer_letter_url || c.offer?.offer_letter_url,
      type: 'PDF',
      icon: Send,
      size: null,
    })
  }

  if (assessment?.report_url) {
    documents.push({
      name: 'Assessment Report',
      url: assessment.report_url,
      type: 'PDF',
      icon: ClipboardList,
      size: null,
    })
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
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {doc.type}{doc.size ? ` \u00b7 ${doc.size}` : ''}
                </div>
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
              <Download size={13} /> Download
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

function ActionButton({ icon: Icon, label, color, outline = false, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px',
        background: outline ? 'transparent' : `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 7, color, fontSize: 13, fontWeight: 600,
        textAlign: 'left', transition: 'all 0.12s', cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}28` }}
      onMouseLeave={e => { e.currentTarget.style.background = outline ? 'transparent' : `${color}18` }}
    >
      <Icon size={14} /> {label}
    </button>
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
        fontSize: isText ? 14 : 18,
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
  if (score == null || score === undefined) {
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
      <ScoreCircle score={score} size={46} label="" />
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
