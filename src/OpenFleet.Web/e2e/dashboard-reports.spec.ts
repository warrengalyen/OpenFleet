import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockAuthenticatedApi, mockDashboardReports } from './fixtures/api'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApi(page)
    await mockDashboardReports(page)

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@openfleet.io')
    await page.getByLabel(/password/i).fill('Admin@1234')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('loads dashboard panels and integration failures', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Recent Integration Failures' }),
    ).toBeVisible()
    await expect(page.getByText('Connection timeout')).toBeVisible()
  })

  test('has no critical accessibility violations on dashboard', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApi(page)
    await page.route('**/api/reports/maintenance-cost', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ vehicles: [] }),
      })
    })

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@openfleet.io')
    await page.getByLabel(/password/i).fill('Admin@1234')
    await page.getByRole('button', { name: /sign in/i }).click()
  })

  test('loads maintenance cost report empty state', async ({ page }) => {
    await page.goto('/reports/maintenance-cost')
    await expect(
      page.getByRole('heading', { name: 'Maintenance Cost by Vehicle' }).first(),
    ).toBeVisible()
    await expect(page.getByText('No maintenance cost data')).toBeVisible()
  })
})
