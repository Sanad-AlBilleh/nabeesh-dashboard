import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Bot, User, AlertTriangle } from 'lucide-react'
import Badge from './Badge'

export default function TranscriptViewer({ transcript, flags = [], fillerCount = 0 }) {
  const [expanded, setExpanded] = useState({})
  const [showAll, setShowAll] = useState(false)

  if (!transcript || transcript.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        No transcript available
      </div>
    )
  }

  const visible = showAll ? transcript : transcript.slice(0, 6)

  function toggleTurn(idx) {
    setExpanded(e => ({ ...e, [idx]: !e[idx] }))
  }

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>
            {transcript.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Turns</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: fillerCount > 20 ? 'var(--warning)' : 'var(--success)', fontFamily: 'Geist Mono, monospace' }}>
            {fillerCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Filler Words</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: flags.length > 3 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>
            {flags.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Behavioral Flags</div>
        </div>
      </div>

      {/* Behavioral flags */}
      {flags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Behavioral Flags
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {flags.map((flag, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 10px',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 6,
              }}>
                <AlertTriangle size={13} color="var(--danger)" style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{flag.type}: </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{flag.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript turns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map((turn, idx) => {
          const isAI = turn.speaker === 'AI' || turn.speaker === 'Interviewer'
          const isExpanded = expanded[idx] ?? true
          const preview = turn.text?.slice(0, 120)
          const hasMore = turn.text?.length > 120

          return (
            <div
              key={idx}
              style={{
                background: isAI ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  cursor: hasMore ? 'pointer' : 'default',
                  borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                }}
                onClick={() => hasMore && toggleTurn(idx)}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isAI ? 'rgba(129,140,248,0.2)' : 'rgba(52,211,153,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isAI ? <Bot size={12} color="var(--accent)" /> : <User size={12} color="var(--success)" />}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: isAI ? 'var(--accent)' : 'var(--success)' }}>
                  {turn.speaker}
                </span>
                {turn.timestamp && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'Geist Mono, monospace' }}>
                    {turn.timestamp}
                  </span>
                )}
                {hasMore && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </span>
                )}
              </div>
              {(isExpanded || !hasMore) && (
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {isExpanded ? turn.text : preview + (hasMore ? '...' : '')}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {transcript.length > 6 && (
        <button
          onClick={() => setShowAll(s => !s)}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            fontSize: 12,
          }}
        >
          {showAll ? 'Show less' : `Show all ${transcript.length} turns`}
        </button>
      )}
    </div>
  )
}
