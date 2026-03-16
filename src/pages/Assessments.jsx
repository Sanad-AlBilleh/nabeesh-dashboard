import React, { useState } from 'react'
import { ClipboardList, BarChart2, Brain, Languages } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import PersonalityRadar from '../components/RadarChart'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'

const MOCK_ASSESSMENTS = [
  { id: '1', candidate: 'Jordan Lee', candidate_id: '5', job: 'Senior Backend Engineer', type: 'big_five', status: 'completed', score: 91, sent_at: '2026-03-09', completed_at: '2026-03-12', results: { big_five: [{ factor: 'Openness', score: 82 }, { factor: 'Conscientiousness', score: 78 }, { factor: 'Extraversion', score: 55 }, { factor: 'Agreeableness', score: 71 }, { factor: 'Neuroticism', score: 32 }] } },
  { id: '2', candidate: 'Jordan Lee', candidate_id: '5', job: 'Senior Backend Engineer', type: 'cognitive', status: 'completed', score: 89, sent_at: '2026-03-09', completed_at: '2026-03-12', results: { cognitive: [{ name: 'Problem Solving', score: 92 }, { name: 'Numerical', score: 88 }, { name: 'Verbal', score: 79 }, { name: 'Memory', score: 85 }, { name: 'Attention', score: 94 }] } },
  { id: '3', candidate: 'Marcus Johnson', candidate_id: '1', job: 'Senior Backend Engineer', type: 'big_five', status: 'completed', score: 78, sent_at: '2026-03-10', completed_at: '2026-03-11', results: { big_five: [{ factor: 'Openness', score: 71 }, { factor: 'Conscientiousness', score: 84 }, { factor: 'Extraversion', score: 62 }, { factor: 'Agreeableness', score: 78 }, { factor: 'Neuroticism', score: 41 }] } },
  { id: '4', candidate: 'Sarah Chen', candidate_id: '2', job: 'Product Designer', type: 'language', status: 'completed', score: 92, sent_at: '2026-03-08', completed_at: '2026-03-09', results: { language: { level: 'C1', score: 92, reading: 94, writing: 91, listening: 89 } } },
  { id: '5', candidate: 'Elena Vasquez', candidate_id: '9', job: 'Head of Marketing', type: 'cognitive', status: 'completed', score: 83, sent_at: '2026-03-11', completed_at: '2026-03-13', results: { cognitive: [{ name: 'Problem Solving', score: 86 }, { name: 'Numerical', score: 79 }, { name: 'Verbal', score: 92 }, { name: 'Memory', score: 81 }, { name: 'Attention', score: 77 }] } },
  { id: '6', candidate: 'Ahmed Al-Rashid', candidate_id: '3', job: 'Senior Backend Engineer', type: 'big_five', status: 'pending', score: null, sent_at: '2026-03-13', completed_at: null, results: null },
  { id: '7', candidate: 'Liam O\'Brien', candidate_id: '7', job: 'DevOps Engineer', type: 'cognitive', status: 'pending', score: null, sent_at: '2026-03-12', completed_at: null, results: null },
  { id: '8', candidate: 'Wei Zhang', candidate_id: '10', job: 'ML Engineer', type: 'big_five', status: 'completed', score: 86, sent_at: '2026-03-10', completed_at: '2026-03-12', results: { big_five: [{ factor: 'Openness', score: 91 }, { factor: 'Conscientiousness', score: 88 }, { factor: 'Extraversion', score: 44 }, { factor: 'Agreeableness', score: 73 }, { factor: 'Neuroticism', score: 28 }] } },
]

const typeIcons = { big_five: Brain, cognitive: BarChart2, language: Languages }
const typeColors = { big_five: 'var(--accent)', cognitive: 'var(--info)', language: 'var(--success)' }

