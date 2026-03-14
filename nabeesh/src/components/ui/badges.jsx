import { STATUS_LABELS, STATUS_COLORS, gradeColor } from '@/lib/supabase'

export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status || '—'
  const color = STATUS_COLORS[status] || '#94a3b8'
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: color + '18', color }}
    >
      {label}
    </span>
  )
}

export function GradeBadge({ grade }) {
  if (!grade || grade === 'N/A') return <span className="text-muted-foreground text-xs">N/A</span>
  const gc = gradeColor(grade)
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold"
      style={{ background: gc.bg, color: gc.text, border: `1px solid ${gc.border}` }}
    >
      {grade}
    </span>
  )
}
