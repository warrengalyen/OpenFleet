import type { UserRole } from '@/types'

const USER_ROLES: readonly UserRole[] = [
  'Viewer',
  'Technician',
  'Supervisor',
  'FleetManager',
  'Administrator',
]

const ROLE_BY_INDEX: Record<number, UserRole> = {
  0: 'Viewer',
  1: 'Technician',
  2: 'Supervisor',
  3: 'FleetManager',
  4: 'Administrator',
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole)
}

/** API enums may arrive as numeric indices; normalize to UserRole strings. */
export function normalizeUserRole(role: unknown): UserRole {
  if (isUserRole(role)) return role
  if (typeof role === 'number' && role in ROLE_BY_INDEX) return ROLE_BY_INDEX[role]
  if (typeof role === 'string') {
    const parsed = Number(role)
    if (!Number.isNaN(parsed) && parsed in ROLE_BY_INDEX) return ROLE_BY_INDEX[parsed]
  }
  return 'Viewer'
}

/**
 * Role policy sets mirroring OpenFleet.Application.Common.AuthorizationPolicies.
 * Role strings match OpenFleet.Domain.Enums.UserRole.ToString() values.
 */
export const AuthPolicy = {
  AnyAuthenticated: 'AnyAuthenticated',
  TechnicianOrAbove: 'TechnicianOrAbove',
  FleetManagerOrAbove: 'FleetManagerOrAbove',
  AdminOnly: 'AdminOnly',
} as const

export type AuthPolicy = (typeof AuthPolicy)[keyof typeof AuthPolicy]

const POLICY_ROLES: Record<AuthPolicy, readonly UserRole[]> = {
  [AuthPolicy.AnyAuthenticated]: [
    'Viewer',
    'Technician',
    'Supervisor',
    'FleetManager',
    'Administrator',
  ],
  [AuthPolicy.TechnicianOrAbove]: [
    'Technician',
    'Supervisor',
    'FleetManager',
    'Administrator',
  ],
  [AuthPolicy.FleetManagerOrAbove]: ['FleetManager', 'Administrator'],
  [AuthPolicy.AdminOnly]: ['Administrator'],
}

export function hasRole(role: UserRole, allowed: readonly UserRole[]): boolean {
  return allowed.includes(role)
}

export function hasPolicy(role: UserRole | string | number, policy: AuthPolicy): boolean {
  return hasRole(normalizeUserRole(role), POLICY_ROLES[policy])
}

export const roleLabel: Record<UserRole, string> = {
  Viewer: 'Viewer',
  Technician: 'Technician',
  Supervisor: 'Supervisor',
  FleetManager: 'Fleet Manager',
  Administrator: 'Administrator',
}

export const roleBadgeVariant: Record<
  UserRole,
  'neutral' | 'info' | 'default' | 'warning' | 'danger'
> = {
  Viewer: 'neutral',
  Technician: 'info',
  Supervisor: 'default',
  FleetManager: 'warning',
  Administrator: 'danger',
}

/** Decode JWT exp claim (seconds since epoch). Returns null if unreadable. */
export function getTokenExpiry(token: string): Date | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number
    }
    if (typeof decoded.exp !== 'number') return null
    return new Date(decoded.exp * 1000)
  } catch {
    return null
  }
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() <= Date.now()
}
