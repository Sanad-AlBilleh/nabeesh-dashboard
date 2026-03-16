import React, { useState } from 'react'
import { Plus, FileText, Eye, Send, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import Layout, { PageHeader } from '../components/Layout'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'

const MOCK_OFFERS = [
  { id: '1', candidate: 'Jordan Lee', candidate_id: '5', job: 'Senior Backend Engineer', salary: 165000, currency: 'USD', status: 'signed', sent_at: '2026-03-15', signed_at: '2026-03-16', expires_at: '2026-03-29', equity: '0.15%', start_date: '2026-04-14' },
  { id: '2', candidate: 'Yuki Tanaka', candidate_id: '15', job: 'Data Scientist', salary: 142000, currency: 'USD', status: 'sent', sent_at: '2026-03-14', signed_at: null, expires_at: '2026-03-28', equity: '0.10%', start_date: '2026-04-21' },
  { id: '3', candidate: 'Elena Vasquez', candidate_id: '9', job: 'Head of Marketing', salary: 155000, currency: 'USD', status: 'draft', sent_at: null, signed_at: null, expires_at: null, equity: '0.20%', start_date: null },
  { id: '4', candidate: 'Marcus Johnson', candidate_id: '1', job: 'Senior Backend Engineer', salary: 158000, currency: 'USD', status: 'sent', sent_at: '2026-03-12', signed_at: null, expires_at: '2026-03-26', equity: '0.12%', start_date: '2026-04-15' },
  { id: '5', candidate: 'Aisha Kofi', candidate_id: '13', job: 'Product Designer', salary: 128000, currency: 'USD', status: 'declined', sent_at: '2026-02-28', signed_at: null, expires_at: '2026-03-13', equity: '0.08%', start_date: null },
  { id: '6', candidate: 'Noah Thompson', candidate_id: '12', job: 'Sales Executive', salary: 95000, currency: 'USD', status: 'expired', sent_at: '2026-02-20', signed_at: null, expires_at: '2026-03-06', equity: null, start_date: null },
  { id: '7', candidate: 'Wei Zhang', candidate_id: '10', job: 'ML Engineer', salary: 172000, currency: 'USD', status: 'draft', sent_at: null, signed_at: null, expires_at: null, equity: '0.18%', start_date: null },
]

export default function Offers() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOffer, setViewOffer] = useState(null)

  const filtered = MOCK_OFFERS.filter(o => {
    const matchSearch = !search || o.candidate.toLowerCase().includes(search.toLowerCase()) || o.job.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusCounts = {}
  MOCK_OFFERS.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })
  const signed = MOCK_OFFERS.filter(o => o.status === 'signed').length
  const pending = MOCK_OFFERS.filter(o => ['sent', 'draft'].includes(o.status)).length

  return (
    <Layout>
      <PageHeader
        title="Offers"
        subtitle={`${signed} signed · ${pending} pending`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search candidate or job..." width={240} />
            <button
              onClick={() => setCreateOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600 }}
            >
              <Plus size={14} /> Create Offer
            </button>
          </div>
        }
      />

      <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 0, background: 'var(--bg-primary)' }}>
        {[['all', 'All'], ['draft', 'Draft'], ['sent', 'Sent'], ['signed', 'Signed'], ['declined', 'Declined'], ['expired', 'Expired']].map(([val, lbl]) => (
          <button key={val} onClick={() => setStatusFilter(val)} style={{ padding: '6px 14px', background: statusFilter === val ? 'var(--bg-tertiary)' : 'transparent', border: '1px solid', borderColor: statusFilter === val ? 'var(--border)' : 'transparent', borderRadius: 6, color: statusFilter === val ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: statusFilter === val ? 600 : 400, marginRight: 2 }}>
            {lbl} {statusCounts[val] && <span style={{ opacity: 0.6 }}>({statusCounts[val]})</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 28px' }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Offers', value: MOCK_OFFERS.length, color: 'var(--text-secondary)' },
            { label: 'Signed', value: signed, color: 'var(--success)' },
            { label: 'Pending', value: pending, color: 'var(--warning)' },
            { label: 'Declined', value: MOCK_OFFERS.filter(o => o.status === 'declined').length, color: 'var(--danger)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Salary</th>
                <th>Equity</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Signed / Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(offer => (
                <tr key={offer.id} style={{ cursor: 'pointer' }} onClick={() => setViewOffer(offer)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                        {offer.candidate.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{offer.candidate}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{offer.job}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarSign size={12} color="var(--success)" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>
                        {offer.salary.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{offer.currency}/yr</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{offer.equity || '—'}</td>
                  <td><Badge status={offer.status} dot /></td>
                  <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>{offer.sent_at ? format(new Date(offer.sent_at), 'MMM d') : '—'}</td>
                  <td style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace' }}>
                    {offer.signed_at ? <span style={{ color: 'var(--success)' }}>{format(new Date(offer.signed_at), 'MMM d')}</span> :
                      offer.expires_at ? format(new Date(offer.expires_at), 'MMM d') : '—'}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <TinyBtn onClick={() => setViewOffer(offer)} title="View"><Eye size={12} /></TinyBtn>
                      {offer.status === 'draft' && (
                        <TinyBtn onClick={() => {}} title="Send" color="var(--accent)"><Send size={12} /></TinyBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Offer Modal */}
      <Modal
        isOpen={!!viewOffer}
        onClose={() => setViewOffer(null)}
        title="Offer Details"
        width={500}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setViewOffer(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Close</button>
            {viewOffer?.status === 'draft' && (
              <button style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Send size={13} /> Send via DocuSign
              </button>
            )}
          </div>
        }
      >
        {viewOffer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{viewOffer.candidate}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{viewOffer.job}</div>
              <div style={{ marginTop: 10 }}><Badge status={viewOffer.status} dot size="md" /></div>
            </div>
            {[
              ['Salary', `$${viewOffer.salary.toLocaleString()} ${viewOffer.currency}/year`],
              ['Equity', viewOffer.equity || 'None'],
              ['Start Date', viewOffer.start_date ? format(new Date(viewOffer.start_date), 'MMMM d, yyyy') : 'TBD'],
              ['Offer Sent', viewOffer.sent_at ? format(new Date(viewOffer.sent_at), 'MMMM d, yyyy') : 'Not sent yet'],
              ['Expires', viewOffer.expires_at ? format(new Date(viewOffer.expires_at), 'MMMM d, yyyy') : '—'],
              ['Signed', viewOffer.signed_at ? format(new Date(viewOffer.signed_at), 'MMMM d, yyyy') : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Create Offer Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Offer"
        width={500}
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Cancel</button>
            <button style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}>Save Draft</button>
            <button style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Create & Send</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Candidate</label><input type="text" placeholder="Search candidate..." /></div>
          <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Job</label><input type="text" placeholder="Select job..." /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Annual Salary</label><input type="number" placeholder="120000" /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Currency</label><select><option>USD</option><option>EUR</option><option>GBP</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Equity %</label><input type="text" placeholder="0.10%" /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Start Date</label><input type="date" /></div>
          </div>
          <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Expiry Date</label><input type="date" /></div>
          <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Additional Notes</label><textarea rows={3} placeholder="Benefits, perks, special conditions..." style={{ resize: 'none' }} /></div>
        </div>
      </Modal>
    </Layout>
  )
}

function TinyBtn({ children, onClick, title, color = 'var(--text-muted)' }) {
  return (
    <button title={title} onClick={onClick} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
      {children}
    </button>
  )
}
