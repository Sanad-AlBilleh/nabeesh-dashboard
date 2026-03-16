import React from 'react'
import { formatDistanceToNow } from 'date-fns'

export default function Timeline({ events = [] }) {
  if (events.length === 0) {
    return (
      <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
        No activity yet
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute',
        left: 7,
        top: 8,
        bottom: 8,
        width: 1,
        background: 'var(--border)',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {events.map((event, idx) => (
          <div key={event.id || idx} style={{ position: 'relative', paddingBottom: 16 }}>
            {/* Dot */}
            <div style={{
              position: 'absolute',
              left: -16,
              top: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: event.color || 'var(--accent)',
              border: '2px solid var(--bg-secondary)',
            }} />

            <div style={{ paddingLeft: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {event.description}
                </p>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  marginTop: 1,
                  fontFamily: 'Geist Mono, monospace',
                }}>
                  {event.created_at
                    ? formatDistanceToNow(new Date(event.created_at), { addSuffix: true })
                    : event.time || ''}
                </span>
              </div>
              {event.actor && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  by {event.actor}
                </p>
              )}
              {event.note && (
                <p style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                  padding: '6px 8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  fontStyle: 'italic',
                }}>
                  "{event.note}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
