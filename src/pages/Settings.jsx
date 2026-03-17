import React, { useState, useEffect } from 'react'
import { Building2, User, Plug, Mail, CheckCircle, XCircle, ExternalLink, Save, Upload, AlertCircle, Loader2 } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Settings() {
  const { user, profile, company, loadProfile } = useAuth()
  const [tab, setTab] = useState('company')
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Integrations state
  const [integrations, setIntegrations] = useState([])
  const [integrationsLoading, setIntegrationsLoading] = useState(false)

  // Email templates state
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  const [companyForm, setCompanyForm] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
    company_type: '',
    company_size: '',
    company_location: '',
  })

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    timezone: 'America/Los_Angeles',
  })

  // Initialize forms from auth context
  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.company_name || '',
        website: company.website || '',
        industry: company.company_industry || '',
        description: company.company_tagline || company.description || '',
        company_type: company.company_type || '',
        company_size: company.company_size || '',
        company_location: company.company_location || '',
      })
    }
  }, [company])

  useEffect(() => {
    setProfileForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      timezone: profile?.timezone || 'America/Los_Angeles',
    })
  }, [profile, user])

  // Fetch integrations when tab is selected
  useEffect(() => {
    if (tab === 'integrations' && company?.id) {
      fetchIntegrations()
    }
  }, [tab, company?.id])

  // Fetch email templates when tab is selected
  useEffect(() => {
    if (tab === 'templates' && company?.id) {
      fetchTemplates()
    }
  }, [tab, company?.id])

  async function fetchIntegrations() {
    setIntegrationsLoading(true)
    try {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('company_id', company.id)
      if (error) throw error
      setIntegrations(data || [])
    } catch (err) {
      console.error('Failed to fetch integrations:', err)
    } finally {
      setIntegrationsLoading(false)
    }
  }

  async function fetchTemplates() {
    setTemplatesLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', company.id)
      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setTemplatesLoading(false)
    }
  }

  async function handleSaveCompany() {
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: companyForm.name,
          website: companyForm.website,
          company_industry: companyForm.industry,
          company_tagline: companyForm.description,
          company_type: companyForm.company_type,
          company_size: companyForm.company_size,
          company_location: companyForm.company_location,
        })
        .eq('company_id', company.id)
      if (error) throw error
      // Refresh profile/company data in auth context
      if (user?.id) await loadProfile(user.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save company settings:', err)
      setSaveError(err.message)
      setTimeout(() => setSaveError(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await supabase
        .from('recruiter_profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          timezone: profileForm.timezone,
        })
        .eq('id', user.id)
      if (error) throw error
      // Refresh profile in auth context
      if (user?.id) await loadProfile(user.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save profile:', err)
      setSaveError(err.message)
      setTimeout(() => setSaveError(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTemplate() {
    if (!editingTemplate) return
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          body: editingTemplate.body,
        })
        .eq('id', editingTemplate.id)
      if (error) throw error
      // Refresh templates list
      await fetchTemplates()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save template:', err)
      setSaveError(err.message)
      setTimeout(() => setSaveError(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  function getIntegrationColor(intg) {
    // Generate a consistent color from the integration name
    const colors = ['#818cf8', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
    const hash = (intg.provider || intg.platform || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <Layout>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, company, and integrations"
        actions={
          <>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6 }}>
                <CheckCircle size={13} color="var(--success)" />
                <span style={{ fontSize: 12, color: 'var(--success)' }}>Saved</span>
              </div>
            )}
            {saveError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6 }}>
                <AlertCircle size={13} color="var(--danger)" />
                <span style={{ fontSize: 12, color: 'var(--danger)' }}>{saveError}</span>
              </div>
            )}
          </>
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
                    {companyForm.name ? companyForm.name[0] : '?'}
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
                    <option value="">Select industry...</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Media">Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Field label="Company Type" value={companyForm.company_type} onChange={v => setCompanyForm(f => ({ ...f, company_type: v }))} />
                <Field label="Company Size" value={companyForm.company_size} onChange={v => setCompanyForm(f => ({ ...f, company_size: v }))} />
                <Field label="Location" value={companyForm.company_location} onChange={v => setCompanyForm(f => ({ ...f, company_location: v }))} />
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea rows={3} value={companyForm.description} onChange={e => setCompanyForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of your company..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              <button onClick={handleSaveCompany} disabled={saving} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: saving ? 'var(--bg-tertiary)' : 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
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
                  {profileForm.full_name ? profileForm.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{profileForm.full_name || 'User'}</div>
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
                <button onClick={handleSaveProfile} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: saving ? 'var(--bg-tertiary)' : 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Integrations tab */}
          {tab === 'integrations' && (
            <div style={{ maxWidth: 700 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Integrations</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Connect your recruiting stack to automate workflows.</p>

              {integrationsLoading ? (
                <LoadingSpinner fullPage />
              ) : integrations.length === 0 ? (
                <EmptyState icon={Plug} title="No integrations configured" description="Integration connections will appear here once configured." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {integrations.map(intg => {
                    const color = getIntegrationColor(intg)
                    const name = intg.provider || intg.platform || intg.name || ''
                    const isConnected = intg.status === 'connected' || intg.status === 'active'

                    return (
                      <div key={intg.id || intg.provider} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 18px',
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${isConnected ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
                        borderRadius: 10,
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: color, flexShrink: 0 }}>
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
                            {isConnected ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--success)' }}>
                                <CheckCircle size={11} /> Connected
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                                <XCircle size={11} /> Not connected
                              </span>
                            )}
                          </div>
                          {intg.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{intg.description}</p>}
                        </div>
                        <div>
                          {isConnected ? (
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
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Email Templates tab */}
          {tab === 'templates' && (
            <div style={{ display: 'grid', gridTemplateColumns: editingTemplate ? '260px 1fr' : '1fr', gap: 16, height: '100%' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Email Templates</h3>
                {templatesLoading ? (
                  <LoadingSpinner fullPage />
                ) : templates.length === 0 ? (
                  <EmptyState icon={Mail} title="No email templates" description="Email templates will appear here once created." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setEditingTemplate({ ...t })}
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
                )}
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
                      value={editingTemplate.subject || ''}
                      onChange={e => setEditingTemplate(t => ({ ...t, subject: e.target.value }))}
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Email Body</label>
                    <textarea
                      rows={10}
                      value={editingTemplate.body || ''}
                      onChange={e => setEditingTemplate(t => ({ ...t, body: e.target.value }))}
                      style={{ resize: 'vertical', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}
                    />
                  </div>
                  <button onClick={handleSaveTemplate} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: saving ? 'var(--bg-tertiary)' : 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                    <Save size={14} /> {saving ? 'Saving...' : 'Save Template'}
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
