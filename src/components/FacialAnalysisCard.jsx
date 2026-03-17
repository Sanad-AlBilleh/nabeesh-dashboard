import React from 'react'
import ScoreCircle from './ScoreCircle'

function getCardAccent(score) {
  if (score >= 70) return { border: 'rgba(52,211,153,0.25)', bg: 'rgba(52,211,153,0.04)' }
  if (score >= 40) return { border: 'rgba(251,191,36,0.25)', bg: 'rgba(251,191,36,0.04)' }
  return { border: 'rgba(248,113,113,0.25)', bg: 'rgba(248,113,113,0.04)' }
}

export default function FacialAnalysisCard({ label, score, description, icon: Icon }) {
  const accent = getCardAccent(score)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 16px',
      background: accent.bg,
      border: `1px solid ${accent.border}`,
      borderRadius: 10,
      transition: 'all 0.15s ease',
    }}>
      <ScoreCircle score={score} size={52} label="" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {Icon && <Icon size={13} color="var(--text-muted)" />}
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            {label}
          </span>
        </div>
        {description && (
          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            {description}
          </p>
        )}
      </div>

      <span style={{
        fontSize: 18,
        fontWeight: 700,
        fontFamily: 'Geist Mono, monospace',
        color: score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)',
        flexShrink: 0,
      }}>
        {score}
      </span>
    </div>
  )
}
