import { describe, expect, it, vi, afterEach } from 'vitest'
import { getDemoLoginCredentials } from './demoCredentials'

describe('getDemoLoginCredentials', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns admin credentials outside production', () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('MODE', 'development')

    const credentials = getDemoLoginCredentials()

    expect(credentials.email).toBe('admin@openfleet.io')
    expect(credentials.password).toBe('Admin@1234')
    expect(credentials.label).toBe('Default')
  })

  it('returns Viewer credentials in production', () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('MODE', 'production')

    const credentials = getDemoLoginCredentials()

    expect(credentials.email).toBe('viewer@openfleet.io')
    expect(credentials.password).toBe('Viewer@1234')
    expect(credentials.label).toMatch(/viewer/i)
  })
})
