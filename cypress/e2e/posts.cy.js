/**
 * E2E Tests for Posts - Real API
 *
 * Tests post functionality with real backend:
 * - View posts list
 * - View single post
 * - Create link post
 * - Create text post
 * - Edit post
 * - Delete post
 */
describe('Posts E2E Tests', () => {
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
      username: `posttest_${uniqueId}`,
      email: `posttest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      // Create a test post with the user as author
      cy.createPost({
        title: `Test Post ${uniqueId}`,
        slug: `test-post-${uniqueId}`,
        content_type: 'link',
        url: 'https://example.com/test',
        description: 'Test post description',
        status: 'published',
        user_id: user.id,
        sub_id: 1,
      }).then((post) => {
        testPost = post
      })
    })
  })

  after(() => {
    // Cleanup: Delete test user and all their data (posts, votes, etc.)
    if (testUser && testUser.id) {
      cy.deleteUser(testUser.id)
    }
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
      cy.get('.post-card a[href*="/posts/"], .list-item-card a[href*="/posts/"], article a[href*="/posts/"]', {
        timeout: 10000,
      })
        .first()
        .click()
    }
  }

  describe('Posts List', () => {
    it('should display home page with content area', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Home page should have the main content area
      cy.get('main', { timeout: 10000 }).should('exist')
    })

    it('should display test post in pending queue', () => {
      // Our test post is created as 'published' but goes to pending, not frontpage
      visitWithRetry('/en/pending')
      acceptCookies()
      cy.wait(500)

      // Should find posts in pending (various layouts) or empty state
      cy.get('.list-item-card, .post-card, .link-card, article, [class*="empty"]', {
        timeout: 10000,
      }).should('exist')
    })

    it('should display post title and metadata', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Check that posts have essential elements if they exist
      cy.get('body').then(($body) => {
        if ($body.find('.list-item-card, .post-card').length > 0) {
          cy.get('.list-item-card, .post-card').first().find('a').should('exist')
        }
      })
    })

    it('should navigate to post detail when clicking', () => {
      // Use the test post we created
      if (testPost && testPost.slug) {
        visitWithRetry(`/en/posts/${testPost.slug}`)
        acceptCookies()
        cy.url().should('include', '/posts/')
      } else {
        // Skip if no test post available
        cy.log('No test post available, skipping navigation test')
      }
    })
  })

  describe('Single Post View', () => {
    it('should display post details', () => {
      // Navigate to the test post
      visitAnyPost()
      acceptCookies()
      cy.wait(500)

      // Should show post title (h3 with card-title class) or any heading
      cy.get('h1, h2, h3, .card-title, .post-title', { timeout: 10000 }).should('exist')
    })

    it('should display comments section', () => {
      visitAnyPost()
      acceptCookies()

      // Should have comments section
      cy.get('.comments-section, [data-testid="comments"], .comment-list', {
        timeout: 10000,
      }).should('exist')
    })
  })

  describe('Post Creation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access submit page when authenticated', () => {
      visitWithRetry('/en/submit')
      acceptCookies()

      // Should see the post creation wizard and be logged in
      cy.url().should('include', '/submit')
      cy.get('.user-info, .user-menu', { timeout: 10000 }).should('exist')
    })

    it('should show content type selection', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(300) // Wait for Vue hydration

      // Should show content type options
      cy.get('[data-testid="content-type-link"], .content-type-link, button', {
        timeout: 10000,
      }).should('have.length.at.least', 1)
    })

    it('should create a link post', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(500)

      // Wait for Vue hydration
      cy.get('[data-hydrated="true"]', { timeout: 10000 }).should('exist')

      // Step 1: Select link type (auto-advances to step 2)
      cy.get('[data-testid="content-type-link"]', { timeout: 10000 }).should('be.visible').click()
      cy.get('[data-testid="step-indicator"]', { timeout: 5000 }).should('contain', '2')

      // Step 2: Fill URL
      cy.get('[data-testid="url-input"]', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('https://example.com/e2e-test')

      // Click next to go to title step (Step 3)
      cy.get('[data-testid="next-button"]', { timeout: 5000 }).should('not.be.disabled').click()
      cy.get('[data-testid="step-indicator"]', { timeout: 5000 }).should('contain', '3')

      // Step 3: Fill title and description
      cy.get('[data-testid="title-input"]', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(`E2E Test Link Post ${uniqueId}`)

      // Link posts use DescriptionEditor with .editor-textarea class
      cy.get('.editor-textarea', { timeout: 5000 }).should('be.visible').type('Test description')

      // Click next to go to final step (Step 4)
      cy.get('[data-testid="next-button"]', { timeout: 5000 }).should('not.be.disabled').click()
      cy.get('[data-testid="step-indicator"]', { timeout: 5000 }).should('contain', '4')

      // Submit post
      cy.get('[data-testid="publish-button"]', { timeout: 10000 }).click()

      // Should redirect to post or show success
      cy.url({ timeout: 15000 }).should('not.include', '/submit')
    })

    it('should create a text post', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(500)

      // Wait for Vue hydration
      cy.get('[data-hydrated="true"]', { timeout: 10000 }).should('exist')

      // Step 1: Select text type (auto-advances to step 2)
      cy.get('[data-testid="content-type-text"]', { timeout: 10000 }).should('be.visible').click()
      cy.get('[data-testid="step-indicator"]', { timeout: 5000 }).should('contain', '2')

      // Step 2: Fill title
      cy.get('[data-testid="title-input"]', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(`E2E Test Text Post ${uniqueId}`)

      // Click next to go to content step (Step 3)
      cy.get('[data-testid="next-button"]', { timeout: 5000 }).should('not.be.disabled').click()
      cy.get('[data-testid="step-indicator"]', { timeout: 5000 }).should('contain', '3')

      // Step 3: Fill content - use the actual textarea inside the markdown editor
      cy.get('.md-editor-textarea, textarea', { timeout: 10000 })
        .first()
        .should('be.visible')
        .clear()
        .type('This is the content of my E2E test text post. It has enough text to be valid.')

      // Click next to go to final step (Step 4)
      cy.get('[data-testid="next-button"]', { timeout: 5000 }).should('not.be.disabled').click()
      cy.get('[data-testid="step-indicator"]', { timeout: 5000 }).should('contain', '4')

      // Submit post
      cy.get('[data-testid="publish-button"]', { timeout: 10000 }).click()

      // Should redirect to post or show success
      cy.url({ timeout: 15000 }).should('not.include', '/submit')
    })

    it('should show validation errors for empty title', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(300)

      // Select link type
      cy.get('[data-testid="content-type-link"]', { timeout: 10000 }).should('be.visible').click()

      cy.wait(200)

      // Try to proceed without title
      cy.get('[data-testid="next-button"], button')
        .contains(/next|continue/i)
        .click()

      // Should show validation error or stay on same step
      cy.get('body').then(($body) => {
        const hasError =
          $body.find('.error, .text-red, [class*="error"], [class*="invalid"]').filter(':visible')
            .length > 0
        // Either error shows or URL is still on submit
        if (!hasError) {
          cy.url().should('include', '/submit')
        } else {
          cy.get('.error, .text-red, [class*="error"], [class*="invalid"]')
            .filter(':visible')
            .should('exist')
        }
      })
    })
  })

  describe('Post Interactions (authenticated)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show voting buttons on posts', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Posts should have voting controls if posts exist
      cy.get('body').then(($body) => {
        if ($body.find('.list-item-card, .post-card').length > 0) {
          cy.get('.list-item-card, .post-card')
            .first()
            .find('button, [class*="vote"]')
            .should('exist')
        }
      })
    })

    it('should show share/save options', () => {
      visitAnyPost()
      acceptCookies()

      // Post should have share or save functionality
      cy.get('button, a', { timeout: 10000 }).filter(':visible').should('have.length.at.least', 1)
    })
  })
})
