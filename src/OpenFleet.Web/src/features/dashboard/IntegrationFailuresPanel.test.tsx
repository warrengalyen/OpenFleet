import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { IntegrationFailuresPanel } from '@/features/dashboard/IntegrationFailuresPanel'
import { renderWithProviders } from '@/test/render'

describe('IntegrationFailuresPanel', () => {
  it('shows failed integration entries from the API', async () => {
    renderWithProviders(<IntegrationFailuresPanel />)

    expect(await screen.findByText(/recent integration failures/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/connection timeout/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no failures are returned', async () => {
    const { server } = await import('@/test/msw/server')
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.get('/api/integrations', () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 5, totalCount: 0 }),
      ),
    )

    renderWithProviders(<IntegrationFailuresPanel />)

    expect(await screen.findByText(/no recent failures/i)).toBeInTheDocument()
  })
})
