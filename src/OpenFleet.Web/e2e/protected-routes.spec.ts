import { test, expect } from '@playwright/test'
import { createTestLoginResponse } from '../src/test/fixtures/auth'
import { mockAuthenticatedApi } from './fixtures/api'

test.describe('Protected routes', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('allows direct access when a valid session exists', async ({ page }) => {
    const login = createTestLoginResponse()
    await mockAuthenticatedApi(page)

    await page.addInitScript((session) => {
      localStorage.setItem('openfleet_token', session.token)
      localStorage.setItem('openfleet_token_expires', session.expiresAt)
    }, login)

    await page.route('**/api/vehicles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.route('**/api/departments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/vehicles')
    await expect(page).toHaveURL(/\/vehicles/)
    await expect(page.getByRole('heading', { name: 'Vehicles' })).toBeVisible()
    await expect(page).not.toHaveURL(/\/login/)
  })
})
