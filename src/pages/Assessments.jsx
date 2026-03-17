import React, { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList, Plus, Trash2, Edit2, ChevronUp, ChevronDown,
  AlertCircle, Loader2, FileQuestion, X, Save, BookOpen,
} from 'lucide-react'
import Layout, { PageHeader } from '../components/Layout'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 72,
  fontFamily: 'inherit',
  lineHeight: 1.5,
}

// ─── Empty question factory ────────────────────────────────────────────────────

function makeQuestion() {
  return { _id: crypto.randomUUID(), question_text: '', model_answer: '' }
}

// ─── AssessmentCard ────────────────────────────────────────────────────────────

function AssessmentCard({ assessment, onEdit, onDelete }) {
  const qCount = assessment.custom_assessment_questions?.[0]?.count ?? 0

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClipboardList size={17} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{assessment.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Created {fmtDate(assessment.created_at)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(assessment)}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            title="Edit assessment"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(assessment)}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            title="Delete assessment"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Description */}
      {assessment.description && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {assessment.description}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
        <FileQuestion size={12} color="var(--text-muted)" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {qCount === 1 ? '1 question' : `${qCount} questions`}
        </span>
      </div>
    </div>
  )
}

// ─── AssessmentForm (create/edit modal body) ───────────────────────────────────

