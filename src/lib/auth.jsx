import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          loadProfile(session.user.id).catch(console.error)
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to get session:', err)
        setLoading(false)
      })

    // NOTE: Do NOT call supabase.auth.getSession() synchronously inside this callback.
    // Supabase SDK v2.x holds an exclusive Web Lock while firing onAuthStateChange, so
    // calling getSession() (which also acquires that lock) causes a deadlock.
    // setTimeout(0) defers the call until after the lock is released.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setTimeout(() => loadProfile(session.user.id).catch(console.error), 0)
      } else {
        setProfile(null)
        setCompany(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    try {
      const { data: prof } = await supabase
        .from('recruiter_profiles')
        .select('*, companies(*)')
        .eq('id', userId)
        .maybeSingle()
      setProfile(prof || null)
      if (prof?.companies) {
        setCompany({ id: prof.company_id, name: prof.companies.company_name, ...prof.companies })
      } else if (prof?.company_id) {
        setCompany({ id: prof.company_id, name: null })
      } else {
        setCompany(null)
      }
    } catch (err) {
      console.warn('Profile not found:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
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
