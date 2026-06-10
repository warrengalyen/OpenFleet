import { test, expect } from '@playwright/test'
import { mockAuthenticatedApi } from './fixtures/api'

test.describe('Vehicles', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApi(page)

    await page.route('**/api/vehicles**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'vehicle-1',
              vin: '1HGBH41JXMN109186',
              licensePlate: 'ABC123',
              make: 'Ford',
              model: 'Transit',
              year: 2022,
              mileage: 15000,
              status: 'Active',
              departmentId: 'dept-1',
              departmentName: 'Operations',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ]),
        })
      }
    })

    await page.route('**/api/departments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'dept-1', name: 'Operations' }]),
      })
    })

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@openfleet.io')
    await page.getByLabel(/password/i).fill('Admin@1234')
    await page.getByRole('button', { name: /sign in/i }).click()
  })

  test('lists vehicles from the API', async ({ page }) => {
    await page.goto('/vehicles')
    await expect(page.getByText('ABC123')).toBeVisible()
    await expect(page.getByText('Ford Transit')).toBeVisible()
  })
})
