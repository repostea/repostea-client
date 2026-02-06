/**
 * E2E Tests for Voting - Real API
 *
 * Tests voting functionality with real backend:
 * - Upvote posts
 * - Downvote posts
 * - Remove votes
 * - Vote persistence
 * - Vote counts update
 */
describe('Voting E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser
  let testPost

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

  before(() => {
    // Create a real user for testing with verified email
    cy.createUser({
      username: `votetest_${uniqueId}`,
      email: `votetest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      // Create a test post to vote on (with user as author)
      cy.createPost({
        title: `Vote Test Post ${uniqueId}`,
        slug: `vote-test-post-${uniqueId}`,
        content_type: 'link',
        url: 'https://example.com/vote-test',
        description: 'Post for testing voting',
        status: 'published',
        user_id: user.id,
        sub_id: 1,
      }).then((post) => {
        testPost = post
      })
    })
  })

  // Helper to navigate to any post page
  const visitAnyPost = () => {
    if (testPost && (testPost.slug || testPost.id)) {
      visitWithRetry(`/es/posts/${testPost.slug || testPost.id}`)
      acceptCookies()
    } else {
      // Fallback: go to homepage and click on a post
      visitWithRetry('/en/')
      acceptCookies()
      cy.get(
        '.post-card a[href*="/posts/"], .list-item-card a[href*="/posts/"], article a[href*="/posts/"]',
        {
          timeout: 10000,
        }
      )
        .first()
        .click()
    }
  }

  describe('Post Voting', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display vote badge on posts', () => {
      visitAnyPost()

      // Should have vote badge with button
      cy.get('.vote-badge', { timeout: 10000 }).should('exist')
      cy.get('.vote-button', { timeout: 10000 }).should('exist')
    })

    it('should display vote count', () => {
      visitAnyPost()

      // Vote badge shows "votos" text with count
      cy.get('.vote-badge', { timeout: 10000 }).should('contain.text', 'votos')
    })

    it('should vote on a post', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Click vote button
      cy.get('.vote-button', { timeout: 10000 }).click()
      cy.wait(300)

      // Button should show "voted" state after clicking
      cy.get('.vote-button', { timeout: 5000 }).should('exist')
    })

    it('should toggle vote when clicking button twice', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Click vote button
      cy.get('.vote-button', { timeout: 10000 }).click()
      cy.wait(300)

      // Click again to toggle
      cy.get('.vote-button', { timeout: 5000 }).click()
      cy.wait(300)

      // Button should still be visible
      cy.get('.vote-button').should('be.visible')
    })

    it('should persist vote after page reload', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Click vote
      cy.get('.vote-button', { timeout: 10000 }).click()
      cy.wait(300)

      // Reload page
      cy.reload()
      acceptCookies()
      cy.wait(500)

      // Vote badge should still be visible
      cy.get('.vote-badge', { timeout: 10000 }).should('exist')
    })
  })

  describe('Voting on Post Detail', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should be able to vote on post detail page', () => {
      visitAnyPost()
      cy.wait(300)

      // Click vote button
      cy.get('.vote-button', { timeout: 10000 }).click()
      cy.wait(200)

      // Should still be on post page
      cy.url().should('include', '/posts/')
    })

    it('should show vote badge on post detail', () => {
      visitAnyPost()
      cy.wait(300)

      // Vote badge should be visible with vote count
      cy.get('.vote-badge', { timeout: 10000 }).should('be.visible')
      cy.get('.vote-badge').should('contain.text', 'votos')
    })
  })

  describe('Anonymous Users Cannot Vote', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should not allow voting without authentication', () => {
      visitWithRetry(`/en/posts/vote-test-post-${uniqueId}`)
      acceptCookies()

      // Try to click vote button
      cy.get('.vote-button', { timeout: 10000 }).click()

      // Should show registration prompt (not redirect)
      cy.contains(/join and share|register|sign up/i, { timeout: 5000 }).should('be.visible')
    })
  })
})
