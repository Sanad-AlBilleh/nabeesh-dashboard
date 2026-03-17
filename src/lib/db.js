import { supabase } from './supabase'

// Derive UI stage from DB status/pipeline fields
export function deriveStage(status, pipeline_stage) {
  if (status === 'hired') return 'hired'
  if (['interview_completed', 'scored'].includes(status)) return 'video_interview'
  if (status === 'interview_pending' || pipeline_stage === 'stage5_interview') return 'video_interview'
  if (status === 'stage3_waiting' || pipeline_stage === 'stage3_waiting') return 'llm_evaluation'
  if (status === 'screen_rejected' && pipeline_stage === 'completed') return 'semantic_similarity'
  if (status === 'screen_rejected') return 'hard_filters'
  return 'applied'
}

export const STAGE_LABELS = {
  applied: 'Applied',
  hard_filters: 'Hard Filters',
  semantic_similarity: 'Semantic Similarity',
  llm_evaluation: 'LLM Evaluation',
  video_interview: 'Video Interview + Analysis',
  hired: 'Hired',
}

export const STAGE_ORDER = [
  'applied',
  'hard_filters',
  'semantic_similarity',
  'llm_evaluation',
  'video_interview',
  'hired',
]

// List all candidates/applications for a company
export async function fetchCandidates(companyId, { search = '', stage = '', limit = 100, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      application_id, status, pipeline_stage, applied_at,
      candidates!inner(candidate_id, full_name, email, city, country, seniority_level, years_relevant_experience, skills, source),
      jobs!inner(job_id, title, company_id),
      stage2_results(total_score, passed)
    `)
    .eq('jobs.company_id', companyId)
    .order('applied_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data || []
}

// Full application detail with all stage data
export async function fetchApplication(applicationId) {
  const { data: app, error } = await supabase
    .from('applications')
    .select(`
      application_id, status, pipeline_stage, applied_at, updated_at, job_id, candidate_id,
      candidates(*),
      jobs(job_id, title, company_id, seniority_level, required_skills)
    `)
    .eq('application_id', applicationId)
    .single()
  if (error) throw error

  const [s1Res, s2Res, s3Res, intRes] = await Promise.all([
    supabase.from('stage1_results').select('*').eq('application_id', applicationId).maybeSingle(),
    supabase.from('stage2_results').select('*').eq('application_id', applicationId).maybeSingle(),
    supabase.from('stage3_results').select('*').eq('application_id', applicationId).maybeSingle(),
    supabase.from('interviews').select('*').eq('application_id', applicationId).maybeSingle(),
  ])

  const interview = intRes.data
  let interviewScores = null
  let facialAnalysis = null

  if (interview) {
    const [scoresRes, facialRes] = await Promise.all([
      supabase.from('interview_scores').select('*').eq('interview_id', interview.interview_id).maybeSingle(),
      supabase.from('facial_analysis_results').select('*').eq('interview_id', interview.interview_id).maybeSingle(),
    ])
    interviewScores = scoresRes.data
    facialAnalysis = facialRes.data
  }

  return {
    application: app,
    candidate: app.candidates,
    job: app.jobs,
    stage1: s1Res.data,
    stage2: s2Res.data,
    stage3: s3Res.data,
    interview,
    interviewScores,
    facialAnalysis,
  }
}

// Dashboard stats for a company
export async function fetchDashboardStats(companyId) {
  const { data: apps, error } = await supabase
    .from('applications')
    .select(`
      application_id, status, pipeline_stage, applied_at,
      candidates(full_name, skills),
      jobs!inner(company_id)
    `)
    .eq('jobs.company_id', companyId)
    .order('applied_at', { ascending: false })

  if (error) throw error

  const total = apps.length
  const stageCounts = {
    applied: 0,
    hard_filters: 0,
    semantic_similarity: 0,
    llm_evaluation: 0,
    video_interview: 0,
    hired: 0,
  }
  const rejected = apps.filter(a => a.status === 'screen_rejected').length

  for (const a of apps) {
    const s = deriveStage(a.status, a.pipeline_stage)
    stageCounts[s] = (stageCounts[s] || 0) + 1
  }

  const recent = apps.slice(0, 8)

  return { total, stageCounts, rejected, recent, apps }
}
