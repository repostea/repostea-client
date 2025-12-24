/**
 * E2E Tests for Authentication - Real API
 *
 * Tests authentication flows with real backend:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Logout
 * - Session persistence
 */
describe('Authentication E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser

  // Helper to visit page with retry on 503 errors
  const visitWithRetry = (url, retries = 3) => {
    cy.visit(url, { failOnStatusCode: false }).then(() => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('503') && retries > 0) {
          cy.wait(2000)
          visitWithRetry(url, retries - 1)
        }
      })
    })
  }

  before(() => {
    // Create a real user for testing with verified email
    cy.createUser({
      username: `authtest_${uniqueId}`,
      email: `authtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  // Helper to dismiss cookie banner if present
  const dismissCookieBanner = () => {
    // Look for cookie banner and click Aceptar if visible
    cy.get('body').then(($body) => {
      // Check if cookie banner text exists
      if ($body.text().includes('Uso de Cookies')) {
        // Find all buttons and click the one with Aceptar text
        const buttons = $body.find('button')
        for (let i = 0; i < buttons.length; i++) {
          if (buttons[i].textContent.trim() === 'Aceptar') {
            cy.wrap(buttons[i]).click({ force: true })
            break
          }
        }
      }
    })
    // Always wait for banner to close
    cy.wait(1500)
  }

  // Helper to fill login form reliably
  const fillLoginForm = (email, password) => {
    // Type email - use clear first, then type slowly
    cy.get('#email')
      .should('be.visible')
      .clear()
      .type(email, { delay: 50 })

    // Type password
    cy.get('#password')
      .should('be.visible')
      .clear()
      .type(password, { delay: 50 })

    // Wait for Vue reactivity
    cy.wait(500)
  }

  describe('Login with Credentials', () => {
    beforeEach(() => {
      // Clear any existing session
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should login successfully with valid credentials', () => {
      visitWithRetry('/es/auth/login')
      // Wait for page to fully load and Vue hydration to complete
      cy.get('#email', { timeout: 20000 }).should('be.visible')
      // Extra wait for initial page setup
      cy.wait(2000)
      dismissCookieBanner()
      // Extra wait for Vue hydration after cookie banner closes
      cy.wait(1000)

      // Fill login form using helper
      fillLoginForm(testUser.email, 'TestPassword123!')

      // Submit form
      cy.get('button[type="submit"]').click()

      // Should redirect to home and show user menu (user-info button appears when logged in)
      cy.url({ timeout: 15000 }).should('not.include', '/auth/login')
      cy.get('.user-info, .user-menu', { timeout: 10000 }).should('exist')
    })

    it('should login with username instead of email', () => {
      visitWithRetry('/es/auth/login')
      // Wait for page to fully load and Vue hydration to complete
      cy.get('#email', { timeout: 20000 }).should('be.visible')
      dismissCookieBanner()
      // Extra wait for Vue hydration
      cy.wait(1500)

      // Fill login form with username
      fillLoginForm(testUser.username, 'TestPassword123!')

      // Submit form
      cy.get('button[type="submit"]').click()

      // Should redirect to home and show user menu
      cy.url({ timeout: 15000 }).should('not.include', '/auth/login')
      cy.get('.user-info, .user-menu', { timeout: 10000 }).should('exist')
    })

    it('should show error with invalid password', () => {
      visitWithRetry('/es/auth/login')
      // Wait for page to fully load and Vue hydration
      cy.get('#email', { timeout: 20000 }).should('be.visible')
      dismissCookieBanner()
      cy.wait(1500)

      // Fill login form with wrong password
      fillLoginForm(testUser.email, 'WrongPassword123!')

      // Submit form
      cy.get('button[type="submit"]').click()

      // Should show error message and stay on login page
      cy.get('.bg-red-50, [class*="bg-red"], [class*="text-red"]', { timeout: 10000 }).should('be.visible')
      cy.url().should('include', '/auth/login')
    })

    it('should show error with non-existent user', () => {
      visitWithRetry('/es/auth/login')
      // Wait for page to fully load and Vue hydration
      cy.get('#email', { timeout: 20000 }).should('be.visible')
      dismissCookieBanner()
      cy.wait(1500)

      // Fill login form with non-existent email
      fillLoginForm('nonexistent_user@example.com', 'SomePassword123!')

      // Submit form
      cy.get('button[type="submit"]').click()

      // Should show error message and stay on login page
      cy.get('.bg-red-50, [class*="bg-red"], [class*="text-red"]', { timeout: 10000 }).should('be.visible')
      cy.url().should('include', '/auth/login')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      // Login before each test
      cy.loginAs(testUser)
      visitWithRetry('/es/')
      dismissCookieBanner()
      cy.get('.user-info, .user-menu', { timeout: 20000 }).should('exist')
    })

    it('should logout successfully', () => {
      // Wait for page to fully stabilize after login
      cy.wait(2000)

      // Click on user menu button to open dropdown - use realClick if available
      cy.get('button.user-info').first()
        .should('be.visible')
        .then(($btn) => {
          // Try native click event
          $btn[0].click()
        })

      // Wait a bit for Vue to react
      cy.wait(500)

      // Check if dropdown appeared, if not try clicking again
      cy.get('body').then(($body) => {
        if ($body.find('.dropdown-menu:visible').length === 0) {
          cy.get('button.user-info').first().click({ force: true })
          cy.wait(500)
        }
      })

      // Wait for dropdown to appear, then click logout
      cy.get('.dropdown-menu', { timeout: 5000 }).should('be.visible')
      cy.get('.dropdown-menu button.logout').first().click({ force: true })

      // Should redirect and show login button instead of user menu
      cy.get('.btn-login', { timeout: 10000 }).should('be.visible')
      cy.get('.user-info').should('not.exist')
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session after page reload', () => {
      cy.loginAs(testUser)
      visitWithRetry('/es/')

      // Verify logged in (user-info button exists when logged in)
      cy.get('.user-info, .user-menu', { timeout: 20000 }).should('exist')

      // Reload page
      cy.reload()

      // Should still be logged in
      cy.get('.user-info, .user-menu', { timeout: 20000 }).should('exist')
    })

    it('should maintain session when navigating between pages', () => {
      cy.loginAs(testUser)
      visitWithRetry('/es/')

      // Verify logged in
      cy.get('.user-info, .user-menu', { timeout: 20000 }).should('exist')

      // Navigate to another page
      visitWithRetry('/es/s')

      // Should still be logged in
      cy.get('.user-info, .user-menu', { timeout: 20000 }).should('exist')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected page without auth', () => {
      // Clear any existing session
      cy.clearCookies()
      cy.clearLocalStorage()

      // Try to access submit page (requires auth)
      visitWithRetry('/es/submit')

      // Should redirect to login
      cy.url({ timeout: 20000 }).should('include', '/auth/login')
    })

    it('should allow access to protected page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/es/submit')

      // Should stay on submit page and show user menu
      cy.url().should('include', '/submit')
      cy.get('.user-info, .user-menu', { timeout: 20000 }).should('exist')
    })
  })
})
