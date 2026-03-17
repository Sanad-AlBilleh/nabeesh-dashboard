import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, Mail, Lock, User, Building2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')
  const passwordStrength = password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : password.length >= 4 ? 'weak' : ''

  async function onSubmit(data) {
    setLoading(true)
    setError(null)
    try {
      // 1. Create auth user
      const result = await signUp(data.email, data.password, {
        full_name: data.full_name,
        company_name: data.company_name,
      })

      const authUser = result?.user
      if (!authUser) throw new Error('Signup failed — no user returned')

      // 2. Create company record
      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .insert({
          company_name: data.company_name,
          company_admin_email: data.email,
          full_name: data.full_name,
        })
        .select('company_id')
        .single()

      if (companyErr) throw new Error('Failed to create company: ' + companyErr.message)

      // 3. Create recruiter profile linking auth user to company
      const { error: profileErr } = await supabase
        .from('recruiter_profiles')
        .upsert({
          id: authUser.id,
          company_id: company.company_id,
          full_name: data.full_name,
          email: data.email,
          role: 'admin',
        }, { onConflict: 'id' })

      if (profileErr) throw new Error('Failed to create profile: ' + profileErr.message)

      setSuccess(true)
      setTimeout(() => navigate('/', { replace: true }), 1500)
    } catch (err) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="fade-in" style={{ textAlign: 'center' }}>
          <CheckCircle size={48} color="var(--success)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Account created!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 20,
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(129,140,248,0.07) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent), #6366f1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Zap size={24} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Nabeesh</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>by Balesh — AI Recruiting Platform</p>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 28,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Create your account
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Start hiring smarter with AI-powered recruiting.
          </p>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 6,
              marginBottom: 16,
            }}>
              <AlertCircle size={14} color="var(--danger)" />
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Name + Company row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Full name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Jane Smith" style={{ paddingLeft: 30 }} {...register('full_name')} />
                </div>
                {errors.full_name && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>{errors.full_name.message}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Company
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Acme Inc" style={{ paddingLeft: 30 }} {...register('company_name')} />
                </div>
                {errors.company_name && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>{errors.company_name.message}</p>}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" placeholder="jane@acme.com" style={{ paddingLeft: 30 }} {...register('email')} />
              </div>
              {errors.email && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" style={{ paddingLeft: 30, paddingRight: 36 }} {...register('password')} />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {password && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {['weak', 'medium', 'strong'].map(level => (
                    <div key={level} style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background: (
                        (passwordStrength === 'weak' && level === 'weak') ||
                        (passwordStrength === 'medium' && ['weak', 'medium'].includes(level)) ||
                        (passwordStrength === 'strong')
                      ) ? (passwordStrength === 'strong' ? 'var(--success)' : passwordStrength === 'medium' ? 'var(--warning)' : 'var(--danger)') : 'var(--border)',
                    }} />
                  ))}
                </div>
              )}
              {errors.password && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>{errors.password.message}</p>}
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>
                Confirm password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" placeholder="Repeat password" style={{ paddingLeft: 30 }} {...register('confirm_password')} />
              </div>
              {errors.confirm_password && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>{errors.confirm_password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: loading ? 'var(--bg-tertiary)' : 'var(--accent)',
                color: '#fff',
                borderRadius: 7,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 20, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
