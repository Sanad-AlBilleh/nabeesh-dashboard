import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
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

// ─── Companies ────────────────────────────────────────────────
export const getCompany = (id) => get(`/companies/${id}`)
export const createCompany = (data) => post('/companies', data)
export const updateCompany = (id, data) => patch(`/companies/${id}`, data)

// ─── Recruiter Profiles ───────────────────────────────────────
export const getProfile = (id) => get(`/recruiter-profiles/${id}`)
export const createProfile = (data) => post('/recruiter-profiles', data)
export const updateProfile = (id, data) => patch(`/recruiter-profiles/${id}`, data)

// ─── Jobs ─────────────────────────────────────────────────────
export const getJobs = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/jobs${q ? '?' + q : ''}`)
}
export const getJob = (id) => get(`/jobs/${id}`)
export const createJob = (data) => post('/jobs', data)
export const updateJob = (id, data) => patch(`/jobs/${id}`, data)
export const deleteJob = (id) => del(`/jobs/${id}`)
export const publishJob = (id) => post(`/jobs/${id}/publish`)
export const closeJob = (id) => post(`/jobs/${id}/close`)

// ─── Applications / Candidates ────────────────────────────────
export const getApplications = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/applications${q ? '?' + q : ''}`)
}
export const getApplication = (id) => get(`/applications/${id}`)
export const updateApplication = (id, data) => patch(`/applications/${id}`, data)
export const shortlistApplication = (id) => post(`/applications/${id}/shortlist`)
export const rejectApplication = (id, data) => post(`/applications/${id}/reject`, data)
export const advanceStage = (id, data) => post(`/applications/${id}/advance`, data)

export const getCandidates = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/candidates${q ? '?' + q : ''}`)
}
export const getCandidate = (id) => get(`/candidates/${id}`)

// ─── Assessments ──────────────────────────────────────────────
export const getAssessments = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/assessments${q ? '?' + q : ''}`)
}
export const getAssessment = (id) => get(`/assessments/${id}`)
export const sendAssessment = (data) => post('/assessments/send', data)

// ─── Interviews ───────────────────────────────────────────────
export const getInterviews = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/interviews${q ? '?' + q : ''}`)
}
export const getInterview = (id) => get(`/interviews/${id}`)
export const scheduleInterview = (data) => post('/interviews/schedule', data)
export const getTranscript = (id) => get(`/interviews/${id}/transcript`)

// ─── Offers ───────────────────────────────────────────────────
export const getOffers = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/offers${q ? '?' + q : ''}`)
}
export const getOffer = (id) => get(`/offers/${id}`)
export const createOffer = (data) => post('/offers', data)
export const sendOffer = (id) => post(`/offers/${id}/send`)
export const updateOffer = (id, data) => patch(`/offers/${id}`, data)

// ─── Analytics ────────────────────────────────────────────────
export const getDashboardStats = () => get('/analytics/dashboard')
export const getPipelineStats = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/analytics/pipeline${q ? '?' + q : ''}`)
}
export const getSourceStats = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/analytics/sources${q ? '?' + q : ''}`)
}
export const getTimeToHire = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/analytics/time-to-hire${q ? '?' + q : ''}`)
}

// ─── Notifications ────────────────────────────────────────────
export const getNotifications = () => get('/notifications')
export const markNotificationRead = (id) => post(`/notifications/${id}/read`)
export const markAllRead = () => post('/notifications/read-all')

// ─── Activity Feed ────────────────────────────────────────────
export const getActivityFeed = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return get(`/activity${q ? '?' + q : ''}`)
}

// ─── Distributions ────────────────────────────────────────────
export const getDistributions = (jobId) => get(`/jobs/${jobId}/distributions`)
export const distributeJob = (jobId, data) => post(`/jobs/${jobId}/distribute`, data)

// ─── Settings ─────────────────────────────────────────────────
export const getIntegrations = () => get('/integrations')
export const connectIntegration = (name, data) => post(`/integrations/${name}/connect`, data)
export const disconnectIntegration = (name) => post(`/integrations/${name}/disconnect`)
export const getEmailTemplates = () => get('/email-templates')
export const updateEmailTemplate = (id, data) => patch(`/email-templates/${id}`, data)

// ─── Notes ────────────────────────────────────────────────────
export const addNote = (applicationId, content) => post(`/applications/${applicationId}/notes`, { content })
export const getNotes = (applicationId) => get(`/applications/${applicationId}/notes`)

// ─── Facial Analysis ─────────────────────────────────────────
export const getFacialAnalysis = (interviewId) => get(`/facial-analysis/${interviewId}`)
export const triggerFacialAnalysis = (interviewId) => post(`/facial-analysis/${interviewId}/analyze`)
