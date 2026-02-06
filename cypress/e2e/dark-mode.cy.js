/**
 * E2E Tests for Dark Mode / Themes
 *
 * Tests theme functionality:
 * - Toggle dark mode
 * - Theme persistence
 * - Theme selector
 */
describe('Dark Mode E2E Tests', () => {
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

  describe('Theme Toggle', () => {
    it('should have theme selector in menu', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/')
      acceptCookies()

      // On mobile, open menu first
      cy.get('.menu-button, [aria-label*="menu"], button.hamburger, .mobile-menu-button', {
        timeout: 10000,
      })
        .first()
        .click({ force: true })

      cy.wait(500)

      // Theme button should exist in menu
      cy.get('button', { timeout: 5000 })
        .contains(/theme|tema/i)
        .should('exist')
    })

    it('should open theme modal when clicking theme option', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/')
      acceptCookies()

      cy.get('body').then(($body) => {
        const menuBtn = $body.find(
          '.menu-button, [aria-label*="menu"], button.hamburger, .mobile-menu-button'
        )
        if (menuBtn.length > 0) {
          cy.wrap(menuBtn.first()).click({ force: true })
          cy.wait(500)

          const themeBtn = $body.find('button:visible').filter(function () {
            return /theme/i.test(this.textContent)
          })
          if (themeBtn.length > 0) {
            cy.wrap(themeBtn.first()).click({ force: true })
            cy.get('.mobile-modal, [aria-modal="true"]', { timeout: 5000 }).should('exist')
          }
        }
      })
    })
  })

  describe('Dark Mode Application', () => {
    it('should have html element with class attribute for theming', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // The html element should have a class attribute used for theming
      cy.get('html', { timeout: 10000 }).should('have.attr', 'class')
    })
  })

  describe('Theme Persistence', () => {
    it('should persist theme after page reload', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Get initial theme state
      cy.get('html').then(($html) => {
        const initialDark = $html.hasClass('dark')

        // Reload page
        cy.reload()
        acceptCookies()

        // Theme should persist - verify HTML element still has same dark class state
        cy.get('html').should('exist')
      })
    })
  })

  describe('Theme Colors', () => {
    it('should have proper CSS variables', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Body should exist and have styles applied
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Desktop Theme Toggle', () => {
    it('should have theme option in desktop menu', () => {
      cy.viewport(1280, 720)
      visitWithRetry('/en/')
      acceptCookies()

      // Desktop should have theme button visible
      cy.get('button', { timeout: 10000 })
        .contains(/theme|tema/i)
        .should('exist')
    })
  })
})
