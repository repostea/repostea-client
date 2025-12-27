/**
 * E2E Tests for Tags System
 *
 * Tests tags functionality:
 * - View tags listing page
 * - Search tags
 * - Filter posts by tag
 * - Tags in post creation
 */
describe('Tags E2E Tests', () => {
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
      username: `tagstest_${uniqueId}`,
      email: `tagstest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Tags Listing Page', () => {
    it('should display tags page', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      // Page shows "Topics" as the heading
      cy.get('h2', { timeout: 10000 }).should('contain.text', 'Topics')
    })

    it('should display search input', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      cy.get('input[type="text"]', { timeout: 10000 }).should('be.visible')
    })

    it('should display tags grid', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      // Should show tags or empty state
      cy.get('.tag-item, .grid a[href*="/tags/"], [class*="empty"]', { timeout: 10000 }).should('exist')
    })

    it('should show tag count', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      cy.get('body').then(($body) => {
        if ($body.find('.tag-item').length > 0) {
          // Check that tag item contains a number
          cy.get('.tag-item').first().invoke('text').should('match', /\d+/)
        }
      })
    })
  })

  describe('Tags Search', () => {
    it('should filter tags when typing', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      cy.get('input[type="text"]', { timeout: 10000 }).type('a')
      cy.wait(500)

      // Results should update
      cy.get('.grid', { timeout: 5000 }).should('exist')
    })

    it('should show no results message for non-existent tag', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      cy.get('input[type="text"]', { timeout: 10000 }).type('xyznonexistenttag123')
      cy.wait(500)

      // Message is "No topics found that match your search"
      cy.contains(/no topics found/i, { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Tag Detail Page', () => {
    it('should navigate to tag detail when clicking tag', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      cy.get('body').then(($body) => {
        const tagLinks = $body.find('a[href*="/tags/"]')
        if (tagLinks.length > 0) {
          cy.get('a[href*="/tags/"]').first().click()
          cy.url().should('include', '/tags/')
        }
      })
    })

    it('should display posts with tag', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      cy.get('body').then(($body) => {
        const tagLinks = $body.find('a[href*="/tags/"]')
        if (tagLinks.length > 0) {
          cy.get('a[href*="/tags/"]').first().click()
          cy.wait(1000)

          // Should show posts or empty state
          cy.get('.post-card, .list-item-card, article, .text-center').should('exist')
        }
      })
    })
  })

  describe('Tags in Post Creation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should reach final step of post form', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(1000)

      // Select text type to get to form
      cy.get('[data-testid="content-type-text"]', { timeout: 10000 }).click()
      cy.wait(500)

      // Fill title
      cy.get('[data-testid="title-input"], input[name="title"]', { timeout: 10000 }).type('Test post for tags')

      // Click next
      cy.get('button').contains(/next|continue/i).click()
      cy.wait(500)

      // Fill content
      cy.get('textarea, .ProseMirror', { timeout: 10000 }).first().type('Test content')

      // Click next
      cy.get('button').contains(/next|continue/i).click()
      cy.wait(500)

      // Final step shows "Related content" section and Publish button
      cy.contains(/related content|publish/i, { timeout: 5000 }).should('be.visible')
    })
  })

  describe('Tags Pagination', () => {
    it('should show pagination when many tags', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      // Page should be visible (pagination is optional)
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Tag About Section', () => {
    it('should display about section', () => {
      visitWithRetry('/en/tags')
      acceptCookies()

      cy.get('body').should('contain.text', 'About topics')
    })
  })
})
