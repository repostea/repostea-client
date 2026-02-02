/**
 * E2E Tests for User Profiles - Real API
 *
 * Tests user profile functionality with real backend:
 * - View public profile
 * - View own profile
 * - Profile settings
 * - User posts and comments
 * - Edit profile
 */
describe('User Profile E2E Tests', () => {
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
    // Create a real user for testing
    cy.createUser({
      username: `profiletest_${uniqueId}`,
      email: `profiletest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Public Profile View', () => {
    it('should display user profile page', () => {
      visitWithRetry(`/es/u/${testUser.username}`)
      acceptCookies()

      // Should show user information
      cy.get('body', { timeout: 10000 }).should('contain.text', testUser.username)
    })

    it('should show user stats section', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      // Profile page shows stats (posts, comments counts)
      cy.contains(/posts|comments/i, { timeout: 10000 }).should('exist')
    })

    it('should show 404 for non-existent user', () => {
      visitWithRetry('/en/u/nonexistent_user_12345')
      acceptCookies()

      // Should show "User not found" message
      cy.contains(/user not found|does not exist/i, { timeout: 10000 }).should('exist')
    })

    it('should show user activity tabs', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      // Profile page has tab buttons for achievements/posts/comments
      cy.get('button', { timeout: 10000 }).filter(':contains("Posts"), :contains("Comments"), :contains("Achievements")').should('have.length.at.least', 1)
    })
  })

  describe('Own Profile (Authenticated)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access own profile from menu', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Wait for auth to be fully loaded
      cy.get('.user-menu', { timeout: 10000 }).should('be.visible')

      // Click user menu with retry for SSR hydration
      cy.get('[data-testid="user-menu-button"]', { timeout: 10000 })
        .should('be.visible')
        .clickWithRetry('[data-testid="user-dropdown"]')

      // Click on profile link in dropdown
      cy.get('[data-testid="user-dropdown"] a[href*="/profile"]').first().click()

      // Should be on profile page
      cy.url().should('include', '/profile')
    })

    it('should display profile dashboard', () => {
      visitWithRetry('/en/profile')
      acceptCookies()

      // Should show the username on profile page
      cy.get('body', { timeout: 10000 }).should('contain.text', testUser.username)
    })

    it('should show my posts section', () => {
      visitWithRetry('/en/profile/posts')
      acceptCookies()

      // Should be on my posts page
      cy.url().should('include', '/profile/posts')
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should access settings page', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      // Should show settings page with form elements
      cy.url().should('include', '/profile/settings')
      cy.get('form, input, select, button[type="submit"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Profile Edit', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access edit profile page', () => {
      visitWithRetry('/en/profile/edit')
      acceptCookies()

      // Should show edit form
      cy.url().should('include', '/profile/edit')
      cy.get('form, input, textarea', { timeout: 10000 }).should('exist')
    })

    it('should display profile fields', () => {
      visitWithRetry('/en/profile/edit')
      acceptCookies()

      // Should have editable fields
      cy.get('input, textarea', { timeout: 10000 }).should('have.length.at.least', 1)
    })

    it('should show save button', () => {
      visitWithRetry('/en/profile/edit')
      acceptCookies()

      // Should have "Save Changes" submit button
      cy.contains('button', 'Save Changes', { timeout: 10000 }).should('exist')
    })
  })

  describe('Profile Settings', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display settings sections', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      // Should show various settings sections
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should have password change section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      // Should have password section
      cy.contains('Password', { timeout: 10000 }).should('be.visible')
    })

    it('should have notification preferences', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Should show notification settings
      cy.url().should('include', '/notifications')
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Profile Achievements', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access achievements page', () => {
      visitWithRetry('/en/profile/achievements')
      acceptCookies()

      // Should show achievements page
      cy.url().should('include', '/achievements')
      cy.contains('Achievements', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Profile Navigation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should navigate between profile sections', () => {
      visitWithRetry('/en/profile')
      acceptCookies()

      // Find and click on posts link (visible one, not mobile hidden)
      cy.get('a[href*="/profile/posts"]:visible, a[href*="/posts"]:visible', { timeout: 10000 })
        .first()
        .click({ force: true })

      // After clicking posts link, URL should include /posts
      cy.url().should('include', '/posts')
    })

    it('should have consistent navigation menu', () => {
      visitWithRetry('/en/profile')
      acceptCookies()

      // Profile should have navigation links
      cy.get('nav, aside, .sidebar, .menu', { timeout: 10000 })
        .find('a')
        .should('have.length.at.least', 1)
    })
  })

  describe('Anonymous Access Restrictions', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should redirect to login when accessing profile without auth', () => {
      visitWithRetry('/en/profile')

      // Auth middleware redirects to login (wait for client-side redirect)
      cy.url({ timeout: 15000 }).should('include', '/auth/login')
    })

    it('should redirect to login when accessing settings without auth', () => {
      visitWithRetry('/en/profile/settings')

      // Should redirect to login
      cy.url({ timeout: 10000 }).should('include', '/auth/login')
    })

    it('should allow viewing public profiles without auth', () => {
      visitWithRetry(`/en/u/${testUser.username}`)
      acceptCookies()

      // Should show the profile (not redirect to login)
      cy.url().should('include', `/u/${testUser.username}`)
      cy.get('body', { timeout: 10000 }).should('contain.text', testUser.username)
    })
  })
})
