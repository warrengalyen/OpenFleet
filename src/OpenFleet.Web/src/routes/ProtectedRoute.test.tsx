import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { tokenStorage } from '@/lib/api'
import { createTestExpiresAt, createTestToken } from '@/test/fixtures/auth'
import { clearTestStorage } from '@/test/localStorage'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/hooks/useAuth'

const mockedUseAuth = vi.mocked(useAuth)

function renderProtected(initialRoute = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    clearTestStorage()
    vi.clearAllMocks()
  })

  it('redirects to login when no token is stored', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: () => false,
      hasPolicy: () => false,
    })

    renderProtected()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('shows loading spinner while auth profile loads', () => {
    tokenStorage.set(createTestToken(), createTestExpiresAt())
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isLoggingIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: () => false,
      hasPolicy: () => false,
    })

    renderProtected()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    tokenStorage.set(createTestToken(), createTestExpiresAt())
    mockedUseAuth.mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'admin@openfleet.io',
        role: 'Administrator',
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        departmentId: 'dept-1',
        isDemoUser: false,
      },
      isAuthenticated: true,
      isLoading: false,
      isLoggingIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: () => true,
      hasPolicy: () => true,
    })

    renderProtected()
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
