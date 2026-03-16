import React from 'react'

function getScoreColor(score) {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return 'var(--accent)'
  if (score >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

export default function ScoreCircle({ score, size = 80, label = 'Score' }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(100, Math.max(0, score || 0))
  const strokeDashoffset = circumference - (pct / 100) * circumference
  const color = getScoreColor(pct)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={6}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{
            fontSize: size >= 80 ? 18 : 14,
            fontWeight: 700,
            color,
            fontFamily: 'Geist Mono, monospace',
            lineHeight: 1,
          }}>
            {pct}
          </span>
        </div>
      </div>
      {label && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      )}
    </div>
  )
}
