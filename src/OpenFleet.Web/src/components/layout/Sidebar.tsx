import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Truck,
  Package,
  ClipboardList,
  Eye,
  Calendar,
  PlugZap,
  BarChart3,
  Users,
  FileText,
} from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Vehicles', to: '/vehicles', icon: Truck },
  { label: 'Assets', to: '/assets', icon: Package },
  { label: 'Work Orders', to: '/work-orders', icon: ClipboardList },
  { label: 'Inspections', to: '/inspections', icon: Eye },
  { label: 'Maintenance', to: '/maintenance', icon: Calendar },
  { label: 'Integrations', to: '/integrations', icon: PlugZap },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Users', to: '/users', icon: Users },
  { label: 'Audit', to: '/audit', icon: FileText },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5">
            <path d="M4 22h24M6 22V16a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="10" cy="24" r="2" fill="white"/>
            <circle cx="22" cy="24" r="2" fill="white"/>
          </svg>
        </div>
        <span className="text-base font-semibold text-gray-900 tracking-tight">OpenFleet</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-0.5">
          {navItems.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-400">OpenFleet v0.1.0</p>
      </div>
    </aside>
  )
}
