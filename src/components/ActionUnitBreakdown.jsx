import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const AU_LABELS = {
  AU1: 'Inner Brow Raiser — Worry, Sadness',
  AU2: 'Outer Brow Raiser — Surprise',
  AU4: 'Brow Lowerer — Confusion, Anger',
  AU5: 'Upper Lid Raiser — Surprise, Fear',
  AU6: 'Cheek Raiser — Genuine Smile (Duchenne)',
  AU7: 'Lid Tightener — Determination, Anger',
  AU9: 'Nose Wrinkler — Disgust',
  AU10: 'Upper Lip Raiser — Disgust',
  AU12: 'Lip Corner Puller — Happiness, Smile',
  AU14: 'Dimpler — Contempt, Smugness',
  AU15: 'Lip Corner Depressor — Sadness, Disappointment',
  AU17: 'Chin Raiser — Doubt, Emotional Control',
  AU20: 'Lip Stretcher — Fear, Anxiety',
  AU23: 'Lip Tightener — Frustration, Determination',
  AU24: 'Lip Pressor — Tension, Suppression',
  AU25: 'Lips Part — Surprise, Speech',
  AU26: 'Jaw Drop — Surprise, Awe',
  AU28: 'Lip Suck — Nervousness, Thinking',
  AU43: 'Eyes Closed — Fatigue, Contemplation',
  AU45: 'Blink — Natural / Stress Indicator',
}

function getIntensityColor(value) {
  if (value >= 0.7) return 'var(--success)'
  if (value >= 0.4) return 'var(--accent)'
  if (value >= 0.2) return 'var(--warning)'
  return 'var(--text-muted)'
}

export default function ActionUnitBreakdown({ data }) {
  const [expanded, setExpanded] = useState(false)

  if (!data || Object.keys(data).length === 0) {
    return null
  }

  const entries = Object.entries(data)
    .filter(([key]) => key.startsWith('AU') || key.startsWith('au'))
    .sort((a, b) => {
      const numA = parseInt(a[0].replace(/\D/g, ''))
      const numB = parseInt(b[0].replace(/\D/g, ''))
      return numA - numB
    })

  const visible = expanded ? entries : entries.slice(0, 6)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 0',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
        }}>
          Action Unit Breakdown ({entries.length} AUs)
        </span>
        {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map(([key, value]) => {
          const label = AU_LABELS[key.toUpperCase()] || key
          const intensity = typeof value === 'number' ? value : 0
          const pct = Math.min(100, intensity * 100)
          const color = getIntensityColor(intensity)

          return (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'Geist Mono, monospace',
                color: 'var(--accent)',
                minWidth: 36,
                flexShrink: 0,
              }}>
                {key.toUpperCase()}
              </span>

              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minWidth: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    flex: 1,
                    height: 5,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'Geist Mono, monospace',
                    color,
                    minWidth: 32,
                    textAlign: 'right',
                  }}>
                    {intensity.toFixed(2)}
                  </span>
                </div>
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {entries.length > 6 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '6px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Show all {entries.length} action units
        </button>
      )}
    </div>
  )
}
