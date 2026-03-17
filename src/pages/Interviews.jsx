import React, { useState, useEffect } from 'react'
import { Calendar, List, Plus, Video, Phone, Clock, ExternalLink, User, AlertCircle } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, isAfter, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { SkeletonTable } from '../components/LoadingSpinner'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Interviews() {
  const { company } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('list')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [form, setForm] = useState({ candidate: '', job: '', date: '', time: '', duration: 60, type: 'ai_voice' })

  useEffect(() => {
    if (!company?.id) return
    fetchInterviews()
  }, [company?.id])

  async function fetchInterviews() {
    setLoading(true)
    setError(null)
    try {
      // First get job IDs for this company
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('job_id')
        .eq('company_id', company.id)

      if (jobsError) throw jobsError

      const jobIds = (jobs || []).map(j => j.job_id)

      if (jobIds.length === 0) {
        setInterviews([])
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('interviews')
        .select(`
          interview_id, status, started_at, completed_at, duration_seconds,
          interview_link, scheduled_at, created_at,
          candidates(full_name, email),
          jobs(title),
          interview_scores(stage6_score, final_composite)
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setInterviews(data || [])
    } catch (err) {
      console.error('Failed to fetch interviews:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getCandidateName(iv) {
    return iv.candidates?.full_name || ''
  }

  function getJobTitle(iv) {
    return iv.jobs?.title || ''
  }

  function getInitials(name) {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('')
  }

  function getDuration(iv) {
    if (iv.duration_seconds) return Math.round(iv.duration_seconds / 60)
    return null
  }

  function getScore(iv) {
    return iv.interview_scores?.[0]?.stage6_score || iv.interview_scores?.[0]?.final_composite || null
  }

  function getInterviewDate(iv) {
    return iv.scheduled_at || iv.started_at || iv.created_at
  }

  function getInterviewType(iv) {
    // Determine type from interview_link presence
    if (iv.interview_link && (iv.interview_link.includes('cal.com') || iv.interview_link.includes('zoom') || iv.interview_link.includes('meet'))) {
      return 'live'
    }
    return 'ai_voice'
  }

  const upcoming = interviews.filter(i => i.status === 'scheduled' || i.status === 'pending').sort((a, b) => {
    const dateA = getInterviewDate(a)
    const dateB = getInterviewDate(b)
    return new Date(dateA) - new Date(dateB)
  })

  const past = interviews.filter(i => i.status === 'completed').sort((a, b) => {
    const dateA = getInterviewDate(a)
    const dateB = getInterviewDate(b)
    return new Date(dateB) - new Date(dateA)
  })

  function getRelativeDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isToday(d)) return 'Today'
    if (isTomorrow(d)) return 'Tomorrow'
    return format(d, 'MMM d, yyyy')
  }

  // Calendar view: current month
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart) // 0=Sun

  return (
    <Layout>
      <PageHeader
        title="Interviews"
        subtitle={`${upcoming.length} upcoming · ${past.length} completed`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
              <ViewBtn active={view === 'list'} onClick={() => setView('list')}><List size={14} /> List</ViewBtn>
              <ViewBtn active={view === 'calendar'} onClick={() => setView('calendar')}><Calendar size={14} /> Calendar</ViewBtn>
            </div>
            <button
              onClick={() => setScheduleOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600 }}
            >
              <Plus size={14} /> Schedule Interview
            </button>
          </div>
        }
      />

      <div style={{ padding: '20px 28px' }}>
        {/* Error state */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 16 }}>
            <AlertCircle size={14} color="var(--danger)" />
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>Failed to load interviews: {error}</span>
            <button onClick={fetchInterviews} style={{ marginLeft: 'auto', padding: '4px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-secondary)', fontSize: 12 }}>Retry</button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner fullPage />
        ) : view === 'list' ? (
          <>
            {/* Upcoming */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Upcoming ({upcoming.length})
              </h3>
              {upcoming.length === 0 ? (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
                  <EmptyState icon={Calendar} title="No upcoming interviews" description="Schedule an interview to get started." />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {upcoming.map(interview => (
                    <InterviewCard key={interview.interview_id} interview={interview} getRelativeDate={getRelativeDate} getCandidateName={getCandidateName} getJobTitle={getJobTitle} getDuration={getDuration} getInterviewDate={getInterviewDate} getInterviewType={getInterviewType} />
                  ))}
                </div>
              )}
            </div>

            {/* Past */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Completed ({past.length})
              </h3>
              {past.length === 0 ? (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
                  <EmptyState icon={Calendar} title="No completed interviews" description="Completed interviews will appear here." />
                </div>
              ) : (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Duration</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {past.map(i => {
                        const candidateName = getCandidateName(i)
                        const jobTitle = getJobTitle(i)
                        const duration = getDuration(i)
                        const score = getScore(i)
                        const interviewDate = getInterviewDate(i)
                        const interviewType = getInterviewType(i)

                        return (
                          <tr key={i.interview_id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>
                                  {getInitials(candidateName)}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{candidateName}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 12 }}>{jobTitle}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                {interviewType === 'ai_voice' ? <Phone size={13} color="var(--accent)" /> : <Video size={13} color="var(--info)" />}
                                <span style={{ fontSize: 12 }}>{interviewType === 'ai_voice' ? 'AI Voice' : 'Live'}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>
                              {interviewDate ? format(new Date(interviewDate), 'MMM d, HH:mm') : '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} color="var(--text-muted)" />
                                <span style={{ fontSize: 12 }}>{duration ? `${duration}m` : '—'}</span>
                              </div>
                            </td>
                            <td>
                              {score !== null ? (
                                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: score >= 80 ? 'var(--success)' : 'var(--accent)' }}>{Math.round(score)}</span>
                              ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Calendar view */
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', minHeight: 500 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, textAlign: 'center' }}>
              {format(now, 'MMMM yyyy')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} style={{ minHeight: 80, padding: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 }} />
              ))}
              {daysInMonth.map((day, i) => {
                const dayNum = day.getDate()
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayInterviews = interviews.filter(iv => {
                  const ivDate = getInterviewDate(iv)
                  return ivDate && ivDate.startsWith(dateStr)
                })
                const isCurrentDay = isToday(day)

                return (
                  <div key={i} style={{
                    minHeight: 80,
                    padding: '6px',
                    background: isCurrentDay ? 'rgba(129,140,248,0.08)' : 'var(--bg-primary)',
                    border: `1px solid ${isCurrentDay ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 6,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: isCurrentDay ? 700 : 400, color: isCurrentDay ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{dayNum}</span>
                    {dayInterviews.map(iv => (
                      <div key={iv.interview_id} style={{ marginTop: 4, padding: '3px 5px', background: iv.status === 'completed' ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.15)', borderRadius: 3, fontSize: 10, color: iv.status === 'completed' ? 'var(--success)' : 'var(--accent)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getCandidateName(iv).split(' ')[0] || 'Interview'}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Interview"
        footer={
          <>
            <button onClick={() => setScheduleOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Cancel</button>
            <button style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Schedule</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Candidate</label>
            <input type="text" placeholder="Search candidate..." value={form.candidate} onChange={e => setForm(f => ({ ...f, candidate: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Job</label>
            <input type="text" placeholder="Select job..." value={form.job} onChange={e => setForm(f => ({ ...f, job: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Time</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Duration (minutes)</label>
              <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Interview Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="ai_voice">AI Voice</option>
                <option value="live">Live / Video</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

function InterviewCard({ interview, getRelativeDate, getCandidateName, getJobTitle, getDuration, getInterviewDate, getInterviewType }) {
  const dateStr = getInterviewDate(interview)
  const d = dateStr ? new Date(dateStr) : new Date()
  const interviewType = getInterviewType(interview)
  const TypeIcon = interviewType === 'ai_voice' ? Phone : Video
  const typeColor = interviewType === 'ai_voice' ? 'var(--accent)' : 'var(--info)'
  const candidateName = getCandidateName(interview)
  const jobTitle = getJobTitle(interview)
  const duration = getDuration(interview)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 18px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      transition: 'border-color 0.12s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--bg-tertiary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ textAlign: 'center', minWidth: 60 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>{format(d, 'd')}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{format(d, 'MMM')}</div>
        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>{format(d, 'HH:mm')}</div>
      </div>
      <div style={{ width: 1, height: 48, background: 'var(--border)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{candidateName}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{jobTitle}</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <TypeIcon size={12} color={typeColor} />
            <span style={{ fontSize: 12, color: typeColor }}>{interviewType === 'ai_voice' ? 'AI Voice Interview' : 'Live Interview'}</span>
          </div>
          {duration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{duration} min</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {dateStr && <Badge label={getRelativeDate(dateStr)} variant="warning" size="sm" />}
        {interview.interview_link && (
          <a href={interview.interview_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--info)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
            <ExternalLink size={12} /> Join
          </a>
        )}
      </div>
    </div>
  )
}

function ViewBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: active ? 'var(--bg-tertiary)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: active ? 600 : 400 }}>
      {children}
    </button>
  )
}
