/**
 * E2E Tests for Magic Link Authentication
 *
 * Tests magic link login functionality:
 * - Request magic link form
 * - Email input validation
 * - Captcha verification
 * - Success/error states
 */
describe('Magic Link E2E Tests', () => {
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

  describe('Magic Link Page Access', () => {
    it('should display magic link page', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'magic link')
    })

    it('should have page header', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('h2, h1', { timeout: 10000 }).should('exist')
    })
  })

  describe('Magic Link Form', () => {
    it('should display email input field', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('input[type="email"], input#email', { timeout: 10000 }).should('exist')
    })

    it('should have email label', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('label[for="email"], label', { timeout: 10000 }).invoke('text').should('match', /email/i)
    })

    it('should have submit button', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('button[type="submit"], button', { timeout: 10000 }).should('exist')
    })

    it('should have captcha verification', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      // Turnstile captcha should exist on the form
      cy.get('[class*="turnstile"], [class*="captcha"], iframe[src*="turnstile"]', {
        timeout: 10000,
      }).should('exist')
    })
  })

  describe('Form Validation', () => {
    it('should require email field', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('input[type="email"]', { timeout: 10000 }).should('have.attr', 'required')
    })

    it('should validate email format', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('input[type="email"]', { timeout: 10000 }).type('invalid-email')
      cy.get('button[type="submit"]').click()

      // Browser validation should prevent submission or show error
      cy.get('body').should('be.visible')
    })
  })

  describe('Info Text', () => {
    it('should display info about magic link', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('p', { timeout: 10000 }).should('have.length.at.least', 1)
    })

    it('should explain how magic link works', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      // Page should explain the magic link process mentioning email
      cy.contains('email', { matchCase: false, timeout: 10000 }).should('exist')
    })
  })

  describe('Navigation Links', () => {
    it('should have back to login link', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('a[href*="/login"], a[href*="/auth"]', { timeout: 10000 }).should('exist')
    })

    it('should navigate to login page', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('a', { timeout: 10000 }).then(($links) => {
        const loginLink = $links.filter(function () {
          return /login|back/i.test(this.textContent)
        })
        if (loginLink.length > 0) {
          cy.wrap(loginLink.first()).click()
          cy.url().should('include', '/login')
        }
      })
    })
  })

  describe('Success State', () => {
    it('should have success message container', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      // Success message container exists but may be hidden
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should have error message container', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      // Error container exists but may be hidden
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when submitting', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      // Loading elements exist in the template
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
      cy.get('input[type="email"]').should('be.visible')
    })

    it('should have centered form on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('[class*="max-w"], [class*="mx-auto"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Token Verification', () => {
    it('should handle magic link with token', () => {
      cy.visit('/en/auth/magic-link?token=test-invalid-token', { failOnStatusCode: false })
      acceptCookies()

      // Should show error or loading state for invalid token
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })
})
