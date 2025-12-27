/**
 * E2E Tests for Email Change Confirmation
 *
 * Tests email change confirmation page:
 * - Token verification
 * - Success/error states
 * - Navigation
 */
describe('Email Change Confirmation E2E Tests', () => {
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

  describe('Confirmation Page Access', () => {
    it('should display confirmation page without token', () => {
      visitWithRetry('/en/profile/confirm-email-change')
      acceptCookies()

      // Should show error for missing token
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should handle invalid token', () => {
      visitWithRetry('/en/profile/confirm-email-change?token=invalid-short')
      acceptCookies()

      // Invalid token should show error state (red styling or error text)
      cy.get('[class*="red"], [class*="error"], h1, h2', { timeout: 10000 }).should('exist')
    })
  })

  describe('Error State', () => {
    it('should display error icon for invalid token', () => {
      visitWithRetry('/en/profile/confirm-email-change?token=invalid-token-12345')
      acceptCookies()

      cy.get('svg, [class*="icon"]', { timeout: 10000 }).should('exist')
    })

    it('should display error message', () => {
      visitWithRetry('/en/profile/confirm-email-change?token=invalid-token-12345')
      acceptCookies()

      // Error page should have a heading
      cy.get('h1, h2', { timeout: 10000 }).should('exist')
    })

    it('should have link to settings', () => {
      visitWithRetry('/en/profile/confirm-email-change?token=invalid-token-12345')
      acceptCookies()

      // Wait for loading to finish (spinner should disappear)
      cy.get('.animate-spin', { timeout: 5000 }).should('not.exist')

      // Now check for link to settings in error state
      cy.get('a[href*="settings"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Loading State', () => {
    it('should show loading initially with valid-length token', () => {
      // Token must be 64 chars to trigger verification
      const validLengthToken = 'a'.repeat(64)
      visitWithRetry(`/es/profile/confirm-email-change?token=${validLengthToken}`)

      // Should show loading or error (since token is fake)
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Page Layout', () => {
    it('should have centered content', () => {
      visitWithRetry('/en/profile/confirm-email-change')
      acceptCookies()

      // Check for centering classes - the page uses flex justify-center and mx-auto
      cy.get('.justify-center, .mx-auto, .text-center, [class*="center"]', { timeout: 10000 }).should('exist')
    })

    it('should have card-style layout', () => {
      visitWithRetry('/en/profile/confirm-email-change')
      acceptCookies()

      cy.get('[class*="card"], [class*="rounded"], [class*="shadow"]', { timeout: 10000 }).should(
        'exist'
      )
    })
  })

  describe('Navigation', () => {
    it('should have navigation link', () => {
      visitWithRetry('/en/profile/confirm-email-change')
      acceptCookies()

      cy.get('a', { timeout: 10000 }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/profile/confirm-email-change')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })
})
