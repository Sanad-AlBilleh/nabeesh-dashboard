import React, { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'var(--bg-primary)',
      }}>
        <div className="fade-in" style={{ minHeight: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

// Page header component (used by all pages)
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div style={{
      padding: '20px 28px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {breadcrumb && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          {breadcrumb}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
