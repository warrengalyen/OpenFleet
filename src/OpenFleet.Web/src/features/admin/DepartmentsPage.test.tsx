import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { DepartmentsPage } from '@/features/admin/DepartmentsPage'
import { renderWithProviders } from '@/test/render'

describe('DepartmentsPage', () => {
  it('renders department list with counts', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/departments" element={<DepartmentsPage />} />
      </Routes>,
      { route: '/admin/departments', withAuth: true },
    )

    expect(await screen.findByRole('heading', { name: /departments/i })).toBeInTheDocument()
    expect(await screen.findByText('Operations')).toBeInTheDocument()
    expect(screen.getByText('OPS')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
  })

  it('shows admin create action', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/departments" element={<DepartmentsPage />} />
      </Routes>,
      { route: '/admin/departments', withAuth: true },
    )

    expect(await screen.findByRole('button', { name: /new department/i })).toBeInTheDocument()
  })

  it('filters departments by search', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/departments" element={<DepartmentsPage />} />
      </Routes>,
      { route: '/admin/departments', withAuth: true },
    )

    await screen.findByText('Operations')
    await user.type(screen.getByLabelText(/search departments/i), 'Maintenance')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => {
      expect(screen.queryByText('Operations')).not.toBeInTheDocument()
      expect(screen.getByText('Maintenance')).toBeInTheDocument()
    })
  })
})
