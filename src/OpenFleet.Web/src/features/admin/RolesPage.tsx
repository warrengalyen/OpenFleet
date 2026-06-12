import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AuthPolicy, hasPolicy, roleBadgeVariant, roleLabel } from '@/lib/auth'
import type { UserRole } from '@/types/auth'
import { AdminBreadcrumb } from './AdminBreadcrumb'

const ROLES: UserRole[] = [
  'Viewer',
  'Technician',
  'Supervisor',
  'FleetManager',
  'Administrator',
]

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Viewer: 'Read-only access to fleet data, dashboards, and reports.',
  Technician: 'Can create and update vehicles, work orders, inspections, and assets.',
  Supervisor: 'Technician capabilities plus broader operational oversight.',
  FleetManager: 'Can manage inventory, vendors, maintenance schedules, and audit history.',
  Administrator: 'Full access including user management and administration screens.',
}

const ROLE_POLICIES: Record<UserRole, string[]> = {
  Viewer: ['View fleet data'],
  Technician: ['Technician routes (create/edit vehicles, work orders, inspections)'],
  Supervisor: ['Technician routes'],
  FleetManager: ['Fleet manager routes (parts, vendors, maintenance, audit logs)'],
  Administrator: ['All routes including user administration'],
}

export function RolesPage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumb title="Roles" />

      <PageTitle
        title="Roles"
        subtitle="Roles are defined in the backend and assigned when creating or editing users"
      />

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            OpenFleet uses fixed role names matching{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">
              UserRole
            </code>{' '}
            in the API. There is no separate roles endpoint — assign roles on the{' '}
            <Link to="/admin/users" className="text-brand-600 hover:underline dark:text-brand-400">
              Users
            </Link>{' '}
            screens.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <Shield className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>{roleLabel[role]}</CardTitle>
                  <Badge variant={roleBadgeVariant[role]} className="mt-1">
                    {role}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {ROLE_DESCRIPTIONS[role]}
              </p>
              <ul className="list-inside list-disc text-sm text-gray-500 dark:text-gray-400">
                {ROLE_POLICIES[role].map((policy) => (
                  <li key={policy}>{policy}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Policy checks:{' '}
                {Object.values(AuthPolicy)
                  .filter((policy) => hasPolicy(role, policy))
                  .join(', ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
