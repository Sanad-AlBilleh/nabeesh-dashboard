import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, authHelpers } from './supabase'
import { createCompany, createProfile, getProfile } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).catch(console.error)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id).catch(console.error)
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
      const data = await getProfile(userId)
      setProfile(data.profile || data)
      setCompany(data.company || null)
    } catch (err) {
      // Profile might not exist yet
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
    const data = await authHelpers.signUp(email, password, metadata)
    if (data.user) {
      try {
        // Create company first
        const companyData = await createCompany({
          name: metadata.company_name || 'My Company',
          recruiter_user_id: data.user.id,
        })
        // Create recruiter profile
        await createProfile({
          user_id: data.user.id,
          full_name: metadata.full_name || '',
          email,
          company_id: companyData.id,
        })
      } catch (err) {
        console.warn('Could not create profile/company:', err.message)
      }
    }
    return data
  }

  async function signOut() {
    await authHelpers.signOut()
    setUser(null)
    setProfile(null)
    setCompany(null)
  }

  const value = { user, profile, company, loading, signIn, signUp, signOut }
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
