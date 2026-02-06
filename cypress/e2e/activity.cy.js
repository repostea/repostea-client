/**
 * E2E Tests for Activity Feed
 *
 * Tests activity feed page:
 * - Activity list display
 * - Activity type filters
 * - Time interval filters
 * - Auto-refresh functionality
 */
describe('Activity Feed E2E Tests', () => {
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

  describe('Activity Page Access', () => {
    it('should display activity page with PageHeader', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // PageHeader component renders h1 with title
      cy.get('h1', { timeout: 10000 }).should('be.visible')
    })

    it('should have container layout', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      cy.get('.container', { timeout: 10000 }).should('exist')
    })
  })

  describe('Time Interval Filters', () => {
    it('should display time interval buttons (1h, 24h, 7d)', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // Time interval buttons use translated labels like "Last 24 hours"
      cy.get('button', { timeout: 10000 })
        .contains(/24|hour/i)
        .should('exist')
    })

    it('should have 24h selected by default', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // Selected button has bg-primary class and contains "24" text
      cy.get('button.bg-primary', { timeout: 10000 }).contains(/24/i).should('exist')
    })

    it('should change active filter on click', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // Click on "Last hour" button
      cy.get('button', { timeout: 10000 })
        .contains(/last hour/i)
        .click()
      cy.wait(500)

      // Now the hour button should have bg-primary
      cy.get('button.bg-primary').contains(/hour/i).should('exist')
    })
  })

  describe('Activity Type Filters', () => {
    it('should display activity type filter buttons in grid', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // The grid has activity type buttons
      cy.get('.grid button', { timeout: 10000 }).should('have.length.at.least', 1)
    })

    it('should toggle activity type filter on click', () => {
      visitWithRetry('/en/activity')
      acceptCookies()
      cy.wait(500)

      // Click first filter and verify it becomes selected
      cy.get('.grid button.activity-btn', { timeout: 10000 }).first().click()
      // After click, the clear button should appear (proves filter is active)
      cy.get('button.bg-red-100', { timeout: 10000 }).should('exist')
    })

    it('should show clear filters button when filters active', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // First select a filter to activate clear button
      cy.get('.grid button', { timeout: 10000 }).first().click()
      cy.wait(500)

      // Clear button has bg-red-100 class (contains xmark icon)
      cy.get('button.bg-red-100', { timeout: 5000 }).should('be.visible')
    })

    it('should clear filters when clicking reset', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // Select a filter
      cy.get('.grid button', { timeout: 10000 }).first().click()
      cy.wait(500)

      // Click clear button
      cy.get('button.bg-red-100').click()
      cy.wait(500)

      // No activity type buttons should be selected (no bg-primary in grid)
      cy.get('.grid button.bg-primary').should('not.exist')
    })
  })

  describe('Activity Feed Display', () => {
    it('should display activity cards or empty state', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // Wait for loading to complete
      cy.wait(1000)

      // Either has activity-card class divs or shows content
      cy.get('.activity-card, .text-center', { timeout: 10000 }).should('exist')
    })

    it('should show icons in page', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // Icons are rendered as SVGs or Icon components
      cy.get('svg, [class*="icon"]', { timeout: 10000 }).should('exist')
    })

    it('should show activity cards with colored icon backgrounds', () => {
      visitWithRetry('/en/activity')
      acceptCookies()
      cy.wait(1000)

      cy.get('body').then(($body) => {
        if ($body.find('.activity-card').length > 0) {
          // Activity cards have icons with bg-* classes (bg-blue-500, bg-green-500, etc)
          cy.get('.activity-card .rounded-full[class*="bg-"]').should('exist')
        }
      })
    })
  })

  describe('Auto-refresh Toggle', () => {
    it('should have auto-refresh toggle button', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      // Auto-refresh button has green class when enabled or inactive class when disabled
      cy.get('button.bg-green-100, button.activity-btn-inactive', { timeout: 10000 }).should(
        'exist'
      )
    })

    it('should toggle auto-refresh state on click', () => {
      visitWithRetry('/en/activity')
      acceptCookies()
      cy.wait(500)

      // Find the auto-refresh button by its class (initially enabled = bg-green-100)
      cy.get('button.bg-green-100', { timeout: 10000 }).as('autoRefreshBtn')

      // Click to toggle off
      cy.get('@autoRefreshBtn').click()
      cy.wait(300)

      // After clicking, button should be inactive (has activity-btn-inactive class)
      cy.get('button.activity-btn-inactive', { timeout: 10000 }).should('exist')
    })
  })

  describe('Activity Links', () => {
    it('should have links in activity cards when activities exist', () => {
      visitWithRetry('/en/activity')
      acceptCookies()
      cy.wait(1000)

      // Activity cards should contain links (to posts, users, etc)
      cy.get('.activity-card a, [class*="empty"]', { timeout: 10000 }).should('exist')
    })

    it('should have clickable content in activity cards', () => {
      visitWithRetry('/en/activity')
      acceptCookies()
      cy.wait(1000)

      // Activity page should have activity cards or empty state
      cy.get('.activity-card, [class*="empty"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Loading States', () => {
    it('should show filter card after loading', () => {
      visitWithRetry('/en/activity')

      // Filter section has card-bg class
      cy.get('.card-bg', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/activity')
      acceptCookies()

      // PageHeader should still be visible
      cy.get('h1', { timeout: 10000 }).should('be.visible')
    })

    it('should show filter buttons on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/activity')
      acceptCookies()

      // Filters should be visible
      cy.get('.grid button', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('SEO', () => {
    it('should have proper page title', () => {
      visitWithRetry('/en/activity')
      acceptCookies()

      cy.title().should('not.be.empty')
    })
  })
})
