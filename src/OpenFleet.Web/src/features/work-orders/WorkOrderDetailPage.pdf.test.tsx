import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { WorkOrderDetailPage } from '@/features/work-orders/WorkOrderDetailPage'
import { VehicleDetailPage } from '@/features/vehicles/VehicleDetailPage'
import { workOrdersService } from '@/services/workOrders.service'
import { vehiclesService } from '@/services/vehicles.service'
import { renderWithProviders } from '@/test/render'
import { tokenStorage } from '@/lib/api'
import { createTestExpiresAt, createTestToken } from '@/test/fixtures/auth'

describe('Export PDF on detail pages', () => {
  beforeEach(() => {
    tokenStorage.set(createTestToken(), createTestExpiresAt())
  })

  afterEach(() => {
    tokenStorage.clear()
    vi.restoreAllMocks()
  })

  it('calls work order PDF endpoint and disables the button while loading', async () => {
    const user = userEvent.setup()
    let resolveDownload!: () => void
    const downloadPromise = new Promise<void>((resolve) => {
      resolveDownload = resolve
    })
    const downloadSpy = vi
      .spyOn(workOrdersService, 'downloadPdf')
      .mockImplementation(() => downloadPromise)

    renderWithProviders(
      <Routes>
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
      </Routes>,
      { route: '/work-orders/wo-1', withAuth: true },
    )

    const exportButton = await screen.findByRole('button', { name: /export pdf/i })
    await user.click(exportButton)

    expect(downloadSpy).toHaveBeenCalledWith('wo-1')
    await waitFor(() => {
      expect(exportButton).toBeDisabled()
    })

    resolveDownload()

    await waitFor(() => {
      expect(exportButton).not.toBeDisabled()
    })
  })

  it('shows an error toast when work order PDF export fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(workOrdersService, 'downloadPdf').mockRejectedValue({
      response: {
        status: 500,
        data: {
          title: 'Server Error',
          detail: 'PDF generation failed.',
          status: 500,
        },
      },
    })

    renderWithProviders(
      <Routes>
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
      </Routes>,
      { route: '/work-orders/wo-1', withAuth: true },
    )

    await user.click(await screen.findByRole('button', { name: /export pdf/i }))

    expect(await screen.findByText(/failed to export pdf/i)).toBeInTheDocument()
    expect(await screen.findByText(/pdf generation failed/i)).toBeInTheDocument()
  })

  it('calls vehicle maintenance history PDF endpoint', async () => {
    const user = userEvent.setup()
    const downloadSpy = vi
      .spyOn(vehiclesService, 'downloadMaintenanceHistoryPdf')
      .mockResolvedValue(undefined)

    renderWithProviders(
      <Routes>
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
      </Routes>,
      { route: '/vehicles/vehicle-1', withAuth: true },
    )

    await user.click(await screen.findByRole('button', { name: /export pdf/i }))

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('vehicle-1')
    })
  })
})
