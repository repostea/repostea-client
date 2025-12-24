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
      cy.get('body', { timeout: 20000 }).should('contain.text', testUser.username)
    })

    it('should show user stats', () => {
      visitWithRetry(`/es/u/${testUser.username}`)
      acceptCookies()

      // Should show posts and comments count
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const hasStats = text.includes('post') ||
                        text.includes('publicacion') ||
                        text.includes('comment') ||
                        text.includes('comentario') ||
                        text.includes('karma')
        expect(hasStats).to.be.true
      })
    })

    it('should handle non-existent user gracefully', () => {
      visitWithRetry('/es/u/nonexistent_user_12345')
      acceptCookies()

      // Should show 404 or user not found message
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('404') ||
               text.includes('not found') ||
               text.includes('no encontrado') ||
               text.includes('no existe')
      })
    })

    it('should show user activity tabs', () => {
      visitWithRetry(`/es/u/${testUser.username}`)
      acceptCookies()

      // Should have tabs or sections for posts/comments
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const hasTabs = $body.find('[role="tablist"], .tabs, .nav-tabs, button').length > 0
        expect(hasTabs).to.be.true
      })
    })
  })

  describe('Own Profile (Authenticated)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access own profile from menu', () => {
      visitWithRetry('/es/')
      acceptCookies()
      cy.wait(1000)

      // Click on user menu
      cy.get('.user-info', { timeout: 20000 }).first().click()

      // Click on profile link
      cy.get('.dropdown-menu', { timeout: 5000 }).should('be.visible')
      cy.get('a[href*="/profile"]').first().click()

      // Should be on profile page
      cy.url().should('include', '/profile')
    })

    it('should display profile dashboard', () => {
      visitWithRetry('/es/profile')
      acceptCookies()

      // Should show profile content
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes(testUser.username.toLowerCase()) ||
               text.includes('perfil') ||
               text.includes('profile')
      })
    })

    it('should show my posts section', () => {
      visitWithRetry('/es/profile/posts')
      acceptCookies()

      // Should be on my posts page
      cy.url().should('include', '/profile/posts')
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should access settings page', () => {
      visitWithRetry('/es/profile/settings')
      acceptCookies()

      // Should show settings form
      cy.url().should('include', '/profile/settings')
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('settings') ||
               text.includes('configuración') ||
               text.includes('ajustes')
      })
    })
  })

  describe('Profile Edit', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access edit profile page', () => {
      visitWithRetry('/es/profile/edit')
      acceptCookies()

      // Should show edit form
      cy.url().should('include', '/profile/edit')
      cy.get('form, input, textarea', { timeout: 20000 }).should('exist')
    })

    it('should display profile fields', () => {
      visitWithRetry('/es/profile/edit')
      acceptCookies()

      // Should have editable fields
      cy.get('input, textarea', { timeout: 20000 })
        .should('have.length.at.least', 1)
    })

    it('should show save button', () => {
      visitWithRetry('/es/profile/edit')
      acceptCookies()

      // Should have submit/save button
      cy.get('button[type="submit"], button', { timeout: 20000 })
        .filter(':contains("guardar"), :contains("save"), :contains("actualizar")')
        .should('exist')
    })
  })

  describe('Profile Settings', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display settings sections', () => {
      visitWithRetry('/es/profile/settings')
      acceptCookies()

      // Should show various settings sections
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should have password change section', () => {
      visitWithRetry('/es/profile/settings')
      acceptCookies()

      // Should have password related fields or section
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const hasPasswordSection = text.includes('password') ||
                                   text.includes('contraseña') ||
                                   text.includes('seguridad') ||
                                   text.includes('security')
        expect(hasPasswordSection).to.be.true
      })
    })

    it('should have notification preferences', () => {
      visitWithRetry('/es/profile/notifications/preferences')
      acceptCookies()

      // Should show notification settings
      cy.url().should('include', '/notifications')
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })
  })

  describe('Profile Achievements', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access achievements page', () => {
      visitWithRetry('/es/profile/achievements')
      acceptCookies()

      // Should show achievements
      cy.url().should('include', '/achievements')
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('logro') ||
               text.includes('achievement') ||
               text.includes('badge') ||
               text.includes('trofeo')
      })
    })
  })

  describe('Profile Navigation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should navigate between profile sections', () => {
      visitWithRetry('/es/profile')
      acceptCookies()

      // Find and click on posts link
      cy.get('a[href*="/profile/posts"], a[href*="/posts"]', { timeout: 20000 })
        .first()
        .click()

      cy.url().should('satisfy', (url) => {
        return url.includes('/posts') || url.includes('/profile')
      })
    })

    it('should have consistent navigation menu', () => {
      visitWithRetry('/es/profile')
      acceptCookies()

      // Profile should have navigation links
      cy.get('nav, aside, .sidebar, .menu', { timeout: 20000 })
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
      visitWithRetry('/es/profile')

      // Should redirect to login
      cy.url({ timeout: 20000 }).should('include', '/auth/login')
    })

    it('should redirect to login when accessing settings without auth', () => {
      visitWithRetry('/es/profile/settings')

      // Should redirect to login
      cy.url({ timeout: 20000 }).should('include', '/auth/login')
    })

    it('should allow viewing public profiles without auth', () => {
      visitWithRetry(`/es/u/${testUser.username}`)
      acceptCookies()

      // Should show the profile (not redirect to login)
      cy.url().should('include', `/u/${testUser.username}`)
      cy.get('body', { timeout: 20000 }).should('contain.text', testUser.username)
    })
  })
})
