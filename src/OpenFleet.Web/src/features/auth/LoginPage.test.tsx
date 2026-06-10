import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { renderWithProviders } from '@/test/render'
import { tokenStorage } from '@/lib/api'

describe('LoginPage', () => {
  it('renders sign-in form with accessible labels', () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<LoginPage />} />
      </Routes>,
      { route: '/', withAuth: true },
    )

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /sign in form/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows API error on invalid credentials', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/" element={<LoginPage />} />
      </Routes>,
      { route: '/', withAuth: true },
    )

    await user.type(screen.getByLabelText(/email/i), 'bad@openfleet.io')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i)
  })

  it('stores token and navigates on successful login', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard home</div>} />
      </Routes>,
      { route: '/', withAuth: true },
    )

    await user.type(screen.getByLabelText(/email/i), 'admin@openfleet.io')
    await user.type(screen.getByLabelText(/password/i), 'Admin@1234')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Dashboard home')).toBeInTheDocument()
    expect(tokenStorage.isValid()).toBe(true)
  })
})
