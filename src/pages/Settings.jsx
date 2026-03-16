import React, { useState } from 'react'
import { Building2, User, Plug, Mail, CheckCircle, XCircle, ExternalLink, Save, Upload } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import { useAuth } from '../lib/auth'

const INTEGRATIONS = [
  { key: 'dstribute', name: 'dstribute.io', description: 'Job board distributor — post to 2,000+ boards including Indeed, LinkedIn, ZipRecruiter', status: 'connected', color: '#818cf8' },
  { key: 'docusign', name: 'DocuSign', description: 'E-signature platform for offer letters and employment contracts', status: 'disconnected', color: '#60a5fa' },
  { key: 'cal_com', name: 'Cal.com', description: 'Scheduling platform for live interview booking with candidates', status: 'connected', color: '#34d399' },
  { key: 'resend', name: 'Resend', description: 'Transactional email service for assessment and offer emails', status: 'connected', color: '#fbbf24' },
  { key: 'slack', name: 'Slack', description: 'Get hiring notifications and alerts in your Slack workspace', status: 'disconnected', color: '#60a5fa' },
  { key: 'greenhouse', name: 'Greenhouse ATS', description: 'Sync candidates and applications with your existing ATS', status: 'disconnected', color: '#f87171' },
]

const EMAIL_TEMPLATES = [
  { id: '1', name: 'Assessment Invitation', subject: 'Complete your assessment for {{job_title}} at {{company_name}}', body: 'Hi {{candidate_name}},\n\nThank you for applying for the {{job_title}} position...' },
  { id: '2', name: 'Interview Confirmation', subject: 'Your interview for {{job_title}} is scheduled', body: 'Hi {{candidate_name}},\n\nYour interview has been scheduled for {{interview_date}} at {{interview_time}}...' },
  { id: '3', name: 'Offer Letter', subject: 'Congratulations! Offer from {{company_name}} for {{job_title}}', body: 'Dear {{candidate_name}},\n\nWe are delighted to extend an offer for the {{job_title}} position...' },
  { id: '4', name: 'Rejection Notice', subject: 'Update on your application for {{job_title}}', body: 'Hi {{candidate_name}},\n\nThank you for your time and interest in the {{job_title}} position...' },
  { id: '5', name: 'Shortlist Notification', subject: 'Great news! You\'ve been shortlisted for {{job_title}}', body: 'Hi {{candidate_name}},\n\nWe\'re pleased to inform you that you have been shortlisted...' },
]

