import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, authHelpers } from './supabase'
import { getMe, apiSignup } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          loadProfile().catch(console.error)
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to get session:', err)
        setLoading(false)
      })

    // Listen for auth changes
    // NOTE: Do NOT call supabase.auth.getSession() synchronously inside this callback.
    // Supabase SDK v2.x holds an exclusive Web Lock while firing onAuthStateChange, so
    // calling getSession() (which also acquires that lock) causes a deadlock — the app
    // freezes on "Signing in..." indefinitely. setTimeout(0) defers the call until
    // after the lock is released.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setTimeout(() => loadProfile().catch(console.error), 0)
      } else {
        setProfile(null)
        setCompany(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile() {
    try {
      const data = await getMe()
      // Pipeline returns { status: "ok", data: { user_id, email, recruiter_profile, company_id } }
      const payload = data?.data || data
      setProfile(payload?.recruiter_profile || payload?.profile || null)
      setCompany(payload?.company_id ? { id: payload.company_id } : null)
    } catch (err) {
      // Profile might not exist yet — that's okay
      console.warn('Profile not found:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const data = await authHelpers.signIn(email, password)
    return data
  }

  async function signUp(email, password, metadata = {}) {
    // Use Supabase client for auth, then the pipeline creates profile + company
    const data = await authHelpers.signUp(email, password, metadata)
    // Note: pipeline's /api/auth/signup creates company + profile in one call
    // but we use Supabase client-side auth so the session is set locally
    return data
  }

  async function signOut() {
    await authHelpers.signOut()
    setUser(null)
    setProfile(null)
    setCompany(null)
  }

  const value = { user, profile, company, loading, signIn, signUp, signOut, loadProfile }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) return null
  return children
}
