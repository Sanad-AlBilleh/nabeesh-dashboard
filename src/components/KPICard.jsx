import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ icon: Icon, label, value, trend, trendLabel, color = 'var(--accent)', loading }) {
  const trendPositive = trend > 0
  const trendNeutral = trend === 0 || trend === undefined || trend === null
  const TrendIcon = trendNeutral ? Minus : trendPositive ? TrendingUp : TrendingDown
  const trendColor = trendNeutral ? 'var(--text-muted)' : trendPositive ? 'var(--success)' : 'var(--danger)'

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--bg-tertiary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={16} color={color} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 32, width: '60%' }} />
      ) : (
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
      )}

      {(trend !== undefined && trend !== null) && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendIcon size={13} color={trendColor} />
          <span style={{ fontSize: 12, color: trendColor, fontWeight: 500 }}>
            {trendNeutral ? '0' : `${trendPositive ? '+' : ''}${trend}`}
          </span>
          {trendLabel && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
