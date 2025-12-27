/**
 * E2E Tests for Report Flow
 *
 * Tests report status and success pages:
 * - Report status lookup
 * - Success page display
 * - Reference number handling
 */
describe('Report Flow E2E Tests', () => {
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

  describe('Report Status Page', () => {
    it('should display status page', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Report Status')
    })

    it('should have page title', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('h1', { timeout: 10000 }).should('exist')
    })

    it('should have reference number input', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('input[type="text"]', { timeout: 10000 }).should('exist')
    })

    it('should have email input', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('input[type="email"]', { timeout: 10000 }).should('exist')
    })

    it('should have submit button', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('button[type="submit"]', { timeout: 10000 }).should('exist')
    })

    it('should accept reference from URL query', () => {
      visitWithRetry('/en/report/status?ref=REP-20251226-TEST')
      acceptCookies()

      cy.get('input[type="text"]', { timeout: 10000 }).should('have.value', 'REP-20251226-TEST')
    })
  })

  describe('Report Status Form Validation', () => {
    it('should require reference number', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('input[type="text"]', { timeout: 10000 }).should('have.attr', 'required')
    })

    it('should require email', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('input[type="email"]', { timeout: 10000 }).should('have.attr', 'required')
    })
  })

  describe('Report Success Page', () => {
    it('should display success page', () => {
      visitWithRetry('/en/report/success')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Report submitted successfully')
    })

    it('should have success icon', () => {
      visitWithRetry('/en/report/success')
      acceptCookies()

      cy.get('svg, [class*="icon"], [class*="check"]', { timeout: 10000 }).should('exist')
    })

    it('should display next steps', () => {
      visitWithRetry('/en/report/success')
      acceptCookies()

      cy.contains(/next|steps/i, { timeout: 10000 }).should('exist')
    })

    it('should have link to home', () => {
      visitWithRetry('/en/report/success')
      acceptCookies()

      cy.get('a[href="/"], a[href*="/en/"], a[href*="/es/"]', { timeout: 10000 }).should('exist')
    })

    it('should display reference number if provided', () => {
      visitWithRetry('/en/report/success?ref=REP-20251226-TEST')
      acceptCookies()

      // Should show reference number in page or have code element
      cy.get('body', { timeout: 10000 }).should('contain.text', 'REP-20251226-TEST')
    })

    it('should have link to check status', () => {
      visitWithRetry('/en/report/success?ref=REP-20251226-TEST')
      acceptCookies()

      cy.get('a[href*="/status"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Contact Information', () => {
    it('should display contact email on success page', () => {
      visitWithRetry('/en/report/success')
      acceptCookies()

      cy.get('a[href^="mailto:"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Page Layout', () => {
    it('should have centered content on status page', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('[class*="mx-auto"], [class*="max-w"]', { timeout: 10000 }).should('exist')
    })

    it('should have centered content on success page', () => {
      visitWithRetry('/en/report/success')
      acceptCookies()

      cy.get('[class*="mx-auto"], [class*="max-w"], [class*="text-center"]', {
        timeout: 10000,
      }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should display status page correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should display success page correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/report/success')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('SEO', () => {
    it('should have noindex meta on status page', () => {
      visitWithRetry('/en/report/status')
      acceptCookies()

      cy.get('head meta[name="robots"]').should('have.attr', 'content').and('include', 'noindex')
    })

    it('should have noindex meta on success page', () => {
      visitWithRetry('/en/report/success')
      acceptCookies()

      cy.get('head meta[name="robots"]').should('have.attr', 'content').and('include', 'noindex')
    })
  })
})
