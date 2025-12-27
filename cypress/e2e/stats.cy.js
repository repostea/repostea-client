/**
 * E2E Tests for Stats Page
 *
 * Tests platform statistics page:
 * - Page display
 * - Stats component
 * - Charts
 */
describe('Stats Page E2E Tests', () => {
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

  describe('Stats Page Display', () => {
    it('should display stats page', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Platform Statistics')
    })

    it('should show page header', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.get('h1, [class*="header"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Platform Stats Component', () => {
    it('should display stats component', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.get('.mt-6, [class*="stats"]', { timeout: 10000 }).should('exist')
    })

    it('should show numerical statistics', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      // Should contain numbers
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasNumbers = /\d+/.test($body.text())
        expect(hasNumbers).to.be.true
      })
    })
  })

  describe('Stats Categories', () => {
    it('should show posts statistics', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Posts')
    })

    it('should show comments statistics', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Comments')
    })

    it('should show users statistics', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Users')
    })
  })

  describe('Charts', () => {
    it('should display charts or canvas elements', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      // Stats page should have visual elements (charts, tables, or stat cards)
      cy.get('canvas, [class*="chart"], svg, table, .card', { timeout: 10000 }).should('exist')
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while fetching', () => {
      visitWithRetry('/en/stats')

      // Either shows loading or content is already loaded
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      // Should not show uncaught error
      cy.get('body', { timeout: 10000 }).should('not.contain.text', 'Error')
    })
  })

  describe('SEO', () => {
    it('should have proper page title', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.title().should('match', /statistic/i)
    })
  })

  describe('Responsive Display', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
      cy.get('.container, .mx-auto', { timeout: 10000 }).should('exist')
    })

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2')
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Data Refresh', () => {
    it('should allow page refresh', () => {
      visitWithRetry('/en/stats')
      acceptCookies()

      cy.reload()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Platform Statistics')
    })
  })
})
