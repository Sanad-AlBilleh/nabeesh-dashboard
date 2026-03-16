import React, { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const MOCK_NOTIFICATIONS = [
  { id: 1, message: 'Sarah Chen completed Big Five assessment', time: new Date(Date.now() - 5 * 60000), read: false, type: 'assessment' },
  { id: 2, message: 'Ahmed Al-Rashid signed the offer letter', time: new Date(Date.now() - 32 * 60000), read: false, type: 'offer' },
  { id: 3, message: 'New application: Marcus Johnson for Senior Engineer', time: new Date(Date.now() - 2 * 3600000), read: false, type: 'application' },
  { id: 4, message: 'Interview with Priya Patel scheduled for tomorrow 2pm', time: new Date(Date.now() - 5 * 3600000), read: true, type: 'interview' },
  { id: 5, message: 'Job posting "Product Manager" published to LinkedIn', time: new Date(Date.now() - 24 * 3600000), read: true, type: 'job' },
]

const typeColors = {
  assessment: 'var(--accent)',
  offer: 'var(--success)',
  application: 'var(--info)',
  interview: 'var(--warning)',
  job: 'var(--text-secondary)',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const ref = useRef(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function markAllRead() {
    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }

  function dismiss(id) {
    setNotifications(n => n.filter(x => x.id !== id))
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: open ? 'var(--bg-tertiary)' : 'transparent',
          borderRadius: 8,
          color: 'var(--text-secondary)',
          position: 'relative',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            background: 'var(--danger)',
            borderRadius: '50%',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-primary)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 340,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            zIndex: 999,
            overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Notifications {unread > 0 && <span style={{ color: 'var(--accent)' }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                All caught up!
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: n.read ? 'transparent' : 'rgba(129,140,248,0.04)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(129,140,248,0.04)'}
                >
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: n.read ? 'transparent' : typeColors[n.type] || 'var(--accent)',
                    marginTop: 5,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Geist Mono, monospace' }}>
                      {formatDistanceToNow(n.time, { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(n.id)}
                    style={{ background: 'transparent', color: 'var(--text-muted)', padding: 2, flexShrink: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
