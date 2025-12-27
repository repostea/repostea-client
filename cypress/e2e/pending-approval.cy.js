/**
 * E2E Tests for Pending Approval Page
 *
 * Tests account pending approval page:
 * - Page content display
 * - Status information
 * - Navigation
 */
describe('Pending Approval E2E Tests', () => {
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

  describe('Pending Approval Page Access', () => {
    it('should display pending approval page', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('contain.text', 'Account Pending Approval')
    })

    it('should have page header', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('h2, h1', { timeout: 10000 }).should('exist')
    })
  })

  describe('Status Information', () => {
    it('should display success message about registration', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.contains(/successful|success|created/i, { timeout: 10000 }).should('exist')
    })

    it('should explain pending approval process', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.contains(/approval|administrator/i, { timeout: 10000 }).should('exist')
    })

    it('should mention email notification', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.contains(/email|notification/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Status Icons', () => {
    it('should display clock/waiting icon', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('svg, [class*="icon"]', { timeout: 10000 }).should('exist')
    })

    it('should display status check icons', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('svg, [class*="check"], [class*="hourglass"], [class*="clock"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Status Steps', () => {
    it('should show account created step', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.contains(/account created|created/i, { timeout: 10000 }).should('exist')
    })

    it('should show awaiting review step', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.contains(/review/i, { timeout: 10000 }).should('exist')
    })

    it('should show email notification step', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.contains(/email|notification/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Time Estimate', () => {
    it('should show expected approval time', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.contains(/24|48|hours/i, { timeout: 10000 }).should('exist')
    })
  })

  describe('Navigation', () => {
    it('should have back to login link', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('a[href*="/login"], a[href*="/auth"]', { timeout: 10000 }).should('exist')
    })

    it('should navigate to login page', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('a', { timeout: 10000 }).then(($links) => {
        const loginLink = $links.filter(function () {
          return /login|back/i.test(this.textContent)
        })
        if (loginLink.length > 0) {
          cy.wrap(loginLink.first()).click()
          cy.url().should('include', '/login')
        }
      })
    })
  })

  describe('Page Layout', () => {
    it('should have card-style layout', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('[class*="card"], [class*="rounded"], [class*="shadow"]', { timeout: 10000 }).should(
        'exist'
      )
    })

    it('should have centered content', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('[class*="mx-auto"], [class*="max-w"], [class*="justify-center"]', {
        timeout: 10000,
      }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).should('be.visible')
    })

    it('should maintain readable content on mobile', () => {
      cy.viewport('iphone-6')
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('p', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Info Box Styling', () => {
    it('should have info-style alert box', () => {
      visitWithRetry('/en/auth/pending-approval')
      acceptCookies()

      cy.get('[class*="blue"], [class*="info"]', { timeout: 10000 }).should('exist')
    })
  })
})
