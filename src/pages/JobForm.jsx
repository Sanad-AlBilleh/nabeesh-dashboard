import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save, Send, ChevronLeft, AlertCircle, CheckCircle, ClipboardList,
  SlidersHorizontal, ShieldAlert, Plus, Trash2, Loader2, Info, BookOpen,
} from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import TagInput from '../components/TagInput'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, 'Job title is required'),
  job_description: z.string().optional(),
  job_city: z.string().optional(),
  job_country: z.string().optional(),
  seniority_level: z.string().optional(),
  employment_type: z.string().optional(),
  required_education_level: z.string().optional(),
  required_major: z.string().optional(),
  required_years_relevant_experience: z.coerce.number().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  salary_currency: z.string().optional().default('USD'),
  salary_period: z.string().optional().default('monthly'),
  interview_questions_count: z.coerce.number().optional().default(8),
})

// ─── Constants ─────────────────────────────────────────────────────────────────

const WEIGHT_KEYS = [
  { key: 'skills_match', label: 'Skills Match', color: '#6366f1' },
  { key: 'experience_relevance', label: 'Experience Relevance', color: '#60a5fa' },
  { key: 'education_relevance', label: 'Education Relevance', color: '#34d399' },
  { key: 'seniority_fit', label: 'Seniority Fit', color: '#fbbf24' },
  { key: 'project_portfolio', label: 'Project / Portfolio Quality', color: '#f87171' },
]

const DEFAULT_WEIGHTS = {
  skills_match: 30,
  experience_relevance: 25,
  education_relevance: 20,
  seniority_fit: 15,
  project_portfolio: 10,
}

const KNOCKOUT_FIELDS = [
  { value: 'years_experience', label: 'Years of Experience', inputType: 'number' },
  { value: 'education', label: 'Education Level', inputType: 'select' },
  { value: 'skills', label: 'Skills', inputType: 'tags' },
  { value: 'location', label: 'Location', inputType: 'text' },
  { value: 'seniority_level', label: 'Seniority Level', inputType: 'select' },
]

const KNOCKOUT_OPERATORS = {
  years_experience: [
    { value: 'gte', label: 'At least (>=)' },
    { value: 'eq', label: 'Exactly (=)' },
    { value: 'lte', label: 'At most (<=)' },
  ],
  education: [
    { value: 'gte', label: 'Minimum' },
    { value: 'eq', label: 'Exactly' },
  ],
  skills: [
    { value: 'contains', label: 'Must include' },
    { value: 'any', label: 'At least one of' },
  ],
  location: [
    { value: 'contains', label: 'Contains' },
    { value: 'eq', label: 'Exactly' },
  ],
  seniority_level: [
    { value: 'eq', label: 'Exactly' },
    { value: 'gte', label: 'Minimum' },
  ],
}

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' },
]

const SENIORITY_OPTIONS = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Principal' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'vp', label: 'VP / C-Level' },
]

// ─── Shared styles ─────────────────────────────────────────────────────────────

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

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 13,
  boxSizing: 'border-box',
}

const tagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '3px 9px',
  background: 'rgba(99,102,241,0.12)',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: 20,
  fontSize: 12,
  color: 'var(--text-primary)',
}

const removeTagBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 0,
  fontSize: 14,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
}

// ─── Scoring Weights Section ───────────────────────────────────────────────────

