/**
 * E2E Tests for Profile Settings
 *
 * Tests profile settings functionality:
 * - Sessions management
 * - Security settings
 */
describe('Profile Settings E2E Tests', () => {
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
    cy.createUser({
      username: `settingstest_${uniqueId}`,
      email: `settingstest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Settings Page Access', () => {
    it('should redirect to login when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.url({ timeout: 10000 }).should('include', '/auth/login')
    })

    it('should show settings page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Settings')
    })
  })

  describe('Sessions Management', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display active sessions section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).invoke('text').should('match', /sessions/i)
    })

    it('should show current session', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        // Translation is just "Current" badge on current session
        const hasSessions = /current/i.test($body.text())
        expect(hasSessions).to.be.true
      })
    })

    it('should show session details', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      // Should show session info - look for active sessions heading or session list items
      cy.contains(/active sessions|current session/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Security Settings', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display security section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        // Page has "Change Password" section
        const hasSecurity = /security|password|contraseña/i.test($body.text())
        expect(hasSecurity).to.be.true
      })
    })
  })

  describe('Logout Other Sessions', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show sessions section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      // Settings page should have sessions section
      cy.contains('Active sessions', { timeout: 10000 }).should('be.visible')
    })
  })
})
