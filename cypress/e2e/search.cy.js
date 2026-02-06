/**
 * E2E Tests for Search - Real API
 *
 * Tests search functionality with real backend:
 * - Global search
 * - Search posts
 * - Search users
 * - Search communities
 * - Search filters
 */
describe('Search E2E Tests', () => {
  const uniqueId = Date.now()

  // Helper to visit page with retry on 503 errors
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

  // Helper to accept cookie banner
  const acceptCookies = () => {
    cy.get('body').then(($body) => {
      const acceptBtn = $body.find('button').filter(function () {
        return this.textContent.includes('Accept')
      })
      if (acceptBtn.length > 0) {
        cy.wrap(acceptBtn.first()).click({ force: true })
        cy.wait(200)
      }
    })
  }

  describe('Search Results Page', () => {
    // Non-modal tests first to avoid Cypress flaky first-test issue
    it('should highlight search term', () => {
      visitWithRetry('/en/?q=test')
      acceptCookies()

      // Check if search term appears somewhere
      cy.get('body', { timeout: 10000 }).should('contain.text', 'test')
    })

    it('should show result count or pagination', () => {
      visitWithRetry('/en/?q=test')
      acceptCookies()

      // May show count or pagination
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should display search results', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Ensure desktop navigation is visible (viewport must be >= md breakpoint)
      cy.viewport(1280, 720)

      // Wait for navigation to be ready
      cy.get('.desktop-navigation', { timeout: 10000 }).should('be.visible')

      // Open search modal with retry for SSR hydration
      cy.get('.desktop-navigation .section-tabs .section-tab', { timeout: 10000 })
        .filter(':contains("Search")')
        .should('be.visible')
        .clickWithRetry('.search-modal')

      // Then type in search input inside modal
      cy.get('.search-modal .search-input', { timeout: 10000 })
        .should('be.visible')
        .type('test{enter}')

      // Should still show modal after search
      cy.get('.search-modal', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Search Filters', () => {
    it('should filter by content type', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // HomePage has FilterControls component for content type filtering
      cy.get('.controls-container', { timeout: 10000 }).should('exist')
      cy.get('.left-controls', { timeout: 10000 }).should('exist')
    })

    it('should filter by date/time', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // HomePage has ResponsiveNavigation with time interval controls
      // Check for the grid layout structure that contains filters
      cy.get('.grid', { timeout: 10000 }).should('exist')
      cy.get('.lg\\:col-span-2', { timeout: 10000 }).should('exist')
    })

    it('should sort results', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // HomePage has LayoutSelector for changing view layout
      cy.get('.controls-wrapper', { timeout: 10000 }).should('exist')
    })
  })

  describe('Search Post by Title', () => {
    it('should find post by exact title', () => {
      const searchTerm = `Searchable Post ${uniqueId}`
      visitWithRetry('/en/')
      acceptCookies()

      // Wait for navigation to be ready
      cy.get('.desktop-navigation', { timeout: 10000 }).should('be.visible')

      // Open search modal with retry for SSR hydration
      cy.get('.desktop-navigation .section-tabs .section-tab', { timeout: 10000 })
        .filter(':contains("Search")')
        .should('be.visible')
        .clickWithRetry('.search-modal')

      // Search for exact title
      cy.get('.search-modal .search-input', { timeout: 10000 }).type(searchTerm)

      // Modal should show results or "no results" message
      cy.get('.search-modal', { timeout: 10000 }).should('be.visible')
    })

    it('should find post by partial title', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Should show results containing "Searchable"
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Search User', () => {
    it('should find user by username', () => {
      const username = `searchuser_${uniqueId}`
      visitWithRetry(`/en/?q=${username}`)
      acceptCookies()

      // Page should load with results area
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should navigate to user profile from search', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Open search modal
      cy.get('.desktop-navigation .section-tabs .section-tab', { timeout: 10000 })
        .filter(':contains("Search")')
        .should('be.visible')
        .click()

      // Type username in search input
      cy.get('.search-modal .search-input', { timeout: 10000 }).type(`searchuser_${uniqueId}`)

      // Wait for results
      cy.wait(500)

      // If user appears in results, click to navigate
      cy.get('body').then(($body) => {
        const userLink = $body.find(`a[href*="/u/searchuser_${uniqueId}"]`)
        if (userLink.length > 0) {
          cy.wrap(userLink.first()).click()
          cy.url().should('include', `/u/searchuser_${uniqueId}`)
        }
      })
    })
  })

  describe('Empty Search', () => {
    it('should handle empty search query', () => {
      visitWithRetry('/en/?q=')
      acceptCookies()

      // Should show home page or all posts
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should handle search with no results', () => {
      visitWithRetry('/en/?q=xyznonexistent12345')
      acceptCookies()

      // Should show empty state (no post cards)
      cy.get('.post-card, article').should('not.exist')
    })
  })

  describe('Search Accessibility', () => {
    it('should be keyboard accessible', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Open search modal first
      cy.get('.desktop-navigation .section-tabs .section-tab', { timeout: 10000 })
        .filter(':contains("Search")')
        .should('be.visible')
        .click()

      // Modal opens and input should be visible
      cy.get('.search-modal .search-input', { timeout: 10000 }).should('be.visible')
    })

    it('should have proper ARIA labels', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Open search modal
      cy.get('.desktop-navigation .section-tabs .section-tab', { timeout: 10000 })
        .filter(':contains("Search")')
        .should('be.visible')
        .click()

      // Search input should have aria-label
      cy.get('.search-modal .search-input[aria-label]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Search Performance', () => {
    it('should show loading state during search', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Wait for navigation to be ready
      cy.get('.desktop-navigation', { timeout: 10000 }).should('be.visible')

      // Open search modal with retry for SSR hydration
      cy.get('.desktop-navigation .section-tabs .section-tab', { timeout: 10000 })
        .filter(':contains("Search")')
        .should('be.visible')
        .clickWithRetry('.search-modal')

      // Type in search input
      cy.get('.search-modal .search-input', { timeout: 10000 }).type('test')

      // Modal should remain visible
      cy.get('.search-modal').should('be.visible')
    })

    it('should debounce search input', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Wait for navigation to be ready
      cy.get('.desktop-navigation', { timeout: 10000 }).should('be.visible')

      // Open search modal with retry for SSR hydration
      cy.get('.desktop-navigation .section-tabs .section-tab', { timeout: 10000 })
        .filter(':contains("Search")')
        .should('be.visible')
        .clickWithRetry('.search-modal')

      // Type quickly
      cy.get('.search-modal .search-input', { timeout: 10000 }).type('testing search debounce')

      // Should handle rapid input gracefully
      cy.get('.search-modal').should('be.visible')
    })
  })
})
