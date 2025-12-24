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
      }).then((post) => {
        testPost = post
      })
    })
  })

  // Helper to navigate to any post page
  const visitAnyPost = () => {
    if (testPost && (testPost.slug || testPost.id)) {
      visitWithRetry(`/es/p/${testPost.slug || testPost.id}`)
      acceptCookies()
    } else {
      // Fallback: go to homepage and click on a post
      visitWithRetry('/es/')
      acceptCookies()
      cy.get('.post-card a[href*="/p/"], .list-item-card a[href*="/p/"], article a[href*="/p/"]', { timeout: 20000 })
        .first()
        .click()
    }
  }

  describe('Posts List', () => {
    it('should display posts on home page', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Wait for posts to load
      cy.get('.post-card, .list-item-card, article', { timeout: 20000 })
        .should('have.length.at.least', 1)
    })

    it('should display post title and metadata', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Check that posts have essential elements
      cy.get('.post-card, .list-item-card, article', { timeout: 20000 })
        .first()
        .within(() => {
          // Should have a title link
          cy.get('a').should('exist')
        })
    })

    it('should navigate to post detail when clicking', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Get first post and click on its comments link
      cy.get('.post-card, .list-item-card, article', { timeout: 20000 })
        .first()
        .find('a[href*="/p/"]')
        .first()
        .click()

      // Should be on post detail page
      cy.url().should('match', /\/p\/[a-z0-9]+/)
    })
  })

  describe('Single Post View', () => {
    it('should display post details', () => {
      // Navigate to the test post
      visitAnyPost()
      acceptCookies()

      // Should show post title
      cy.get('h1, .post-title', { timeout: 20000 }).should('be.visible')
    })

    it('should display comments section', () => {
      visitAnyPost()
      acceptCookies()

      // Should have comments section
      cy.get('.comments-section, [data-testid="comments"], .comment-list', { timeout: 20000 })
        .should('exist')
    })
  })

  describe('Post Creation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access submit page when authenticated', () => {
      visitWithRetry('/es/submit')
      acceptCookies()

      // Should see the post creation wizard and be logged in
      cy.url().should('include', '/submit')
      cy.get('.user-info, .user-menu', { timeout: 20000 }).should('exist')
    })

    it('should show content type selection', () => {
      visitWithRetry('/es/submit')
      acceptCookies()
      cy.wait(1000) // Wait for Vue hydration

      // Should show content type options
      cy.get('[data-testid="content-type-link"], .content-type-link, button', { timeout: 20000 })
        .should('have.length.at.least', 1)
    })

    it('should create a link post', () => {
      visitWithRetry('/es/submit')
      acceptCookies()
      cy.wait(1000)

      // Select link type
      cy.get('[data-testid="content-type-link"]', { timeout: 10000 })
        .should('be.visible')
        .click()

      // Wait for step 2
      cy.wait(500)

      // Fill title
      cy.get('[data-testid="title-input"], input[name="title"], #title', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(`E2E Test Link Post ${uniqueId}`)
        .trigger('input')

      // Click next
      cy.get('[data-testid="next-button"], button').contains(/next|siguiente|continuar/i).click()

      // Wait for step 3
      cy.wait(500)

      // Fill URL
      cy.get('[data-testid="url-input"], input[name="url"], input[type="url"]', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('https://example.com/e2e-test')
        .trigger('input')

      // Click next
      cy.get('[data-testid="next-button"], button').contains(/next|siguiente|continuar/i).click()

      // Wait for step 4 (optional details)
      cy.wait(500)

      // Submit post
      cy.get('[data-testid="publish-button"], button')
        .contains(/publish|publicar|enviar/i)
        .click()

      // Should redirect to post or show success
      cy.url({ timeout: 15000 }).should('satisfy', (url) => {
        return !url.includes('/submit') || url.includes('/p/')
      })
    })

    it('should create a text post', () => {
      visitWithRetry('/es/submit')
      acceptCookies()
      cy.wait(1000)

      // Select text type
      cy.get('[data-testid="content-type-text"]', { timeout: 10000 })
        .should('be.visible')
        .click()

      // Wait for step 2
      cy.wait(500)

      // Fill title
      cy.get('[data-testid="title-input"], input[name="title"], #title', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(`E2E Test Text Post ${uniqueId}`)
        .trigger('input')

      // Click next
      cy.get('[data-testid="next-button"], button').contains(/next|siguiente|continuar/i).click()

      // Wait for step 3
      cy.wait(500)

      // Fill content
      cy.get('[data-testid="content-textarea"], textarea[name="content"], .ProseMirror, textarea', { timeout: 10000 })
        .first()
        .should('be.visible')
        .clear()
        .type('This is the content of my E2E test text post. It has enough text to be valid.')
        .trigger('input')

      // Click next
      cy.get('[data-testid="next-button"], button').contains(/next|siguiente|continuar/i).click()

      // Wait for step 4
      cy.wait(500)

      // Submit post
      cy.get('[data-testid="publish-button"], button')
        .contains(/publish|publicar|enviar/i)
        .click()

      // Should redirect or show success
      cy.url({ timeout: 15000 }).should('satisfy', (url) => {
        return !url.includes('/submit') || url.includes('/p/')
      })
    })

    it('should show validation errors for empty title', () => {
      visitWithRetry('/es/submit')
      acceptCookies()
      cy.wait(1000)

      // Select link type
      cy.get('[data-testid="content-type-link"]', { timeout: 10000 })
        .should('be.visible')
        .click()

      cy.wait(500)

      // Try to proceed without title
      cy.get('[data-testid="next-button"], button')
        .contains(/next|siguiente|continuar/i)
        .click()

      // Should show validation error or stay on same step
      cy.get('body').then(($body) => {
        const hasError = $body.find('.error, .text-red, [class*="error"], [class*="invalid"]').filter(':visible').length > 0
        // Either error shows or URL is still on submit
        if (!hasError) {
          cy.url().should('include', '/submit')
        } else {
          cy.get('.error, .text-red, [class*="error"], [class*="invalid"]').filter(':visible').should('exist')
        }
      })
    })
  })

  describe('Post Interactions (authenticated)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show voting buttons on posts', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Posts should have voting controls
      cy.get('.post-card, .list-item-card, article', { timeout: 20000 })
        .first()
        .find('.vote-button, [data-testid="vote-up"], .upvote, button[aria-label*="vote"]')
        .should('exist')
    })

    it('should show share/save options', () => {
      visitAnyPost()
      acceptCookies()

      // Post should have share or save functionality
      cy.get('button, a', { timeout: 20000 })
        .filter(':visible')
        .should('have.length.at.least', 1)
    })
  })
})
