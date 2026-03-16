import React, { useState } from 'react'
import { Calendar, List, Plus, Video, Phone, Clock, ExternalLink, User } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, isAfter } from 'date-fns'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'

const now = new Date('2026-03-16T10:00:00')

const MOCK_INTERVIEWS = [
  { id: '1', candidate: 'Jordan Lee', candidate_id: '5', job: 'Senior Backend Engineer', type: 'ai_voice', status: 'completed', scheduled_at: '2026-03-14T15:00:00', duration: 45, score: 94, transcript_available: true, meeting_link: null },
  { id: '2', candidate: 'Sarah Chen', candidate_id: '2', job: 'Product Designer', type: 'ai_voice', status: 'completed', scheduled_at: '2026-03-13T11:00:00', duration: 40, score: 79, transcript_available: true, meeting_link: null },
  { id: '3', candidate: 'Elena Vasquez', candidate_id: '9', job: 'Head of Marketing', type: 'live', status: 'scheduled', scheduled_at: '2026-03-17T14:00:00', duration: 60, score: null, transcript_available: false, meeting_link: 'https://cal.com/meeting/abc123' },
  { id: '4', candidate: 'Marcus Johnson', candidate_id: '1', job: 'Senior Backend Engineer', type: 'live', status: 'scheduled', scheduled_at: '2026-03-18T10:00:00', duration: 60, score: null, transcript_available: false, meeting_link: 'https://cal.com/meeting/def456' },
  { id: '5', candidate: 'Wei Zhang', candidate_id: '10', job: 'ML Engineer', type: 'ai_voice', status: 'completed', scheduled_at: '2026-03-15T16:00:00', duration: 42, score: 88, transcript_available: true, meeting_link: null },
  { id: '6', candidate: 'Priya Patel', candidate_id: '4', job: 'Data Scientist', type: 'ai_voice', status: 'scheduled', scheduled_at: '2026-03-19T09:00:00', duration: 40, score: null, transcript_available: false, meeting_link: null },
  { id: '7', candidate: 'Aisha Kofi', candidate_id: '13', job: 'Product Designer', type: 'live', status: 'completed', scheduled_at: '2026-03-12T14:00:00', duration: 55, score: 82, transcript_available: true, meeting_link: null },
]

export default function Interviews() {
  const [view, setView] = useState('list')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [form, setForm] = useState({ candidate: '', job: '', date: '', time: '', duration: 60, type: 'ai_voice' })

  const upcoming = MOCK_INTERVIEWS.filter(i => i.status === 'scheduled').sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  const past = MOCK_INTERVIEWS.filter(i => i.status === 'completed').sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))

  function getRelativeDate(dateStr) {
    const d = new Date(dateStr)
    if (isToday(d)) return 'Today'
    if (isTomorrow(d)) return 'Tomorrow'
    return format(d, 'MMM d, yyyy')
  }

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
        {view === 'list' && (
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
                    <InterviewCard key={interview.id} interview={interview} getRelativeDate={getRelativeDate} />
                  ))}
                </div>
              )}
            </div>

            {/* Past */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Completed ({past.length})
              </h3>
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
                      <th>Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map(i => (
                      <tr key={i.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>
                              {i.candidate.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{i.candidate}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{i.job}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {i.type === 'ai_voice' ? <Phone size={13} color="var(--accent)" /> : <Video size={13} color="var(--info)" />}
                            <span style={{ fontSize: 12 }}>{i.type === 'ai_voice' ? 'AI Voice' : 'Live'}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>
                          {format(new Date(i.scheduled_at), 'MMM d, HH:mm')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} color="var(--text-muted)" />
                            <span style={{ fontSize: 12 }}>{i.duration}m</span>
                          </div>
                        </td>
                        <td>
                          {i.score !== null ? (
                            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: i.score >= 80 ? 'var(--success)' : 'var(--accent)' }}>{i.score}</span>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                        </td>
                        <td>
                          {i.transcript_available ? (
                            <button style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>
                              View
                            </button>
                          ) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>N/A</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {view === 'calendar' && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', minHeight: 500 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNum = i - 6 + 1 // March 2026 starts on Sunday
                const dateStr = dayNum > 0 && dayNum <= 31 ? `2026-03-${String(dayNum).padStart(2, '0')}` : null
                const dayInterviews = dateStr ? MOCK_INTERVIEWS.filter(iv => iv.scheduled_at.startsWith(dateStr)) : []
                const isCurrentDay = dayNum === 16

                return (
                  <div key={i} style={{
                    minHeight: 80,
                    padding: '6px',
                    background: isCurrentDay ? 'rgba(129,140,248,0.08)' : 'var(--bg-primary)',
                    border: `1px solid ${isCurrentDay ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 6,
                  }}>
                    {dayNum > 0 && dayNum <= 31 && (
                      <>
                        <span style={{ fontSize: 12, fontWeight: isCurrentDay ? 700 : 400, color: isCurrentDay ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{dayNum}</span>
                        {dayInterviews.map(iv => (
                          <div key={iv.id} style={{ marginTop: 4, padding: '3px 5px', background: iv.status === 'completed' ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.15)', borderRadius: 3, fontSize: 10, color: iv.status === 'completed' ? 'var(--success)' : 'var(--accent)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {iv.candidate.split(' ')[0]}
                          </div>
                        ))}
                      </>
                    )}
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

function InterviewCard({ interview, getRelativeDate }) {
  const d = new Date(interview.scheduled_at)
  const TypeIcon = interview.type === 'ai_voice' ? Phone : Video
  const typeColor = interview.type === 'ai_voice' ? 'var(--accent)' : 'var(--info)'

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
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{interview.candidate}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{interview.job}</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <TypeIcon size={12} color={typeColor} />
            <span style={{ fontSize: 12, color: typeColor }}>{interview.type === 'ai_voice' ? 'AI Voice Interview' : 'Live Interview'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{interview.duration} min</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Badge label={getRelativeDate(interview.scheduled_at)} variant="warning" size="sm" />
        {interview.meeting_link && (
          <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--info)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
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
