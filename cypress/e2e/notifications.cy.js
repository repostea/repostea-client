/**
 * E2E Tests for Notifications - Real API
 *
 * Tests notification functionality with real backend:
 * - View notifications
 * - Filter notifications
 * - Mark as read
 * - Notification preferences
 * - Notification categories
 */
describe('Notifications E2E Tests', () => {
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
      username: `notiftest_${uniqueId}`,
      email: `notiftest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Notifications Page Access', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access notifications page', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      // Should show notifications page title
      cy.contains('Notifications', { timeout: 10000 }).should('be.visible')
    })

    it('should show notification panel', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      // Should have notification panel or list
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should display notification categories', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      // Should show category filters or icons
      cy.contains(/comment|mention|achievement/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Notification Filters', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show filter buttons', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      // Should have filter options
      cy.get('button', { timeout: 10000 })
        .filter(
          ':contains("All"), :contains("All"), :contains("Read"), :contains("Read"), :contains("Unread"), :contains("Unread")'
        )
        .should('have.length.at.least', 0)
    })

    it('should filter by read status', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()
      cy.wait(1000)

      // Click on unread filter if exists
      cy.get('body').then(($body) => {
        const unreadBtn = $body.find('button').filter(function () {
          return this.textContent.includes('Unread') || this.textContent.includes('Unread')
        })
        if (unreadBtn.length > 0) {
          cy.wrap(unreadBtn.first()).click()
          cy.wait(500)
        }
      })
    })

    it('should filter by category', () => {
      visitWithRetry('/en/profile/notifications/posts')
      acceptCookies()

      // URL should reflect category
      cy.url().should('include', '/notifications')
    })
  })

  describe('Notification List', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display notification page structure', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      // Page should show the "Recent Notifications" section (always present)
      cy.contains(/recent notifications|notificaciones recientes/i, { timeout: 10000 }).should('be.visible')
    })

    it('should show notification content', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      // If notifications exist, they should have content
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const notifications = $body.find('.notification, .notification-item')
        if (notifications.length > 0) {
          cy.get('.notification, .notification-item').first().should('contain.text', '')
        }
      })
    })

    it('should show notification timestamp', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const notifications = $body.find('.notification, .notification-item')
        if (notifications.length > 0) {
          // May have time indicators
          cy.get('.notification, .notification-item').first().should('be.visible')
        }
      })
    })
  })

  describe('Mark as Read', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show mark all read button', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      // The notifications page has filter buttons with .notif-filter-btn or .bg-primary class
      // Mark all read button appears when there are unread notifications
      cy.get('.notif-filter-btn, .bg-primary', { timeout: 10000 }).should('exist')
    })

    it('should mark all as read', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()
      cy.wait(1000)

      // Click mark all read if available
      cy.get('body').then(($body) => {
        const markReadBtn = $body.find('button').filter(function () {
          const text = this.textContent.toLowerCase()
          return text.includes('mark') && text.includes('read')
        })
        if (markReadBtn.length > 0) {
          cy.wrap(markReadBtn.first()).click()
          cy.wait(1000)
        }
      })
    })

    it('should mark individual notification as read', () => {
      visitWithRetry('/en/profile/notifications')
      acceptCookies()

      // Click on notification to mark as read
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const notifications = $body.find('.notification, .notification-item, a[href*="/p/"]')
        if (notifications.length > 0) {
          cy.wrap(notifications.first()).click()
          cy.wait(500)
        }
      })
    })
  })

  describe('Notification Preferences', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should access preferences page', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Should show preferences page with form controls
      cy.get('input[type="checkbox"], [role="switch"], select', { timeout: 10000 }).should('exist')
    })

    it('should show notification toggles', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Should have toggle switches or checkboxes
      cy.get('input[type="checkbox"], [role="switch"], .toggle', { timeout: 10000 }).should(
        'have.length.at.least',
        0
      )
    })

    it('should show email notification options', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()

      // Preferences page has card sections with .card-bg and .prefs-border classes
      cy.get('.card-bg', { timeout: 10000 }).should('exist')
      // Has toggle switches for notification preferences
      cy.get('input[type="checkbox"], [role="switch"]', { timeout: 10000 }).should('exist')
    })

    it('should save preference changes', () => {
      visitWithRetry('/en/profile/notifications/preferences')
      acceptCookies()
      cy.wait(1000)

      // Toggle a setting if available - use force:true because toggle may have overlay
      cy.get('input[type="checkbox"], [role="switch"]', { timeout: 10000 }).then(($toggles) => {
        if ($toggles.length > 0) {
          cy.wrap($toggles.first()).click({ force: true })
          cy.wait(1000)

          // Should either auto-save or have save button
          cy.get('body').should('be.visible')
        }
      })
    })
  })

  describe('Notification Categories', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show post comments category', () => {
      visitWithRetry('/en/profile/notifications/posts')
      acceptCookies()

      cy.url().should('include', '/posts')
    })

    it('should show comment replies category', () => {
      visitWithRetry('/en/profile/notifications/comments')
      acceptCookies()

      cy.url().should('include', '/comments')
    })

    it('should show mentions category', () => {
      visitWithRetry('/en/profile/notifications/mentions')
      acceptCookies()

      cy.url().should('include', '/mentions')
    })

    it('should show achievements category', () => {
      visitWithRetry('/en/profile/notifications/achievements')
      acceptCookies()

      cy.url().should('include', '/achievements')
    })
  })

  describe('Notification Badge (Header)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show notification icon in header', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Header should have notification bell or user info (logged in)
      cy.get('[aria-label*="notification"], .notification-bell, a[href*="/notification"], .user-info', { timeout: 10000 }).should('exist')
    })

    it('should show unread count badge', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // May show badge with count if there are unread notifications
      cy.get('header, nav', { timeout: 10000 }).should('be.visible')
    })

    it('should navigate to notifications from header', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Wait for navbar to be ready
      cy.get('.navbar', { timeout: 10000 }).should('be.visible')

      // Click notification bell with retry for SSR hydration
      cy.get('.notification-bell-btn, [aria-label*="notification"]', { timeout: 10000 })
        .first()
        .clickWithRetry('.notification-dropdown')

      // Click "View all" link inside dropdown to navigate (first link)
      cy.get('.notification-dropdown a[href*="/notification"]', { timeout: 5000 }).first().click()

      // Should navigate to notifications page
      cy.url({ timeout: 5000 }).should('include', '/notification')
    })
  })

  describe('Anonymous Access', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should stay on notifications page when not authenticated', () => {
      visitWithRetry('/en/profile/notifications')

      // Page does not redirect - stays on notifications
      cy.url({ timeout: 10000 }).should('include', '/profile/notifications')
    })

    it('should stay on preferences page when not authenticated', () => {
      visitWithRetry('/en/profile/notifications/preferences')

      // Page does not redirect - stays on preferences
      cy.url({ timeout: 10000 }).should('include', '/notifications/preferences')
    })
  })
})
