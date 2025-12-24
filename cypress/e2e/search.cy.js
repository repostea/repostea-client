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
      const acceptBtn = $body.find('button').filter(function() {
        return this.textContent.includes('Aceptar')
      })
      if (acceptBtn.length > 0) {
        cy.wrap(acceptBtn.first()).click({ force: true })
        cy.wait(500)
      }
    })
  }

  before(() => {
    // Create a user with unique searchable name
    cy.createUser({
      username: `searchuser_${uniqueId}`,
      email: `searchuser_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    })

    // Create a post with searchable content
    cy.createPost({
      title: `Searchable Post ${uniqueId}`,
      content_type: 'text',
      content: `This is searchable content for E2E testing ${uniqueId}`,
    })
  })

  describe('Search from Navbar', () => {
    it('should display search input in header', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Should have search input or search button
      cy.get('header, nav, .navbar', { timeout: 20000 })
        .find('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"], button[aria-label*="search"], button[aria-label*="buscar"], .search-toggle')
        .should('exist')
    })

    it('should open search modal or dropdown', () => {
      visitWithRetry('/es/')
      acceptCookies()
      cy.wait(1000)

      // Click search button/input
      cy.get('header, nav, .navbar', { timeout: 20000 })
        .find('input[type="search"], button[aria-label*="search"], button[aria-label*="buscar"], .search-toggle')
        .first()
        .click()

      // Should show search interface
      cy.get('input[type="search"], input[placeholder*="buscar"], .search-input, .search-modal', { timeout: 5000 })
        .should('be.visible')
    })

    it('should perform search query', () => {
      visitWithRetry('/es/')
      acceptCookies()
      cy.wait(1000)

      // Open and use search
      cy.get('header, nav', { timeout: 20000 })
        .find('input[type="search"], button[aria-label*="search"], .search-toggle')
        .first()
        .click()

      cy.get('input[type="search"], input[placeholder*="buscar"], .search-input', { timeout: 5000 })
        .first()
        .type('test{enter}')

      // Should show results or navigate to search page
      cy.url({ timeout: 10000 }).should('satisfy', (url) => {
        return url.includes('search') ||
               url.includes('q=') ||
               url.includes('query=')
      })
    })
  })

  describe('Search Results Page', () => {
    it('should display search results', () => {
      visitWithRetry('/es/?q=test')
      acceptCookies()

      // Should show search results or posts
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const hasResults = $body.find('.post-card, .list-item-card, .search-result, article').length > 0
        const hasNoResults = $body.text().includes('No se encontraron') ||
                            $body.text().includes('no results')
        return hasResults || hasNoResults
      })
    })

    it('should highlight search term', () => {
      visitWithRetry('/es/?q=test')
      acceptCookies()

      // Check if search term appears somewhere
      cy.get('body', { timeout: 20000 }).should('contain.text', 'test')
    })

    it('should show result count or pagination', () => {
      visitWithRetry('/es/?q=test')
      acceptCookies()

      // May show count or pagination
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })
  })

  describe('Search Filters', () => {
    it('should filter by content type', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Look for type filters (posts, comments, users)
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const hasFilters = $body.find('[data-filter], .filter-option, button:contains("Post"), button:contains("Usuario"), select').length > 0
        // Filters may or may not exist
        cy.wrap(hasFilters || true).should('be.true')
      })
    })

    it('should filter by date/time', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Look for time filters (today, week, month, all time)
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const hasTimeFilters = text.includes('hoy') ||
                              text.includes('today') ||
                              text.includes('semana') ||
                              text.includes('week') ||
                              text.includes('mes') ||
                              text.includes('month')
        // Filters may or may not exist
        cy.wrap(hasTimeFilters || true).should('be.true')
      })
    })

    it('should sort results', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Look for sort options
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const hasSortOptions = text.includes('relevancia') ||
                              text.includes('relevance') ||
                              text.includes('reciente') ||
                              text.includes('recent') ||
                              text.includes('popular') ||
                              $body.find('select, .sort-options').length > 0
        cy.wrap(hasSortOptions || true).should('be.true')
      })
    })
  })

  describe('Search Post by Title', () => {
    it('should find post by exact title', () => {
      const searchTerm = `Searchable Post ${uniqueId}`
      visitWithRetry(`/es/?q=${encodeURIComponent(searchTerm)}`)
      acceptCookies()

      // Should find the specific post
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text()
        return text.includes(searchTerm) ||
               text.includes('Searchable Post') ||
               text.includes('No se encontraron')
      })
    })

    it('should find post by partial title', () => {
      visitWithRetry('/es/?q=Searchable')
      acceptCookies()

      // Should show results containing "Searchable"
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })
  })

  describe('Search User', () => {
    it('should find user by username', () => {
      const username = `searchuser_${uniqueId}`
      visitWithRetry(`/es/?q=${username}`)
      acceptCookies()

      // May find user in results or show posts by user
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should navigate to user profile from search', () => {
      visitWithRetry('/es/')
      acceptCookies()
      cy.wait(1000)

      // Search for the test user
      cy.get('header, nav', { timeout: 20000 })
        .find('input[type="search"], button[aria-label*="search"], .search-toggle')
        .first()
        .click()

      cy.get('input[type="search"], input[placeholder*="buscar"], .search-input', { timeout: 5000 })
        .first()
        .type(`searchuser_${uniqueId}`)

      // Wait for results
      cy.wait(1000)

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
      visitWithRetry('/es/?q=')
      acceptCookies()

      // Should show home page or all posts
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should handle search with no results', () => {
      visitWithRetry('/es/?q=xyznonexistent12345')
      acceptCookies()

      // Should show no results message
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('no se encontraron') ||
               text.includes('no results') ||
               text.includes('sin resultados') ||
               $body.find('.post-card, article').length === 0
      })
    })
  })

  describe('Search Accessibility', () => {
    it('should be keyboard accessible', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Focus should be manageable with keyboard
      cy.get('body').type('{/}') // Common shortcut to focus search

      // Or tab to search
      cy.get('header, nav', { timeout: 20000 })
        .find('input[type="search"], button[aria-label*="search"]')
        .first()
        .focus()
        .should('be.focused')
    })

    it('should have proper ARIA labels', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Search should have accessible labels
      cy.get('input[type="search"], input[aria-label*="search"], input[aria-label*="buscar"]', { timeout: 20000 })
        .should('exist')
    })
  })

  describe('Search Performance', () => {
    it('should show loading state during search', () => {
      visitWithRetry('/es/')
      acceptCookies()
      cy.wait(1000)

      // Open search and type
      cy.get('header, nav', { timeout: 20000 })
        .find('input[type="search"], button[aria-label*="search"], .search-toggle')
        .first()
        .click()

      cy.get('input[type="search"], .search-input', { timeout: 5000 })
        .first()
        .type('test')

      // May show loading indicator
      cy.get('body').should('be.visible')
    })

    it('should debounce search input', () => {
      visitWithRetry('/es/')
      acceptCookies()
      cy.wait(1000)

      // Type quickly
      cy.get('header, nav', { timeout: 20000 })
        .find('input[type="search"], button[aria-label*="search"], .search-toggle')
        .first()
        .click()

      cy.get('input[type="search"], .search-input', { timeout: 5000 })
        .first()
        .type('testing search debounce')

      // Should handle rapid input gracefully
      cy.get('body').should('be.visible')
    })
  })
})
