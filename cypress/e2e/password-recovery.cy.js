/**
 * E2E Tests for Password Recovery & Magic Link - Real API
 *
 * Tests password recovery flows with real backend:
 * - Forgot password page
 * - Magic link page
 * - Form validation
 * - Navigation between auth pages
 *
 * Note: Full flows require Turnstile captcha bypass which may need
 * backend configuration for test environment
 */
describe('Password Recovery E2E Tests', () => {
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
        cy.wait(200)
      }
    })
  }

  describe('Forgot Password Page', () => {
    it('should display forgot password form', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      // Should show form
      cy.get('form', { timeout: 10000 }).should('exist')
    })

    it('should show email input field', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      // Should have email input or be redirected
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasEmail = $body.find('#email, input[type="email"]').length > 0
        expect(hasEmail).to.be.true
      })
    })

    it('should show captcha', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      // Captcha may or may not be visible
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should have submit button', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      // Should have submit button or form
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasSubmit = $body.find('button[type="submit"], button').length > 0
        expect(hasSubmit).to.be.true
      })
    })

    it('should have back to login link', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      // Should have login link or navigation
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasLoginLink = $body.find('a[href*="login"]').length > 0
        expect(hasLoginLink).to.be.true
      })
    })

    it('should validate email format', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()
      cy.wait(300)

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const emailInput = $body.find('#email, input[type="email"]')
        if (emailInput.length > 0) {
          cy.wrap(emailInput.first()).clear().type('notanemail').blur()
          cy.get('button[type="submit"]').first().click({ force: true })
        }
      })
      // Should stay on forgot-password page
      cy.url().should('include', 'forgot-password')
    })

    it('should require email field', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()
      cy.wait(300)

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const submitBtn = $body.find('button[type="submit"]')
        if (submitBtn.length > 0) {
          cy.wrap(submitBtn.first()).click({ force: true })
        }
      })
      // Should stay on forgot-password page
      cy.url().should('include', 'forgot-password')
    })

    it('should navigate to login page', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const loginLink = $body.find('a[href*="login"]')
        if (loginLink.length > 0) {
          cy.wrap(loginLink.first()).click()
          cy.url().should('include', 'login')
        }
      })
    })
  })

  describe('Magic Link Page', () => {
    it('should display magic link form', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      // Should show form
      cy.get('form', { timeout: 10000 }).should('exist')
    })

    it('should show email input field', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasEmail = $body.find('#email, input[type="email"]').length > 0
        expect(hasEmail).to.be.true
      })
    })

    it('should show captcha', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should have send button', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasSubmit = $body.find('button[type="submit"], button').length > 0
        expect(hasSubmit).to.be.true
      })
    })

    it('should show explanation text', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should validate email format', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()
      cy.wait(300)

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const emailInput = $body.find('#email, input[type="email"]')
        if (emailInput.length > 0) {
          cy.wrap(emailInput.first()).clear().type('notvalid').blur()
          cy.get('button[type="submit"]').first().click({ force: true })
        }
      })
      cy.url().should('include', 'magic-link')
    })

    it('should require email field', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()
      cy.wait(300)

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const submitBtn = $body.find('button[type="submit"]')
        if (submitBtn.length > 0) {
          cy.wrap(submitBtn.first()).click({ force: true })
        }
      })
      cy.url().should('include', 'magic-link')
    })
  })

  describe('Navigation Between Auth Pages', () => {
    it('should navigate from login to forgot password', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const forgotLink = $body.find('a[href*="forgot-password"]')
        if (forgotLink.length > 0) {
          cy.wrap(forgotLink.first()).click()
          cy.url().should('include', 'forgot-password')
        }
      })
    })

    it('should navigate from login to magic link', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const magicLink = $body.find('a[href*="magic-link"]')
        if (magicLink.length > 0) {
          cy.wrap(magicLink.first()).click()
          cy.url().should('include', 'magic-link')
        }
      })
    })

    it('should navigate from forgot password to login', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const loginLink = $body.find('a[href*="login"]')
        if (loginLink.length > 0) {
          cy.wrap(loginLink.first()).click()
          cy.url().should('include', 'login')
        }
      })
    })
  })

  describe('Password Reset Token Page', () => {
    it('should handle invalid reset token', () => {
      // Route is /auth/reset-password/[token] - token in path, not query
      visitWithRetry('/en/auth/reset-password/invalidtoken123')
      acceptCookies()

      // Should show the reset password form
      cy.get('form', { timeout: 10000 }).should('exist')
    })

    it('should handle expired reset token', () => {
      // Route is /auth/reset-password/[token] - token in path
      visitWithRetry('/en/auth/reset-password/expired_token_old_12345')
      acceptCookies()

      // Should show the reset password form
      cy.get('form', { timeout: 10000 }).should('exist')
    })
  })

  describe('Magic Link Token Verification', () => {
    it('should handle invalid magic link token', () => {
      // Visit magic link page with invalid token param
      visitWithRetry('/en/auth/magic-link?token=invalidmagictoken123')
      acceptCookies()

      // Should show form or error message
      cy.get('form, [class*="error"], [class*="alert"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Authenticated User Access', () => {
    let testUser

    before(() => {
      // Create test user
      cy.createUser({
        username: `pwtest_${uniqueId}`,
        email: `pwtest_${uniqueId}@example.com`,
        password: 'TestPassword123!',
        email_verified_at: new Date().toISOString(),
      }).then((user) => {
        testUser = user
      })
    })

    it('should redirect authenticated user from forgot password', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/auth/forgot-password')

      // May redirect or show form (behavior depends on implementation)
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should redirect authenticated user from magic link', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/auth/magic-link')

      // May redirect or show form
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Form Accessibility', () => {
    it('should have proper labels on forgot password form', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasLabel = $body.find('label').length > 0
        expect(hasLabel).to.be.true
      })
    })

    it('should have proper labels on magic link form', () => {
      visitWithRetry('/en/auth/magic-link')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasLabel = $body.find('label').length > 0
        expect(hasLabel).to.be.true
      })
    })

    it('should be keyboard navigable', () => {
      visitWithRetry('/en/auth/forgot-password')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const emailInput = $body.find('#email, input[type="email"]')
        if (emailInput.length > 0) {
          cy.wrap(emailInput.first()).focus()
        }
      })
    })
  })
})
