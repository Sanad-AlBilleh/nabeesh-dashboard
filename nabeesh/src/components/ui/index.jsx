import { cn } from '@/lib/utils'

export function Button({ className, variant = 'default', size = 'default', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap text-sm'
  const variants = {
    default:     'bg-brand text-white hover:bg-brand-500',
    outline:     'border border-slate-200 bg-transparent hover:bg-slate-50',
    ghost:       'hover:bg-slate-100',
    secondary:   'bg-slate-100 text-slate-900 hover:bg-slate-200',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
  }
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm:      'h-7 px-3 text-xs',
    lg:      'h-11 px-8',
    icon:    'h-9 w-9 p-0',
  }
  return <button className={cn(base, variants[variant] ?? variants.default, sizes[size] ?? sizes.default, className)} {...props} />
}

export function Badge({ className, variant = 'default', ...props }) {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors'
  const variants = {
    default:     'border-transparent bg-brand text-white',
    secondary:   'border-transparent bg-slate-100 text-slate-900',
    outline:     'text-slate-900',
    destructive: 'border-transparent bg-red-100 text-red-800',
    success:     'border-transparent bg-green-100 text-green-800',
    warning:     'border-transparent bg-yellow-100 text-yellow-800',
    brand:       'border-transparent bg-brand-50 text-brand',
  }
  return <span className={cn(base, variants[variant] ?? variants.default, className)} {...props} />
}

export function Card({ className, ...props }) {
  return <div className={cn('rounded-lg border bg-white shadow-sm', className)} {...props} />
}
export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-sm font-semibold leading-none tracking-tight', className)} {...props} />
}
export function CardDescription({ className, ...props }) {
  return <p className={cn('text-xs text-muted-foreground', className)} {...props} />
}
export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}
export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}
export function TableHeader({ className, ...props }) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />
}
export function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}
export function TableRow({ className, ...props }) {
  return <tr className={cn('border-b transition-colors hover:bg-slate-50', className)} {...props} />
}
export function TableHead({ className, ...props }) {
  return <th className={cn('h-10 px-3 text-left align-middle text-xs font-medium text-muted-foreground whitespace-nowrap', className)} {...props} />
}
export function TableCell({ className, ...props }) {
  return <td className={cn('px-3 py-3 align-middle text-sm', className)} {...props} />
}

export function Progress({ value = 0, className, indicatorClassName }) {
  return (
    <div className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={cn('h-full bg-brand transition-all duration-300', indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Separator({ className, orientation = 'horizontal', ...props }) {
  return (
    <div className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} {...props} />
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn('flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    />
  )
}

export function NativeSelect({ className, ...props }) {
  return (
    <select
      className={cn('flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn('flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 resize-none', className)}
      {...props}
    />
  )
}

export function Label({ className, ...props }) {
  return <label className={cn('text-xs font-medium leading-none text-slate-700', className)} {...props} />
}

export function StatCard({ label, value, sub, icon: Icon, trendUp }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
            {sub && (
              <p className={cn('text-xs mt-1', trendUp === true ? 'text-green-600' : trendUp === false ? 'text-red-500' : 'text-muted-foreground')}>
                {sub}
              </p>
            )}
          </div>
          {Icon && (
            <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 ml-3">
              <Icon className="h-4 w-4 text-brand" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
