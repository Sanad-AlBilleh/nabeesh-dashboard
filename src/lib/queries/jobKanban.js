import { supabase } from '../supabase'

export function deriveStage(status, pipeline_stage) {
  const s = (status || '').toLowerCase()
  const ps = (pipeline_stage || '').toLowerCase()
  if (s === 'hired') return 'hired'
  if (ps.includes('stage6') || ps.includes('video') || ps.includes('interview')) return 'video_interview'
  if (s === 'stage3_waiting' || ps === 'stage3_waiting') return 'semantic'
  if (ps.includes('stage3') || ps.includes('llm')) return 'llm_evaluation'
  if (ps.includes('stage2') || ps.includes('semantic')) return 'semantic'
  if (ps.includes('stage1') || ps.includes('hard') || ps.includes('filter')) return 'hard_filters'
  if (s === 'rejected' || s === 'withdrawn') return 'applied'
  return 'applied'
}

export const STAGE_ORDER = [
  'applied',
  'hard_filters',
  'semantic',
  'llm_evaluation',
  'video_interview',
  'hired',
]

export const STAGE_LABELS = {
  applied: 'Applied',
  hard_filters: 'Hard Filters',
  semantic: 'Semantic Similarity',
  llm_evaluation: 'LLM Evaluation',
  video_interview: 'Video Interview + Analysis',
  hired: 'Hired',
}

/**
 * Fetches all applications for a job with candidate and score data,
 * grouped into Kanban columns by pipeline stage.
 *
 * @param {string} jobId
 * @returns {Promise<{ columns: Record<string, Array>, raw: Array }>}
 */
export async function fetchJobPipelineCandidates(jobId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      application_id,
      status,
      pipeline_stage,
      applied_at,
      candidates (
        candidate_id,
        full_name,
        skills,
        seniority_level,
        email
      ),
      stage2_results (
        total_score,
        passed
      )
    `)
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })

  if (error) throw error

  const raw = data || []

  // Initialize empty columns in stage order
  const columns = {}
  for (const stage of STAGE_ORDER) {
    columns[stage] = []
  }

  // Group applications into columns
  for (const app of raw) {
    const stage = deriveStage(app.status, app.pipeline_stage)
    if (columns[stage]) {
      columns[stage].push(app)
    } else {
      columns['applied'].push(app)
    }
  }

  return { columns, raw }
}
