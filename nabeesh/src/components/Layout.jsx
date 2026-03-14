import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, Users, Settings,
  ChevronLeft, ChevronRight, Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

const NAV = [
  { to: '/',         end: true,  Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs/new', end: false, Icon: Briefcase,        label: 'Jobs' },
  { to: '/candidates', end: false, Icon: Users,          label: 'Candidates', disabled: true },
  { to: '/settings',  end: false, Icon: Settings,        label: 'Settings',   disabled: true },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ease-in-out flex-shrink-0',
          collapsed ? 'w-14' : 'w-56',
        )}
      >
        {/* Brand */}
        <div className={cn('flex items-center h-14 border-b border-slate-100 px-3', collapsed ? 'justify-center' : 'gap-2')}>
          <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm text-slate-900 truncate">Nabeesh</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, end, Icon, label, disabled }) =>
            disabled ? (
              <div
                key={to}
                className={cn(
                  'flex items-center gap-3 px-2 py-2 rounded-md text-slate-400 cursor-not-allowed select-none',
                  collapsed ? 'justify-center' : '',
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{label}</span>}
              </div>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-brand-50 text-brand font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            )
          )}
        </nav>

        {/* Collapse toggle + User */}
        <div className="border-t border-slate-100 p-2 space-y-1">
          <div
            className={cn(
              'flex items-center gap-2 px-2 py-1.5',
              collapsed ? 'justify-center' : '',
            )}
          >
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">Nabeesh</p>
                <p className="text-xs text-slate-400">Admin</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed
                ? <ChevronRight className="h-3.5 w-3.5" />
                : <ChevronLeft  className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
