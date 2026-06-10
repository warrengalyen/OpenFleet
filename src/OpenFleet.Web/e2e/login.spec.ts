import { test, expect } from '@playwright/test'
import { mockAuthenticatedApi } from './fixtures/api'

test.describe('Login', () => {
  test('shows validation for empty submission', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByLabel(/email/i)).toBeFocused()
  })

  test('signs in and lands on dashboard', async ({ page }) => {
    await mockAuthenticatedApi(page)
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('admin@openfleet.io')
    await page.getByLabel(/password/i).fill('Admin@1234')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials.' }),
      })
    })

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('bad@openfleet.io')
    await page.getByLabel(/password/i).fill('wrong')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByRole('alert')).toContainText(/invalid credentials/i)
  })
})
