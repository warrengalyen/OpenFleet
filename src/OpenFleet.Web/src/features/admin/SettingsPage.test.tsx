import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { SettingsPage } from '@/features/admin/SettingsPage'
import { renderWithProviders } from '@/test/render'

describe('SettingsPage', () => {
  it('renders settings form with loaded values', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Routes>,
      { route: '/admin/settings', withAuth: true },
    )

    expect(await screen.findByRole('heading', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('OpenFleet')).toBeInTheDocument()
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument()
  })

  it('updates settings successfully', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Routes>,
      { route: '/admin/settings', withAuth: true },
    )

    const nameInput = await screen.findByLabelText(/organization name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Metro Fleet')
    await user.click(screen.getByRole('button', { name: /save settings/i }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Metro Fleet')).toBeInTheDocument()
    })
  })
})