function AssessmentFormModal({ isOpen, onClose, existing, companyId, userId, onSaved }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState([makeQuestion()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Populate when editing
  useEffect(() => {
    if (!isOpen) return
    if (existing) {
      setName(existing.name || '')
      setDescription(existing.description || '')
      const qs = existing.custom_assessment_questions || []
      setQuestions(
        qs.length > 0
          ? qs.map(q => ({ _id: q.id, id: q.id, question_text: q.question_text, model_answer: q.model_answer }))
          : [makeQuestion()]
      )
    } else {
      setName('')
      setDescription('')
      setQuestions([makeQuestion()])
    }
    setError(null)
  }, [isOpen, existing])

  function addQuestion() {
    setQuestions(prev => [...prev, makeQuestion()])
  }

  function removeQuestion(idx) {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  function moveQuestion(idx, dir) {
    setQuestions(prev => {
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return next
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function updateQuestion(idx, field, value) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  async function handleSave() {
    if (!name.trim()) { setError('Assessment name is required.'); return }
    if (questions.length === 0) { setError('Add at least one question.'); return }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) { setError(`Question ${i + 1} text is required.`); return }
    }
    setError(null)
    setSaving(true)
    try {
      let assessmentId

      if (existing) {
        // Update assessment record
        const { error: updateErr } = await supabase
          .from('custom_assessments')
          .update({ name: name.trim(), description: description.trim(), updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (updateErr) throw updateErr

        assessmentId = existing.id

        // Delete existing questions and re-insert
        const { error: delErr } = await supabase
          .from('custom_assessment_questions')
          .delete()
          .eq('assessment_id', assessmentId)
        if (delErr) throw delErr
      } else {
        // Create new assessment
        const { data: newAssessment, error: insertErr } = await supabase
          .from('custom_assessments')
          .insert({ company_id: companyId, name: name.trim(), description: description.trim(), created_by: userId })
          .select()
          .single()
        if (insertErr) throw insertErr
        assessmentId = newAssessment.id
      }

      // Insert questions
      const { error: qErr } = await supabase.from('custom_assessment_questions').insert(
        questions.map((q, i) => ({
          assessment_id: assessmentId,
          question_text: q.question_text.trim(),
          model_answer: q.model_answer.trim(),
          sort_order: i,
        }))
      )
      if (qErr) throw qErr

      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save assessment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existing ? 'Edit Assessment' : 'Create Assessment'}
      width={680}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={13} />}
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </>
      }
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {error && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 16 }}>
          <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

      {/* Name */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
          Assessment Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Backend Engineer Technical Screen"
          style={inputStyle}
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description of what this assessment evaluates..."
          rows={3}
          style={textareaStyle}
        />
      </div>

      {/* Questions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Questions <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>({questions.length})</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q, idx) => (
            <div
              key={q._id}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                padding: '14px 16px',
              }}
            >
              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>Question {idx + 1}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => moveQuestion(idx, -1)}
                    disabled={idx === 0}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 5, color: idx === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}
                    title="Move up"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => moveQuestion(idx, 1)}
                    disabled={idx === questions.length - 1}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 5, color: idx === questions.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === questions.length - 1 ? 0.4 : 1 }}
                    title="Move down"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={() => removeQuestion(idx)}
                    disabled={questions.length === 1}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-muted)', cursor: questions.length === 1 ? 'not-allowed' : 'pointer', opacity: questions.length === 1 ? 0.3 : 1 }}
                    onMouseEnter={e => { if (questions.length > 1) { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    title="Remove question"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Question Text *</label>
                <textarea
                  value={q.question_text}
                  onChange={e => updateQuestion(idx, 'question_text', e.target.value)}
                  placeholder="e.g. Describe a time you designed a scalable system under tight constraints..."
                  rows={2}
                  style={textareaStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Model Answer <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(ideal response for AI scoring)</span>
                </label>
                <textarea
                  value={q.model_answer}
                  onChange={e => updateQuestion(idx, 'model_answer', e.target.value)}
                  placeholder="The ideal answer would cover: distributed architecture tradeoffs, CAP theorem, caching layers..."
                  rows={3}
                  style={{ ...textareaStyle, borderColor: 'rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)' }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addQuestion}
          style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, padding: '8px 14px', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <Plus size={14} /> Add Question
        </button>
      </div>
    </Modal>
  )
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({ isOpen, onClose, assessment, onConfirm, deleting }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Assessment" width={420}
      footer={
        <>
          <button onClick={onClose} disabled={deleting} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--danger)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={13} />}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </>
      }
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{assessment?.name}</strong>?
        This will permanently remove all questions associated with it. This action cannot be undone.
      </p>
    </Modal>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Assessments() {
  const { user, company } = useAuth()
  const companyId = company?.id

  const [assessments, setAssessments] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = create

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ── Fetch list ───────────────────────────────────────────────────────────────
  const fetchAssessments = useCallback(async () => {
    if (!companyId) return
    setLoadingList(true)
    setListError(null)
    try {
      const { data, error } = await supabase
        .from('custom_assessments')
        .select('*, custom_assessment_questions(count)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setAssessments(data || [])
    } catch (err) {
      setListError(err.message || 'Failed to load assessments.')
    } finally {
      setLoadingList(false)
    }
  }, [companyId])

  useEffect(() => { fetchAssessments() }, [fetchAssessments])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null)
    setFormOpen(true)
  }

  async function openEdit(assessment) {
    // Fetch full assessment with questions
    const { data, error } = await supabase
      .from('custom_assessments')
      .select('*, custom_assessment_questions(*)')
      .eq('id', assessment.id)
      .single()
    if (!error && data) {
      // Sort questions by sort_order
      data.custom_assessment_questions = (data.custom_assessment_questions || []).sort((a, b) => a.sort_order - b.sort_order)
      setEditTarget(data)
    } else {
      setEditTarget(assessment)
    }
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('custom_assessments').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setDeleteTarget(null)
      fetchAssessments()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <PageHeader
        title="Assessments"
        subtitle="Create and manage custom assessment templates with questions and model answers"
        actions={
          <button
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <Plus size={15} /> Create Assessment
          </button>
        }
      />

      <div style={{ padding: '20px 28px' }}>
        {/* Loading */}
        {loadingList && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10 }}>
            <Loader2 size={20} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading assessments...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {!loadingList && listError && (
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9 }}>
            <AlertCircle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>Failed to load assessments</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>{listError}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loadingList && !listError && assessments.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <BookOpen size={26} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>No assessments yet</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: '0 0 20px', lineHeight: 1.6 }}>
              Create custom assessments with tailored questions and model answers to guide AI evaluation of candidate responses.
            </p>
            <button
              onClick={openCreate}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}
            >
              <Plus size={14} /> Create Your First Assessment
            </button>
          </div>
        )}

        {/* Grid */}
        {!loadingList && !listError && assessments.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {assessments.map(a => (
              <AssessmentCard
                key={a.id}
                assessment={a}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AssessmentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        existing={editTarget}
        companyId={companyId}
        userId={user?.id}
        onSaved={fetchAssessments}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        assessment={deleteTarget}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </Layout>
  )
}
