/**
 * E2E Tests for Account Settings
 *
 * Tests profile settings page:
 * - Account preferences
 * - Email change
 * - Password change
 * - Session management
 * - Account deletion
 */
describe('Account Settings E2E Tests', () => {
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
      username: `settingstest_${uniqueId}`,
      email: `settingstest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Settings Page Access', () => {
    it('should stay on settings page when not authenticated', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      // Page does not redirect - stays on settings (shows empty state for unauthenticated user)
      cy.url({ timeout: 10000 }).should('include', '/profile/settings')
    })

    it('should display settings page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Account Preferences Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display account preferences section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.contains(/preferences|account/i, { timeout: 10000 }).should('exist')
    })

    it('should have section header', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('h2', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Email Change Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display email change section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.contains(/email|change/i, { timeout: 10000 }).should('exist')
    })

    it('should have email input fields', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('input[type="email"], input[name*="email"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Password Change Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display password change section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.contains(/password/i, { timeout: 10000 }).should('exist')
    })

    it('should have password input fields', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('input[type="password"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Session Management Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display active sessions section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.contains(/session|device/i, { timeout: 10000 }).should('exist')
    })

    it('should have session description', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      // Description says "Manage devices where you are logged in"
      cy.contains(/session|device|logged/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Danger Zone Section', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display danger zone section', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.contains(/danger|delete/i, { timeout: 10000 }).should('exist')
    })

    it('should have delete account button', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('button', { timeout: 10000 }).then(($buttons) => {
        const deleteBtn = $buttons.filter(function () {
          return /delete/i.test(this.textContent)
        })
        expect(deleteBtn.length).to.be.at.least(1)
      })
    })

    it('should have red styling for danger zone', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('[class*="red"], [class*="danger"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Delete Account Confirmation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show confirmation when delete is clicked', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('button', { timeout: 10000 }).then(($buttons) => {
        const deleteBtn = $buttons.filter(function () {
          return /delete account/i.test(this.textContent)
        })
        if (deleteBtn.length > 0) {
          cy.wrap(deleteBtn.first()).click()
          cy.wait(500)

          // Should show confirmation form
          cy.get('input[type="password"]').should('exist')
        }
      })
    })

    it('should have cancel button in confirmation', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      // Scroll to danger zone and click delete button
      cy.contains('button', /delete account/i, { timeout: 10000 })
        .scrollIntoView()
        .click({ force: true })

      // Confirmation should have multiple buttons (confirm + cancel)
      cy.get('button', { timeout: 5000 }).should('have.length.at.least', 2)
    })
  })

  describe('Email Verification Warning', () => {
    it('should show warning for unverified users', () => {
      // Create unverified user (without email_verified_at)
      const unverifiedId = Date.now()
      cy.createUser({
        username: `unverif_${unverifiedId}`,
        email: `unverif_${unverifiedId}@example.com`,
        password: 'TestPassword123!',
        // Not setting email_verified_at means it will be null
      }).then((unverifiedUser) => {
        cy.loginAs(unverifiedUser)
        visitWithRetry('/en/profile/settings')
        acceptCookies()

        // Warning should show "Email verification required" text
        cy.contains('Email verification required', { timeout: 10000 }).should('exist')
      })
    })
  })

  describe('Profile Navigation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should be within profile layout', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('[class*="profile"], nav', { timeout: 10000 }).should('exist')
    })

    it('should have navigation to other profile sections', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('a[href*="/profile"]', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should stack sections on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('[class*="space-y"], [class*="gap"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Form Cards', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have card-style sections', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('[class*="card"], [class*="rounded"][class*="shadow"]', { timeout: 10000 }).should(
        'exist'
      )
    })

    it('should have section headers', () => {
      visitWithRetry('/en/profile/settings')
      acceptCookies()

      cy.get('h2', { timeout: 10000 }).should('have.length.at.least', 2)
    })
  })
})
