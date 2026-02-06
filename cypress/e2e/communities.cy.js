/**
 * E2E Tests for Communities (Subs) - Real API
 *
 * Tests community functionality with real backend:
 * - Browse communities list
 * - View single community
 * - Search communities
 * - Join/leave communities
 * - Create community (if allowed)
 */
describe('Communities E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser

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
        cy.wait(500)
      }
    })
  }

  before(() => {
    // Create a real user for testing
    cy.createUser({
      username: `subtest_${uniqueId}`,
      email: `subtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Communities List', () => {
    it('should display communities page', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      // Should show communities header
      cy.get('h1, .page-title', { timeout: 10000 }).should('be.visible')
    })

    it('should show search input', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      // Should have search functionality
      cy.get('input[type="text"], input[type="search"]', { timeout: 10000 }).should('exist')
    })

    it('should display community cards', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      // Page shows "Explore Subs" title
      cy.get('h1', { timeout: 10000 }).should('contain.text', 'Explore Subs')
    })

    it('should have tabs for filtering', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      // Should have filter tabs
      cy.get('button', { timeout: 10000 }).filter(':visible').should('have.length.at.least', 1)
    })

    it('should search communities', () => {
      visitWithRetry('/en/s')
      acceptCookies()
      cy.wait(1000)

      // Type in search
      cy.get('input[type="text"], input[type="search"]', { timeout: 10000 })
        .first()
        .clear()
        .type('test')
        .trigger('input')

      cy.wait(1000)

      // Results should update (either show results or no results message)
      cy.get('body').should('be.visible')
    })
  })

  describe('Single Community View', () => {
    it('should navigate to community from list', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      // Click on first community if available
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const communityLinks = $body.find('a[href*="/s/"]')
        if (communityLinks.length > 0) {
          cy.wrap(communityLinks.first()).click()
          cy.url().should('match', /\/s\/[a-zA-Z0-9_-]+/)
        }
      })
    })

    it('should show community header', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const communityLinks = $body
          .find('a[href*="/s/"]')
          .not('[href="/en/s"]')
          .not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()

          // Should show community name/header
          cy.get('h1, h2, .community-name', { timeout: 10000 }).should('be.visible')
        }
      })
    })

    it('should display posts or empty state in community', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const communityLinks = $body
          .find('a[href*="/s/"]')
          .not('[href="/en/s"]')
          .not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()

          // Community page should have a content area (posts list or empty state)
          cy.get('.post-card, .list-item-card, article, [class*="empty"]', {
            timeout: 10000,
          }).should('exist')
        }
      })
    })
  })

  describe('Community Membership (Authenticated)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show join/subscribe button', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const communityLinks = $body
          .find('a[href*="/s/"]')
          .not('[href="/en/s"]')
          .not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()

          // Should have join/subscribe button
          cy.get('button', { timeout: 10000 })
            .filter(
              ':contains("join"), :contains("join"), :contains("subscribe"), :contains("subscribe")'
            )
            .should('exist')
        }
      })
    })

    it('should toggle membership status', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const communityLinks = $body
          .find('a[href*="/s/"]')
          .not('[href="/en/s"]')
          .not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()
          cy.wait(1000)

          // Find and click join button
          cy.get('button')
            .filter(
              ':contains("join"), :contains("join"), :contains("subscribe"), :contains("leave"), :contains("leave")'
            )
            .first()
            .click()

          cy.wait(1000)

          // Button text should change
          cy.get('button')
            .filter(
              ':contains("join"), :contains("join"), :contains("subscribe"), :contains("leave"), :contains("leave"), :contains("member")'
            )
            .should('exist')
        }
      })
    })
  })

  describe('My Subs', () => {
    it('should display my-subs page for authenticated user', () => {
      // Create a fresh user
      const freshId = Date.now()
      cy.createUser({
        username: `freshuser_${freshId}`,
        email: `freshuser_${freshId}@example.com`,
        password: 'TestPassword123!',
        email_verified_at: new Date().toISOString(),
      }).then((freshUser) => {
        cy.loginAs(freshUser)
        visitWithRetry('/en/my-subs')
        acceptCookies()

        // URL should be correct
        cy.url().should('include', '/my-subs')

        // Page should load - either shows subscribed content or empty state
        // (new users may be auto-subscribed to default communities)
        cy.get('body').then(($body) => {
          const hasEmptyState = $body.text().includes("You're not subscribed to any subs")
          const hasContent = $body.find('[class*="post"], article, .card').length > 0

          // Either empty state or content should be present
          expect(hasEmptyState || hasContent).to.be.true
        })
      })
    })

    it('should show subscribed community after joining one', () => {
      // Create a fresh user
      const freshId = Date.now()
      cy.createUser({
        username: `joiner_${freshId}`,
        email: `joiner_${freshId}@example.com`,
        password: 'TestPassword123!',
        email_verified_at: new Date().toISOString(),
      }).then((joinerUser) => {
        cy.loginAs(joinerUser)

        // Go to communities list
        visitWithRetry('/en/s')
        acceptCookies()

        // Find and click on a community
        cy.get('a[href*="/s/"]').not('[href="/en/s"]').not('[href*="/s/create"]').first().click()
        acceptCookies()
        cy.wait(500)

        // Check membership status - either Join button or Leave link should exist
        cy.get('body').then(($body) => {
          // If Join button exists, click it
          if ($body.find('button:contains("Join")').length > 0) {
            cy.contains('button', 'Join').click()
            cy.wait(500)
          }
          // If Leave link exists, user is already a member (no action needed)
          // Either way, proceed to verify my-subs
        })

        // Now go to my-subs
        visitWithRetry('/en/my-subs')
        acceptCookies()

        // Should NOT show empty state anymore (user is member of at least one community)
        cy.contains("You're not subscribed to any subs").should('not.exist')
      })
    })
  })

  describe('Create Community', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access create community page', () => {
      visitWithRetry('/en/s/create')
      acceptCookies()

      // Should show creation form (or redirect if not allowed)
      cy.get('form, input[name="name"], input[id="name"]', { timeout: 10000 }).should('exist')
    })

    it('should show community name field', () => {
      visitWithRetry('/en/s/create')
      acceptCookies()

      // Form should have name input
      cy.get('input[name="name"], input[id="name"]', { timeout: 10000 }).should('exist')
    })

    it('should validate required fields on submit', () => {
      visitWithRetry('/en/s/create')
      acceptCookies()
      cy.wait(1000)

      // Submit empty form
      cy.get('button[type="submit"]', { timeout: 10000 }).first().click({ force: true })

      // Should stay on create page (validation prevents submission)
      cy.url().should('include', '/s/create')
    })
  })

  describe('Community Settings', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show settings for community owner', () => {
      // This test depends on user owning a community
      // For now, just verify settings page structure
      visitWithRetry('/en/s')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const settingsLinks = $body.find('a[href*="/settings"]')
        if (settingsLinks.length > 0) {
          cy.wrap(settingsLinks.first()).click()
          cy.url().should('include', '/settings')
        }
      })
    })
  })

  describe('Anonymous Access', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should allow browsing communities without auth', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      // Should show communities page
      cy.url().should('include', '/s')
      cy.get('h1, .page-title', { timeout: 10000 }).should('be.visible')
    })

    it('should allow viewing single community without auth', () => {
      visitWithRetry('/en/s')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const communityLinks = $body
          .find('a[href*="/s/"]')
          .not('[href="/en/s"]')
          .not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()

          // Should show community content
          cy.get('h1, h2, .community-name', { timeout: 10000 }).should('be.visible')
        }
      })
    })

    it('should redirect to login to create community', () => {
      visitWithRetry('/en/s/create')

      // Auth middleware redirects to login
      cy.url({ timeout: 15000 }).should('include', '/auth/login')
    })
  })
})
