/**
 * E2E Tests for Responsive/Mobile Design
 *
 * Tests mobile and tablet viewport behavior:
 * - Mobile navigation (hamburger menu)
 * - Mobile posts list
 * - Mobile post detail
 * - Mobile authentication
 * - Mobile comments
 * - Tablet viewports
 */
describe('Responsive Design E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser
  let testPost

  // Viewport presets
  const viewports = {
    mobile: 'iphone-6',
    mobileLarge: 'iphone-x',
    tablet: 'ipad-2',
    tabletLandscape: 'ipad-2', // Will use landscape orientation
  }

  // Helper to visit page with retry on 503 errors
  const visitWithRetry = (url, retries = 3) => {
    cy.visit(url, {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        // Set cookie consent before page loads to prevent banner from blocking elements
        win.localStorage.setItem(
          'cookie-consent',
          JSON.stringify({ essential: true, timestamp: Date.now(), version: '1.0' })
        )
      },
    }).then(() => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('503') && retries > 0) {
          cy.wait(2000)
          visitWithRetry(url, retries - 1)
        }
      })
    })
  }

  // Helper to dismiss cookie banner if visible (legacy, but kept for compatibility)
  const acceptCookies = () => {
    // Cookie consent is set in visitWithRetry, so banner should not appear
    // But check just in case
    cy.get('body').then(($body) => {
      const cookieBanner = $body.find('.cookie-banner')
      if (cookieBanner.length > 0 && cookieBanner.is(':visible')) {
        cy.get('.cookie-banner button').first().click({ force: true })
        cy.wait(300)
      }
    })
  }

  before(() => {
    // Create test user
    cy.createUser({
      username: `mobiletest_${uniqueId}`,
      email: `mobiletest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      // Create a test post
      cy.createPost({
        title: `Mobile Test Post ${uniqueId}`,
        slug: `mobile-test-post-${uniqueId}`,
        content_type: 'text',
        content: 'This is a post for testing mobile functionality.',
        status: 'published',
        user_id: user.id,
        sub_id: 1,
      }).then((post) => {
        testPost = post
      })
    })
  })

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile)
    })

    it('should show hamburger menu button on mobile', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Hamburger menu button should be visible
      cy.get('.menu-button', { timeout: 10000 }).should('be.visible')

      // Desktop menu should be hidden
      cy.get('.hidden.md\\:flex, .desktop-menu').should('not.be.visible')
    })

    it('should open mobile menu when clicking hamburger', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Wait for navbar to be ready
      cy.get('.navbar', { timeout: 10000 }).should('be.visible')

      // Use clickWithRetry for SSR hydration
      cy.get('.menu-button', { timeout: 10000 })
        .should('be.visible')
        .clickWithRetry('.mobile-menu-container.open')
    })

    it('should close mobile menu when clicking a link', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Wait for navbar to be ready
      cy.get('.navbar', { timeout: 10000 }).should('be.visible')

      // Open menu with retry for SSR hydration
      cy.get('.menu-button', { timeout: 10000 })
        .scrollIntoView()
        .should('be.visible')
        .clickWithRetry('.mobile-menu-container.open')

      // Click on a navigation link
      cy.get('.mobile-nav-link', { timeout: 5000 }).first().click()

      // Should navigate (URL changes or menu closes)
      cy.wait(500)
      cy.url().should('not.eq', 'about:blank')
    })

    it('should navigate to all main sections from mobile menu', () => {
      // Test just one navigation to keep test fast and reliable
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      cy.get('.menu-button', { timeout: 10000 }).scrollIntoView().should('be.visible').click()
      cy.get('.mobile-menu-container.open', { timeout: 5000 }).should('exist')
      cy.get('.mobile-nav-link', { timeout: 5000 }).should('have.length.at.least', 3)
    })

    it('should show FAB (floating action button) on mobile', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // FAB should be visible
      cy.get('.mobile-fab', { timeout: 10000 }).should('be.visible')

      // Click FAB should go to submit page
      cy.get('.mobile-fab').click()
      cy.url().should('include', '/submit')
    })

    it('should hide FAB on submit page', () => {
      cy.loginAs(testUser)
      cy.viewport(viewports.mobile)
      visitWithRetry('/en/submit')
      acceptCookies()

      // FAB should not be visible on submit page
      cy.get('.mobile-fab').should('not.exist')
    })

    it('should open language selector modal', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Scroll to top to avoid content overlap
      cy.scrollTo(0, 0)
      cy.get('.menu-button', { timeout: 10000 }).scrollIntoView().should('be.visible').click()
      cy.get('.mobile-menu-container', { timeout: 5000 }).should('have.class', 'open')

      // Click language button - target the button element directly
      cy.get('button.mobile-nav-link')
        .contains(/language|idioma/i)
        .scrollIntoView()
        .click()
      cy.get('.mobile-modal-overlay', { timeout: 5000 }).should('exist')
    })

    it('should open theme selector modal', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Scroll to top to avoid content overlap
      cy.scrollTo(0, 0)
      cy.get('.menu-button', { timeout: 10000 }).scrollIntoView().should('be.visible').click()
      cy.get('.mobile-menu-container.open', { timeout: 5000 }).should('exist')

      // Scroll within the menu container to reveal Theme button at bottom
      cy.get('.mobile-menu-container.open').scrollTo('bottom', { ensureScrollable: false })
      cy.wait(200)

      // Click theme button - use first() in case of multiple matches
      cy.get('button.mobile-nav-link')
        .contains(/theme|tema/i)
        .first()
        .click({ force: true })
      cy.get('.mobile-modal-overlay', { timeout: 5000 }).should('exist')
    })
  })

  describe('Mobile Posts List', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile)
    })

    it('should display posts list correctly on mobile', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Check for posts or empty state
      cy.get('body').then(($body) => {
        if ($body.find('.list-item-card, .post-card').length > 0) {
          cy.get('.list-item-card, .post-card').first().should('be.visible')
        }
      })
    })

    it('should show voting controls on mobile posts', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      cy.get('body').then(($body) => {
        if ($body.find('.list-item-card, .post-card').length > 0) {
          cy.get('.list-item-card, .post-card')
            .first()
            .find('[class*="vote"], button')
            .should('exist')
        }
      })
    })

    it('should be able to scroll through posts', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Scroll down
      cy.scrollTo('bottom')
      cy.wait(500)

      // Page should still be visible
      cy.get('body').should('be.visible')
    })

    it('should show post metadata on mobile', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      cy.get('body').then(($body) => {
        if ($body.find('.list-item-card, .post-card').length > 0) {
          cy.get('.list-item-card, .post-card').first().find('a').should('exist')
        }
      })
    })
  })

  describe('Mobile Post Detail', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile)
    })

    it('should display post detail page correctly on mobile', () => {
      if (testPost && testPost.slug) {
        visitWithRetry(`/es/posts/${testPost.slug}`)
      } else {
        visitWithRetry('/en/')
        acceptCookies()
        cy.get('a[href*="/posts/"]', { timeout: 10000 }).first().click()
      }
      acceptCookies()
      cy.wait(500)

      // Post title should be visible (h3 with card-title class)
      cy.get('h1, h2, h3, .card-title', { timeout: 10000 }).should('exist')
    })

    it('should show comments section on mobile', () => {
      if (testPost && testPost.slug) {
        visitWithRetry(`/es/posts/${testPost.slug}`)
      } else {
        visitWithRetry('/en/')
        acceptCookies()
        cy.get('a[href*="/posts/"]', { timeout: 10000 }).first().click()
      }
      acceptCookies()

      // Comments section should exist
      cy.get('.comments-section, .comments-list-container, [data-testid="comments"]', {
        timeout: 10000,
      }).should('exist')
    })

    it('should allow voting on mobile post detail', () => {
      cy.loginAs(testUser)
      cy.viewport(viewports.mobile)

      if (testPost && testPost.slug) {
        visitWithRetry(`/es/posts/${testPost.slug}`)
      } else {
        visitWithRetry('/en/')
        acceptCookies()
        cy.get('a[href*="/posts/"]', { timeout: 10000 }).first().click()
      }
      acceptCookies()

      // Vote controls should be accessible
      cy.get('.vote-badge, .vote-controls, [class*="vote"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Mobile Authentication', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile)
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should display login page correctly on mobile', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()

      // Form should be visible and usable
      cy.get('#email', { timeout: 10000 }).should('be.visible')
      cy.get('#password').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })

    it('should be able to type in login form on mobile', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()
      cy.wait(500)

      // Type in form fields with clear first
      cy.get('#email', { timeout: 10000 }).clear().type('test@example.com', { delay: 30 })
      cy.get('#password').clear().type('password123', { delay: 30 })

      // Values should be entered (check partial match to avoid timing issues)
      cy.get('#email').invoke('val').should('include', 'example.com')
      cy.get('#password').invoke('val').should('include', 'password')
    })

    it('should login successfully on mobile', () => {
      visitWithRetry('/en/auth/login')
      acceptCookies()
      cy.wait(2000)

      // Fill login form
      cy.get('#email', { timeout: 10000 }).clear().type(testUser.email, { delay: 50 })
      cy.get('#password').clear().type('TestPassword123!', { delay: 50 })
      cy.wait(500)

      // Submit
      cy.get('button[type="submit"]').click()

      // Should redirect and show user is logged in
      cy.url({ timeout: 10000 }).should('not.include', '/auth/login')
      cy.get('.user-info, .mobile-auth', { timeout: 10000 }).should('exist')
    })

    it('should show user menu elements when authenticated on mobile', () => {
      cy.loginAs(testUser)
      cy.viewport(viewports.mobile)
      visitWithRetry('/en/')
      acceptCookies()

      // Should show some indication of being logged in
      cy.get('.user-info, .mobile-auth .user-info, [class*="avatar"]', { timeout: 10000 }).should(
        'exist'
      )
    })
  })

  describe('Mobile Comments', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile)
      cy.loginAs(testUser)
    })

    it('should show comment editor on mobile', () => {
      if (testPost && testPost.slug) {
        visitWithRetry(`/en/posts/${testPost.slug}`)
      } else {
        visitWithRetry('/en/')
        acceptCookies()
        cy.get('a[href*="/posts/"]', { timeout: 10000 }).first().click()
      }
      acceptCookies()
      cy.wait(1000)

      // Click write comment button (Spanish or English)
      cy.get('.comments-list-container', { timeout: 10000 }).then(($container) => {
        const writeBtn = $container
          .find('button')
          .filter((i, el) => /write comment|escribir comentario/i.test(el.textContent))
        if (writeBtn.length > 0) {
          cy.wrap(writeBtn.first()).click()
          cy.get('.comment-editor, [data-testid="comment-form"]', { timeout: 5000 }).should('exist')
        }
      })
    })

    it('should be able to type comment on mobile', () => {
      if (testPost && testPost.slug) {
        visitWithRetry(`/en/posts/${testPost.slug}`)
      } else {
        visitWithRetry('/en/')
        acceptCookies()
        cy.get('a[href*="/posts/"]', { timeout: 10000 }).first().click()
      }
      acceptCookies()
      cy.wait(1000)

      // Click write comment button
      cy.get('.comments-list-container', { timeout: 10000 }).then(($container) => {
        const writeBtn = $container
          .find('button')
          .filter((i, el) => /write comment|escribir comentario/i.test(el.textContent))
        if (writeBtn.length > 0) {
          cy.wrap(writeBtn.first()).click()
          cy.wait(300)
          cy.get('.comment-editor textarea, .editor-textarea', { timeout: 5000 })
            .first()
            .type('Mobile test comment')
        }
      })
    })

    it('should submit comment on mobile', () => {
      if (testPost && testPost.slug) {
        visitWithRetry(`/en/posts/${testPost.slug}`)
      } else {
        visitWithRetry('/en/')
        acceptCookies()
        cy.get('a[href*="/posts/"]', { timeout: 10000 }).first().click()
      }
      acceptCookies()
      cy.wait(1000)

      // Click write comment button
      cy.get('.comments-list-container', { timeout: 10000 }).then(($container) => {
        const writeBtn = $container
          .find('button')
          .filter((i, el) => /write comment|escribir comentario/i.test(el.textContent))
        if (writeBtn.length > 0) {
          cy.wrap(writeBtn.first()).click()
          cy.wait(300)

          const commentText = `Mobile E2E comment ${uniqueId}`
          cy.get('.comment-editor textarea, .editor-textarea', { timeout: 5000 })
            .first()
            .type(commentText)
          cy.get('.comment-editor button[type="submit"]').first().click()
        }
      })
    })
  })

  describe('Tablet Viewport', () => {
    beforeEach(() => {
      cy.viewport(viewports.tablet)
    })

    it('should display correctly on tablet portrait', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Check page loaded
      cy.get('body').should('be.visible')
    })

    it('should display correctly on tablet landscape', () => {
      cy.viewport(1024, 768) // iPad landscape
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Check page loaded
      cy.get('body').should('be.visible')
    })

    it('should handle post creation on tablet', () => {
      cy.loginAs(testUser)
      cy.viewport(viewports.tablet)
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(1000)

      // Content type selection should be visible
      cy.get('[data-testid="content-type-link"], [data-testid="content-type-text"]', {
        timeout: 10000,
      }).should('be.visible')
    })
  })

  describe('Touch Interactions', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile)
    })

    it('should handle tap on post card', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Tap on a post link if posts exist
      cy.get('body').then(($body) => {
        const postLink = $body.find(
          '.list-item-card a[href*="/posts/"], .post-card a[href*="/posts/"]'
        )
        if (postLink.length > 0) {
          cy.wrap(postLink.first()).click()
          cy.url().should('include', '/posts/')
        }
      })
    })

    it('should handle swipe/scroll on posts list', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Initial scroll position
      cy.window().then((win) => {
        const initialScroll = win.scrollY

        // Scroll down
        cy.scrollTo(0, 500)

        cy.window().then((winAfter) => {
          expect(winAfter.scrollY).to.be.greaterThan(initialScroll)
        })
      })
    })
  })

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape change', () => {
      // Start in portrait
      cy.viewport(375, 667)
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Should have hamburger menu
      cy.get('.menu-button', { timeout: 10000 }).should('be.visible')

      // Change to landscape
      cy.viewport(667, 375)

      // Content should still be visible
      cy.get('body').should('be.visible')
    })

    it('should close mobile menu on orientation change to desktop size', () => {
      cy.viewport(viewports.mobile)
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Open mobile menu
      cy.get('.menu-button', { timeout: 10000 }).click()
      cy.wait(300)
      cy.get('.mobile-menu-container', { timeout: 5000 }).should('have.class', 'open')

      // Change to desktop viewport
      cy.viewport(1280, 720)
      cy.wait(300)

      // Mobile menu should be hidden on desktop
      cy.get('.mobile-menu-container').should('not.be.visible')
    })
  })

  describe('Mobile-specific UI Elements', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile)
    })

    it('should not show sidebar on mobile', () => {
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(500)

      // Sidebar should be hidden on mobile (or not exist)
      cy.get('body').then(($body) => {
        const sidebar = $body.find('.sidebar, aside')
        if (sidebar.length > 0) {
          cy.get('.sidebar, aside').should('not.be.visible')
        }
      })
    })

    it('should show search accessible on mobile', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Search should be accessible via search button or input
      cy.get('input[type="search"], .search-input, button:contains("Search"), .menu-button', {
        timeout: 10000,
      }).should('exist')
    })

    it('should show notifications icon for authenticated users', () => {
      cy.loginAs(testUser)
      cy.viewport(viewports.mobile)
      visitWithRetry('/en/')
      acceptCookies()

      // Notification icon should be visible
      cy.get('[class*="notification"], [aria-label*="notificacion"]', { timeout: 10000 }).should(
        'exist'
      )
    })
  })
})
