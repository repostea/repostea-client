/**
 * E2E Tests for Social Page
 *
 * Tests social/collaboration page:
 * - Page content display
 * - Contact information
 * - Navigation
 */
describe('Social Page E2E Tests', () => {
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

  describe('Social Page Access', () => {
    it('should display social page', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should have page title', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('h1', { timeout: 10000 }).should('exist')
    })
  })

  describe('Page Content', () => {
    it('should display description text', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('p', { timeout: 10000 }).should('have.length.at.least', 1)
    })

    it('should display page content', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      // Social page should have headings and content
      cy.get('h1, h2, h3', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Contact Information', () => {
    it('should display contact email', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('a[href^="mailto:"]', { timeout: 10000 }).should('exist')
    })

    it('should have clickable email link', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('a[href^="mailto:"]', { timeout: 10000 }).then(($link) => {
        expect($link.attr('href')).to.include('mailto:')
      })
    })
  })

  describe('Page Layout', () => {
    it('should have centered content', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('[class*="container"], [class*="mx-auto"]', { timeout: 10000 }).should('exist')
    })

    it('should display card-style content', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('[class*="card"], [class*="rounded"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Navigation', () => {
    it('should have header navigation', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('header, nav', { timeout: 10000 }).should('exist')
    })

    it('should have link to home', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('a[href*="/"], .logo, [class*="logo"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should maintain readable content on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/social')
      acceptCookies()

      cy.get('p', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('SEO', () => {
    it('should have proper page title', () => {
      visitWithRetry('/en/social')
      acceptCookies()

      cy.title().should('not.be.empty')
    })
  })
})
