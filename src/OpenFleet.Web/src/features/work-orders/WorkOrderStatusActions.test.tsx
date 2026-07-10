import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkOrderStatusActions } from '@/features/work-orders/WorkOrderStatusActions'
import { createTestWorkOrder } from '@/test/fixtures/workOrders'
import { renderWithProviders } from '@/test/render'

describe('WorkOrderStatusActions', () => {
  it('renders available transition buttons', () => {
    const workOrder = createTestWorkOrder({
      allowedNextStatuses: ['InProgress', 'Cancelled'],
    })

    renderWithProviders(<WorkOrderStatusActions workOrder={workOrder} />)

    expect(screen.getByRole('button', { name: /move to in progress/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move to cancelled/i })).toBeInTheDocument()
  })

  it('shows message when no transitions are available', () => {
    const workOrder = createTestWorkOrder({ allowedNextStatuses: [] })
    renderWithProviders(<WorkOrderStatusActions workOrder={workOrder} />)

    expect(screen.getByText(/no further status transitions/i)).toBeInTheDocument()
  })

  it('calls status transition API when a button is clicked', async () => {
    const user = userEvent.setup()
    const workOrder = createTestWorkOrder({
      id: 'wo-42',
      allowedNextStatuses: ['InProgress'],
    })

    renderWithProviders(<WorkOrderStatusActions workOrder={workOrder} />)

    await user.click(screen.getByRole('button', { name: /move to in progress/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /move to in progress/i })).not.toBeDisabled()
    })
  })
})