export default function Assessments() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAssessment, setSelectedAssessment] = useState(null)

  const filtered = MOCK_ASSESSMENTS.filter(a => {
    const matchSearch = !search || a.candidate.toLowerCase().includes(search.toLowerCase()) || a.job.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || a.type === typeFilter
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const completed = MOCK_ASSESSMENTS.filter(a => a.status === 'completed').length
  const pending = MOCK_ASSESSMENTS.filter(a => a.status === 'pending').length

  return (
    <Layout>
      <PageHeader
        title="Assessments"
        subtitle={`${completed} completed · ${pending} pending`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search candidate or job..." width={240} />
          </div>
        }
      />

      {/* Filter bar */}
      <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        <FilterGroup label="Type" options={[['all', 'All'], ['big_five', 'Big Five'], ['cognitive', 'Cognitive'], ['language', 'Language']]} value={typeFilter} onChange={setTypeFilter} />
        <FilterGroup label="Status" options={[['all', 'All'], ['completed', 'Completed'], ['pending', 'Pending']]} value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div style={{ padding: '16px 28px' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Type</th>
                <th>Status</th>
                <th>Score</th>
                <th>Sent</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const Icon = typeIcons[a.type] || ClipboardList
                const color = typeColors[a.type] || 'var(--accent)'
                return (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => a.status === 'completed' && setSelectedAssessment(a)}>
                    <td>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.candidate}</span>
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.job}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 5, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={12} color={color} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {a.type === 'big_five' ? 'Big Five' : a.type === 'cognitive' ? 'Cognitive' : 'Language'}
                        </span>
                      </div>
                    </td>
                    <td><Badge status={a.status} dot /></td>
                    <td>
                      {a.score !== null ? (
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Geist Mono, monospace', color: a.score >= 80 ? 'var(--success)' : a.score >= 60 ? 'var(--accent)' : 'var(--warning)' }}>{a.score}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>{a.sent_at}</td>
                    <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>{a.completed_at || '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {a.status === 'completed' ? (
                        <button onClick={() => setSelectedAssessment(a)} style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-secondary)', fontSize: 11 }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                          View
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting...</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assessment Detail Modal */}
      <Modal
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        title={selectedAssessment ? `${selectedAssessment.candidate} — ${selectedAssessment.type === 'big_five' ? 'Big Five' : selectedAssessment.type === 'cognitive' ? 'Cognitive' : 'Language'} Results` : ''}
        width={600}
      >
        {selectedAssessment && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Candidate</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAssessment.candidate}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Job</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAssessment.job}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: selectedAssessment.score >= 80 ? 'var(--success)' : 'var(--accent)', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>{selectedAssessment.score}</p>
              </div>
            </div>

            {selectedAssessment.type === 'big_five' && selectedAssessment.results?.big_five && (
              <PersonalityRadar data={selectedAssessment.results.big_five} height={260} />
            )}

            {selectedAssessment.type === 'cognitive' && selectedAssessment.results?.cognitive && (
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={selectedAssessment.results.cognitive} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                    <Bar dataKey="score" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {selectedAssessment.type === 'language' && selectedAssessment.results?.language && (
              <div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--success)', fontFamily: 'Geist Mono, monospace' }}>
                      {selectedAssessment.results.language.level}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CEFR Level</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries({ reading: selectedAssessment.results.language.reading, writing: selectedAssessment.results.language.writing, listening: selectedAssessment.results.language.listening }).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 70, textTransform: 'capitalize' }}>{k}</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3 }}>
                          <div style={{ width: `${v}%`, height: '100%', background: 'var(--success)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'var(--success)', minWidth: 28, textAlign: 'right' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  )
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
      {options.map(([val, lbl]) => (
        <button key={val} onClick={() => onChange(val)} style={{ padding: '5px 12px', background: value === val ? 'var(--bg-tertiary)' : 'transparent', color: value === val ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: value === val ? 600 : 400, borderRadius: 0 }}>
          {lbl}
        </button>
      ))}
    </div>
  )
}
