import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const PIPELINE_URL      = import.meta.env.VITE_PIPELINE_URL      || ''

export const supabase    = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const pipelineUrl = PIPELINE_URL

// ── Grade helpers ────────────────────────────────────────────────────────────
export const GRADE_COLORS = {
  A: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  B: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  C: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  D: { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' },
  F: { bg: '#fecaca', text: '#991b1b', border: '#fca5a5' },
}
export function gradeColor(grade) {
  return GRADE_COLORS[grade] || GRADE_COLORS.C
}

// ── Status helpers ───────────────────────────────────────────────────────────
export const STATUS_LABELS = {
  applied:              'Applied',
  screening:            'Screening',
  screen_rejected:      'Rejected',
  stage3_waiting:       'Waiting (S3)',
  stage3_processing:    'Stage 3',
  interview_pending:    'Interview Ready',
  interview_completed:  'Interviewed',
  scored:               'Scored',
  hired:                'Hired',
  rejected:             'Rejected',
}

export const STATUS_COLORS = {
  applied:              '#94a3b8',
  screening:            '#1a93ac',
  screen_rejected:      '#ef4444',
  stage3_waiting:       '#f59e0b',
  stage3_processing:    '#1a93ac',
  interview_pending:    '#8b5cf6',
  interview_completed:  '#10b981',
  scored:               '#059669',
  hired:                '#166534',
  rejected:             '#ef4444',
}

// ── Utility ──────────────────────────────────────────────────────────────────
export function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
