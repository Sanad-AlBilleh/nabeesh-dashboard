import React from 'react'
import {
  RadarChart as RechartsRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const BIG_FIVE_DESCRIPTIONS = {
  Openness: 'Curiosity, creativity, and openness to new experiences',
  Conscientiousness: 'Organization, dependability, and self-discipline',
  Extraversion: 'Sociability, assertiveness, and energy in social situations',
  Agreeableness: 'Cooperation, trust, and empathy toward others',
  Neuroticism: 'Emotional instability, anxiety, and moodiness',
}

export default function PersonalityRadar({ data, height = 280 }) {
  // data: [{ factor: 'Openness', score: 72 }, ...]
  const chartData = data?.map(d => ({
    subject: d.factor || d.name,
    value: d.score || d.value || 0,
    fullMark: 100,
  })) || []

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadar data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'Geist, system-ui' }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#818cf8"
            fill="#818cf8"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(value) => [`${value}/100`, 'Score']}
            contentStyle={{
              background: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: 8,
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>

      {/* Factor descriptions */}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {data.map(d => {
            const factor = d.factor || d.name
            const score = d.score || d.value || 0
            const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--accent)' : 'var(--warning)'
            return (
              <div key={factor} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 130 }}>{factor}</span>
                <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', color, minWidth: 28, textAlign: 'right' }}>{score}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