export default function Settings() {
  const { user, profile, company } = useAuth()
  const [tab, setTab] = useState('company')
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [saved, setSaved] = useState(false)

  const [companyForm, setCompanyForm] = useState({
    name: company?.name || 'Acme Corp',
    website: company?.website || 'https://acme.com',
    industry: company?.industry || 'Technology',
    description: company?.description || '',
  })

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    timezone: profile?.timezone || 'America/Los_Angeles',
  })

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Layout>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, company, and integrations"
        actions={
          saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6 }}>
              <CheckCircle size={13} color="var(--success)" />
              <span style={{ fontSize: 12, color: 'var(--success)' }}>Saved</span>
            </div>
          )
        }
      />

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Side tabs */}
        <div style={{ width: 200, borderRight: '1px solid var(--border)', padding: '12px 8px', flexShrink: 0 }}>
          {[
            { key: 'company', label: 'Company', icon: Building2 },
            { key: 'profile', label: 'Profile', icon: User },
            { key: 'integrations', label: 'Integrations', icon: Plug },
            { key: 'templates', label: 'Email Templates', icon: Mail },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                background: tab === t.key ? 'var(--bg-tertiary)' : 'transparent',
                borderRadius: 7,
                color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: tab === t.key ? 600 : 400,
                textAlign: 'left',
                marginBottom: 2,
                transition: 'all 0.12s',
              }}
            >
              <t.icon size={15} color={tab === t.key ? 'var(--accent)' : 'var(--text-muted)'} />
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* Company tab */}
          {tab === 'company' && (
            <div style={{ maxWidth: 600 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Company Settings</h3>

              {/* Logo */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Company Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', fontSize: 22, fontWeight: 800, color: 'var(--text-muted)' }}>
                    {companyForm.name[0]}
                  </div>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                    <Upload size={13} /> Upload Logo
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Company Name" value={companyForm.name} onChange={v => setCompanyForm(f => ({ ...f, name: v }))} />
                <Field label="Website" value={companyForm.website} onChange={v => setCompanyForm(f => ({ ...f, website: v }))} />
                <div>
                  <label style={labelStyle}>Industry</label>
                  <select value={companyForm.industry} onChange={e => setCompanyForm(f => ({ ...f, industry: e.target.value }))}>
                    <option>Technology</option>
                    <option>Finance</option>
                    <option>Healthcare</option>
                    <option>E-commerce</option>
                    <option>Media</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea rows={3} value={companyForm.description} onChange={e => setCompanyForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of your company..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              <button onClick={handleSave} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
                <Save size={14} /> Save Changes
              </button>
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 600 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Profile Settings</h3>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
                  {profileForm.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{profileForm.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profileForm.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Full Name" value={profileForm.full_name} onChange={v => setProfileForm(f => ({ ...f, full_name: v }))} />
                <Field label="Email Address" value={profileForm.email} onChange={v => setProfileForm(f => ({ ...f, email: v }))} type="email" />
                <Field label="Phone Number" value={profileForm.phone} onChange={v => setProfileForm(f => ({ ...f, phone: v }))} type="tel" />
                <div>
                  <label style={labelStyle}>Timezone</label>
                  <select value={profileForm.timezone} onChange={e => setProfileForm(f => ({ ...f, timezone: e.target.value }))}>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Chicago">Central Time (US)</option>
                    <option value="America/Denver">Mountain Time (US)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Integrations tab */}
          {tab === 'integrations' && (
            <div style={{ maxWidth: 700 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Integrations</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Connect your recruiting stack to automate workflows.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {INTEGRATIONS.map(intg => (
                  <div key={intg.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 18px',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${intg.status === 'connected' ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
                    borderRadius: 10,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${intg.color}18`, border: `1px solid ${intg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: intg.color, flexShrink: 0 }}>
                      {intg.name[0]}{intg.name[1]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{intg.name}</span>
                        {intg.status === 'connected' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--success)' }}>
                            <CheckCircle size={11} /> Connected
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                            <XCircle size={11} /> Not connected
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{intg.description}</p>
                    </div>
                    <div>
                      {intg.status === 'connected' ? (
                        <button style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, color: 'var(--danger)', fontSize: 12 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          Disconnect
                        </button>
                      ) : (
                        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                          <ExternalLink size={12} /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Templates tab */}
          {tab === 'templates' && (
            <div style={{ display: 'grid', gridTemplateColumns: editingTemplate ? '260px 1fr' : '1fr', gap: 16, height: '100%' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Email Templates</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {EMAIL_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setEditingTemplate(t)}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        background: editingTemplate?.id === t.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        border: `1px solid ${editingTemplate?.id === t.id ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                    </button>
                  ))}
                </div>
              </div>

              {editingTemplate && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{editingTemplate.name}</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Available variables: <code style={{ color: 'var(--accent)', background: 'rgba(129,140,248,0.1)', padding: '1px 5px', borderRadius: 3 }}>{'{{candidate_name}}'}</code> <code style={{ color: 'var(--accent)', background: 'rgba(129,140,248,0.1)', padding: '1px 5px', borderRadius: 3 }}>{'{{job_title}}'}</code> <code style={{ color: 'var(--accent)', background: 'rgba(129,140,248,0.1)', padding: '1px 5px', borderRadius: 3 }}>{'{{company_name}}'}</code>
                  </p>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Subject Line</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={e => setEditingTemplate(t => ({ ...t, subject: e.target.value }))}
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Email Body</label>
                    <textarea
                      rows={10}
                      value={editingTemplate.body}
                      onChange={e => setEditingTemplate(t => ({ ...t, body: e.target.value }))}
                      style={{ resize: 'vertical', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}
                    />
                  </div>
                  <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
                    <Save size={14} /> Save Template
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
