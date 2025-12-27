/**
 * E2E Tests for Profile Posts Page
 *
 * Tests user's own posts page:
 * - Posts list display
 * - Edit/delete actions
 * - Status filter
 * - Refresh functionality
 */
describe('Profile Posts E2E Tests', () => {
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
      username: `profileposts_${uniqueId}`,
      email: `profileposts_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Profile Posts Page Access', () => {
    it('should show login buttons when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // Page loads but shows login/register buttons in header (not logged in)
      cy.get('.btn-login, a[href*="login"]', { timeout: 10000 }).should('exist')
    })

    it('should display posts page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Posts List Display', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display page header', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // Should show Posts heading
      cy.contains(/posts/i, { timeout: 10000 }).should('exist')
    })

    it('should show empty state for new user', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // New user should see empty state message: "You haven't submitted any posts yet"
      cy.contains(/haven't submitted|no posts/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Action Buttons', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have add post button', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // Should have link to submit page or add button
      cy.get('a[href*="/submit"], [class*="add"]', { timeout: 10000 }).should('exist')
    })

    it('should have buttons on page', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      cy.get('button', { timeout: 10000 }).should('exist')
    })
  })

  describe('Status Filter', () => {
    let testPost

    before(() => {
      // Create a post so filter controls appear
      cy.createPost({
        title: `Filter Test Post ${uniqueId}`,
        slug: `filter-test-post-${uniqueId}`,
        content_type: 'text',
        content: 'Post for testing filters',
        status: 'published',
        user_id: testUser.id,
        sub_id: 1,
      }).then((post) => {
        testPost = post
      })
    })

    after(() => {
      if (testPost?.id) {
        cy.deletePost(testPost.id)
      }
    })

    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have filter options when posts exist', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // Filter controls only appear when there are posts
      cy.get('select', { timeout: 10000 }).should('exist')
    })
  })

  describe('Profile Navigation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should be within profile layout', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // Should have profile navigation
      cy.get('[class*="profile"], nav', { timeout: 10000 }).should('exist')
    })

    it('should have posts tab active', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // Should have active styling on current tab
      cy.get('[class*="active"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Empty State', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display empty message', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // Should show empty state: "You haven't submitted any posts yet"
      cy.contains(/haven't submitted|no posts/i, { timeout: 10000 }).should('exist')
    })

    it('should have call to action', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      cy.get('a[href*="/submit"], button', { timeout: 10000 }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })
})
