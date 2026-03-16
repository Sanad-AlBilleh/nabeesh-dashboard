import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Mail, Phone, MapPin, Download, Send, Star, XCircle, Calendar, ClipboardList, MessageSquare, FileText, Plus } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import ScoreBar from '../components/ScoreBar'
import ScoreCircle from '../components/ScoreCircle'
import PersonalityRadar from '../components/RadarChart'
import Timeline from '../components/Timeline'
import TranscriptViewer from '../components/TranscriptViewer'
import { PageLoader } from '../components/LoadingSpinner'

const MOCK_CANDIDATE = {
  id: '1',
  name: 'Jordan Lee',
  email: 'jordan.lee@email.com',
  phone: '+1 (415) 555-0123',
  location: 'San Francisco, CA',
  current_title: 'Senior Software Engineer at Stripe',
  stage: 'shortlisted',
  source: 'ziprecruiter',
  applied_for: 'Senior Backend Engineer',
  composite_score: 91,
  cv_score: 88,
  interview_score: 94,
  assessment_score: 91,
  summary: 'Highly experienced backend engineer with 7+ years building distributed systems at scale. Strong Go and Kubernetes expertise. Led core infrastructure migrations at Stripe serving 100M+ requests/day.',
  skills: ['Go', 'Kubernetes', 'gRPC', 'PostgreSQL', 'Redis', 'AWS', 'Terraform', 'Distributed Systems', 'System Design'],
  experience: [
    { title: 'Senior Software Engineer', company: 'Stripe', period: '2022–Present', description: 'Core infrastructure team, led migration to Kubernetes, reduced latency by 40%.' },
    { title: 'Software Engineer', company: 'Coinbase', period: '2020–2022', description: 'Built high-throughput transaction processing systems in Go.' },
    { title: 'Software Engineer', company: 'Lyft', period: '2018–2020', description: 'Backend services for ride matching and pricing engine.' },
  ],
  education: [{ degree: 'B.S. Computer Science', school: 'UC Berkeley', year: '2018' }],
  big_five: [
    { factor: 'Openness', score: 82 },
    { factor: 'Conscientiousness', score: 78 },
    { factor: 'Extraversion', score: 55 },
    { factor: 'Agreeableness', score: 71 },
    { factor: 'Neuroticism', score: 32 },
  ],
  cognitive: [
    { name: 'Problem Solving', score: 92 },
    { name: 'Numerical', score: 88 },
    { name: 'Verbal', score: 79 },
    { name: 'Memory', score: 85 },
    { name: 'Attention', score: 94 },
  ],
  language: { level: 'C2', score: 96, reading: 97, writing: 95, listening: 96 },
  pipeline_stages: [
    { stage: 'Stage 1: CV Screening', status: 'pass', score: 88, date: '2026-03-08', notes: 'Excellent background. Strong Stripe experience.' },
    { stage: 'Stage 2: AI Phone Screen', status: 'pass', score: 79, date: '2026-03-10', notes: 'Clear communication. Good answers to technical questions.' },
    { stage: 'Stage 3: Technical Assessment', status: 'pass', score: 94, date: '2026-03-12', notes: 'Top scores across all cognitive areas.' },
    { stage: 'Stage 4: AI Interview', status: 'pass', score: null, date: '2026-03-14', notes: 'Full interview completed with behavioral analysis.' },
    { stage: 'Stage 5: Recruiter Review', status: 'in-progress', score: null, date: null, notes: null },
    { stage: 'Stage 6: Offer', status: 'pending', score: null, date: null, notes: null },
  ],
  interview_questions: [
    { question: 'Tell me about a distributed system you designed and the trade-offs involved.', grade: 'A', score: 96, notes: 'Excellent depth, referenced CAP theorem and real Stripe system.' },
    { question: 'How do you approach debugging a latency issue in production?', grade: 'A', score: 93, notes: 'Methodical approach, clear escalation process.' },
    { question: 'Describe your experience with Kubernetes and container orchestration.', grade: 'A+', score: 98, notes: 'Led migration, extensive hands-on. Best answer of session.' },
    { question: 'Tell me about a time you disagreed with a team decision. How did you handle it?', grade: 'B+', score: 82, notes: 'Good example, could have been more specific about outcome.' },
    { question: 'How do you mentor junior engineers?', grade: 'B', score: 78, notes: 'Reasonable examples but limited detail on structure.' },
  ],
  transcript: [
    { speaker: 'AI', text: 'Welcome Jordan! I\'m the AI technical interviewer for the Senior Backend Engineer role at our company. Could you start by telling me about your most impactful infrastructure project at Stripe?', timestamp: '0:00' },
    { speaker: 'Candidate', text: 'Sure! My most impactful project was leading the Kubernetes migration for Stripe\'s payment processing infrastructure. We were running on legacy EC2 instances and the operational overhead was significant. I architected a phased migration plan that allowed zero-downtime cutover for services processing over 100 million requests per day. The key challenge was maintaining consistency across stateful services while moving to a container-based model.', timestamp: '0:25' },
    { speaker: 'AI', text: 'Impressive. What were the main trade-offs you encountered when deciding on your deployment strategy? Specifically around the stateful vs stateless service boundary?', timestamp: '2:10' },
    { speaker: 'Candidate', text: 'Great question. The fundamental tension was between operational simplicity and consistency guarantees. For stateless services, Kubernetes was a natural fit — we could scale horizontally, rolling updates were trivial. But for our PostgreSQL clusters and Redis instances, we had to make hard decisions. We decided to keep those on managed RDS and ElastiCache for the initial migration, then gradually move to StatefulSets for some lower-criticality Redis instances. The CAP theorem played heavily into this — we were explicit about choosing CP or AP characteristics for each service based on the business impact of partition failures.', timestamp: '2:45' },
    { speaker: 'AI', text: 'How did you handle the observability aspect of the migration? Rolling back 100M req/day isn\'t trivial.', timestamp: '5:20' },
    { speaker: 'Candidate', text: 'We instrumented everything. OpenTelemetry traces across service boundaries, custom Prometheus metrics for migration-specific signals, and we built a comparison dashboard that ran the old and new infrastructure in parallel. Our rollback strategy was blue-green at the service level — we could flip traffic back within 90 seconds based on SLO breach alerts.', timestamp: '5:50' },
  ],
  behavioral_flags: [
    { type: 'Filler Words', description: 'Used "um" 8 times across 6 responses — within acceptable range' },
  ],
  filler_count: 8,
  activity: [
    { id: 1, description: 'Application received', created_at: '2026-03-08T09:00:00Z', color: 'var(--info)' },
    { id: 2, description: 'CV score calculated: 88/100', created_at: '2026-03-08T09:01:00Z', color: 'var(--accent)' },
    { id: 3, description: 'Assessment sent by Sarah Kim', created_at: '2026-03-09T14:20:00Z', color: 'var(--warning)', actor: 'Sarah Kim' },
    { id: 4, description: 'Big Five + Cognitive assessment completed', created_at: '2026-03-12T10:15:00Z', color: 'var(--success)' },
    { id: 5, description: 'AI Interview conducted — Score: 94', created_at: '2026-03-14T15:00:00Z', color: 'var(--accent)' },
    { id: 6, description: 'Shortlisted by David Chen', created_at: '2026-03-15T11:30:00Z', color: 'var(--success)', actor: 'David Chen' },
  ],
}

