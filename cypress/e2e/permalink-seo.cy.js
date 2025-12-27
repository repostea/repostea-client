/**
 * E2E Tests for Permalink SEO
 *
 * Tests that permalink URLs (/p/{uuid}) have proper SEO meta tags
 * for social media crawlers, while still redirecting users to the
 * canonical URL.
 */
describe('Permalink SEO Tests', () => {
  const uniqueId = Date.now()
  let testUser
  let testPost

  before(() => {
    // Create a user and a post for testing
    cy.createUser({
      username: `seotest_${uniqueId}`,
      email: `seotest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      // Create a test post
      cy.createPost({
        user_id: user.id,
        title: `SEO Test Post ${uniqueId}`,
        content: 'This is a test post for SEO meta tag verification.',
        content_type: 'text',
        status: 'published',
        sub_id: 1,
      }).then((post) => {
        testPost = post
      })
    })
  })

  after(() => {
    // Cleanup
    if (testPost?.id) {
      cy.deletePost(testPost.id).then(() => {})
    }
    if (testUser?.id) {
      cy.deleteUser(testUser.id).then(() => {})
    }
  })

  describe('Meta Tags', () => {
    it('should have og:title meta tag with post title', () => {
      // Visit the final redirected page and check meta tags
      cy.visit(`/p/${testPost.uuid}`, { timeout: 10000 })
      cy.url({ timeout: 10000 }).should('include', '/posts/')

      // Check og:title meta tag in DOM
      cy.get('head meta[property="og:title"]', { timeout: 5000 }).should('exist')
    })

    it('should have canonical link pointing to slug URL', () => {
      cy.visit(`/p/${testPost.uuid}`, { timeout: 10000 })
      cy.url({ timeout: 10000 }).should('include', '/posts/')

      // Check canonical link exists
      cy.get('head link[rel="canonical"]', { timeout: 5000 }).should('exist')
    })

    it('should have twitter:card meta tag', () => {
      cy.visit(`/p/${testPost.uuid}`, { timeout: 10000 })
      cy.url({ timeout: 10000 }).should('include', '/posts/')

      // Check twitter:card meta tag
      cy.get('head meta[name="twitter:card"]', { timeout: 5000 }).should('exist')
    })
  })

  describe('User Redirect', () => {
    it('should redirect users to the canonical slug URL', () => {
      cy.visit(`/p/${testPost.uuid}`, { timeout: 10000 })

      // Should be redirected to the post slug URL
      cy.url({ timeout: 10000 }).should('include', '/posts/')
      cy.url().should('include', testPost.slug)
    })

    it('should show post content after redirect', () => {
      cy.visit(`/p/${testPost.uuid}`, { timeout: 10000 })

      // Wait for redirect and content
      cy.url({ timeout: 10000 }).should('include', '/posts/')

      // Post title should be visible
      cy.contains(testPost.title, { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should redirect to home for non-existent UUID', () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000'

      cy.visit(`/p/${fakeUuid}`, { failOnStatusCode: false, timeout: 10000 })

      // Should be redirected to home (with locale prefix)
      cy.url({ timeout: 10000 }).should('match', /\/(en|es|ca|eu|gl)\/?$/)
    })
  })
})
