import type { Page } from '@playwright/test'
import { createTestLoginResponse, createTestUser } from '../../src/test/fixtures/auth'

export async function mockAuthenticatedApi(page: Page) {
  const login = createTestLoginResponse()
  const user = createTestUser()

  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(login),
    })
  })

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    })
  })
}

export async function mockDashboardReports(page: Page) {
  await page.route('**/api/reports/**', async (route) => {
    const url = route.request().url()

    if (url.includes('work-orders-by-status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          open: 2,
          inProgress: 1,
          waitingForParts: 0,
          completed: 5,
          cancelled: 0,
          total: 8,
        }),
      })
    }

    if (url.includes('work-orders-by-priority')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          low: 1,
          medium: 2,
          high: 1,
          critical: 0,
          total: 4,
        }),
      })
    }

    if (url.includes('open-work-orders')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalOpen: 0,
          open: 0,
          inProgress: 0,
          waitingForParts: 0,
          items: [],
        }),
      })
    }

    if (url.includes('vehicles-due')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalDue: 0, vehicles: [] }),
      })
    }

    if (url.includes('inspection-failure-rate')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalInspections: 0,
          passed: 0,
          failed: 0,
          needsReview: 0,
          failureRatePercent: 0,
          topFailedVehicles: [],
        }),
      })
    }

    if (url.includes('parts-usage')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalParts: 0, totalInventoryValue: 0, parts: [] }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })

  await page.route('**/api/integrations**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'log-1',
            source: 'FuelUsage',
            direction: 'Import',
            status: 'Failed',
            payload: null,
            errorMessage: 'Connection timeout',
            attemptCount: 2,
            lastAttemptAt: '2026-01-15T10:00:00Z',
            nextRetryAt: null,
            recordsProcessed: null,
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
          },
        ],
        page: 1,
        pageSize: 5,
        totalCount: 1,
        pageCount: 1,
      }),
    })
  })
}
