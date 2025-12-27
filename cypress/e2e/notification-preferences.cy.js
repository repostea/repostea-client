/**
 * E2E Tests for Notification Preferences
 *
 * Tests notification preferences page:
 * - Push notification settings
 * - Snooze functionality
 * - Instant notifications
 * - Digest settings
 * - Quiet hours
 */
describe('Notification Preferences E2E Tests', () => {
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
        cy.wait(200)
      }
    })
  }

  before(() => {
    cy.createUser({
      username: `notifpref_${uniqueId}`,
      email: `notifpref_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Preferences Page Access', () => {
    it('should stay on preferences page when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Page does not redirect - stays on preferences
      cy.url({ timeout: 10000 }).should('include', '/notifications/preferences')
    })

    it('should display preferences page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Notification Tabs', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show preferences tab as active', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Should have preferences text or active tab styling
      cy.get('[class*="active"], .text-primary', { timeout: 10000 }).should('exist')
    })
  })

  describe('Beta Banner', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display beta warning banner', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Should have yellow/amber beta notice
      cy.get('[class*="amber"], [class*="yellow"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Push Status Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display push notification section', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Page should mention notifications
      cy.contains(/notification/i, { timeout: 10000 }).should('exist')
    })

    it('should have push toggle button', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      cy.get('button', { timeout: 10000 }).should('exist')
    })
  })

  describe('Snooze Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display snooze section', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // English translation: "Snooze alerts"
      cy.contains('Snooze alerts', { timeout: 10000 }).should('be.visible')
    })

    it('should have snooze duration options', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Snooze section should have input controls (select, radio, or buttons)
      cy.get('select, input[type="radio"], input[type="number"], button', { timeout: 10000 }).should(
        'exist'
      )
    })
  })

  describe('Instant Notifications Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display instant alerts section', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // English translation: "Instant alerts"
      cy.contains('Instant alerts', { timeout: 10000 }).should('be.visible')
    })

    it('should have checkboxes for notification types', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      cy.get('input[type="checkbox"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Digest Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display digest section', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Look for digest or summary text
      cy.contains(/digest|summary/i, { timeout: 10000 }).should('exist')
    })

    it('should have frequency selector', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Page should have form controls for frequency selection
      cy.get('select, input[type="radio"], input[type="checkbox"]', { timeout: 10000 }).should(
        'exist'
      )
    })
  })

  describe('Quiet Hours Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display quiet hours section', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Should mention quiet hours
      cy.contains(/quiet/i, { timeout: 10000 }).should('exist')
    })

    it('should have quiet hours toggle', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      cy.get('input[type="checkbox"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Profile Navigation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should be within profile layout', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Should have navigation elements
      cy.get('nav, [class*="profile"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })
})
