/**
 * E2E Tests for Karma Page
 *
 * Tests karma explanation page:
 * - Page display
 * - Sections visibility
 * - Levels table
 * - Examples
 */
describe('Karma Page E2E Tests', () => {
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

  describe('Karma Page Display', () => {
    it('should display karma page with title', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Page should contain karma text
      cy.contains('karma', { matchCase: false, timeout: 10000 }).should('be.visible')
    })

    it('should show description paragraphs', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Page should have description paragraphs
      cy.get('p', { timeout: 10000 }).should('have.length.at.least', 1)
    })

    it('should show beta notice', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Should have yellow notice
      cy.get('.bg-yellow-50, [class*="yellow"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Karma Overview Section', () => {
    it('should display overview section', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.contains('karma', { matchCase: false, timeout: 10000 }).should('be.visible')
    })

    it('should show key features list', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Should have list items
      cy.get('ul li', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Karma Mechanics Section', () => {
    it('should show posts mechanics', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.contains('post', { matchCase: false, timeout: 10000 }).should('exist')
    })

    it('should show comments mechanics', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.contains('comment', { matchCase: false, timeout: 10000 }).should('exist')
    })

    it('should show activity section', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.contains(/activit/i, { timeout: 10000 }).should('exist')
    })

    it('should show age decay section', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Should mention decay or age (both are valid terms for this concept)
      cy.get('body', { timeout: 10000 }).should('contain.text', 'decay')
    })
  })

  describe('Community Seals Section', () => {
    it('should show seals section', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.contains('seal', { matchCase: false, timeout: 10000 }).should('exist')
    })

    it('should show seals allocation table', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Should have seals section with table
      cy.get('#community-seals, [id*="seal"], table', { timeout: 10000 }).should('exist')
    })
  })

  describe('Levels Table', () => {
    it('should show levels table', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.get('table', { timeout: 10000 }).should('have.length.at.least', 1)
    })

    it('should show Novice level', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Karma page uses "Novice" for first level (from karma.json)
      cy.contains('Novice', { timeout: 10000 }).should('exist')
    })

    it('should show karma thresholds as numbers', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Tables should contain numbers
      cy.get('table', { timeout: 10000 }).should('contain.text', '0')
    })

    it('should show multipliers', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // Should show multiplier values like 1.0x
      cy.get('body', { timeout: 10000 }).should('contain.text', '1.0')
    })
  })

  describe('Examples Section', () => {
    it('should show examples section', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.contains('example', { matchCase: false, timeout: 10000 }).should('exist')
    })

    it('should show example cards with borders', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.get('.border-l-4, [class*="example"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Simulations Section', () => {
    it('should show simulation or example section', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      // The page shows simulations with user type examples
      cy.contains(/simulation|example/i, { timeout: 10000 }).should('exist')
    })

    it('should show grid layout for user types', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.get('.grid', { timeout: 10000 }).should('exist')
    })
  })

  describe('Technical Details Section', () => {
    it('should have collapsible technical section', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.get('details', { timeout: 10000 }).should('exist')
    })

    it('should expand technical section on click', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.get('details summary', { timeout: 10000 }).first().click()
      cy.get('details[open]').should('exist')
    })

    it('should show formulas when expanded', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.get('details summary', { timeout: 10000 }).first().click()
      cy.wait(500)
      cy.get('pre, code').should('exist')
    })
  })

  describe('SEO', () => {
    it('should have proper page title', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.title().should('contain', 'Karma')
    })
  })

  describe('Navigation', () => {
    it('should be scrollable', () => {
      visitWithRetry('/en/karma')
      acceptCookies()

      cy.scrollTo('bottom')
      cy.wait(500)
      cy.get('body').should('be.visible')
    })

    it('should have seals anchor section', () => {
      visitWithRetry('/en/karma#community-seals')
      acceptCookies()

      cy.get('#community-seals, [id*="seal"]', { timeout: 10000 }).should('exist')
    })
  })
})
