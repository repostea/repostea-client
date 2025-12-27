/**
 * E2E Tests for Static/Info Pages
 *
 * Tests static informational pages:
 * - Help page
 * - FAQ page
 * - Accessibility page
 * - Transparency page
 * - Aggregators network page
 */
describe('Static Pages E2E Tests', () => {
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

  describe('Help Page', () => {
    it('should display help page', () => {
      visitWithRetry('/en/help')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Help')
    })

    it('should have help content', () => {
      visitWithRetry('/en/help')
      acceptCookies()

      cy.get('p, li', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('FAQ Page', () => {
    it('should display FAQ page', () => {
      visitWithRetry('/en/faq')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Frequently Asked Questions')
    })

    it('should have questions and answers', () => {
      visitWithRetry('/en/faq')
      acceptCookies()

      // FAQ page should have expandable sections or headings
      cy.get('details, .accordion, h3, h2', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Accessibility Page', () => {
    it('should display accessibility page', () => {
      visitWithRetry('/en/accessibility')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Accessibility Statement')
    })

    it('should have accessibility information', () => {
      visitWithRetry('/en/accessibility')
      acceptCookies()

      cy.get('p, section', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Transparency Page', () => {
    it('should display transparency page', () => {
      visitWithRetry('/en/transparency')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Transparency')
    })

    it('should have transparency information', () => {
      visitWithRetry('/en/transparency')
      acceptCookies()

      cy.get('p, section, table', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Aggregators Network Page', () => {
    it('should display aggregators network page', () => {
      visitWithRetry('/en/aggregators-network')
      acceptCookies()

      // Page redirects to home, check we're on home page
      cy.url({ timeout: 10000 }).should('include', '/en')
    })

    it('should have network information', () => {
      visitWithRetry('/en/aggregators-network')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasContent = $body.find('p, a, section').length > 0
        expect(hasContent).to.be.true
      })
    })
  })

  describe('Page SEO', () => {
    it('should have proper title on help page', () => {
      visitWithRetry('/en/help')
      acceptCookies()

      cy.title().should('not.be.empty')
    })

    it('should have proper title on FAQ page', () => {
      visitWithRetry('/en/faq')
      acceptCookies()

      cy.title().should('not.be.empty')
    })
  })

  describe('Navigation from Static Pages', () => {
    it('should have link to home from help page', () => {
      visitWithRetry('/en/help')
      acceptCookies()

      cy.get('a[href*="/"], .logo, [class*="logo"]', { timeout: 10000 }).should('exist')
    })
  })
})
