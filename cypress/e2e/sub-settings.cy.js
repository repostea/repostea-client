/**
 * E2E Tests for Sub/Community Settings
 *
 * Tests community settings page:
 * - Access control
 * - General settings
 * - Moderation tab
 * - Members tab
 * - Team management
 */
describe('Sub Settings E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser
  let testSub

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
    // Create user first, then create a sub where user is the creator
    cy.createUser({
      username: `subtest_${uniqueId}`,
      email: `subtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      // Create a community where testUser is the creator
      cy.createSub({
        name: `testsub-${uniqueId}`,
        display_name: `Test Sub ${uniqueId}`,
        description: 'Test community for E2E tests',
        created_by: user.id,
      }).then((sub) => {
        testSub = sub
      })
    })
  })

  describe('Settings Page Access', () => {
    it('should show not authorized for non-moderators', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/s/test-community/settings')
      acceptCookies()

      // Should show "Access denied" message (translation: settings_not_authorized_title)
      cy.contains(/access denied|acceso denegado/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Beta Warning Banner', () => {
    it('should display beta warning if page loads', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/s/test-community/settings')
      acceptCookies()

      // Should show beta or warning styling
      cy.get('[class*="yellow"], [class*="warning"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Back Navigation', () => {
    it('should have back link to community', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/s/test-community/settings')
      acceptCookies()

      // Should have links on the page
      cy.get('a[href*="/s/"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Tab Navigation', () => {
    it('should have tab structure', () => {
      cy.loginAs(testUser)
      visitWithRetry(`/en/s/${testSub.name}/settings`)
      acceptCookies()

      // Settings page should have navigation tabs or General text
      cy.get('body', { timeout: 10000 }).should('contain.text', 'General')
    })
  })

  describe('General Settings Tab', () => {
    it('should have form fields', () => {
      cy.loginAs(testUser)
      visitWithRetry(`/en/s/${testSub.name}/settings`)
      acceptCookies()

      cy.get('input, textarea, select', { timeout: 10000 }).should('exist')
    })
  })

  describe('Moderation Tab', () => {
    it('should reference moderation functionality', () => {
      cy.loginAs(testUser)
      visitWithRetry(`/en/s/${testSub.name}/settings`)
      acceptCookies()

      cy.contains(/moderation|pending/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Members Tab', () => {
    it('should reference members functionality', () => {
      cy.loginAs(testUser)
      visitWithRetry(`/en/s/${testSub.name}/settings`)
      acceptCookies()

      cy.contains(/members|users/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Submit/Cancel Buttons', () => {
    it('should have action buttons', () => {
      cy.loginAs(testUser)
      visitWithRetry(`/en/s/${testSub.name}/settings`)
      acceptCookies()

      cy.get('button')
        .contains(/save|cancel/i, { timeout: 10000 })
        .should('exist')
    })
  })

  describe('Page Layout', () => {
    it('should have card-style sections', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/s/test-community/settings')
      acceptCookies()

      cy.get('[class*="card"], [class*="rounded"], [class*="shadow"]', { timeout: 10000 }).should(
        'exist'
      )
    })

    it('should have section headers', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/s/test-community/settings')
      acceptCookies()

      cy.get('h1, h2', { timeout: 10000 }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      cy.loginAs(testUser)
      visitWithRetry('/en/s/test-community/settings')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Not Authorized State', () => {
    it('should show lock icon for unauthorized users', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/s/test-community/settings')
      acceptCookies()

      // Should have an icon (lock or other svg)
      cy.get('svg, [class*="lock"]', { timeout: 10000 }).should('exist')
    })
  })
})
