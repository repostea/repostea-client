/**
 * E2E Tests for Pending Posts Page
 *
 * Tests pending posts functionality:
 * - Posts list display
 * - Sorting and filtering
 * - Layout options
 * - Infinite scroll
 */
describe('Pending Posts E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser
  let testPost

  before(() => {
    // Create a user and pending post for testing
    cy.createUser({
      username: `pendingtest_${uniqueId}`,
      email: `pendingtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      cy.createPost({
        title: `Pending Test Post ${uniqueId}`,
        slug: `pending-test-post-${uniqueId}`,
        content_type: 'link',
        url: 'https://example.com/pending-test',
        description: 'Post for testing pending page',
        status: 'pending',
        user_id: user.id,
        sub_id: 1,
      }).then((post) => {
        testPost = post
      })
    })
  })

  after(() => {
    if (testPost?.id) {
      cy.deletePost(testPost.id)
    }
    if (testUser?.id) {
      cy.deleteUser(testUser.id)
    }
  })

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

  describe('Pending Page Access', () => {
    it('should display pending posts page', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should have navigation tabs', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Page should have pending text visible
      cy.contains(/pending/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Posts List Display', () => {
    it('should display posts list or empty state', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Should have post cards or empty state message
      cy.get('[class*="post"], [class*="card"], [class*="list-item"], [class*="empty"]', {
        timeout: 10000,
      }).should('exist')
    })

    it('should display post links', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Should have links to posts or headings
      cy.get('a[href*="/posts/"], h2, h3', { timeout: 10000 }).should('exist')
    })

    it('should display vote badges', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Should have vote badge on posts
      cy.get('.vote-badge', { timeout: 10000 }).should('exist')
    })
  })

  describe('Sorting Options', () => {
    it('should have sort controls', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Should have sort dropdown or buttons
      cy.get('[class*="sort"], select, [class*="dropdown"]', { timeout: 10000 }).should('exist')
    })

    it('should allow changing sort order', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      cy.get('button, select', { timeout: 10000 }).then(($controls) => {
        const sortBtn = $controls.filter(function () {
          return /sort|recent|new/i.test(this.textContent)
        })
        if (sortBtn.length > 0) {
          cy.wrap(sortBtn.first()).click()
          cy.wait(500)
        }
      })
    })
  })

  describe('Filter Controls', () => {
    it('should have filter options', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      cy.get('[class*="filter"], button', { timeout: 10000 }).should('exist')
    })

    it('should have content type filter', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Filter control shows "All" by default and expands to show content types
      cy.get('.filter-controls', { timeout: 10000 }).should('exist')
      cy.get('.filter-controls button').should('contain.text', 'All')
    })
  })

  describe('Layout Selector', () => {
    it('should have layout options', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Should have layout switching buttons or grid/list elements
      cy.get('[class*="layout"], [class*="grid"], [class*="list"], button svg', {
        timeout: 10000,
      }).should('exist')
    })
  })

  describe('Language Selector', () => {
    it('should have content language selector', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Should have language filter
      cy.get('[class*="language"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Sidebar Content', () => {
    it('should display sidebar on desktop', () => {
      cy.viewport(1280, 800)
      visitWithRetry('/en/pending')
      acceptCookies()

      // Should have sidebar elements
      cy.get('[class*="sidebar"], [class*="col-span-1"]', { timeout: 10000 }).should('exist')
    })

    it('should show recent comments widget', () => {
      cy.viewport(1280, 800)
      visitWithRetry('/en/pending')
      acceptCookies()

      // Should have comments section in sidebar
      cy.get('[class*="comment"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/pending')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should hide sidebar on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/pending')
      acceptCookies()

      cy.get('.lg\\:block', { timeout: 10000 }).should('not.be.visible')
    })
  })

  describe('SEO', () => {
    it('should have proper page title', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      cy.title().should('not.be.empty')
    })

    it('should have meta description', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      cy.get('head meta[name="description"]').should('exist')
    })
  })

  describe('Navigation', () => {
    it('should navigate to post detail on click', () => {
      visitWithRetry('/en/pending')
      acceptCookies()

      // Click first post link if available
      cy.get('a[href*="/posts/"]', { timeout: 10000 }).first().click()
      cy.url().should('include', '/posts/')
    })
  })
})
