import React from 'react'

const STAGE_COLORS = {
  Applied: '#60a5fa',
  Screened: '#818cf8',
  Interviewed: '#c084fc',
  Shortlisted: '#f472b6',
  Offered: '#fbbf24',
  Hired: '#34d399',
}

export default function PipelineFunnel({ data }) {
  // data: [{ stage, count }]
  const max = Math.max(...(data?.map(d => d.count) || [1]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(data || []).map((item, idx) => {
        const pct = max > 0 ? (item.count / max) * 100 : 0
        const color = STAGE_COLORS[item.stage] || 'var(--accent)'
        const conversion = idx > 0 && data[idx - 1]?.count > 0
          ? Math.round((item.count / data[idx - 1].count) * 100)
          : null

        return (
          <div key={item.stage}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 88 }}>{item.stage}</span>
              <div style={{ flex: 1, height: 22, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                  opacity: 0.85,
                }} />
                <span style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#fff',
                  fontFamily: 'Geist Mono, monospace',
                }}>
                  {item.count}
                </span>
              </div>
              {conversion !== null && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 40, textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>
                  {conversion}%
                </span>
              )}
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>conversion rate →</span>
      </div>
    </div>
  )
}
