/**
 * E2E Tests for Authentication - Real API
 *
 * Tests authentication flows with real backend:
 * - Login form elements
 * - Logout
 * - Session persistence
 */
describe('Authentication E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser

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
    cy.createUser({
      username: `authtest_${uniqueId}`,
      email: `authtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  const acceptCookies = () => {
    cy.get('body').then(($body) => {
      const acceptBtn = $body.find('button').filter(function () {
        return this.textContent.includes('Accept')
      })
      if (acceptBtn.length > 0) {
        cy.wrap(acceptBtn.first()).click({ force: true })
        cy.wait(300)
      }
    })
  }

  describe('Login Page', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should display email input', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()
      cy.get('#email', { timeout: 10000 }).should('be.visible')
    })

    it('should display password input', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()
      cy.get('#password', { timeout: 10000 }).should('be.visible')
    })

    it('should display submit button', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()
      cy.get('button[type="submit"]', { timeout: 10000 }).should('be.visible')
    })

    it('should have forgot password link', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()
      cy.get('a[href*="forgot-password"]', { timeout: 10000 }).should('exist')
    })

    it('should have register link', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()
      cy.get('a[href*="register"]', { timeout: 10000 }).should('exist')
    })

    it('should have magic link option', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()
      cy.get('a[href*="magic-link"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('User Menu (Logged In)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
      visitWithRetry('/en/')
      acceptCookies()
      // Wait for auth to be fully loaded (user-menu wrapper exists)
      cy.get('.user-menu', { timeout: 10000 }).should('be.visible')
    })

    it('should show user-info button and open dropdown with logout', () => {
      // Force fresh page state
      cy.reload()
      cy.get('.user-menu', { timeout: 10000 }).should('be.visible')
      // Both desktop and mobile menus render AuthNav, use :visible to get the active one
      cy.get('.user-menu:visible .user-info', { timeout: 10000 }).should('be.visible')
      // Click to open dropdown
      cy.wait(500)
      cy.get('.user-menu:visible .user-info', { timeout: 10000 })
        .should('be.visible')
        .click()
      cy.wait(300)
      cy.get('.dropdown-menu', { timeout: 10000 }).should('be.visible')
      cy.get('.dropdown-menu .logout', { timeout: 5000 }).should('exist')
    })

    it('should show profile link in dropdown', () => {
      cy.wait(500)
      cy.get('.user-menu:visible .user-info', { timeout: 10000 })
        .should('be.visible')
        .trigger('click')
      cy.get('.dropdown-menu', { timeout: 10000 }).should('be.visible')
      cy.get('.dropdown-menu a[href*="profile"]', { timeout: 5000 }).should('exist')
    })

    it('should show settings link in dropdown', () => {
      cy.wait(500)
      cy.get('.user-menu:visible .user-info', { timeout: 10000 })
        .should('be.visible')
        .trigger('click')
      cy.get('.dropdown-menu', { timeout: 10000 }).should('be.visible')
      cy.get('.dropdown-menu a[href*="settings"]', { timeout: 5000 }).should('exist')
    })
  })

  describe('Auth Buttons (Not Logged In)', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should show login button when not logged in', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.get('.btn-login', { timeout: 10000 }).should('exist')
    })

    it('should show register button when not logged in', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.get('.btn-register', { timeout: 10000 }).should('exist')
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session after page reload', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/')
      cy.get('.user-info', { timeout: 10000 }).should('exist')

      cy.reload()

      cy.get('.user-info', { timeout: 10000 }).should('exist')
    })

    it('should maintain session when navigating between pages', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/')
      cy.get('.user-info', { timeout: 10000 }).should('exist')

      visitWithRetry('/en/s')
      cy.get('.user-info', { timeout: 10000 }).should('exist')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing submit without auth', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/submit')
      cy.url({ timeout: 10000 }).should('include', '/auth/login')
    })

    it('should allow access to submit when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/submit')
      cy.url().should('include', '/submit')
      cy.get('.user-info', { timeout: 10000 }).should('exist')
    })
  })
})
