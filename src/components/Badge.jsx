import React from 'react'
import clsx from 'clsx'

const variants = {
  default: { bg: '#27272a', color: '#a1a1aa', border: '#3f3f46' },
  success: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  warning: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  danger:  { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
  info:    { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
  accent:  { bg: 'rgba(129,140,248,0.12)', color: '#818cf8', border: 'rgba(129,140,248,0.25)' },
  purple:  { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  cyan:    { bg: 'rgba(34,211,238,0.12)',  color: '#22d3ee', border: 'rgba(34,211,238,0.25)' },
}

const statusMap = {
  // Job statuses
  draft:      'default',
  published:  'success',
  closed:     'danger',
  // Application stages
  applied:    'info',
  screening:  'accent',
  interview:  'purple',
  shortlisted:'success',
  offered:    'warning',
  hired:      'success',
  rejected:   'danger',
  withdrawn:  'default',
  // Assessment
  pending:    'warning',
  completed:  'success',
  failed:     'danger',
  sent:       'info',
  // Offer
  signed:     'success',
  declined:   'danger',
  expired:    'default',
  // Interview
  scheduled:  'info',
  'in-progress': 'warning',
  // Source
  linkedin:   'info',
  indeed:     'accent',
  direct:     'success',
  ziprecruiter: 'purple',
  other:      'default',
}

export default function Badge({ label, variant, status, size = 'sm', dot = false, className }) {
  const resolvedVariant = variant || (status && statusMap[status?.toLowerCase()]) || 'default'
  const style = variants[resolvedVariant] || variants.default
  const displayLabel = label || status || ''

  const sizes = {
    xs: { fontSize: 10, padding: '1px 6px', height: 18 },
    sm: { fontSize: 11, padding: '2px 8px', height: 20 },
    md: { fontSize: 12, padding: '3px 10px', height: 22 },
  }
  const sz = sizes[size] || sizes.sm

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: 4,
        fontSize: sz.fontSize,
        padding: sz.padding,
        height: sz.height,
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
      className={className}
    >
      {dot && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: style.color,
          flexShrink: 0,
        }} />
      )}
      {displayLabel}
    </span>
  )
}
