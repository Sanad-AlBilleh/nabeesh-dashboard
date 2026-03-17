import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function getAuthHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return {}
    return { Authorization: `Bearer ${session.access_token}` }
  } catch {
    return {}
  }
}

async function request(method, path, body = null) {
  const headers = await getAuthHeaders()
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, config)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

const get = (path) => request('GET', path)
const post = (path, body) => request('POST', path, body)
const put = (path, body) => request('PUT', path, body)
const patch = (path, body) => request('PATCH', path, body)
const del = (path) => request('DELETE', path)

// ─── Auth ─────────────────────────────────────────────────────
export const getMe = () => get('/api/auth/me')
export const updateMe = (data) => put('/api/auth/me', data)
export const apiSignup = (data) => post('/api/auth/signup', data)
export const apiLogin = (data) => post('/api/auth/login', data)

// ─── Jobs ─────────────────────────────────────────────────────
export const getJobs = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/jobs${q ? '?' + q : ''}`)
}
export const getJob = (id) => get(`/api/jobs/${id}`)
export const createJob = (data) => post('/api/jobs', data)
export const updateJob = (id, data) => put(`/api/jobs/${id}`, data)
export const deleteJob = (id) => del(`/api/jobs/${id}`)
export const publishJob = (id) => post(`/api/jobs/${id}/publish`)
export const closeJob = (id) => post(`/api/jobs/${id}/close`)
export const getJobApplications = (id, params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/jobs/${id}/applications${q ? '?' + q : ''}`)
}
export const getJobAnalytics = (id) => get(`/api/jobs/${id}/analytics`)

// ─── Candidates ──────────────────────────────────────────────
export const getCandidates = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/candidates${q ? '?' + q : ''}`)
}
export const getCandidate = (id) => get(`/api/candidates/${id}`)
export const candidateAction = (id, data) => post(`/api/candidates/${id}/actions`, data)
export const candidateBulkAction = (id, data) => post(`/api/candidates/${id}/bulk-action`, data)
export const getCandidateTimeline = (id) => get(`/api/candidates/${id}/timeline`)

// ─── Assessments ──────────────────────────────────────────────
export const getAssessments = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/assessments${q ? '?' + q : ''}`)
}
export const getAssessment = (id) => get(`/api/assessments/${id}`)
export const getAssessmentResults = (applicationId) => get(`/api/assessments/results/${applicationId}`)
export const sendAssessment = (data) => post('/api/assessments/send', data)

// ─── Interviews / Scheduling ─────────────────────────────────
export const getInterviews = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/schedule${q ? '?' + q : ''}`)
}
export const getInterview = (id) => get(`/api/schedule/${id}`)
export const scheduleInterview = (data) => post('/api/schedule', data)

// ─── Offers ───────────────────────────────────────────────────
export const getOffers = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/offers${q ? '?' + q : ''}`)
}
export const getOffer = (id) => get(`/api/offers/${id}`)
export const createOffer = (data) => post('/api/offers', data)
export const sendOffer = (id) => post(`/api/offers/${id}/send`)
export const updateOffer = (id, data) => put(`/api/offers/${id}`, data)
export const withdrawOffer = (id) => post(`/api/offers/${id}/withdraw`)

// ─── Analytics ────────────────────────────────────────────────
export const getDashboardStats = () => get('/api/analytics/overview')
export const getPipelineStats = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/analytics/pipeline${q ? '?' + q : ''}`)
}
export const getSourceStats = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/analytics/sources${q ? '?' + q : ''}`)
}
export const getTimeToHire = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/analytics/time-to-hire${q ? '?' + q : ''}`)
}
export const getScoreDistribution = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/api/analytics/score-distribution${q ? '?' + q : ''}`)
}

// ─── Notifications ────────────────────────────────────────────
export const getNotifications = () => get('/api/notifications')
export const markNotificationRead = (id) => put(`/api/notifications/${id}/read`)
export const markAllRead = () => post('/api/notifications/read-all')
export const getUnreadCount = () => get('/api/notifications/unread-count')

// ─── Integrations ─────────────────────────────────────────────
export const getIntegrations = () => get('/api/integrations')
export const connectIntegration = (data) => post('/api/integrations/connect', data)
export const disconnectIntegration = (id) => del(`/api/integrations/${id}`)
export const testIntegration = (id) => post(`/api/integrations/test/${id}`)

// ─── Career Page ──────────────────────────────────────────────
export const updateCareerPage = (data) => put('/api/career-page', data)

// ─── Pipeline Triggers ─────────────────────────────────────────
export const triggerStage3 = (jobId, topPercent = 1.0) =>
  post('/api/trigger-stage3', { job_id: Number(jobId), top_percent: topPercent })

// ─── Facial Analysis ─────────────────────────────────────────
export const getFacialAnalysis = (interviewId) => get(`/api/facial-analysis/${interviewId}`)
export const triggerFacialAnalysis = (interviewId) => post(`/api/facial-analysis/${interviewId}/analyze`)
export const getFacialAnalysisStatus = (interviewId) => get(`/api/facial-analysis/${interviewId}/status`)

// ─── Legacy aliases (for backward compatibility) ──────────────
export const getProfile = () => getMe()
export const getApplication = getCandidate
export const shortlistApplication = (id) => candidateAction(id, { action: 'shortlist' })
export const rejectApplication = (id, data) => candidateAction(id, { action: 'reject', ...data })
export const addNote = (candidateId, content) => candidateAction(candidateId, { action: 'note', content })
export const getNotes = (candidateId) => getCandidateTimeline(candidateId)
export const getTranscript = (interviewId) => get(`/api/schedule/${interviewId}`)
