import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Truck,
  Package,
  ClipboardList,
  Eye,
  Calendar,
  Wrench,
  Store,
  PlugZap,
  BarChart3,
  Shield,
  Users,
  Building2,
  Settings,
  FileText,
  ChevronDown,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy, type AuthPolicy as AuthPolicyType } from '@/lib/auth'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  policy?: AuthPolicyType
}

interface NavGroup {
  label: string
  icon: React.ElementType
  children: NavItem[]
}

type NavEntry = NavItem | ({ isGroup: true } & NavGroup)

const navEntries: NavEntry[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Vehicles', to: '/vehicles', icon: Truck },
  { label: 'Assets', to: '/assets', icon: Package },
  { label: 'Work Orders', to: '/work-orders', icon: ClipboardList },
  { label: 'Inspections', to: '/inspections', icon: Eye },
  { label: 'Maintenance', to: '/maintenance', icon: Calendar },
  { label: 'Parts', to: '/parts', icon: Wrench },
  { label: 'Vendors', to: '/vendors', icon: Store },
  { label: 'Integrations', to: '/integrations', icon: PlugZap },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  {
    isGroup: true,
    label: 'Administration',
    icon: Shield,
    children: [
      {
        label: 'Users',
        to: '/admin/users',
        icon: Users,
        policy: AuthPolicy.AdminOnly,
      },
      {
        label: 'Roles',
        to: '/admin/roles',
        icon: Shield,
        policy: AuthPolicy.AdminOnly,
      },
      {
        label: 'Departments',
        to: '/admin/departments',
        icon: Building2,
        policy: AuthPolicy.AdminOnly,
      },
      {
        label: 'Settings',
        to: '/admin/settings',
        icon: Settings,
        policy: AuthPolicy.AdminOnly,
      },
      {
        label: 'Audit Logs',
        to: '/admin/audit',
        icon: FileText,
        policy: AuthPolicy.FleetManagerOrAbove,
      },
    ],
  },
]

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
const linkActive =
  'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
const linkInactive =
  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'

interface SidebarProps {
  onClose: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const [adminOpen, setAdminOpen] = useState(true)
  const { hasPolicy } = useAuth()

  function isVisible(item: NavItem): boolean {
    return !item.policy || hasPolicy(item.policy)
  }

  const visibleEntries = navEntries
    .map((entry) => {
      if ('isGroup' in entry && entry.isGroup) {
        const children = entry.children.filter(isVisible)
        if (children.length === 0) return null
        return { ...entry, children }
      }
      return isVisible(entry as NavItem) ? entry : null
    })
    .filter((entry): entry is NavEntry => entry !== null)

  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
            <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5">
              <path
                d="M4 22h24M6 22V16a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="10" cy="24" r="2" fill="white" />
              <circle cx="22" cy="24" r="2" fill="white" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
            OpenFleet
          </span>
        </div>

        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-0.5">
          {visibleEntries.map((entry) => {
            if ('isGroup' in entry && entry.isGroup) {
              const { label, icon: Icon, children } = entry
              return (
                <li key={label}>
                  <button
                    onClick={() => setAdminOpen((o) => !o)}
                    className={clsx(linkBase, 'w-full justify-between', linkInactive)}
                    aria-expanded={adminOpen}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </span>
                    <ChevronDown
                      className={clsx(
                        'h-4 w-4 shrink-0 text-gray-400 transition-transform',
                        adminOpen && 'rotate-180',
                      )}
                    />
                  </button>

                  {adminOpen && (
                    <ul className="mt-0.5 space-y-0.5 pl-4">
                      {children.map(({ label: childLabel, to, icon: ChildIcon }) => (
                        <li key={to}>
                          <NavLink
                            to={to}
                            onClick={onClose}
                            className={({ isActive }) =>
                              clsx(linkBase, isActive ? linkActive : linkInactive)
                            }
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            {childLabel}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            }

            const { label, to, icon: Icon } = entry as NavItem
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(linkBase, isActive ? linkActive : linkInactive)
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-600">OpenFleet v0.1.0</p>
      </div>
    </aside>
  )
}
