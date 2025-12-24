import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/auth/login')

  // Verify we are on the login page
  await expect(page).toHaveTitle(/Login/)

  // Rellenar el formulario
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')

  // Mockear la respuesta del backend
  await page.route('**/api/v1/login', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'fake-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      }),
    })
  })

  // Enviar el formulario
  await page.click('button[type="submit"]')

  // Verify we are redirected to the home page
  await expect(page).toHaveURL('/')

  // Verificar que se muestra el nombre de usuario
  await expect(page.locator('text=testuser')).toBeVisible()
})
