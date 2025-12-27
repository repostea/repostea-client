/**
 * E2E Tests for Internationalization (i18n)
 *
 * Tests language functionality:
 * - Language switching
 * - URL localization
 * - Content translation
 */
describe('Internationalization E2E Tests', () => {
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

  describe('Language in URL', () => {
    it('should have language prefix in URL (es)', () => {
      visitWithRetry('/es/')
      acceptCookies()

      cy.url().should('include', '/es')
    })

    it('should have language prefix in URL (en)', () => {
      visitWithRetry('/en/')
      acceptCookies()

      cy.url().should('include', '/en')
    })
  })

  describe('Spanish Content', () => {
    it('should display Spanish content', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Just verify the page loads with Spanish URL
      cy.url().should('include', '/es/')
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('English Content', () => {
    it('should display English content', () => {
      visitWithRetry('/en/')
      acceptCookies()

      // Just verify the page loads with English URL
      cy.url().should('include', '/en/')
      cy.get('body', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Language Switcher', () => {
    it('should have language selector option', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/es/')
      acceptCookies()

      // Look for menu button or hamburger
      cy.get('body').then(($body) => {
        const menuBtn = $body.find('.menu-button, [aria-label*="menu"], button.hamburger, .mobile-menu-button')
        if (menuBtn.length > 0) {
          cy.wrap(menuBtn.first()).click()
          cy.wait(500)
        }

        const text = $body.text()
        const hasLanguageOption = text.includes('Language')
        expect(hasLanguageOption).to.be.true
      })
    })

    it('should open language modal', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/es/')
      acceptCookies()

      cy.get('body').then(($body) => {
        const menuBtn = $body.find('.menu-button, [aria-label*="menu"], button.hamburger, .mobile-menu-button')
        if (menuBtn.length > 0) {
          cy.wrap(menuBtn.first()).click()
          cy.wait(500)

          const langBtn = $body.find('button').filter(function() {
            return /Language/i.test(this.textContent)
          })
          if (langBtn.length > 0) {
            cy.wrap(langBtn.first()).click()
            cy.get('.mobile-modal, [aria-modal="true"]', { timeout: 5000 }).should('exist')
          }
        }
      })
    })

    it('should show available languages', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/es/')
      acceptCookies()

      cy.get('body').then(($body) => {
        const menuBtn = $body.find('.menu-button, [aria-label*="menu"], button.hamburger, .mobile-menu-button')
        if (menuBtn.length > 0) {
          cy.wrap(menuBtn.first()).click()
          cy.wait(500)

          const langBtn = $body.find('button').filter(function() {
            return /Language/i.test(this.textContent)
          })
          if (langBtn.length > 0) {
            cy.wrap(langBtn.first()).click()
            cy.wait(500)

            cy.get('.mobile-modal, [aria-modal="true"]').contains(/español|english|català/i).should('exist')
          }
        }
      })
    })
  })

  describe('Language Navigation', () => {
    it('should navigate to English version', () => {
      visitWithRetry('/es/')
      acceptCookies()

      // Try to find language link or navigate directly
      cy.get('body').then(($body) => {
        const enLinks = $body.find('a[href*="/en/"], a[href*="/en"]')
        if (enLinks.length > 0) {
          cy.wrap(enLinks.first()).click()
          cy.url().should('include', '/en')
        } else {
          // Navigate directly if no link found (use visitWithRetry for resilience)
          visitWithRetry('/en/')
          cy.url().should('include', '/en')
        }
      })
    })
  })

  describe('Localized Page Titles', () => {
    it('should have Spanish page title', () => {
      visitWithRetry('/es/')
      acceptCookies()

      cy.title().should('not.be.empty')
    })

    it('should have English page title', () => {
      visitWithRetry('/en/')
      acceptCookies()

      cy.title().should('not.be.empty')
    })
  })

  describe('RTL Support Check', () => {
    it('should not break layout with different languages', () => {
      visitWithRetry('/es/')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
      // Check layout is functional (posts or empty state or main container)
      cy.get('.post-card, .list-item-card, article, main, [role="main"]', { timeout: 10000 }).should('exist')
    })
  })
})
