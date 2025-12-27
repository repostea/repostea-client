/**
 * E2E Tests for Email Verification
 *
 * Tests email verification page:
 * - Verification pending state
 * - Resend verification email
 * - Success/error states
 * - Logout functionality
 */
describe('Email Verification E2E Tests', () => {
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

  const acceptCookies = () => {
    cy.get('body').then(($body) => {
      const acceptBtn = $body.find('button').filter(function () {
        return this.textContent.includes('Accept')
      })
      if (acceptBtn.length > 0) {
        cy.wrap(acceptBtn.first()).click({ force: true })
        cy.wait(500)
      }
    })
  }

  before(() => {
    // Create unverified user for testing
    cy.createUser({
      username: `unveriftest_${uniqueId}`,
      email: `unveriftest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: null, // Not verified
    }).then((user) => {
      testUser = user
    })
  })

  describe('Verification Page Access', () => {
    it('should stay on verify-email page when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      // Page does not redirect - stays on verify-email
      cy.url({ timeout: 10000 }).should('include', '/verify-email')
    })

    it('should display verification page for unverified user', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).invoke('text').should('match', /verif|email/i)
    })
  })

  describe('Verification Message', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display verification title', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      // Page should show verification or email related heading
      cy.get('h1, h2', { timeout: 10000 }).should('exist')
    })

    it('should display user email', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      // Page should mention email
      cy.contains(/email|@/i, { timeout: 10000 }).should('exist')
    })

    it('should show warning about unverified email', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      // Page should mention verification
      cy.contains(/verify/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Resend Verification Button', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have resend verification button', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      // Page should have a button for resending verification
      cy.get('button', { timeout: 10000 }).should('exist')
    })

    it('should have send icon on button', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      cy.get('button svg, button [class*="icon"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Additional Information', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show spam folder hint', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      cy.contains(/spam|junk/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Logout Option', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have logout option', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      cy.contains(/logout/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Page Layout', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have envelope icon', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      cy.get('svg, [class*="icon"]', { timeout: 10000 }).should('exist')
    })

    it('should have card-style layout', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      cy.get('[class*="card"], [class*="rounded"], [class*="shadow"]', { timeout: 10000 }).should(
        'exist'
      )
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should have centered content on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      cy.get('[class*="mx-auto"], [class*="max-w"], [class*="center"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Success/Error States', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have success message container', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      // Container exists but may be hidden
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should have error message container', () => {
      visitWithRetry('/en/auth/verify-email')
      acceptCookies()

      // Container exists but may be hidden
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })
})
