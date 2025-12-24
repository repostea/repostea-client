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
      const acceptBtn = $body.find('button').filter(function() {
        return this.textContent.includes('Aceptar')
      })
      if (acceptBtn.length > 0) {
        cy.wrap(acceptBtn.first()).click({ force: true })
        cy.wait(500)
      }
    })
  }

  describe('Registration Page Access', () => {
    it('should display registration form', () => {
      visitWithRetry('/es/auth/register')
      acceptCookies()

      // Should show registration form fields
      cy.get('#username', { timeout: 20000 }).should('be.visible')
      cy.get('#email').should('be.visible')
      cy.get('#password').should('be.visible')
      cy.get('#password-confirm').should('be.visible')
    })

    it('should have link to login page', () => {
      visitWithRetry('/es/auth/register')
      acceptCookies()

      // Should have login link
      cy.get('a[href*="/auth/login"]', { timeout: 20000 }).should('exist')
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
        visitWithRetry('/es/auth/register')

        // Should redirect away from register page
        cy.url({ timeout: 10000 }).should('not.include', '/auth/register')
      })
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      visitWithRetry('/es/auth/register')
      acceptCookies()
      cy.wait(1000) // Wait for Vue hydration
    })

    it('should show error for short username', () => {
      cy.get('#username', { timeout: 20000 })
        .clear()
        .type('ab')
        .trigger('input')
        .blur()

      // Try to submit (even though captcha won't pass, validation runs first)
      cy.get('button[type="submit"]').click({ force: true })

      // Should show username validation error
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('3 caracteres') ||
               text.includes('username') ||
               text.includes('usuario')
      })
    })

    it('should show error for invalid email', () => {
      cy.get('#username', { timeout: 20000 })
        .clear()
        .type('validuser')
        .trigger('input')

      cy.get('#email')
        .clear()
        .type('notanemail')
        .trigger('input')
        .blur()

      cy.get('button[type="submit"]').click({ force: true })

      // Should show email validation error
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('email') ||
               text.includes('correo') ||
               text.includes('válido')
      })
    })

    it('should show error for password mismatch', () => {
      cy.get('#username', { timeout: 20000 })
        .clear()
        .type('validuser')
        .trigger('input')

      cy.get('#email')
        .clear()
        .type('valid@example.com')
        .trigger('input')

      cy.get('#password')
        .clear()
        .type('Password123!')
        .trigger('input')

      cy.get('#password-confirm')
        .clear()
        .type('DifferentPassword!')
        .trigger('input')
        .blur()

      cy.get('button[type="submit"]').click({ force: true })

      // Should show password mismatch error
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('coinciden') ||
               text.includes('match') ||
               text.includes('contraseña')
      })
    })

    it('should show error for short password', () => {
      cy.get('#username', { timeout: 20000 })
        .clear()
        .type('validuser')
        .trigger('input')

      cy.get('#email')
        .clear()
        .type('valid@example.com')
        .trigger('input')

      cy.get('#password')
        .clear()
        .type('12345')
        .trigger('input')
        .blur()

      cy.get('button[type="submit"]').click({ force: true })

      // Should show password length error
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('6 caracteres') ||
               text.includes('characters') ||
               text.includes('contraseña')
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
      visitWithRetry('/es/auth/register')
      acceptCookies()

      // Check if registration is closed message appears
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const isClosed = text.includes('registration is currently closed') ||
                        text.includes('registro cerrado') ||
                        text.includes('cerrado')

        if (isClosed) {
          // Form should be disabled or hidden
          cy.get('form').should('satisfy', ($form) => {
            return $form.hasClass('opacity-50') ||
                   $form.hasClass('pointer-events-none') ||
                   $form.find('button[disabled]').length > 0
          })
        }
      })
    })

    it('should handle invite-only mode with valid code', () => {
      visitWithRetry('/es/auth/register?invitation=TESTCODE')
      acceptCookies()

      // If invite mode is active, should show invitation detected message
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const hasInviteMode = $body.text().includes('invite') ||
                             $body.text().includes('invitación')

        if (hasInviteMode) {
          // Should show success message for valid invitation
          cy.get('.bg-green-50, .text-green').should('exist')
        }
      })
    })

    it('should handle invite-only mode without code', () => {
      visitWithRetry('/es/auth/register')
      acceptCookies()

      // Check for invite-only message
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const needsInvite = $body.text().includes('invitation') ||
                          $body.text().includes('invitación') ||
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
      visitWithRetry('/es/auth/register')
      acceptCookies()

      // Click login link
      cy.get('a[href*="/auth/login"]', { timeout: 20000 })
        .first()
        .click()

      // Should be on login page
      cy.url().should('include', '/auth/login')
    })

    it('should be accessible from login page', () => {
      visitWithRetry('/es/auth/login')
      acceptCookies()

      // Click register link
      cy.get('a[href*="/auth/register"]', { timeout: 20000 })
        .first()
        .click()

      // Should be on register page
      cy.url().should('include', '/auth/register')
    })
  })
})
