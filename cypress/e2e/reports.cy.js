/**
 * E2E Tests for Reports System
 *
 * Tests legal/content reporting:
 * - Report form display
 * - Form validation
 * - Report types
 * - Copyright specific fields
 */
describe('Reports E2E Tests', () => {
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
      username: `reportstest_${uniqueId}`,
      email: `reportstest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Report Page Access', () => {
    it('should display report page', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Report content')
    })

    it('should show report form', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('form', { timeout: 10000 }).should('exist')
    })
  })

  describe('Report Form Fields', () => {
    it('should show report type selector', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('select', { timeout: 10000 }).should('exist')
    })

    it('should show content URL field', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('input[type="url"]', { timeout: 10000 }).should('exist')
    })

    it('should show reporter name field', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('input[autocomplete="name"], input[type="text"]', { timeout: 10000 }).should('exist')
    })

    it('should show reporter email field', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('input[type="email"]', { timeout: 10000 }).should('exist')
    })

    it('should show description textarea', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('textarea', { timeout: 10000 }).should('exist')
    })

    it('should show legal checkbox', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('input[type="checkbox"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Report Types', () => {
    it('should have copyright option', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('select option[value="copyright"]', { timeout: 10000 }).should('exist')
    })

    it('should have illegal content option', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('select option[value="illegal"]', { timeout: 10000 }).should('exist')
    })

    it('should have harassment option', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('select option[value="harassment"]', { timeout: 10000 }).should('exist')
    })

    it('should have spam option', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('select option[value="spam"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Copyright Specific Fields', () => {
    it('should show copyright fields when copyright type selected', () => {
      // Use query parameter to pre-select copyright type (works with Vue reactivity)
      visitWithRetry('/en/report?type=copyright')
      acceptCookies()

      // Verify the select has copyright value
      cy.get('select', { timeout: 10000 }).should('have.value', 'copyright')

      // Copyright section should appear - check for the copyright info heading
      cy.contains('Copyright information', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Form Validation', () => {
    it('should require report type', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('select', { timeout: 10000 }).should('have.attr', 'required')
    })

    it('should require content URL', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('input[type="url"]').should('have.attr', 'required')
    })

    it('should require reporter email', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('input[type="email"]').should('have.attr', 'required')
    })

    it('should require description', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('textarea').should('have.attr', 'required')
    })
  })

  describe('Report with URL Parameter', () => {
    it('should prefill URL from query parameter', () => {
      const testUrl = 'https://example.com/test-post'
      visitWithRetry(`/es/report?url=${encodeURIComponent(testUrl)}`)
      acceptCookies()

      cy.get('input[type="url"]', { timeout: 10000 }).should('have.value', testUrl)
    })

    it('should prefill type from query parameter', () => {
      visitWithRetry('/en/report?type=spam')
      acceptCookies()

      cy.get('select', { timeout: 10000 }).should('have.value', 'spam')
    })
  })

  describe('CAPTCHA', () => {
    it('should show captcha component', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      // Turnstile captcha should exist
      cy.get('[class*="turnstile"], [class*="captcha"], iframe', { timeout: 10000 }).should('exist')
    })

    it('should disable submit button without captcha', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('button[type="submit"]', { timeout: 10000 }).should('be.disabled')
    })
  })

  describe('Privacy Notice', () => {
    it('should show privacy notice', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Personal data protection')
    })
  })

  describe('Cancel Action', () => {
    it('should have cancel link', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('a')
        .contains(/cancel/i, { timeout: 10000 })
        .should('exist')
    })

    it('should navigate to home when canceling', () => {
      visitWithRetry('/en/report')
      acceptCookies()

      cy.get('a')
        .contains(/cancel/i)
        .click()

      // Accept both /en and /en/ (with or without trailing slash)
      cy.url().should('match', /\/en\/?$/)
    })
  })
})
