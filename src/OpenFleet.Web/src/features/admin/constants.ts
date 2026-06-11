import {
  Users,
  Shield,
  Building2,
  Settings,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { AuthPolicy, type AuthPolicy as AuthPolicyType } from '@/lib/auth'

export interface AdminSection {
  slug: string
  title: string
  description: string
  to: string
  icon: LucideIcon
  policy: AuthPolicyType
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    slug: 'users',
    title: 'Users',
    description: 'Create accounts, assign roles, and manage department membership',
    to: '/admin/users',
    icon: Users,
    policy: AuthPolicy.AdminOnly,
  },
  {
    slug: 'roles',
    title: 'Roles',
    description: 'Review role definitions and how permissions map to fleet operations',
    to: '/admin/roles',
    icon: Shield,
    policy: AuthPolicy.AdminOnly,
  },
  {
    slug: 'departments',
    title: 'Departments',
    description: 'View organizational departments and vehicle assignments',
    to: '/admin/departments',
    icon: Building2,
    policy: AuthPolicy.AdminOnly,
  },
  {
    slug: 'settings',
    title: 'Settings',
    description: 'Application-wide configuration and operational defaults',
    to: '/admin/settings',
    icon: Settings,
    policy: AuthPolicy.AdminOnly,
  },
  {
    slug: 'audit',
    title: 'Audit Logs',
    description: 'Immutable history of changes across vehicles, work orders, and users',
    to: '/admin/audit',
    icon: FileText,
    policy: AuthPolicy.FleetManagerOrAbove,
  },
]

export function getAdminSection(slug: string): AdminSection | undefined {
  return ADMIN_SECTIONS.find((section) => section.slug === slug)
}
