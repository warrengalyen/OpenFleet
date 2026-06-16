import type { UserRole } from '@/types'
import { isUserRole, normalizeUserRole } from '@/lib/enums'

export { isUserRole, normalizeUserRole }

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
