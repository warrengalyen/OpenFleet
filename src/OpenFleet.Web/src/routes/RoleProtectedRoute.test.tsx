import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RoleProtectedRoute } from '@/routes/RoleProtectedRoute'
import { AuthPolicy } from '@/lib/auth'
import { tokenStorage } from '@/lib/api'
import { createTestExpiresAt, createTestToken } from '@/test/fixtures/auth'
import { clearTestStorage } from '@/test/localStorage'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/hooks/useAuth'

const mockedUseAuth = vi.fn()
vi.mocked(useAuth).mockImplementation(mockedUseAuth)

function renderRoleRoute() {
  return render(
    <MemoryRouter initialEntries={['/vehicles/new']}>
      <Routes>
        <Route
          path="/vehicles/new"
          element={
            <RoleProtectedRoute policy={AuthPolicy.TechnicianOrAbove}>
              <div>Create vehicle</div>
            </RoleProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleProtectedRoute', () => {
  beforeEach(() => {
    clearTestStorage()
    vi.clearAllMocks()
    tokenStorage.set(createTestToken(), createTestExpiresAt())
  })

  it('allows users with the required policy', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'tech@openfleet.io',
        role: 'Technician',
        firstName: 'Tech',
        lastName: 'User',
        fullName: 'Tech User',
        departmentId: 'dept-1',
        isDemoUser: false,
      },
      isAuthenticated: true,
      isLoading: false,
      isLoggingIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: () => true,
      hasPolicy: (policy: AuthPolicy) => policy === AuthPolicy.TechnicianOrAbove,
    })

    renderRoleRoute()
    expect(screen.getByText('Create vehicle')).toBeInTheDocument()
  })

  it('redirects viewers to unauthorized', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        userId: 'user-2',
        email: 'viewer@openfleet.io',
        role: 'Viewer',
        firstName: 'Viewer',
        lastName: 'User',
        fullName: 'Viewer User',
        departmentId: 'dept-1',
        isDemoUser: false,
      },
      isAuthenticated: true,
      isLoading: false,
      isLoggingIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: () => true,
      hasPolicy: () => false,
    })

    renderRoleRoute()
    expect(screen.getByText('Unauthorized')).toBeInTheDocument()
  })
})
