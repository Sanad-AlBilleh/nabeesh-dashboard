import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const EMOTION_COLORS = {
  confidence: '#34d399',
  engagement: '#818cf8',
  stress: '#f87171',
  happiness: '#fbbf24',
  surprise: '#22d3ee',
  neutral: '#71717a',
  sadness: '#60a5fa',
  anger: '#f87171',
  fear: '#c084fc',
  disgust: '#fb923c',
}

function formatTimestamp(seconds) {
  if (typeof seconds !== 'number') return seconds
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  // Find dominant emotion
  const sorted = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0))
  const dominant = sorted[0]

  return (
    <div style={{
      background: '#18181b',
      border: '1px solid #3f3f46',
      borderRadius: 8,
      padding: '10px 12px',
      fontSize: 12,
    }}>
      <div style={{
        fontSize: 11,
        color: '#71717a',
        marginBottom: 6,
        fontFamily: 'Geist Mono, monospace',
      }}>
        {formatTimestamp(label)}
      </div>
      {dominant && (
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: dominant.color || 'var(--accent)',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          Dominant: {dominant.name}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: entry.color,
              flexShrink: 0,
            }} />
            <span style={{ color: '#a1a1aa', textTransform: 'capitalize' }}>{entry.name}</span>
          </div>
          <span style={{
            fontFamily: 'Geist Mono, monospace',
            fontWeight: 600,
            color: '#fafafa',
          }}>
            {Math.round(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function EmotionTimeline({ data, height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-tertiary)',
        borderRadius: 10,
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No timeline data available</span>
      </div>
    )
  }

  // Detect which emotion keys are present in the data
  const samplePoint = data[0] || {}
  const emotionKeys = Object.keys(samplePoint).filter(
    k => k !== 'time' && k !== 'timestamp' && k !== 'second' && k !== 'dominant_emotion'
  )

  // Normalize data to use 'time' as x-axis
  const chartData = data.map(point => ({
    ...point,
    time: point.time ?? point.timestamp ?? point.second ?? 0,
  }))

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px 8px 8px 0',
    }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            {emotionKeys.map(key => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EMOTION_COLORS[key] || '#818cf8'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={EMOTION_COLORS[key] || '#818cf8'} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={formatTimestamp}
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'Geist Mono, monospace' }}
            stroke="#3f3f46"
            axisLine={{ stroke: '#3f3f46' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'Geist Mono, monospace' }}
            stroke="#3f3f46"
            axisLine={{ stroke: '#3f3f46' }}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={6}
            formatter={(value) => (
              <span style={{ color: '#a1a1aa', textTransform: 'capitalize', fontSize: 11 }}>{value}</span>
            )}
          />
          {emotionKeys.map(key => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={EMOTION_COLORS[key] || '#818cf8'}
              fill={`url(#gradient-${key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
