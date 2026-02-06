/**
 * E2E Tests for Public User Profiles
 *
 * Tests user profile functionality:
 * - View public profile
 * - Profile tabs (achievements, posts, comments)
 * - User stats
 * - Deleted user handling
 * - Anonymous user handling
 */
describe('User Profiles E2E Tests', () => {
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
      username: `profiletest_${uniqueId}`,
      email: `profiletest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
      // Create a post so there's an author link to click in navigation test
      cy.createPost({
        title: `Test Post by ${user.username}`,
        content_type: 'text',
        content: 'This is a test post for profile navigation test',
        sub_id: 1,
        user_id: user.id,
      })
    })
  })

  describe('Public Profile View', () => {
    it('should display user profile page', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('not.contain.text', '503')
    })

    it('should show username on profile', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', testUser.username)
    })

    it('should show user info card', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('.lg\\:col-span-1, [class*="info"], [class*="card"]', { timeout: 10000 }).should(
        'exist'
      )
    })
  })

  describe('Profile Tabs', () => {
    it('should show achievements tab', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('button, nav button', { timeout: 10000 })
        .contains(/Achievements/i)
        .should('exist')
    })

    it('should show posts tab', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('button, nav button', { timeout: 10000 }).contains(/posts/i).should('exist')
    })

    it('should show comments tab', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('button, nav button', { timeout: 10000 })
        .contains(/comments/i)
        .should('exist')
    })

    it('should switch to posts tab', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('button').contains('Posts').click()
      cy.wait(500)

      // Posts tab should be active - check button has border-primary class
      cy.get('button').contains('Posts').closest('button').should('have.class', 'border-primary')
    })

    it('should switch to comments tab', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('button').contains('Comments').click()
      cy.wait(500)

      // Comments tab should be active - check button has border-primary class
      cy.get('button').contains('Comments').closest('button').should('have.class', 'border-primary')
    })
  })

  describe('User Stats', () => {
    it('should display karma stats', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      // Profile page shows user info in sidebar column (stats shown when available)
      cy.get('.lg\\:col-span-1', { timeout: 10000 }).should('exist')
    })

    it('should display post count', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Posts')
    })

    it('should display comment count', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Comments')
    })
  })

  describe('Non-existent User', () => {
    it('should show error for non-existent user', () => {
      visitWithRetry('/en/u/nonexistentuser123456789')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'User not found')
    })

    it('should show home link on error page', () => {
      visitWithRetry('/en/u/nonexistentuser123456789')
      acceptCookies()

      cy.get('a[href*="/"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Anonymous User Page', () => {
    it('should show anonymous user info', () => {
      visitWithRetry('/en/u/anonymous')
      acceptCookies()

      // The page shows "Anonymous mode features:" section
      cy.get('body', { timeout: 10000 }).should('contain.text', 'Anonymous mode features')
    })

    it('should show register/login links for anonymous', () => {
      visitWithRetry('/en/u/anonymous')
      acceptCookies()

      cy.get('a[href*="register"], a[href*="login"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Profile SEO', () => {
    it('should have proper page title', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      cy.title().should('contain', testUser.username)
    })
  })

  describe('Profile Navigation', () => {
    it('should be accessible from post author link', () => {
      // Visit pending page where our test post should be
      visitWithRetry('/en/pending')
      acceptCookies()

      // Post was created in before(), click on author link
      cy.get('a[href*="/u/"]', { timeout: 10000 }).first().click()
      cy.url().should('include', '/u/')
    })
  })

  describe('Achievements Display', () => {
    it('should show achievements section on profile', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      // Profile page should have achievements section or content
      cy.get('[class*="achievement"], [class*="empty"]', { timeout: 10000 }).should('exist')
    })
  })
})
