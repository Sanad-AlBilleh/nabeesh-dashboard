import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, Users, ClipboardList, Calendar,
  FileText, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import NotificationBell from './NotificationBell'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/candidates', label: 'Candidates', icon: Users },
  { path: '/assessments', label: 'Assessments', icon: ClipboardList },
  { path: '/interviews', label: 'Interviews', icon: Calendar },
  { path: '/offers', label: 'Offers', icon: FileText },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, profile, company, signOut } = useAuth()
  const navigate = useNavigate()
  const width = collapsed ? 56 : 240

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const companyName = company?.name || profile?.company_name || 'Nabeesh'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{
      width,
      minWidth: width,
      height: '100vh',
      background: '#111113',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 12px' : '0 16px',
        borderBottom: '1px solid var(--border)',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Nabeesh</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.2 }}>by Balesh</div>
          </div>
        )}
      </div>

      {/* Notification bell + collapse toggle */}
      <div style={{
        padding: collapsed ? '8px 10px' : '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {!collapsed && <NotificationBell />}
        {collapsed && <NotificationBell />}
        {!collapsed && (
          <button
            onClick={onToggle}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              borderRadius: 6,
              color: 'var(--text-muted)',
            }}
            title="Collapse sidebar"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map(item => (
          <SidebarLink key={item.path} item={item} collapsed={collapsed} />
        ))}

        <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />

        <SidebarLink
          item={{ path: '/settings', label: 'Settings', icon: Settings }}
          collapsed={collapsed}
        />
      </nav>

      {/* User footer */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: collapsed ? '12px 10px' : '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {companyName}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                borderRadius: 6,
                color: 'var(--text-muted)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--danger)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <LogOut size={14} />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            title="Expand sidebar"
            style={{
              position: 'absolute',
              bottom: 80,
              right: -12,
              width: 24,
              height: 24,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function SidebarLink({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '9px 12px' : '9px 16px',
        margin: '1px 8px',
        borderRadius: 7,
        textDecoration: 'none',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: isActive ? 'var(--bg-tertiary)' : 'transparent',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.style.background || e.currentTarget.style.background === 'transparent') {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        }
      }}
      onMouseLeave={e => {
        // active state handled by NavLink
      }}
    >
      {({ isActive }) => (
        <>
          <item.icon
            size={16}
            color={isActive ? 'var(--accent)' : 'var(--text-muted)'}
            strokeWidth={isActive ? 2.5 : 2}
            style={{ flexShrink: 0 }}
          />
          {!collapsed && item.label}
        </>
      )}
    </NavLink>
  )
}
