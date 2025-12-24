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
      // Visit permalink and check meta tags before redirect
      cy.request({
        url: `/p/${testPost.uuid}`,
        followRedirect: false,
      }).then((response) => {
        // The page should return 200 with HTML
        expect(response.status).to.eq(200)
        // Check for og:title in the HTML
        expect(response.body).to.include('og:title')
        expect(response.body).to.include(testPost.title)
      })
    })

    it('should have canonical link pointing to slug URL', () => {
      cy.request({
        url: `/p/${testPost.uuid}`,
        followRedirect: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
        // Check for canonical link
        expect(response.body).to.include('rel="canonical"')
        expect(response.body).to.include(`/posts/${testPost.slug}`)
      })
    })

    it('should have twitter:card meta tag', () => {
      cy.request({
        url: `/p/${testPost.uuid}`,
        followRedirect: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.include('twitter:card')
      })
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

      // Should be redirected to home
      cy.url({ timeout: 10000 }).should('satisfy', (url) => {
        return url.endsWith('/') || url.includes('/es') || url.includes('/en')
      })
    })
  })
})
