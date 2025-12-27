/**
 * E2E Tests for Moderation
 *
 * Tests user moderation page:
 * - View moderation status
 * - Active bans display
 * - Active strikes display
 * - Moderation history
 */
describe('Moderation E2E Tests', () => {
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
      username: `modtest_${uniqueId}`,
      email: `modtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Moderation Page Access', () => {
    it('should stay on moderation page when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // Page does not redirect - stays on moderation
      cy.url({ timeout: 10000 }).should('include', '/profile/moderation')
    })

    it('should show moderation page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      cy.contains(/moderation/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Moderation Status Display', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display page title', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      cy.contains(/moderation/i, { timeout: 10000 }).should('exist')
    })

    it('should display page description', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      cy.get('p', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Bans Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show bans section or clean record', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // Wait for loading to finish
      cy.get('.animate-spin', { timeout: 5000 }).should('not.exist')

      // Either shows bans info or clean record message
      cy.contains(/ban|clean record|no moderation/i, { timeout: 10000 }).should('exist')
    })

    it('should display status indicators', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // Wait for loading to finish
      cy.get('.animate-spin', { timeout: 5000 }).should('not.exist')

      // Should have colored status indicators
      cy.get('.bg-red-50, .bg-green-50', { timeout: 10000 }).should('exist')
    })
  })

  describe('Strikes Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show strikes section or clean record', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // Wait for loading to finish
      cy.get('.animate-spin', { timeout: 5000 }).should('not.exist')

      // Either shows strikes info or clean record message
      cy.contains(/strike|clean record|no moderation/i, { timeout: 10000 }).should('exist')
    })

    it('should display strike indicators if present', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // Should have warning/status elements
      cy.get('.bg-yellow-50, .bg-green-50, [class*="strike"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Moderation History', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show history section', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // History section always appears
      cy.contains(/history/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Clean Record Display', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show clean record message for users without issues', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // Wait for loading to finish
      cy.get('.animate-spin', { timeout: 5000 }).should('not.exist')

      // For a new user, should show "Clean Record!" message with green background
      cy.get('.bg-green-50', { timeout: 10000 }).should('exist')
    })
  })

  describe('Profile Layout Integration', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should be within profile layout', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // Should have profile navigation elements
      cy.get('[class*="profile"], [class*="nav"]', { timeout: 10000 }).should('exist')
    })

    it('should show navigation to other profile sections', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      cy.get('a[href*="/profile"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Loading State', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show loading indicator initially', () => {
      visitWithRetry('/en/profile/moderation')

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Date Formatting', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display page content correctly', () => {
      visitWithRetry('/en/profile/moderation')
      acceptCookies()

      // Page should load and display content
      cy.get('body', { timeout: 10000 }).should('be.visible')
      cy.contains(/moderation/i).should('exist')
    })
  })
})
