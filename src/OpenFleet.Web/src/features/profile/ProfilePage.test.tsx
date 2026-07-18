import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Routes, Route } from 'react-router-dom'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { tokenStorage } from '@/lib/api'
import { createTestExpiresAt, createTestToken, createTestUser } from '@/test/fixtures/auth'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

describe('ProfilePage', () => {
  beforeEach(() => {
    tokenStorage.set(createTestToken(), createTestExpiresAt())
  })

  it('renders profile form with current user values and enabled controls', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>,
      { route: '/profile', withAuth: true },
    )

    expect(await screen.findByRole('heading', { name: /^profile$/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Admin')).toBeInTheDocument()
    expect(screen.getByDisplayValue('User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('admin@openfleet.io')).toBeInTheDocument()

    expect(screen.getByLabelText(/first name/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/last name/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/^current password$/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/^new password$/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/confirm new password/i)).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
  })

  it('requires matching passwords when changing password', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>,
      { route: '/profile', withAuth: true },
    )

    await screen.findByRole('heading', { name: /^profile$/i })

    await user.type(screen.getByLabelText(/^current password$/i), 'Admin@1234')
    await user.type(screen.getByLabelText(/^new password$/i), 'NewPass@1234')
    await user.type(screen.getByLabelText(/confirm new password/i), 'Mismatch@1234')
    await user.click(screen.getByRole('button', { name: /save profile/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('updates display name successfully', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>,
      { route: '/profile', withAuth: true },
    )

    const firstName = await screen.findByLabelText(/first name/i)
    await user.clear(firstName)
    await user.type(firstName, 'Warren')
    await user.click(screen.getByRole('button', { name: /save profile/i }))

    expect(await screen.findByText(/profile updated/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByDisplayValue('Warren')).toBeInTheDocument()
    })
  })

  it('disables profile and password controls for demo users', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json(
          createTestUser({
            email: 'viewer@openfleet.io',
            firstName: 'Dana',
            lastName: 'Nguyen',
            fullName: 'Dana Nguyen',
            role: 'Viewer',
            isDemoUser: true,
          }),
        ),
      ),
    )

    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>,
      { route: '/profile', withAuth: true },
    )

    expect(
      await screen.findByText(/profile and password changes are disabled for the shared demo account/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/shared demo account/i)

    expect(screen.getByLabelText(/first name/i)).toBeDisabled()
    expect(screen.getByLabelText(/last name/i)).toBeDisabled()
    expect(screen.getByLabelText(/^current password$/i)).toBeDisabled()
    expect(screen.getByLabelText(/^new password$/i)).toBeDisabled()
    expect(screen.getByLabelText(/confirm new password/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /save profile/i })).toBeDisabled()
  })

  it('shows backend 403 restriction without logging out', async () => {
    const user = userEvent.setup()

    server.use(
      http.put('/api/auth/profile', () =>
        HttpResponse.json(
          {
            type: 'https://httpstatuses.io/403',
            title: 'Demo account restriction',
            status: 403,
            detail: 'Profile changes are unavailable for the shared demo account.',
          },
          { status: 403 },
        ),
      ),
    )

    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>,
      { route: '/profile', withAuth: true },
    )

    const firstName = await screen.findByLabelText(/first name/i)
    await user.clear(firstName)
    await user.type(firstName, 'Hacker')
    await user.click(screen.getByRole('button', { name: /save profile/i }))

    expect(
      await screen.findByText(/profile changes are unavailable for the shared demo account/i),
    ).toBeInTheDocument()
    expect(tokenStorage.isValid()).toBe(true)
  })
})
