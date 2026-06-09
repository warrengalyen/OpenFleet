import type { CurrentUserResponse, LoginResponse, UserRole } from '@/types'

/** JWT-shaped token with a future exp claim for tests. */
export function createTestToken(expiresInSeconds = 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds }),
  )
  return `${header}.${payload}.test-signature`
}

export function createTestExpiresAt(expiresInSeconds = 3600): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

export function createTestUser(
  overrides: Partial<CurrentUserResponse> = {},
): CurrentUserResponse {
  return {
    userId: 'user-1',
    email: 'admin@openfleet.io',
    role: 'Administrator',
    fullName: 'Admin User',
    departmentId: 'dept-1',
    ...overrides,
  }
}

export function createTestLoginResponse(
  overrides: Partial<LoginResponse> = {},
): LoginResponse {
  const expiresAt = createTestExpiresAt()
  return {
    token: createTestToken(),
    expiresAt,
    userId: 'user-1',
    email: 'admin@openfleet.io',
    role: 'Administrator',
    fullName: 'Admin User',
    ...overrides,
  }
}

export function createTestUserForRole(role: UserRole): CurrentUserResponse {
  return createTestUser({ role })
}
