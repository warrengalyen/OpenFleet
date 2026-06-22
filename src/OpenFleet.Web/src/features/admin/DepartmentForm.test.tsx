import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DepartmentForm } from '@/features/admin/DepartmentForm'
import { renderWithProviders } from '@/test/render'

describe('DepartmentForm', () => {
  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DepartmentForm onSubmit={async () => {}} submitLabel="Create department" />,
    )

    await user.click(screen.getByRole('button', { name: /create department/i }))

    expect(await screen.findByText(/department name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/department code is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid code format', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DepartmentForm onSubmit={async () => {}} submitLabel="Create department" />,
    )

    await user.type(screen.getByLabelText(/department name/i), 'Warehouse')
    await user.type(screen.getByLabelText(/department code/i), 'whs-1')
    await user.click(screen.getByRole('button', { name: /create department/i }))

    expect(
      await screen.findByText(/code must contain only uppercase letters and numbers/i),
    ).toBeInTheDocument()
  })

  it('submits valid values', async () => {
    const user = userEvent.setup()
    let submitted: { name: string; code: string } | undefined

    renderWithProviders(
      <DepartmentForm
        onSubmit={async (values) => {
          submitted = values
        }}
        submitLabel="Create department"
      />,
    )

    await user.type(screen.getByLabelText(/department name/i), 'Warehouse')
    await user.type(screen.getByLabelText(/department code/i), 'WHS')
    await user.click(screen.getByRole('button', { name: /create department/i }))

    await waitFor(() => {
      expect(submitted).toEqual({ name: 'Warehouse', code: 'WHS' })
    })
  })
})
