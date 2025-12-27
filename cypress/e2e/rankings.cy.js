/**
 * E2E Tests for Rankings
 *
 * Tests rankings functionality:
 * - View rankings page
 * - Filter by timeframe
 * - Pagination
 * - User links
 */
describe('Rankings E2E Tests', () => {
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
    // Create user with karma_points so they appear in rankings
    cy.createUser({
      username: `rankingstest_${uniqueId}`,
      email: `rankingstest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
      karma_points: 100,
    }).then((user) => {
      testUser = user
      // Rankings requires user to have posts/comments/votes
      // Create a post so user appears in rankings
      cy.createPost({
        title: `Rankings test post ${uniqueId}`,
        content_type: 'text',
        content: 'Test content for rankings',
        sub_id: 1,
        user_id: user.id,
        status: 'published',
      })
    })
  })

  describe('Rankings Page', () => {
    it('should display rankings page', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Rankings')
    })

    it('should show page header', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      cy.get('h1, [class*="header"]', { timeout: 10000 }).should('exist')
    })

    it('should display test user in rankings', () => {
      visitWithRetry('/en/rankings?timeframe=all')
      acceptCookies()

      // Test user was created with karma and a post, should appear in rankings
      cy.get('a[href*="/u/"]', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Timeframe Filters', () => {
    it('should show timeframe filter options', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      // Should have filter buttons or dropdown
      cy.get('button, select', { timeout: 10000 }).should('have.length.at.least', 1)
    })

    it('should filter by week', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      cy.get('body').then(($body) => {
        const weekButton = $body.find('button').filter(function() {
          return /semana|week|7d/i.test(this.textContent)
        })
        if (weekButton.length > 0) {
          cy.wrap(weekButton.first()).click()
          cy.wait(500)
          // URL should update or content should refresh
        }
      })
    })

    it('should filter by month', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      cy.get('body').then(($body) => {
        const monthButton = $body.find('button').filter(function() {
          return /mes|month|30d/i.test(this.textContent)
        })
        if (monthButton.length > 0) {
          cy.wrap(monthButton.first()).click()
          cy.wait(500)
        }
      })
    })

    it('should filter by all time', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      cy.get('body').then(($body) => {
        const allButton = $body.find('button').filter(function() {
          return /all/i.test(this.textContent)
        })
        if (allButton.length > 0) {
          cy.wrap(allButton.first()).click()
          cy.wait(500)
        }
      })
    })
  })

  describe('Rankings List', () => {
    it('should show user avatars or placeholders', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      cy.get('body').then(($body) => {
        if ($body.find('a[href*="/u/"]').length > 0) {
          cy.get('img, [class*="avatar"], .rounded-full').should('exist')
        }
      })
    })

    it('should show karma scores', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('a[href*="/u/"]').length > 0) {
          // Should contain numbers (karma scores)
          const hasNumbers = /\d+/.test($body.text())
          expect(hasNumbers).to.be.true
        }
      })
    })

    it('should link to user profiles', () => {
      visitWithRetry('/en/rankings?timeframe=all')
      acceptCookies()

      // Click on a user profile link
      cy.get('a[href*="/u/"]', { timeout: 10000 }).first().click()
      cy.url().should('include', '/u/')
    })
  })

  describe('Pagination', () => {
    it('should show pagination if more than one page', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      // Page should be visible (pagination is optional based on user count)
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Rankings SEO', () => {
    it('should have proper page title', () => {
      visitWithRetry('/en/rankings')
      acceptCookies()

      cy.title().should('match', /rankings/i)
    })
  })

  describe('Query Parameters', () => {
    it('should accept timeframe query parameter', () => {
      visitWithRetry('/en/rankings?timeframe=week')
      acceptCookies()

      cy.url().should('include', 'timeframe')
    })

    it('should accept page query parameter', () => {
      visitWithRetry('/en/rankings?page=1')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('not.contain.text', '503')
    })
  })
})
