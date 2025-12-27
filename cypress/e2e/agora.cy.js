/**
 * E2E Tests for Agora (Chat) - Real API
 *
 * Tests chat functionality with real backend:
 * - Access agora page
 * - View messages
 * - Send messages (authenticated)
 * - View toggle
 */
describe('Agora (Chat) E2E Tests', () => {
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
        cy.wait(200)
      }
    })
  }

  before(() => {
    cy.createUser({
      username: `agoratest_${uniqueId}`,
      email: `agoratest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Agora Page Access', () => {
    it('should display agora page with h1 title', () => {
      visitWithRetry('/en/agora')
      acceptCookies()

      cy.get('h1', { timeout: 10000 }).should('be.visible')
    })

    it('should show agora subtitle', () => {
      visitWithRetry('/en/agora')
      acceptCookies()

      // Subtitle is a p tag after h1
      cy.get('h1 + p, h1').parent().find('p').should('exist')
    })

    it('should display messages area or empty state', () => {
      visitWithRetry('/en/agora')
      acceptCookies()

      cy.wait(1000)

      // Either has message wrappers or empty state
      cy.get('.agora-message-wrapper, .agora-empty-state', { timeout: 10000 }).should('exist')
    })
  })

  describe('View Toggle', () => {
    it('should show view toggle tabs', () => {
      visitWithRetry('/en/agora')
      acceptCookies()

      // View tabs (threads/chronological)
      cy.get('.agora-view-tab', { timeout: 10000 }).should('have.length', 2)
    })

    it('should switch between threads and chronological view', () => {
      visitWithRetry('/en/agora')
      acceptCookies()

      // Click chronological tab
      cy.get('.agora-view-tab', { timeout: 10000 }).last().click()
      cy.wait(500)

      // Tab should be active
      cy.get('.agora-view-tab.active').should('exist')
    })
  })

  describe('View Messages', () => {
    it('should display messages or empty state after loading', () => {
      visitWithRetry('/en/agora')
      acceptCookies()
      cy.wait(2000)

      // Either messages or empty state - no skeleton loaders
      cy.get('.agora-message-wrapper, .agora-empty-state', { timeout: 10000 }).should('exist')
    })

    it('should show user link in messages if messages exist', () => {
      visitWithRetry('/en/agora')
      acceptCookies()
      cy.wait(2000)

      cy.get('body').then(($body) => {
        if ($body.find('.agora-message-wrapper').length > 0) {
          // Messages have user links
          cy.get('.agora-message-wrapper a[href*="/u/"]').should('exist')
        }
      })
    })
  })

  describe('Send Message (Authenticated)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show compose bar when logged in', () => {
      visitWithRetry('/en/agora')
      acceptCookies()
      cy.wait(300)

      cy.get('.agora-compose-bar', { timeout: 10000 }).should('exist')
    })

    it('should expand compose area on click', () => {
      visitWithRetry('/en/agora')
      acceptCookies()
      cy.wait(300)

      cy.get('.agora-compose-bar', { timeout: 10000 }).click()

      // Should show compose form
      cy.get('.agora-compose-form', { timeout: 5000 }).should('be.visible')
    })

    it('should have publish button in compose form', () => {
      visitWithRetry('/en/agora')
      acceptCookies()
      cy.wait(300)

      cy.get('.agora-compose-bar', { timeout: 10000 }).click()

      // Publish button in footer
      cy.get('.agora-compose-footer button.bg-primary', { timeout: 5000 }).should('exist')
    })

    it('should have anonymous checkbox in compose form', () => {
      visitWithRetry('/en/agora')
      acceptCookies()
      cy.wait(300)

      cy.get('.agora-compose-bar', { timeout: 10000 }).click()

      // Anonymous checkbox
      cy.get('.agora-compose-footer input[type="checkbox"]', { timeout: 5000 }).should('exist')
    })

    it('should have close button in compose form', () => {
      visitWithRetry('/en/agora')
      acceptCookies()
      cy.wait(300)

      cy.get('.agora-compose-bar', { timeout: 10000 }).click()

      // Close button
      cy.get('.agora-close-btn', { timeout: 5000 }).should('exist')
    })
  })

  describe('Anonymous Access', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should allow viewing agora without auth', () => {
      visitWithRetry('/en/agora')
      acceptCookies()

      cy.url().should('include', '/agora')
      cy.get('h1', { timeout: 10000 }).should('be.visible')
    })

    it('should show login CTA instead of compose bar', () => {
      visitWithRetry('/en/agora')
      acceptCookies()

      // Should not have compose bar
      cy.get('.agora-compose-bar').should('not.exist')

      // Should have login button in CTA
      cy.get('a[href*="/auth/login"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Agora Sidebar', () => {
    it('should show sidebar on desktop', () => {
      cy.viewport(1280, 800)
      visitWithRetry('/en/agora')
      acceptCookies()

      // Sidebar has lg:col-span-1 class
      cy.get('.lg\\:col-span-1', { timeout: 10000 }).should('be.visible')
    })

    it('should hide sidebar on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/agora')
      acceptCookies()

      // Sidebar has hidden class on mobile
      cy.get('.hidden.lg\\:block', { timeout: 10000 }).should('exist')
    })
  })

  describe('Thread Navigation', () => {
    it('should have links to individual threads if messages exist', () => {
      visitWithRetry('/en/agora')
      acceptCookies()
      cy.wait(2000)

      cy.get('body').then(($body) => {
        if ($body.find('.agora-message-wrapper').length > 0) {
          // Messages have links to individual threads
          cy.get('a[href*="/agora/"]').should('exist')
        }
      })
    })
  })
})
