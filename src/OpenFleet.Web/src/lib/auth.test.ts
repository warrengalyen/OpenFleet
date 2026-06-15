import { describe, expect, it } from 'vitest'
import { AuthPolicy, hasPolicy, isExpired, normalizeUserRole } from '@/lib/auth'
import { createTestExpiresAt } from '@/test/fixtures/auth'

describe('normalizeUserRole', () => {
  it('passes through string role names', () => {
    expect(normalizeUserRole('Administrator')).toBe('Administrator')
  })

  it('maps numeric enum values from the API', () => {
    expect(normalizeUserRole(4)).toBe('Administrator')
    expect(normalizeUserRole(3)).toBe('FleetManager')
  })

  it('maps stringified numeric enum values', () => {
    expect(normalizeUserRole('4')).toBe('Administrator')
  })
})

describe('hasPolicy', () => {
  it('allows administrators for all policies', () => {
    expect(hasPolicy('Administrator', AuthPolicy.AdminOnly)).toBe(true)
    expect(hasPolicy(4, AuthPolicy.AdminOnly)).toBe(true)
    expect(hasPolicy('Administrator', AuthPolicy.FleetManagerOrAbove)).toBe(true)
    expect(hasPolicy('Administrator', AuthPolicy.TechnicianOrAbove)).toBe(true)
  })

  it('denies viewers from technician routes', () => {
    expect(hasPolicy('Viewer', AuthPolicy.TechnicianOrAbove)).toBe(false)
  })

  it('allows technicians on technician-or-above routes', () => {
    expect(hasPolicy('Technician', AuthPolicy.TechnicianOrAbove)).toBe(true)
    expect(hasPolicy('Technician', AuthPolicy.FleetManagerOrAbove)).toBe(false)
  })
})

describe('isExpired', () => {
  it('returns true when expiry is in the past', () => {
    expect(isExpired('2000-01-01T00:00:00Z')).toBe(true)
  })

  it('returns false when expiry is in the future', () => {
    expect(isExpired(createTestExpiresAt(3600))).toBe(false)
  })

  it('returns true when expiry is missing', () => {
    expect(isExpired(null)).toBe(true)
  })
})
