import React from 'react'

function getScoreColor(score) {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return 'var(--accent)'
  if (score >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

export default function ScoreBar({ score, max = 100, label, showValue = true, height = 6 }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100))
  const color = getScoreColor(pct)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      {label && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80, flexShrink: 0 }}>{label}</span>
      )}
      <div style={{
        flex: 1,
        height,
        background: 'var(--bg-tertiary)',
        borderRadius: height,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: height,
          transition: 'width 0.4s ease',
        }} />
      </div>
      {showValue && (
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color,
          fontFamily: 'Geist Mono, monospace',
          minWidth: 28,
          textAlign: 'right',
        }}>
          {Math.round(pct)}
        </span>
      )}
    </div>
  )
}
