import { test, expect } from '@playwright/test'

test.describe('Language Preferences Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Mock de la API de preferencias
    await page.route('**/api/v1/preferences', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            layout: 'card',
            theme: 'renegados1',
            sort_by: 'created_at',
            sort_dir: 'desc',
            filters: null,
            content_languages: null,
            push_notifications: null
          })
        })
      } else if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Preferences saved successfully',
            preferences: postData
          })
        })
      }
    })

    // Navigate to the home page
    await page.goto('/')
  })

  test('should display "All languages" button initially', async ({ page }) => {
    // Find the language selector button
    const languageButton = page.locator('button:has-text("All languages"), button:has-text("Todos los idiomas")')
    await expect(languageButton).toBeVisible()
  })

  test('should open language selector modal on button click', async ({ page }) => {
    // Click on the languages button
    const languageButton = page.locator('.language-selector button').first()
    await languageButton.click()

    // Verificar que se abre el modal
    const modal = page.locator('.modal-overlay')
    await expect(modal).toBeVisible()

    // Verify it has the correct title
    const modalTitle = page.locator('h3:has-text("Select languages"), h3:has-text("Seleccionar idiomas")')
    await expect(modalTitle).toBeVisible()
  })

  test('should filter languages by search', async ({ page }) => {
    // Abrir el selector
    const languageButton = page.locator('.language-selector button').first()
    await languageButton.click()

    // Find the search input
    const searchInput = page.locator('input[type="text"][placeholder*="uscar"]')
    await searchInput.fill('español')

    // Verificar que solo aparecen idiomas que coinciden
    const spanishOption = page.locator('label:has-text("Español")')
    await expect(spanishOption).toBeVisible()

    // Verificar que otros idiomas no aparecen
    const englishOption = page.locator('label:has-text("English")')
    const count = await englishOption.count()
    expect(count).toBe(0)
  })

  test('should select and apply languages', async ({ page }) => {
    // Abrir el selector
    const languageButton = page.locator('.language-selector button').first()
    await languageButton.click()

    // Select Spanish and English
    const spanishCheckbox = page.locator('input[type="checkbox"][value="es"]')
    await spanishCheckbox.check()

    const englishCheckbox = page.locator('input[type="checkbox"][value="en"]')
    await englishCheckbox.check()

    // Aplicar cambios
    const applyButton = page.locator('button:has-text("Apply"), button:has-text("Aplicar")')
    await applyButton.click()

    // Verificar que el modal se cierra
    const modal = page.locator('.modal-overlay')
    await expect(modal).not.toBeVisible()

    // Verify the button shows the selected languages
    const updatedButton = page.locator('.language-selector button').first()
    const buttonText = await updatedButton.textContent()
    expect(buttonText).toContain('Español')
  })

  test('should persist selected languages in cookie', async ({ page, context }) => {
    // Abrir y seleccionar idiomas
    const languageButton = page.locator('.language-selector button').first()
    await languageButton.click()

    const spanishCheckbox = page.locator('input[type="checkbox"][value="es"]')
    await spanishCheckbox.check()

    const applyButton = page.locator('button:has-text("Apply"), button:has-text("Aplicar")')
    await applyButton.click()

    // Esperar un momento para que se guarde la cookie
    await page.waitForTimeout(500)

    // Verificar que existe la cookie user_prefs
    const cookies = await context.cookies()
    const prefsCookie = cookies.find(c => c.name === 'user_prefs')

    expect(prefsCookie).toBeDefined()

    if (prefsCookie) {
      const prefs = JSON.parse(prefsCookie.value)
      expect(prefs.selectedLanguages).toEqual(['es'])
    }
  })

  test('should load languages from cookie on page refresh', async ({ page, context }) => {
    // Establecer cookie con idiomas seleccionados
    await context.addCookies([{
      name: 'user_prefs',
      value: JSON.stringify({
        theme: 'renegados1',
        layout: 'card',
        sortBy: 'created_at',
        sortDir: 'desc',
        selectedLanguages: ['es', 'en', 'fr']
      }),
      domain: 'localhost',
      path: '/'
    }])

    // Reload the page
    await page.reload()

    // Verify the button shows languages from the cookie
    const languageButton = page.locator('.language-selector button').first()
    const buttonText = await languageButton.textContent()

    // Should show "3 languages" or the language names
    expect(buttonText).toMatch(/3.*language|Español.*English.*Français/)
  })

  test('should reset to "All languages"', async ({ page }) => {
    // Abrir y seleccionar algunos idiomas primero
    const languageButton = page.locator('.language-selector button').first()
    await languageButton.click()

    const spanishCheckbox = page.locator('input[type="checkbox"][value="es"]')
    await spanishCheckbox.check()

    const applyButton = page.locator('button:has-text("Apply"), button:has-text("Aplicar")')
    await applyButton.click()

    // Reabrir el modal
    await languageButton.click()

    // Click en Reset
    const resetButton = page.locator('button:has-text("Reset"), button:has-text("Restablecer")')
    await resetButton.click()

    // Verificar que vuelve a "All languages"
    const updatedButton = page.locator('.language-selector button').first()
    await expect(updatedButton).toContainText(/All languages|Todos los idiomas/)
  })

  test('should send selected languages to API when authenticated', async ({ page }) => {
    let savedPreferences = null

    // Mock de usuario autenticado
    await page.route('**/api/v1/preferences', async (route) => {
      if (route.request().method() === 'POST') {
        savedPreferences = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Preferences saved successfully',
            preferences: savedPreferences
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            layout: 'card',
            theme: 'renegados1',
            sort_by: 'created_at',
            sort_dir: 'desc',
            filters: null,
            content_languages: ['es', 'en'],
            push_notifications: null
          })
        })
      }
    })

    await page.goto('/')

    // Seleccionar idiomas
    const languageButton = page.locator('.language-selector button').first()
    await languageButton.click()

    const germanCheckbox = page.locator('input[type="checkbox"][value="de"]')
    await germanCheckbox.check()

    const applyButton = page.locator('button:has-text("Apply"), button:has-text("Aplicar")')
    await applyButton.click()

    // Wait for the request to be sent
    await page.waitForTimeout(1000)

    // Verify content_languages was sent to the API
    expect(savedPreferences).toBeDefined()
    if (savedPreferences) {
      expect(savedPreferences.content_languages).toBeDefined()
    }
  })

  test('should display selected language count correctly', async ({ page }) => {
    // Abrir selector
    const languageButton = page.locator('.language-selector button').first()
    await languageButton.click()

    // Seleccionar 4 idiomas
    await page.locator('input[type="checkbox"][value="es"]').check()
    await page.locator('input[type="checkbox"][value="en"]').check()
    await page.locator('input[type="checkbox"][value="fr"]').check()
    await page.locator('input[type="checkbox"][value="de"]').check()

    const applyButton = page.locator('button:has-text("Apply"), button:has-text("Aplicar")')
    await applyButton.click()

    // Verificar que muestra el contador
    const updatedButton = page.locator('.language-selector button').first()
    await expect(updatedButton).toContainText('4')
  })
})
