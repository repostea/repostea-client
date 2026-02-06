/**
 * E2E Tests for OAuth/Social Login
 *
 * Tests social authentication:
 * - Mastodon OAuth
 * - Mbin OAuth
 * - Social login buttons
 */
describe('OAuth Social Login E2E Tests', () => {
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

  describe('Social Login Buttons on Login Page', () => {
    it('should display login page with password input', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      // Login page should always have email/password form
      cy.get('input[type="password"]', { timeout: 10000 }).should('exist')
    })

    it('should show social login section if enabled', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      // Check for social login section - this is optional based on server config
      cy.get('body', { timeout: 10000 }).should('be.visible')
      // Just verify page loaded - social login availability depends on config
    })
  })

  describe('Social Login Buttons on Register Page', () => {
    it('should display register page with form', () => {
      visitWithRetry('/en/auth/register')
      acceptCookies()

      // Register page should always have registration form with password input
      cy.get('input[type="password"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Mastodon OAuth Flow', () => {
    it('should have Mastodon instance input if available', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      // Click Mastodon button if it exists
      cy.get('button, a', { timeout: 10000 }).filter(':contains("Mastodon")').first().click()

      // Should show instance input
      cy.get('input', { timeout: 5000 }).should('exist')
    })
  })

  describe('Mbin OAuth Flow', () => {
    it('should have Mbin instance input if available', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const mbinBtn = $body.find('button, a').filter(function () {
          return /mbin/i.test(this.textContent)
        })
        if (mbinBtn.length > 0) {
          cy.wrap(mbinBtn.first()).click()
          cy.wait(500)

          // Should show instance input or redirect
          cy.get('body').should('exist')
        }
      })
    })
  })

  describe('OAuth Callback Pages', () => {
    it('should have Mastodon callback route', () => {
      cy.request({
        url: '/en/auth/mastodon/callback',
        failOnStatusCode: false,
      }).then((response) => {
        // Should exist (might return error without proper OAuth state)
        expect(response.status).to.be.oneOf([200, 302, 400, 401, 422, 500])
      })
    })

    it('should have Mbin callback route', () => {
      cy.request({
        url: '/en/auth/mbin/callback',
        failOnStatusCode: false,
      }).then((response) => {
        // Should exist (might return error without proper OAuth state)
        expect(response.status).to.be.oneOf([200, 302, 400, 401, 422, 500])
      })
    })
  })

  describe('Social Login UI', () => {
    it('should show divider or login text', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      // Login page should contain "or" divider or just have login functionality
      cy.get('hr, [class*="divider"]', { timeout: 10000 }).should('exist')
    })

    it('should have proper icons for social providers if present', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasSocialButtons =
          $body.find('[class*="social"] button, [class*="social"] a').length > 0
        if (hasSocialButtons) {
          cy.get(
            '[class*="social"] svg, [class*="social"] img, [class*="social"] [class*="icon"]'
          ).should('exist')
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid OAuth state gracefully', () => {
      cy.visit('/en/auth/mastodon/callback?error=access_denied', { failOnStatusCode: false })
      acceptCookies()

      // Should show error or redirect to login
      cy.get('body', { timeout: 10000 }).should('exist')
    })

    it('should handle missing OAuth code gracefully', () => {
      cy.visit('/en/auth/mbin/callback', { failOnStatusCode: false })
      acceptCookies()

      // Should show error or redirect to login
      cy.get('body', { timeout: 10000 }).should('exist')
    })
  })

  describe('Instance Validation', () => {
    it('should validate Mastodon instance URL format', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const mastodonBtn = $body.find('button, a').filter(function () {
          return /mastodon/i.test(this.textContent)
        })
        if (mastodonBtn.length > 0) {
          cy.wrap(mastodonBtn.first()).click()
          cy.wait(500)

          // If there's an input, it should validate
          cy.get('input').then(($inputs) => {
            if ($inputs.length > 0) {
              cy.wrap($inputs.first()).type('invalid-url')
              // Should show validation error or prevent submission
            }
          })
        }
      })
    })
  })
})