const gradeColors = { 'A+': '#34d399', 'A': '#34d399', 'B+': '#60a5fa', 'B': '#818cf8', 'C': '#fbbf24', 'F': '#f87171' }

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')

  useEffect(() => { setTimeout(() => setLoading(false), 600) }, [])

  if (loading) return <Layout><PageLoader /></Layout>

  const c = MOCK_CANDIDATE

  return (
    <Layout>
      <PageHeader
        title={c.name}
        breadcrumb="Candidates"
        subtitle={`${c.current_title} · Applied for ${c.applied_for}`}
        actions={
          <button onClick={() => navigate('/candidates')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
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
              {c.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</h2>
                <Badge status={c.stage} />
                <Badge status={c.source} size="xs" />
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <InfoChip icon={Mail} text={c.email} />
                <InfoChip icon={Phone} text={c.phone} />
                <InfoChip icon={MapPin} text={c.location} />
              </div>
            </div>
            {/* Score overview */}
            <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
              <ScoreCircle score={c.composite_score} size={70} label="Overall" />
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <ScoreBar score={c.cv_score} label="CV Score" height={6} />
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={c.interview_score} label="Interview" height={6} />
            </div>
            <div style={{ flex: 1 }}>
              <ScoreBar score={c.assessment_score} label="Assessment" height={6} />
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', gap: 0 }}>
            {['profile', 'pipeline', 'assessments', 'interview', 'documents'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 14px', background: 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: tab === t ? 600 : 400, borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, borderRadius: 0, marginBottom: -1, textTransform: 'capitalize', transition: 'all 0.1s' }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Section title="Summary">
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.summary}</p>
                </Section>
                <Section title="Skills">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.skills.map(s => (
                      <span key={s} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, background: 'rgba(129,140,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(129,140,248,0.2)', fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </Section>
                <Section title="Experience">
                  {c.experience.map((exp, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{exp.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1 }}>{exp.company} · {exp.period}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{exp.description}</div>
                      </div>
                    </div>
                  ))}
                </Section>
                <Section title="Education">
                  {c.education.map((edu, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{edu.degree}</span> — {edu.school} · {edu.year}
                    </div>
                  ))}
                </Section>
              </div>
            )}

            {/* Pipeline Tab */}
            {tab === 'pipeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
                  {c.pipeline_stages.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: s.status === 'pass' ? 'rgba(52,211,153,0.15)' : s.status === 'in-progress' ? 'rgba(251,191,36,0.15)' : 'var(--bg-tertiary)',
                        color: s.status === 'pass' ? 'var(--success)' : s.status === 'in-progress' ? 'var(--warning)' : 'var(--text-muted)',
                        border: `1px solid ${s.status === 'pass' ? 'rgba(52,211,153,0.3)' : s.status === 'in-progress' ? 'rgba(251,191,36,0.3)' : 'var(--border)'}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {i + 1}
                      </div>
                      {i < c.pipeline_stages.length - 1 && <div style={{ width: 20, height: 1, background: 'var(--border)' }} />}
                    </div>
                  ))}
                </div>

                {c.pipeline_stages.map((stage, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: stage.notes ? 8 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{stage.stage}</span>
                        {stage.date && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{stage.date}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {stage.score !== null && stage.score !== undefined && <ScoreCircle score={stage.score} size={36} label="" />}
                        <Badge status={stage.status === 'pass' ? 'success' : stage.status === 'in-progress' ? 'warning' : 'default'} label={stage.status === 'in-progress' ? 'In Progress' : stage.status === 'pass' ? 'Pass' : stage.status || 'Pending'} size="sm" />
                      </div>
                    </div>
                    {stage.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{stage.notes}</p>}
                  </div>
                ))}

                {/* Interview question grades */}
                <div style={{ marginTop: 8 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Interview Question Grades
                  </h4>
                  {c.interview_questions.map((q, i) => (
                    <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: gradeColors[q.grade] || 'var(--accent)', borderRadius: 4, padding: '2px 7px', flexShrink: 0, marginTop: 1 }}>{q.grade}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{q.question}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: gradeColors[q.grade], fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>{q.score}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 36 }}>{q.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessments Tab */}
            {tab === 'assessments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Section title="Big Five Personality">
                  <PersonalityRadar data={c.big_five} />
                </Section>
                <Section title="Cognitive Aptitude">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {c.cognitive.map(item => (
                      <ScoreBar key={item.name} score={item.score} label={item.name} height={8} />
                    ))}
                  </div>
                </Section>
                <Section title="Language Proficiency">
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ padding: '12px 20px', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', fontFamily: 'Geist Mono, monospace' }}>{c.language.level}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CEFR Level</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <ScoreBar score={c.language.reading} label="Reading" height={6} />
                      <ScoreBar score={c.language.writing} label="Writing" height={6} />
                      <ScoreBar score={c.language.listening} label="Listening" height={6} />
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {/* Interview Tab */}
            {tab === 'interview' && (
              <TranscriptViewer
                transcript={c.transcript}
                flags={c.behavioral_flags}
                fillerCount={c.filler_count}
              />
            )}

            {/* Documents Tab */}
            {tab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={18} color="var(--accent)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Resume / CV</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>jordan_lee_resume.pdf · 284 KB</div>
                    </div>
                  </div>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Actions */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <ActionButton icon={Star} label="Shortlist" color="var(--success)" />
              <ActionButton icon={Calendar} label="Schedule Interview" color="var(--info)" />
              <ActionButton icon={ClipboardList} label="Send Assessment" color="var(--accent)" />
              <ActionButton icon={FileText} label="Create Offer" color="var(--warning)" />
              <ActionButton icon={XCircle} label="Reject" color="var(--danger)" outline />
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
              style={{ resize: 'none', fontSize: 12 }}
            />
            <button
              disabled={!note.trim()}
              style={{ marginTop: 8, width: '100%', padding: '7px', background: note.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: note.trim() ? 'pointer' : 'not-allowed' }}
            >
              Add Note
            </button>
          </div>

          {/* Activity Timeline */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Activity</p>
            <Timeline events={c.activity} />
          </div>
        </div>
      </div>
    </Layout>
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

function Section({ title, children }) {
  return (
    <div>
      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</h4>
      {children}
    </div>
  )
}

function ActionButton({ icon: Icon, label, color, outline = false }) {
  return (
    <button
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        background: outline ? 'transparent' : `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 7,
        color,
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'left',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}28` }}
      onMouseLeave={e => { e.currentTarget.style.background = outline ? 'transparent' : `${color}18` }}
    >
      <Icon size={14} /> {label}
    </button>
  )
}
