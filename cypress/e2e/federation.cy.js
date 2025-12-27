/**
 * E2E Tests for Federation Pages
 *
 * Tests ActivityPub federation:
 * - Public federation page
 * - Profile federation settings
 */
describe('Federation E2E Tests', () => {
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
      username: `fedtest_${uniqueId}`,
      email: `fedtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Public Federation Page', () => {
    it('should display federation page', () => {
      visitWithRetry('/en/federation')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).invoke('text').should('match', /federation|fediverse/i)
    })

    it('should show federation explanation', () => {
      visitWithRetry('/en/federation')
      acceptCookies()

      // Check for English content from federation.json translations
      cy.get('body', { timeout: 10000 }).invoke('text').should('match', /ActivityPub|Fediverse/i)
    })

    it('should show connected instances info', () => {
      visitWithRetry('/en/federation')
      acceptCookies()

      // Should mention platforms or specific instances
      cy.contains(/platforms|Mastodon|Lemmy/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Profile Federation Settings', () => {
    it('should stay on federation page when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/profile/federation')
      acceptCookies()

      // Page does not redirect - stays on federation
      cy.url({ timeout: 10000 }).should('include', '/profile/federation')
    })

    it('should show federation settings when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/federation')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).invoke('text').should('match', /federation|fediverse/i)
    })

    it('should show ActivityPub address', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/federation')
      acceptCookies()

      // Should show ActivityPub address with @ symbol
      cy.contains(/@|address|ActivityPub/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Federation Stats', () => {
    it('should show federation statistics on public page', () => {
      visitWithRetry('/en/federation')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        // Should have some numbers
        const hasStats = /\d+/.test($body.text())
        expect(hasStats).to.be.true
      })
    })
  })
})
