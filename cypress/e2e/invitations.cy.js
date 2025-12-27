/**
 * E2E Tests for Invitations System
 *
 * Tests invitation functionality:
 * - View invitations page
 * - Create invitation button
 * - Stats display
 */
describe('Invitations E2E Tests', () => {
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
      username: `invitetest_${uniqueId}`,
      email: `invitetest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Invitations Page Access', () => {
    it('should require authentication', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/profile/invitations')

      // Page has auth middleware - should redirect to login
      cy.url({ timeout: 10000 }).should('include', '/auth/login')
    })

    it('should show invitations page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/invitations')
      acceptCookies()

      // Page should have title h2
      cy.get('h2', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Invitations Stats', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display stats grid with 3 sections', () => {
      visitWithRetry('/en/profile/invitations')
      acceptCookies()

      // Stats grid has 3 columns with invitations-stats-bg class
      cy.get('.invitations-stats-bg', { timeout: 10000 }).should('have.length', 3)
    })

    it('should display numeric counts in stats', () => {
      visitWithRetry('/en/profile/invitations')
      acceptCookies()

      // Stats sections have numbers (or ∞)
      cy.get('.invitations-stats-bg .text-2xl', { timeout: 10000 }).should('have.length', 3)
    })
  })

  describe('Create Invitation Button', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show create invitation button', () => {
      visitWithRetry('/en/profile/invitations')
      acceptCookies()

      // Create button has bg-primary class and plus icon
      cy.get('button.bg-primary', { timeout: 10000 }).should('exist')
    })

    it('should have plus icon in create button', () => {
      visitWithRetry('/en/profile/invitations')
      acceptCookies()

      // Button contains icon for plus
      cy.get('button.bg-primary svg, button.bg-primary [class*="icon"]', { timeout: 10000 }).should(
        'exist'
      )
    })
  })

  describe('Invitations List', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show my invitations section', () => {
      visitWithRetry('/en/profile/invitations')
      acceptCookies()

      // Section has h3 for "my invitations"
      cy.get('h3', { timeout: 10000 }).should('be.visible')
    })

    it('should show list or empty state', () => {
      visitWithRetry('/en/profile/invitations')
      acceptCookies()

      // Should show invitations or empty state
      cy.get('.invitations-code-bg, .text-gray-500, [class*="empty"]', { timeout: 10000 }).should('exist')
    })
  })
})
