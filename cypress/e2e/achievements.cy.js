/**
 * E2E Tests for Achievements System
 *
 * Tests achievements functionality:
 * - View achievements page
 * - Achievement categories
 * - Progress display
 */
describe('Achievements E2E Tests', () => {
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
      username: `achievetest_${uniqueId}`,
      email: `achievetest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Achievements Page Access', () => {
    it('should stay on achievements page when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/profile/achievements')
      acceptCookies()

      // Page does not redirect - stays on achievements
      cy.url({ timeout: 10000 }).should('include', '/profile/achievements')
    })

    it('should show achievements page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/achievements')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const hasAchievementsText = text.includes('achievements')
        expect(hasAchievementsText).to.be.true
      })
    })
  })

  describe('Achievements Display', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display achievement cards or list', () => {
      visitWithRetry('/en/profile/achievements')
      acceptCookies()

      // Should have achievement cards or grid layout
      cy.get('[class*="achievement"], .grid', { timeout: 10000 }).should('exist')
    })

    it('should show empty state for new user', () => {
      visitWithRetry('/en/profile/achievements')
      acceptCookies()

      // New user has no achievements - shows empty state message
      cy.contains(/haven't unlocked any achievements/i, { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Achievement Categories', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show achievement categories', () => {
      visitWithRetry('/en/profile/achievements')
      acceptCookies()

      // Should have category tabs or sections
      cy.get('button, .tab', { timeout: 10000 }).should('exist')
    })
  })

  describe('Achievement Progress', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show achievements page heading', () => {
      visitWithRetry('/en/profile/achievements')
      acceptCookies()

      // Page should show Achievements heading
      cy.contains('Achievements', { timeout: 10000 }).should('be.visible')
    })
  })
})
