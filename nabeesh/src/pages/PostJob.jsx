import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Input, Label, Textarea, NativeSelect, Separator,
} from '@/components/ui'
import { cn } from '@/lib/utils'

// ── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, setTags, placeholder }) {
  const [input, setInput] = useState('')
  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      if (!tags.includes(input.trim())) setTags([...tags, input.trim()])
      setInput('')
    }
    if (e.key === 'Backspace' && !input && tags.length) setTags(tags.slice(0, -1))
  }
  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 cursor-text"
      onClick={() => document.getElementById(`tag-${placeholder}`)?.focus()}
    >
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand px-2.5 py-0.5 text-xs font-medium">
          {t}
          <button type="button" onClick={e => { e.stopPropagation(); setTags(tags.filter(x => x !== t)) }} className="hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={`tag-${placeholder}`}
        className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-slate-400"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length ? '' : placeholder}
      />
    </div>
  )
}

// ── Dynamic List ──────────────────────────────────────────────────────────────
function DynamicList({ items, setItems, placeholder }) {
  const [input, setInput] = useState('')
  function add() {
    if (input.trim()) { setItems([...items, input.trim()]); setInput('') }
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">{item}</div>
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

// ── Field Row ─────────────────────────────────────────────────────────────────
function FieldRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PostJob() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '', job_description: '', seniority_level: 'junior',
    job_city: '', employment_type: 'Full-time', is_remote: false,
    required_education_level: 'bachelor', required_major: '',
    required_years_relevant_experience: 0, company_name: '',
  })
  const [requiredSkills,  setRequiredSkills]  = useState([])
  const [preferredSkills, setPreferredSkills] = useState([])
  const [responsibilities, setResponsibilities] = useState([])

  const [intent, setIntent] = useState({
    experience_tolerance_years: 1, min_required_skills_match: 1,
    location_policy: 'flexible', seniority_overqual: 'allow_deprioritize',
    education_overqual: 'ignore', major_policy: 'allow_deprioritize', stage2_top_k: 50,
  })
  const [weights, setWeights] = useState({
    skills_match: 20, experience_relevance: 50, education_relevance: 10,
    project_portfolio: 10, seniority_fit: 10,
  })
  const [interviewConfig, setInterviewConfig] = useState({ total_questions: 6 })

  const weightsSum = Object.values(weights).reduce((a, b) => a + b, 0)
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (weightsSum !== 100) { alert('Scoring weights must sum to 100'); return }
    if (!form.title.trim()) { alert('Job title is required'); return }
    setSaving(true)

    const recruiterIntent = {
      ...intent, weights,
      education_rank: { high_school:1, associate:2, bachelor:3, masters:4, mba:4, phd:5 },
      seniority_rank:  { entry:1, junior:2, mid:3, senior:4, executive:5 },
    }

    const { data, error } = await supabase.from('jobs').insert({
      ...form,
      required_years_relevant_experience: Number(form.required_years_relevant_experience),
      required_skills: requiredSkills,
      preferred_skills: preferredSkills,
      core_responsibilities: responsibilities,
      recruiter_intent: recruiterIntent,
      recruiter_interview_config: { total_questions: interviewConfig.total_questions, custom_questions: [] },
      company_id: 1,
      status: 'open',
    }).select().single()

    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    navigate(`/jobs/${data.job_id}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-base font-semibold text-slate-900">Post a New Job</h1>
          <p className="text-xs text-muted-foreground">Configure the AI screening pipeline</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">

          {/* Job Details */}
          <Section title="Job Details">
            <FieldRow>
              <Field label="Job Title *">
                <Input value={form.title} onChange={e => upd('title', e.target.value)} placeholder="e.g. Backend Engineer" required />
              </Field>
              <Field label="Company Name">
                <Input value={form.company_name} onChange={e => upd('company_name', e.target.value)} placeholder="e.g. Zain" />
              </Field>
            </FieldRow>
            <Field label="Job Description">
              <Textarea value={form.job_description} onChange={e => upd('job_description', e.target.value)}
                placeholder="Describe the role, team and expectations…" rows={4} />
            </Field>
            <FieldRow>
              <Field label="Seniority Level">
                <NativeSelect value={form.seniority_level} onChange={e => upd('seniority_level', e.target.value)}>
                  <option value="entry">Entry</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </NativeSelect>
              </Field>
              <Field label="City">
                <Input value={form.job_city} onChange={e => upd('job_city', e.target.value)} placeholder="e.g. Amman" />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Employment Type">
                <NativeSelect value={form.employment_type} onChange={e => upd('employment_type', e.target.value)}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </NativeSelect>
              </Field>
              <Field label="Remote">
                <label className="flex items-center gap-2 h-9 cursor-pointer">
                  <input type="checkbox" checked={form.is_remote} onChange={e => upd('is_remote', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
                  <span className="text-sm text-slate-700">This is a remote position</span>
                </label>
              </Field>
            </FieldRow>
          </Section>

          {/* Requirements */}
          <Section title="Requirements">
            <Field label="Required Skills">
              <TagInput tags={requiredSkills} setTags={setRequiredSkills} placeholder="Type a skill and press Enter" />
            </Field>
            <Field label="Preferred Skills">
              <TagInput tags={preferredSkills} setTags={setPreferredSkills} placeholder="Nice-to-have skills" />
            </Field>
            <FieldRow>
              <Field label="Min. Years of Experience">
                <Input type="number" min={0} value={form.required_years_relevant_experience}
                  onChange={e => upd('required_years_relevant_experience', e.target.value)} />
              </Field>
              <Field label="Required Education">
                <NativeSelect value={form.required_education_level} onChange={e => upd('required_education_level', e.target.value)}>
                  <option value="high_school">High School</option>
                  <option value="associate">Associate</option>
                  <option value="bachelor">Bachelor's</option>
                  <option value="masters">Master's</option>
                  <option value="phd">PhD</option>
                </NativeSelect>
              </Field>
            </FieldRow>
            <Field label="Required Major">
              <Input value={form.required_major} onChange={e => upd('required_major', e.target.value)} placeholder="e.g. Computer Science" />
            </Field>
          </Section>

          {/* Responsibilities */}
          <Section title="Core Responsibilities">
            <DynamicList items={responsibilities} setItems={setResponsibilities} placeholder="Add a responsibility and press Enter" />
          </Section>

          {/* Recruiter Intent */}
          <Section title="Recruiter Intent" description="Fine-tune how the AI screens and scores candidates">
            <FieldRow>
              <Field label="Experience Tolerance (years)" hint="How many years below the requirement is still OK">
                <Input type="number" min={0} value={intent.experience_tolerance_years}
                  onChange={e => setIntent(i => ({ ...i, experience_tolerance_years: Number(e.target.value) }))} />
              </Field>
              <Field label="Min Required Skills Match">
                <Input type="number" min={0} value={intent.min_required_skills_match}
                  onChange={e => setIntent(i => ({ ...i, min_required_skills_match: Number(e.target.value) }))} />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Location Policy">
                <NativeSelect value={intent.location_policy} onChange={e => setIntent(i => ({ ...i, location_policy: e.target.value }))}>
                  <option value="strict">Strict (same city only)</option>
                  <option value="flexible">Flexible (city or willing to relocate)</option>
                  <option value="off">Off (skip location filter)</option>
                </NativeSelect>
              </Field>
              <Field label="Seniority Overqualification">
                <NativeSelect value={intent.seniority_overqual} onChange={e => setIntent(i => ({ ...i, seniority_overqual: e.target.value }))}>
                  <option value="hard_block">Hard Block</option>
                  <option value="allow_deprioritize">Allow but Deprioritize</option>
                  <option value="ignore">Ignore</option>
                </NativeSelect>
              </Field>
            </FieldRow>

            <Separator />

            {/* Scoring Weights */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Scoring Weights</Label>
                <span className={cn('text-xs font-mono font-semibold', weightsSum === 100 ? 'text-green-600' : 'text-red-500')}>
                  {weightsSum}/100
                </span>
              </div>
              <div className="space-y-3">
                {Object.entries(weights).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-40 flex-shrink-0 capitalize">{key.replace(/_/g, ' ')}</span>
                    <input
                      type="range" min={0} max={100} value={val}
                      onChange={e => setWeights(w => ({ ...w, [key]: Number(e.target.value) }))}
                      className="flex-1 accent-brand"
                    />
                    <span className="text-xs font-mono text-slate-700 w-8 text-right flex-shrink-0">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <FieldRow>
              <Field label="Interview Questions" hint="4–10 questions per session">
                <Input type="number" min={4} max={10} value={interviewConfig.total_questions}
                  onChange={e => setInterviewConfig({ total_questions: Number(e.target.value) })} />
              </Field>
              <Field label="Stage 2 Top K" hint="Max candidates advancing from Stage 2">
                <Input type="number" min={1} value={intent.stage2_top_k}
                  onChange={e => setIntent(i => ({ ...i, stage2_top_k: Number(e.target.value) }))} />
              </Field>
            </FieldRow>
          </Section>

          {/* Submit */}
          <div className="flex items-center gap-3 pb-6">
            <Button type="submit" disabled={saving}>
              {saving ? 'Posting…' : '🚀 Post Job & Start Pipeline'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
