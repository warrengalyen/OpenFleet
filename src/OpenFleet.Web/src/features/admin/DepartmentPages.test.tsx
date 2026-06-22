import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { DepartmentCreatePage } from '@/features/admin/DepartmentCreatePage'
import { DepartmentEditPage } from '@/features/admin/DepartmentEditPage'
import { renderWithProviders } from '@/test/render'

describe('DepartmentCreatePage', () => {
  it('renders create department form', () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/departments/new" element={<DepartmentCreatePage />} />
      </Routes>,
      { route: '/admin/departments/new', withAuth: true },
    )

    expect(screen.getByRole('heading', { name: /new department/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/department name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/department code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create department/i })).toBeInTheDocument()
  })
})

describe('DepartmentEditPage', () => {
  it('renders edit form with existing department values', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/departments/:id/edit" element={<DepartmentEditPage />} />
      </Routes>,
      { route: '/admin/departments/dept-1/edit', withAuth: true },
    )

    expect(await screen.findByRole('heading', { name: /edit department/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Operations')).toBeInTheDocument()
    expect(screen.getByDisplayValue('OPS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('allows updating department values', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/departments/:id/edit" element={<DepartmentEditPage />} />
        <Route path="/admin/departments/:id" element={<div>Department detail</div>} />
      </Routes>,
      { route: '/admin/departments/dept-2/edit', withAuth: true },
    )

    await screen.findByDisplayValue('Maintenance')
    await user.clear(screen.getByLabelText(/department name/i))
    await user.type(screen.getByLabelText(/department name/i), 'Maintenance Hub')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Department detail')).toBeInTheDocument()
  })
})