function ScoringWeights({ weights, onChange }) {
  const total = Object.values(weights).reduce((s, v) => s + v, 0)
  const isValid = total === 100

  function handleSlider(key, raw) {
    const val = Math.max(0, Math.min(100, Number(raw)))
    onChange({ ...weights, [key]: val })
  }

  return (
    <div style={{ ...sectionStyle, marginBottom: 16 }}>
      <div style={sectionTitleStyle}>
        <SlidersHorizontal size={15} color="var(--accent)" />
        <span>Scoring Weights</span>
        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
          Set how much each criterion matters for candidate evaluation
        </span>
      </div>

      {/* Visual distribution bar */}
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 20, gap: 1 }}>
        {WEIGHT_KEYS.map(({ key, color }) => (
          <div
            key={key}
            style={{ width: `${weights[key]}%`, background: color, transition: 'width 0.2s', minWidth: weights[key] > 0 ? 2 : 0 }}
            title={`${key}: ${weights[key]}%`}
          />
        ))}
        {/* Fill remainder if under 100 */}
        {total < 100 && <div style={{ flex: 1, background: 'var(--bg-tertiary)' }} />}
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {WEIGHT_KEYS.map(({ key, label, color }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={e => handleSlider(key, e.target.value)}
                  style={{ width: 52, padding: '3px 6px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-primary)', fontSize: 12, textAlign: 'center' }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={weights[key]}
              onChange={e => handleSlider(key, e.target.value)}
              style={{ width: '100%', accentColor: color, height: 4, cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>

      {/* Total indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 14px', background: isValid ? 'rgba(34,197,94,0.07)' : 'rgba(245,158,11,0.07)', border: `1px solid ${isValid ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 8 }}>
        {isValid
          ? <CheckCircle size={14} color="var(--success)" />
          : <AlertCircle size={14} color="var(--warning)" />
        }
        <span style={{ fontSize: 12, color: isValid ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
          Total: {total}%
        </span>
        {!isValid && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            — Weights should sum to 100 ({total < 100 ? `${100 - total} remaining` : `${total - 100} over`})
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Knockout Rules Section ────────────────────────────────────────────────────

function makeKnockout() {
  return { _id: crypto.randomUUID(), field: 'years_experience', operator: 'gte', value: '', skillTags: [] }
}

function buildKnockoutLabel(ko) {
  const fieldDef = KNOCKOUT_FIELDS.find(f => f.value === ko.field)
  const opDef = (KNOCKOUT_OPERATORS[ko.field] || []).find(o => o.value === ko.operator)
  const fieldLabel = fieldDef?.label || ko.field
  const opLabel = opDef?.label || ko.operator

  let valueLabel = ko.value
  if (ko.field === 'education') {
    valueLabel = EDUCATION_OPTIONS.find(e => e.value === ko.value)?.label || ko.value
  } else if (ko.field === 'seniority_level') {
    valueLabel = SENIORITY_OPTIONS.find(s => s.value === ko.value)?.label || ko.value
  } else if (ko.field === 'skills') {
    valueLabel = ko.skillTags?.join(', ') || ko.value
  }
  return `${fieldLabel} ${opLabel} ${valueLabel}`.trim()
}

function KnockoutCriteria({ knockouts, onChange }) {
  function addRule() {
    onChange([...knockouts, makeKnockout()])
  }

  function removeRule(idx) {
    onChange(knockouts.filter((_, i) => i !== idx))
  }

  function updateRule(idx, patch) {
    onChange(knockouts.map((k, i) => {
      if (i !== idx) return k
      const updated = { ...k, ...patch }
      // Reset operator when field changes
      if (patch.field && patch.field !== k.field) {
        const ops = KNOCKOUT_OPERATORS[patch.field] || []
        updated.operator = ops[0]?.value || 'eq'
        updated.value = ''
        updated.skillTags = []
      }
      return updated
    }))
  }

  return (
    <div style={{
      ...sectionStyle,
      borderColor: 'rgba(239,68,68,0.35)',
      background: 'rgba(239,68,68,0.03)',
      marginBottom: 16,
    }}>
      <div style={{ ...sectionTitleStyle, borderBottomColor: 'rgba(239,68,68,0.2)' }}>
        <ShieldAlert size={15} color="#ef4444" />
        <div>
          <span style={{ color: '#ef4444' }}>Must-Have Requirements (Knockouts)</span>
          <p style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Candidates who don't meet these will be immediately filtered out
          </p>
        </div>
      </div>

      {knockouts.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(239,68,68,0.05)', border: '1px dashed rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 14 }}>
          <Info size={13} color="rgba(239,68,68,0.7)" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No knockout rules set — all candidates will proceed to evaluation.</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {knockouts.map((ko, idx) => {
          const fieldDef = KNOCKOUT_FIELDS.find(f => f.value === ko.field)
          const operators = KNOCKOUT_OPERATORS[ko.field] || []

          return (
            <div
              key={ko._id}
              style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}
            >
              {/* Red pill number */}
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>{idx + 1}</span>
              </div>

              {/* Field selector */}
              <div style={{ flex: '0 0 180px' }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Field</label>
                <select
                  value={ko.field}
                  onChange={e => updateRule(idx, { field: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                >
                  {KNOCKOUT_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Operator */}
              <div style={{ flex: '0 0 140px' }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Condition</label>
                <select
                  value={ko.operator}
                  onChange={e => updateRule(idx, { operator: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                >
                  {operators.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Value</label>
                {fieldDef?.inputType === 'number' && (
                  <input
                    type="number"
                    min={0}
                    value={ko.value}
                    onChange={e => updateRule(idx, { value: Number(e.target.value) })}
                    placeholder="e.g. 3"
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box' }}
                  />
                )}
                {fieldDef?.inputType === 'text' && (
                  <input
                    type="text"
                    value={ko.value}
                    onChange={e => updateRule(idx, { value: e.target.value })}
                    placeholder="e.g. United States"
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box' }}
                  />
                )}
                {fieldDef?.inputType === 'select' && ko.field === 'education' && (
                  <select
                    value={ko.value}
                    onChange={e => updateRule(idx, { value: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  >
                    <option value="">Select...</option>
                    {EDUCATION_OPTIONS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                )}
                {fieldDef?.inputType === 'select' && ko.field === 'seniority_level' && (
                  <select
                    value={ko.value}
                    onChange={e => updateRule(idx, { value: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  >
                    <option value="">Select...</option>
                    {SENIORITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                )}
                {fieldDef?.inputType === 'tags' && (
                  <TagInput
                    value={ko.skillTags || []}
                    onChange={tags => updateRule(idx, { skillTags: tags, value: tags })}
                    placeholder="Type skill and press Enter..."
                  />
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => removeRule(idx)}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: 'rgba(239,68,68,0.6)', cursor: 'pointer', flexShrink: 0, marginTop: 20 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)' }}
                title="Remove rule"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={addRule}
        style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, padding: '8px 14px', background: 'transparent', border: '1px dashed rgba(239,68,68,0.35)', borderRadius: 8, color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Plus size={14} /> Add Knockout Rule
      </button>
    </div>
  )
}

// ─── Assessment Picker ─────────────────────────────────────────────────────────

function AssessmentPicker({ assessments, loadingAssessments, selectedId, onChange }) {
  if (loadingAssessments) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7 }}>
        <Loader2 size={13} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading assessments...</span>
      </div>
    )
  }

  if (assessments.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(99,102,241,0.05)', border: '1px dashed rgba(99,102,241,0.25)', borderRadius: 8 }}>
        <BookOpen size={15} color="var(--accent)" style={{ flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>No custom assessments found.</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Go to the <strong style={{ color: 'var(--accent)' }}>Assessments</strong> page to create one first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <select
      value={selectedId || ''}
      onChange={e => onChange(e.target.value || null)}
      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7, color: selectedId ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13 }}
    >
      <option value="">No assessment</option>
      {assessments.map(a => {
        const qCount = a.custom_assessment_questions?.[0]?.count ?? a._qCount ?? 0
        return (
          <option key={a.id} value={a.id}>
            {a.name} ({qCount} question{qCount !== 1 ? 's' : ''})
          </option>
        )
      })}
    </select>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function JobForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id && id !== 'new')
  const { user, company } = useAuth()
  const companyId = company?.id

  // Core form state
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [fetchingJob, setFetchingJob] = useState(isEdit)

  // Remote toggle
  const [isRemote, setIsRemote] = useState(false)

  // Tag inputs — required skills (controlled)
  const [requiredSkills, setRequiredSkills] = useState([])
  const [reqSkillInput, setReqSkillInput] = useState('')

  // Tag inputs — preferred skills (controlled)
  const [preferredSkills, setPreferredSkills] = useState([])
  const [prefSkillInput, setPrefSkillInput] = useState('')

  // Core responsibilities (controlled)
  const [coreResponsibilities, setCoreResponsibilities] = useState([])
  const [coreRespInput, setCoreRespInput] = useState('')

  // Assessment picker
  const [assessments, setAssessments] = useState([])
  const [loadingAssessments, setLoadingAssessments] = useState(true)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null)

  // Scoring weights
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS })

  // Knockout criteria
  const [knockouts, setKnockouts] = useState([])

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      salary_currency: 'USD',
      salary_period: 'monthly',
      employment_type: 'full-time',
      seniority_level: 'mid',
      interview_questions_count: 8,
    },
  })

  // ── Fetch company assessments ────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return
    setLoadingAssessments(true)
    supabase
      .from('custom_assessments')
      .select('id, name, custom_assessment_questions(count)')
      .eq('company_id', companyId)
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) setAssessments(data)
        setLoadingAssessments(false)
      })
  }, [companyId])

  // ── Fetch existing job when editing ─────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return
    setFetchingJob(true)
    supabase
      .from('jobs')
      .select('*')
      .eq('job_id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Failed to load job: ' + (error?.message || 'Not found'))
          setFetchingJob(false)
          return
        }
        reset({
          title: data.title || '',
          job_description: data.job_description || '',
          job_city: data.job_city || '',
          job_country: data.job_country || '',
          seniority_level: data.seniority_level || 'mid',
          employment_type: data.employment_type || 'full-time',
          required_education_level: data.required_education_level || '',
          required_major: data.required_major || '',
          required_years_relevant_experience: data.required_years_relevant_experience ?? undefined,
          salary_min: data.salary_min ?? undefined,
          salary_max: data.salary_max ?? undefined,
          salary_currency: data.salary_currency || 'USD',
          salary_period: data.salary_period || 'monthly',
          interview_questions_count: data.recruiter_interview_config?.total_questions ?? 8,
        })
        setIsRemote(data.is_remote || false)
        setRequiredSkills(data.required_skills || [])
        setPreferredSkills(data.preferred_skills || [])
        setCoreResponsibilities(data.core_responsibilities || [])
        if (data.assessment_id) setSelectedAssessmentId(String(data.assessment_id))
        if (data.scoring_weights) setWeights({ ...DEFAULT_WEIGHTS, ...data.scoring_weights })
        if (data.recruiter_intent?.weights) {
          setWeights({ ...DEFAULT_WEIGHTS, ...data.recruiter_intent.weights })
        }
        if (data.knockout_criteria?.length) {
          setKnockouts(data.knockout_criteria.map(ko => ({
            _id: crypto.randomUUID(),
            field: ko.field,
            operator: ko.operator,
            value: Array.isArray(ko.value) ? '' : ko.value,
            skillTags: Array.isArray(ko.value) ? ko.value : [],
          })))
        }
        setFetchingJob(false)
      })
  }, [isEdit, id, reset])

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function onSubmit(data, publish = false) {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const knockoutCriteria = knockouts
        .filter(ko => {
          if (ko.field === 'skills') return (ko.skillTags || []).length > 0
          return ko.value !== '' && ko.value !== undefined && ko.value !== null
        })
        .map(ko => ({
          field: ko.field,
          operator: ko.operator,
          value: ko.field === 'skills' ? ko.skillTags : ko.value,
          label: buildKnockoutLabel(ko),
        }))

      const recruiterIntent = {
        experience_tolerance_years: 1,
        min_required_skills_match: 1,
        location_policy: isRemote ? 'off' : 'flexible',
        seniority_overqual: 'allow_deprioritize',
        education_overqual: 'ignore',
        major_policy: 'allow_deprioritize',
        stage2_top_k: 50,
        weights: {
          skills_match: weights.skills_match,
          experience_relevance: weights.experience_relevance,
          education_relevance: weights.education_relevance,
          project_portfolio: weights.project_portfolio,
          seniority_fit: weights.seniority_fit,
        },
      }

      const payload = {
        title: data.title,
        job_description: data.job_description || '',
        job_city: data.job_city || '',
        job_country: data.job_country || '',
        is_remote: isRemote,
        seniority_level: data.seniority_level,
        employment_type: data.employment_type,
        required_education_level: data.required_education_level || '',
        required_major: data.required_major || '',
        required_years_relevant_experience: data.required_years_relevant_experience || 0,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        core_responsibilities: coreResponsibilities,
        salary_min: data.salary_min || null,
        salary_max: data.salary_max || null,
        salary_currency: data.salary_currency || 'USD',
        salary_period: data.salary_period || 'monthly',
        recruiter_intent: recruiterIntent,
        recruiter_interview_config: {
          total_questions: data.interview_questions_count || 8,
          custom_questions: [],
        },
        status: publish ? 'open' : 'draft',
        assessment_id: selectedAssessmentId ? Number(selectedAssessmentId) : null,
        scoring_weights: weights,
        knockout_criteria: knockoutCriteria,
      }

      if (isEdit) {
        const { error: updateErr } = await supabase
          .from('jobs')
          .update(payload)
          .eq('job_id', id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('jobs')
          .insert({ ...payload, company_id: companyId })
        if (insertErr) throw insertErr
      }

      setSaved(true)
      setTimeout(() => navigate('/jobs'), 1200)
    } catch (err) {
      setError(err.message || 'Failed to save job.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (fetchingJob) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 10 }}>
          <Loader2 size={20} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading job...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <PageHeader
        title={isEdit ? 'Edit Job' : 'Create Job'}
        breadcrumb={`Jobs / ${isEdit ? 'Edit' : 'New'}`}
        actions={
          <button
            onClick={() => navigate('/jobs')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
          >
            <ChevronLeft size={14} /> Back
          </button>
        }
      />

      <div style={{ padding: '20px 28px', maxWidth: 900 }}>
        {error && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, marginBottom: 16 }}>
            <AlertCircle size={14} color="var(--danger)" />
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</span>
          </div>
        )}
        {saved && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, marginBottom: 16 }}>
            <CheckCircle size={14} color="var(--success)" />
            <span style={{ fontSize: 13, color: 'var(--success)' }}>Job saved successfully! Redirecting...</span>
          </div>
        )}

        {/* ── Section 1: Basic Info ───────────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>1. Basic Information</div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Job Title *</label>
            <input type="text" placeholder="e.g. Senior Backend Engineer" {...register('title')} />
            {errors.title && <p style={errorStyle}>{errors.title.message}</p>}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Job Description</label>
            <textarea
              rows={5}
              placeholder="Describe the role, responsibilities, and what success looks like..."
              style={{ resize: 'vertical' }}
              {...register('job_description')}
            />
            {errors.job_description && <p style={errorStyle}>{errors.job_description.message}</p>}
          </div>

          {/* Remote toggle */}
          <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Remote Position</label>
            <button
              type="button"
              onClick={() => setIsRemote(prev => !prev)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: isRemote ? 'var(--accent)' : 'var(--bg-tertiary, #374151)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
                padding: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 2,
                left: isRemote ? 22 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
            <span style={{ fontSize: 12, color: isRemote ? 'var(--accent)' : 'var(--text-muted)' }}>
              {isRemote ? 'Yes — remote' : 'No — office / hybrid'}
            </span>
          </div>

          <div style={gridTwo}>
            <div style={{ ...fieldStyle, opacity: isRemote ? 0.4 : 1, pointerEvents: isRemote ? 'none' : 'auto' }}>
              <label style={labelStyle}>City</label>
              <input type="text" placeholder="e.g. San Francisco" {...register('job_city')} disabled={isRemote} />
            </div>
            <div style={{ ...fieldStyle, opacity: isRemote ? 0.4 : 1, pointerEvents: isRemote ? 'none' : 'auto' }}>
              <label style={labelStyle}>Country</label>
              <input type="text" placeholder="e.g. United States" {...register('job_country')} disabled={isRemote} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Requirements ─────────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>2. Requirements</div>
          <div style={gridTwo}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Seniority Level</label>
              <select {...register('seniority_level')}>
                <option value="">Select level</option>
                {SENIORITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.seniority_level && <p style={errorStyle}>{errors.seniority_level.message}</p>}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Required Education Level</label>
              <select {...register('required_education_level')}>
                <option value="">Any</option>
                <option value="high_school">High School</option>
                <option value="associate">Associate Degree</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD</option>
              </select>
            </div>
          </div>
          <div style={gridTwo}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Required Major / Field of Study</label>
              <input type="text" placeholder="e.g. Computer Science, Engineering" {...register('required_major')} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Years of Relevant Experience Required</label>
              <input type="number" min={0} max={30} placeholder="0" {...register('required_years_relevant_experience')} />
            </div>
          </div>

          {/* Required Skills — controlled inline */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Required Skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {requiredSkills.map((s, i) => (
                <span key={i} style={tagStyle}>
                  {s}
                  <button
                    type="button"
                    onClick={() => setRequiredSkills(prev => prev.filter((_, j) => j !== i))}
                    style={removeTagBtn}
                  >×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={reqSkillInput}
              onChange={e => setReqSkillInput(e.target.value)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ',') && reqSkillInput.trim()) {
                  e.preventDefault()
                  setRequiredSkills(prev => [...prev, reqSkillInput.trim()])
                  setReqSkillInput('')
                }
              }}
              placeholder="Type skill and press Enter"
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Press Enter or comma to add a skill</p>
          </div>

          {/* Preferred Skills — controlled inline */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Preferred Skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {preferredSkills.map((s, i) => (
                <span key={i} style={tagStyle}>
                  {s}
                  <button
                    type="button"
                    onClick={() => setPreferredSkills(prev => prev.filter((_, j) => j !== i))}
                    style={removeTagBtn}
                  >×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={prefSkillInput}
              onChange={e => setPrefSkillInput(e.target.value)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ',') && prefSkillInput.trim()) {
                  e.preventDefault()
                  setPreferredSkills(prev => [...prev, prefSkillInput.trim()])
                  setPrefSkillInput('')
                }
              }}
              placeholder="Type skill and press Enter"
              style={inputStyle}
            />
          </div>

          {/* Core Responsibilities */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Core Responsibilities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {coreResponsibilities.map((r, i) => (
                <span key={i} style={{ ...tagStyle, background: 'rgba(52,211,153,0.10)', borderColor: 'rgba(52,211,153,0.3)' }}>
                  {r}
                  <button
                    type="button"
                    onClick={() => setCoreResponsibilities(prev => prev.filter((_, j) => j !== i))}
                    style={removeTagBtn}
                  >×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={coreRespInput}
              onChange={e => setCoreRespInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && coreRespInput.trim()) {
                  e.preventDefault()
                  setCoreResponsibilities(prev => [...prev, coreRespInput.trim()])
                  setCoreRespInput('')
                }
              }}
              placeholder="Type responsibility and press Enter"
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Press Enter to add a responsibility</p>
          </div>
        </div>

        {/* ── Section 3: Compensation ─────────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>3. Compensation &amp; Type</div>
          <div style={gridTwo}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Employment Type</label>
              <select {...register('employment_type')}>
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Salary Period</label>
              <select {...register('salary_period')}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Salary Min</label>
              <input type="number" placeholder="80000" {...register('salary_min')} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Salary Max</label>
              <input type="number" placeholder="120000" {...register('salary_max')} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Currency</label>
              <select {...register('salary_currency')}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 4: AI Config ────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>4. AI Configuration</div>
          <div style={gridTwo}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Interview Questions Count</label>
              <input type="number" min={3} max={20} {...register('interview_questions_count')} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Scoring weights below control how candidates are ranked. The location policy is automatically set based on the Remote toggle above.
          </p>
        </div>

        {/* ── Section 5: Assessment Picker ─────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <ClipboardList size={15} color="var(--accent)" />
            5. Custom Assessment
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
              Attach a custom question set to evaluate candidates
            </span>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Assessment</label>
            <AssessmentPicker
              assessments={assessments}
              loadingAssessments={loadingAssessments}
              selectedId={selectedAssessmentId}
              onChange={setSelectedAssessmentId}
            />
            {selectedAssessmentId && (() => {
              const a = assessments.find(x => String(x.id) === String(selectedAssessmentId))
              const qCount = a?.custom_assessment_questions?.[0]?.count ?? 0
              return a ? (
                <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle size={11} /> Selected: {a.name} — {qCount} question{qCount !== 1 ? 's' : ''}
                </p>
              ) : null
            })()}
          </div>
        </div>

        {/* ── Section 6: Scoring Weights ─────────────────────────────────── */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            6. Scoring &amp; Filtering
          </div>
          <ScoringWeights weights={weights} onChange={setWeights} />
          <KnockoutCriteria knockouts={knockouts} onChange={setKnockouts} />
        </div>

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, paddingBottom: 32 }}>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(d => onSubmit(d, false))}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-primary)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={14} />}
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit(d => onSubmit(d, true))}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
            {loading ? 'Saving...' : 'Publish Job'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
