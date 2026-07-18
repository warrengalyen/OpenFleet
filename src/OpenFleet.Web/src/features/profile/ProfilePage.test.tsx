import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { tokenStorage } from '@/lib/api'
import { createTestExpiresAt, createTestToken } from '@/test/fixtures/auth'
import { renderWithProviders } from '@/test/render'

describe('ProfilePage', () => {
  beforeEach(() => {
    tokenStorage.set(createTestToken(), createTestExpiresAt())
  })

  it('renders profile form with current user values', async () => {
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
})
