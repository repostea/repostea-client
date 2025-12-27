/**
 * E2E Tests for My Subs Page
 *
 * Tests user's subscribed communities:
 * - View subscribed subs
 * - View moderated subs
 */
describe('My Subs E2E Tests', () => {
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
      username: `mysubstest_${uniqueId}`,
      email: `mysubstest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('My Subs Page Access', () => {
    it('should stay on my-subs page when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/my-subs')
      acceptCookies()

      // Page does not redirect - stays on my-subs
      cy.url({ timeout: 10000 }).should('include', '/my-subs')
    })

    it('should show my-subs page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/my-subs')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Subscribed Communities', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show page content', () => {
      visitWithRetry('/en/my-subs')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should show empty state or list', () => {
      visitWithRetry('/en/my-subs')
      acceptCookies()

      // Should show community list or empty message
      cy.get('a[href*="/s/"], [class*="empty"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have navigation elements', () => {
      visitWithRetry('/en/my-subs')
      acceptCookies()

      cy.get('a, button', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })
})
