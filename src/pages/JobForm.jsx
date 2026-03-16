import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Send, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import TagInput from '../components/TagInput'

const schema = z.object({
  title: z.string().min(3, 'Job title is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(1, 'Location is required'),
  city: z.string().optional(),
  country: z.string().optional(),
  seniority_level: z.string().min(1, 'Select a seniority level'),
  required_education: z.string().optional(),
  required_years_experience: z.number().min(0).optional(),
  employment_type: z.string().min(1, 'Select employment type'),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  currency: z.string().optional(),
  location_type: z.string().min(1, 'Select location type'),
  recruiter_intent: z.string().optional(),
  interview_questions_count: z.number().min(1).max(20).optional(),
})

export default function JobForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id && id !== 'new')

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [requiredSkills, setRequiredSkills] = useState([])
  const [preferredSkills, setPreferredSkills] = useState([])
  const [platforms, setPlatforms] = useState({ indeed: false, linkedin: false, ziprecruiter: false, glassdoor: false })
  const [focusAreas, setFocusAreas] = useState([])

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'USD',
      location_type: 'hybrid',
      employment_type: 'full-time',
      seniority_level: 'mid',
      interview_questions_count: 8,
    },
  })

  async function onSubmit(data, publish = false) {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...data,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        distribution_platforms: Object.entries(platforms).filter(([, v]) => v).map(([k]) => k),
        focus_areas: focusAreas,
        status: publish ? 'published' : 'draft',
      }
      // Would call API here
      await new Promise(r => setTimeout(r, 800))
      setSaved(true)
      setTimeout(() => { navigate('/jobs') }, 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sectionStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '20px',
    marginBottom: 16,
  }
  const sectionTitleStyle = {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }
  const fieldStyle = { marginBottom: 14 }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }
  const errorStyle = { fontSize: 11, color: 'var(--danger)', marginTop: 3 }
  const gridTwo = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

  return (
    <Layout>
      <PageHeader
        title={isEdit ? 'Edit Job' : 'Create Job'}
        breadcrumb="Jobs / New"
        actions={
          <button
            onClick={() => navigate('/jobs')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13 }}
          >
            <ChevronLeft size={14} /> Back
          </button>
        }
      />

      <div style={{ padding: '20px 28px', maxWidth: 860 }}>
        {error && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, marginBottom: 16 }}>
            <AlertCircle size={14} color="var(--danger)" />
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</span>
          </div>
        )}
        {saved && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, marginBottom: 16 }}>
            <CheckCircle size={14} color="var(--success)" />
            <span style={{ fontSize: 13, color: 'var(--success)' }}>Job saved successfully!</span>
          </div>
        )}

        {/* Section 1: Basic Info */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>1. Basic Information</div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Job Title *</label>
            <input type="text" placeholder="e.g. Senior Backend Engineer" {...register('title')} />
            {errors.title && <p style={errorStyle}>{errors.title.message}</p>}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Job Description *</label>
            <textarea
              rows={5}
              placeholder="Describe the role, responsibilities, and what success looks like..."
              style={{ resize: 'vertical' }}
              {...register('description')}
            />
            {errors.description && <p style={errorStyle}>{errors.description.message}</p>}
          </div>
          <div style={gridTwo}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Location</label>
              <input type="text" placeholder="e.g. San Francisco, CA" {...register('location')} />
              {errors.location && <p style={errorStyle}>{errors.location.message}</p>}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Country</label>
              <input type="text" placeholder="e.g. United States" {...register('country')} />
            </div>
          </div>
        </div>

        {/* Section 2: Requirements */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>2. Requirements</div>
          <div style={gridTwo}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Seniority Level *</label>
              <select {...register('seniority_level')}>
                <option value="">Select level</option>
                <option value="intern">Intern</option>
                <option value="junior">Junior (0-2 yrs)</option>
                <option value="mid">Mid-Level (2-5 yrs)</option>
                <option value="senior">Senior (5+ yrs)</option>
                <option value="lead">Lead / Principal</option>
                <option value="manager">Manager</option>
                <option value="director">Director</option>
                <option value="vp">VP / C-Level</option>
              </select>
              {errors.seniority_level && <p style={errorStyle}>{errors.seniority_level.message}</p>}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Required Education</label>
              <select {...register('required_education')}>
                <option value="">Any</option>
                <option value="high_school">High School</option>
                <option value="associate">Associate Degree</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Years of Experience Required</label>
            <input type="number" min={0} max={30} placeholder="0" style={{ width: 100 }} {...register('required_years_experience', { valueAsNumber: true })} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Required Skills</label>
            <TagInput value={requiredSkills} onChange={setRequiredSkills} placeholder="Type skill and press Enter..." />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Press Enter or comma to add a skill</p>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Preferred Skills</label>
            <TagInput value={preferredSkills} onChange={setPreferredSkills} placeholder="Nice-to-have skills..." />
          </div>
        </div>

        {/* Section 3: Compensation */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>3. Compensation & Type</div>
          <div style={gridTwo}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Employment Type *</label>
              <select {...register('employment_type')}>
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Location Type *</label>
              <select {...register('location_type')}>
                <option value="onsite">On-Site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Salary Min</label>
              <input type="number" placeholder="80000" {...register('salary_min', { valueAsNumber: true })} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Salary Max</label>
              <input type="number" placeholder="120000" {...register('salary_max', { valueAsNumber: true })} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Currency</label>
              <select {...register('currency')}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: AI Config */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>4. AI Configuration</div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Recruiter Intent</label>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              Describe the ideal candidate profile and what traits/skills matter most. This guides the AI screener and interviewer.
            </p>
            <textarea
              rows={4}
              placeholder="We are looking for a senior backend engineer who excels at distributed systems, has experience with high-traffic APIs, and can mentor junior engineers..."
              style={{ resize: 'vertical' }}
              {...register('recruiter_intent')}
            />
          </div>
          <div style={gridTwo}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Interview Questions Count</label>
              <input type="number" min={3} max={20} {...register('interview_questions_count', { valueAsNumber: true })} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Focus Areas</label>
              <TagInput value={focusAreas} onChange={setFocusAreas} placeholder="e.g. Leadership, System Design..." />
            </div>
          </div>
        </div>

        {/* Section 5: Distribution */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>5. Distribution Platforms</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Select platforms to publish this job to upon publishing.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { key: 'indeed', label: 'Indeed', color: '#818cf8' },
              { key: 'linkedin', label: 'LinkedIn', color: '#60a5fa' },
              { key: 'ziprecruiter', label: 'ZipRecruiter', color: '#34d399' },
              { key: 'glassdoor', label: 'Glassdoor', color: '#fbbf24' },
            ].map(p => (
              <label
                key={p.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px',
                  background: platforms[p.key] ? `${p.color}12` : 'var(--bg-primary)',
                  border: `1px solid ${platforms[p.key] ? p.color + '50' : 'var(--border)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={platforms[p.key]}
                  onChange={e => setPlatforms(prev => ({ ...prev, [p.key]: e.target.checked }))}
                  style={{ display: 'none' }}
                />
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: p.color }}>
                  {p.label[0]}{p.label[1]}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: platforms[p.key] ? p.color : 'var(--text-secondary)' }}>
                  {p.label}
                </span>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${platforms[p.key] ? p.color : 'var(--border)'}`, background: platforms[p.key] ? p.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {platforms[p.key] && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(d => onSubmit(d, false))}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-primary)', fontSize: 13 }}
          >
            <Save size={14} /> Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit(d => onSubmit(d, true))}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600 }}
          >
            <Send size={14} /> {loading ? 'Publishing...' : 'Publish Job'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
