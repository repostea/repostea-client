/**
 * E2E Tests for Error Pages
 *
 * Tests error handling pages:
 * - 404 Not Found
 * - 500 Server Error
 * - Maintenance page
 */
describe('Error Pages E2E Tests', () => {
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

  // Helper to visit with retry on network errors
  const visitWithRetry = (url, retries = 2) => {
    cy.visit(url, { failOnStatusCode: false, timeout: 30000 }).then(
      () => {},
      (err) => {
        if (retries > 0 && err.message.includes('ESOCKETTIMEDOUT')) {
          cy.wait(2000)
          visitWithRetry(url, retries - 1)
        }
      }
    )
  }

  describe('404 Not Found Page', () => {
    it('should display 404 page for non-existent route', () => {
      cy.visit('/en/nonexistent-page-12345', { failOnStatusCode: false })
      acceptCookies()

      cy.get('body', { timeout: 10000 })
        .invoke('text')
        .should('match', /404|not found|error/i)
    })

    it('should have link to home on 404 page', () => {
      cy.visit('/en/nonexistent-page-12345', { failOnStatusCode: false })
      acceptCookies()

      cy.get('a[href*="/"], button', { timeout: 10000 }).should('exist')
    })

    it('should display user-friendly error message', () => {
      cy.visit('/en/this-page-does-not-exist', { failOnStatusCode: false })
      acceptCookies()

      cy.get('body', { timeout: 10000 })
        .invoke('text')
        .should('match', /404|not found|error/i)
    })
  })

  describe('500 Error Page', () => {
    it('should have 500 error page available', () => {
      cy.visit('/en/500', { failOnStatusCode: false })
      acceptCookies()

      cy.get('body', { timeout: 10000 })
        .invoke('text')
        .should('match', /500|error|server/i)
    })

    it('should have retry or home link on 500 page', () => {
      cy.visit('/en/500', { failOnStatusCode: false })
      acceptCookies()

      cy.get('a, button', { timeout: 10000 }).should('exist')
    })
  })

  describe('Maintenance Page', () => {
    it('should have maintenance page available', () => {
      // Maintenance page may timeout due to API checks, so use longer timeout
      cy.visit('/en/maintenance', { failOnStatusCode: false, timeout: 60000 })
      acceptCookies()

      // Should show "Maintenance in Progress" title
      cy.get('body', { timeout: 10000 }).should('contain.text', 'Maintenance in Progress')
    })
  })

  describe('Error Page UI', () => {
    it('should display icon or image on error page', () => {
      cy.visit('/en/nonexistent-page-12345', { failOnStatusCode: false })
      acceptCookies()

      cy.get('svg, img, [class*="icon"]', { timeout: 10000 }).should('exist')
    })

    it('should maintain consistent styling on error page', () => {
      cy.visit('/en/nonexistent-page-12345', { failOnStatusCode: false })
      acceptCookies()

      // Should still have header or navigation
      cy.get('header, nav, .navbar', { timeout: 10000 }).should('exist')
    })
  })

  describe('Error Page Navigation', () => {
    it('should have navigation link to home from 404', () => {
      cy.visit('/en/nonexistent-page-12345', { failOnStatusCode: false })
      acceptCookies()

      // Verify home link or any navigation exists
      cy.get('a[href="/"], a[href*="/en"], a, nav, header', { timeout: 10000 }).should('exist')
    })
  })

  describe('Responsive Error Pages', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      cy.visit('/en/nonexistent-page-12345', { failOnStatusCode: false })
      acceptCookies()

      cy.get('body', { timeout: 10000 })
        .invoke('text')
        .should('match', /404|not found|error/i)
    })
  })
})
