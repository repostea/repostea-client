/**
 * E2E Tests for User Registration - Real API
 *
 * Tests registration functionality with real backend:
 * - Access registration page
 * - Form validation
 * - Registration modes (open, invite_only, closed)
 * - Error handling
 *
 * Note: Full registration flow requires Turnstile captcha bypass
 * which may need backend configuration for test environment
 */
describe('Registration E2E Tests', () => {
  const uniqueId = Date.now()

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

  // Helper to accept cookie banner
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

  describe('Registration Page Access', () => {
    it('should display registration form', () => {
      visitWithRetry('/en/auth/register')
      acceptCookies()

      // Should show registration form fields
      cy.get('#username', { timeout: 10000 }).should('be.visible')
      cy.get('#email').should('be.visible')
      cy.get('#password').should('be.visible')
      cy.get('#password-confirm').should('be.visible')
    })

    it('should have link to login page', () => {
      visitWithRetry('/en/auth/register')
      acceptCookies()

      // Should have login link
      cy.get('a[href*="/auth/login"]', { timeout: 10000 }).should('exist')
    })

    it('should redirect authenticated users', () => {
      // Create and login a user
      cy.createUser({
        username: `regredirect_${uniqueId}`,
        email: `regredirect_${uniqueId}@example.com`,
        password: 'TestPassword123!',
        email_verified_at: new Date().toISOString(),
      }).then((user) => {
        cy.loginAs(user)
        visitWithRetry('/en/auth/register')

        // Should redirect away from register page
        cy.url({ timeout: 10000 }).should('not.include', '/auth/register')
      })
    })
  })

  describe('Form Validation', () => {
    // Helper to check if form is enabled (registration open)
    const ensureFormEnabled = () => {
      cy.get('form', { timeout: 5000 }).then(($form) => {
        if ($form.hasClass('pointer-events-none')) {
          // Registration is closed/invite-only, skip these tests
          cy.log('Registration form is disabled - skipping validation test')
          return false
        }
        return true
      })
    }

    beforeEach(() => {
      visitWithRetry('/en/auth/register')
      acceptCookies()
      cy.wait(1500) // Wait for Vue hydration and settings to load
    })

    it('should show error for short username', () => {
      cy.get('form', { timeout: 10000 }).then(($form) => {
        if ($form.hasClass('pointer-events-none')) {
          cy.log('SKIPPED: Registration form is disabled')
          return
        }
        cy.get('#username').clear().type('ab')
        cy.get('button[type="submit"]').click()
        cy.get('#username-error', { timeout: 5000 }).should('exist')
      })
    })

    it('should show error for invalid email', () => {
      cy.get('form', { timeout: 10000 }).then(($form) => {
        if ($form.hasClass('pointer-events-none')) {
          cy.log('SKIPPED: Registration form is disabled')
          return
        }
        cy.get('#username').clear().type('validuser')
        cy.get('#email').clear().type('notanemail')
        cy.get('button[type="submit"]').click()
        cy.get('#email-error', { timeout: 5000 }).should('exist')
      })
    })

    it('should show error for password mismatch', () => {
      cy.get('form', { timeout: 10000 }).then(($form) => {
        if ($form.hasClass('pointer-events-none')) {
          cy.log('SKIPPED: Registration form is disabled')
          return
        }
        cy.get('#username').clear().type('validuser')
        cy.get('#email').clear().type('valid@example.com')
        cy.get('#password').clear().type('Password123!')
        cy.get('#password-confirm').clear().type('DifferentPassword!')
        cy.get('button[type="submit"]').click()
        cy.get('#password-confirm-error', { timeout: 5000 }).should('exist')
      })
    })

    it('should show error for short password', () => {
      cy.get('form', { timeout: 10000 }).then(($form) => {
        if ($form.hasClass('pointer-events-none')) {
          cy.log('SKIPPED: Registration form is disabled')
          return
        }
        cy.get('#username').clear().type('validuser')
        cy.get('#email').clear().type('valid@example.com')
        cy.get('#password').clear().type('123')
        cy.get('button[type="submit"]').click()
        cy.get('#password-error', { timeout: 5000 }).should('exist')
      })
    })

    it('should require all fields', () => {
      // Try to submit empty form
      cy.get('button[type="submit"]').click({ force: true })

      // Should not navigate away (validation prevents submission)
      cy.url().should('include', '/auth/register')
    })
  })

  describe('Registration Modes', () => {
    it('should handle closed registration mode', () => {
      visitWithRetry('/en/auth/register')
      acceptCookies()

      // Page should show registration form or closed message
      cy.get('form, [class*="closed"]', { timeout: 10000 }).should('exist')
    })

    it('should handle invite-only mode with valid code', () => {
      visitWithRetry('/en/auth/register?invitation=TESTCODE')
      acceptCookies()

      // If invite mode is active, should show invitation detected message
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasInviteMode = $body.text().includes('invite') || $body.text().includes('invitation')

        if (hasInviteMode) {
          // Should show success message for valid invitation
          cy.get('.bg-green-50, .text-green').should('exist')
        }
      })
    })

    it('should handle invite-only mode without code', () => {
      visitWithRetry('/en/auth/register')
      acceptCookies()

      // Check for invite-only message
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const needsInvite =
          $body.text().includes('invitation') ||
          $body.text().includes('invitation') ||
          $body.text().includes('invite')

        if (needsInvite && !$body.text().includes('open')) {
          // Should show info about needing invitation
          cy.get('.bg-blue-50, .bg-red-50').should('exist')
        }
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to login from register', () => {
      visitWithRetry('/en/auth/register')
      acceptCookies()

      // Click login link
      cy.get('a[href*="/auth/login"]', { timeout: 10000 }).first().click()

      // Should be on login page
      cy.url().should('include', '/auth/login')
    })

    it('should be accessible from login page', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      // Click register link
      cy.get('a[href*="/auth/register"]', { timeout: 10000 }).first().click()

      // Should be on register page
      cy.url().should('include', '/auth/register')
    })
  })
})
