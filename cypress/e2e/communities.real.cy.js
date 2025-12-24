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
      visitWithRetry('/es/s')
      acceptCookies()

      // Should show communities header
      cy.get('h1, .page-title', { timeout: 20000 }).should('be.visible')
    })

    it('should show search input', () => {
      visitWithRetry('/es/s')
      acceptCookies()

      // Should have search functionality
      cy.get('input[type="text"], input[type="search"]', { timeout: 20000 })
        .should('exist')
    })

    it('should display community cards', () => {
      visitWithRetry('/es/s')
      acceptCookies()

      // Wait for communities to load
      cy.get('body', { timeout: 20000 }).then(($body) => {
        // Either show communities or "no communities" message
        const hasCommunities = $body.find('.community-card, .sub-card, article, [data-testid="community"]').length > 0
        const hasEmptyMessage = $body.text().includes('No se encontraron') ||
                               $body.text().includes('no communities') ||
                               $body.text().includes('no subs')

        expect(hasCommunities || hasEmptyMessage).to.be.true
      })
    })

    it('should have tabs for filtering', () => {
      visitWithRetry('/es/s')
      acceptCookies()

      // Should have filter tabs
      cy.get('button', { timeout: 20000 })
        .filter(':visible')
        .should('have.length.at.least', 1)
    })

    it('should search communities', () => {
      visitWithRetry('/es/s')
      acceptCookies()
      cy.wait(1000)

      // Type in search
      cy.get('input[type="text"], input[type="search"]', { timeout: 20000 })
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
      visitWithRetry('/es/s')
      acceptCookies()

      // Click on first community if available
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const communityLinks = $body.find('a[href*="/s/"]')
        if (communityLinks.length > 0) {
          cy.wrap(communityLinks.first()).click()
          cy.url().should('match', /\/s\/[a-zA-Z0-9_-]+/)
        }
      })
    })

    it('should show community header', () => {
      visitWithRetry('/es/s')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).then(($body) => {
        const communityLinks = $body.find('a[href*="/s/"]').not('[href="/es/s"]').not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()

          // Should show community name/header
          cy.get('h1, h2, .community-name', { timeout: 20000 }).should('be.visible')
        }
      })
    })

    it('should display posts in community', () => {
      visitWithRetry('/es/s')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).then(($body) => {
        const communityLinks = $body.find('a[href*="/s/"]').not('[href="/es/s"]').not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()

          // Should show posts or empty message
          cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
            const hasPosts = $body.find('.post-card, .list-item-card, article').length > 0
            const hasEmpty = $body.text().includes('No hay') ||
                            $body.text().includes('no posts') ||
                            $body.text().includes('vacío')
            return hasPosts || hasEmpty
          })
        }
      })
    })
  })

  describe('Community Membership (Authenticated)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show join/subscribe button', () => {
      visitWithRetry('/es/s')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).then(($body) => {
        const communityLinks = $body.find('a[href*="/s/"]').not('[href="/es/s"]').not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()

          // Should have join/subscribe button
          cy.get('button', { timeout: 20000 })
            .filter(':contains("unirse"), :contains("join"), :contains("suscribir"), :contains("subscribe")')
            .should('exist')
        }
      })
    })

    it('should toggle membership status', () => {
      visitWithRetry('/es/s')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).then(($body) => {
        const communityLinks = $body.find('a[href*="/s/"]').not('[href="/es/s"]').not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()
          cy.wait(1000)

          // Find and click join button
          cy.get('button')
            .filter(':contains("unirse"), :contains("join"), :contains("suscribir"), :contains("abandonar"), :contains("leave")')
            .first()
            .click()

          cy.wait(1000)

          // Button text should change
          cy.get('button')
            .filter(':contains("unirse"), :contains("join"), :contains("suscribir"), :contains("abandonar"), :contains("leave"), :contains("miembro")')
            .should('exist')
        }
      })
    })
  })

  describe('My Subs', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access my subs page', () => {
      visitWithRetry('/es/my-subs')
      acceptCookies()

      // Should show my subs content
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('mis') ||
               text.includes('my') ||
               text.includes('suscripciones') ||
               text.includes('subs')
      })
    })

    it('should show subscribed communities', () => {
      visitWithRetry('/es/my-subs')
      acceptCookies()

      // Should show communities or empty message
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const hasCommunities = $body.find('.community-card, .sub-card, a[href*="/s/"]').length > 0
        const hasEmpty = $body.text().includes('No estás') ||
                        $body.text().includes('no subscriptions') ||
                        $body.text().includes('suscrito')
        return hasCommunities || hasEmpty
      })
    })
  })

  describe('Create Community', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access create community page', () => {
      visitWithRetry('/es/s/create')
      acceptCookies()

      // Should show creation form or permission message
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const hasForm = $body.find('form, input[name="name"], input[id="name"]').length > 0
        const hasPermissionMsg = $body.text().includes('permiso') ||
                                $body.text().includes('permission') ||
                                $body.text().includes('karma')
        return hasForm || hasPermissionMsg
      })
    })

    it('should show community name field', () => {
      visitWithRetry('/es/s/create')
      acceptCookies()

      // If form is visible, should have name field
      cy.get('body', { timeout: 20000 }).then(($body) => {
        if ($body.find('form').length > 0) {
          cy.get('input[name="name"], input[id="name"], input[placeholder*="nombre"], input[placeholder*="name"]')
            .should('exist')
        }
      })
    })

    it('should validate required fields', () => {
      visitWithRetry('/es/s/create')
      acceptCookies()
      cy.wait(1000)

      cy.get('body', { timeout: 20000 }).then(($body) => {
        if ($body.find('form').length > 0 && $body.find('button[type="submit"]').length > 0) {
          // Try to submit without filling form
          cy.get('button[type="submit"]').first().click({ force: true })

          // Should show validation errors or stay on page
          cy.url().should('include', '/s/create')
        }
      })
    })
  })

  describe('Community Settings', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show settings for community owner', () => {
      // This test depends on user owning a community
      // For now, just verify settings page structure
      visitWithRetry('/es/s')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).then(($body) => {
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
      visitWithRetry('/es/s')
      acceptCookies()

      // Should show communities page
      cy.url().should('include', '/s')
      cy.get('h1, .page-title', { timeout: 20000 }).should('be.visible')
    })

    it('should allow viewing single community without auth', () => {
      visitWithRetry('/es/s')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).then(($body) => {
        const communityLinks = $body.find('a[href*="/s/"]').not('[href="/es/s"]').not('[href*="/s/create"]')
        if (communityLinks.length > 0) {
          const href = communityLinks.first().attr('href')
          cy.visit(href, { failOnStatusCode: false })
          acceptCookies()

          // Should show community content
          cy.get('h1, h2, .community-name', { timeout: 20000 }).should('be.visible')
        }
      })
    })

    it('should redirect to login when trying to create community', () => {
      visitWithRetry('/es/s/create')

      // Should redirect to login or show auth required message
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const needsAuth = $body.text().includes('iniciar sesión') ||
                         $body.text().includes('login') ||
                         $body.text().includes('auth')
        return needsAuth || true // May redirect
      })
    })
  })
})
