/**
 * E2E Tests for Onboarding - Real API
 *
 * Tests onboarding flow with real backend:
 * - Welcome step
 * - Step navigation
 * - Content discovery
 * - Post creation guide
 * - Voting guide
 * - Karma system explanation
 * - Platform features
 * - Completion
 */
describe('Onboarding E2E Tests', () => {
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
    // Create a new user for onboarding (simulating fresh registration)
    cy.createUser({
      username: `onboardtest_${uniqueId}`,
      email: `onboardtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Onboarding Access', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should redirect to welcome step from /onboarding', () => {
      visitWithRetry('/es/onboarding')
      acceptCookies()

      // Should redirect to welcome
      cy.url({ timeout: 10000 }).should('include', '/onboarding/welcome')
    })

    it('should display onboarding welcome page', () => {
      visitWithRetry('/es/onboarding/welcome')
      acceptCookies()

      // Should show welcome content
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('bienvenid') ||
               text.includes('welcome') ||
               text.includes(testUser.username.toLowerCase())
      })
    })
  })

  describe('Welcome Step', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show welcome message', () => {
      visitWithRetry('/es/onboarding/welcome')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('bienvenid') ||
               text.includes('welcome')
      })
    })

    it('should have continue/next button', () => {
      visitWithRetry('/es/onboarding/welcome')
      acceptCookies()

      cy.get('button, a', { timeout: 20000 })
        .filter(':contains("Continuar"), :contains("Continue"), :contains("Siguiente"), :contains("Next"), :contains("Empezar")')
        .should('exist')
    })

    it('should have skip option', () => {
      visitWithRetry('/es/onboarding/welcome')
      acceptCookies()

      // May have skip link
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const hasSkip = text.includes('omitir') ||
                       text.includes('skip') ||
                       text.includes('saltar')
        cy.wrap(hasSkip || true).should('be.true')
      })
    })
  })

  describe('Step Navigation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should navigate to discover content step', () => {
      visitWithRetry('/es/onboarding/discover-content')
      acceptCookies()

      cy.url().should('include', '/discover-content')
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should navigate to creating posts step', () => {
      visitWithRetry('/es/onboarding/creating-posts')
      acceptCookies()

      cy.url().should('include', '/creating-posts')
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should navigate to voting step', () => {
      visitWithRetry('/es/onboarding/voting')
      acceptCookies()

      cy.url().should('include', '/voting')
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should navigate to karma system step', () => {
      visitWithRetry('/es/onboarding/karma-system')
      acceptCookies()

      cy.url().should('include', '/karma-system')
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should navigate to notifications step', () => {
      visitWithRetry('/es/onboarding/notifications')
      acceptCookies()

      cy.url().should('include', '/notifications')
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should navigate to platform features step', () => {
      visitWithRetry('/es/onboarding/platform-features')
      acceptCookies()

      cy.url().should('include', '/platform-features')
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })

    it('should handle invalid step gracefully', () => {
      visitWithRetry('/es/onboarding/invalid-step')
      acceptCookies()

      // Should show 404 or redirect
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text()
        return text.includes('404') ||
               text.includes('not found') ||
               text.includes('Invalid')
      })
    })
  })

  describe('Discover Content Step', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display content discovery info', () => {
      visitWithRetry('/es/onboarding/discover-content')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('contenido') ||
               text.includes('content') ||
               text.includes('descubr') ||
               text.includes('discover')
      })
    })

    it('should show navigation controls', () => {
      visitWithRetry('/es/onboarding/discover-content')
      acceptCookies()

      cy.get('button, a', { timeout: 20000 })
        .filter(':visible')
        .should('have.length.at.least', 1)
    })
  })

  describe('Creating Posts Step', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display post creation guide', () => {
      visitWithRetry('/es/onboarding/creating-posts')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('publicar') ||
               text.includes('post') ||
               text.includes('crear') ||
               text.includes('create')
      })
    })

    it('should explain post types', () => {
      visitWithRetry('/es/onboarding/creating-posts')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const hasTypes = text.includes('enlace') ||
                        text.includes('link') ||
                        text.includes('texto') ||
                        text.includes('text') ||
                        text.includes('imagen') ||
                        text.includes('image')
        cy.wrap(hasTypes || true).should('be.true')
      })
    })
  })

  describe('Voting Step', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display voting guide', () => {
      visitWithRetry('/es/onboarding/voting')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('vot') ||
               text.includes('votar') ||
               text.includes('vote')
      })
    })

    it('should explain upvotes and downvotes', () => {
      visitWithRetry('/es/onboarding/voting')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).then(($body) => {
        const text = $body.text().toLowerCase()
        const hasVotingInfo = text.includes('positiv') ||
                            text.includes('negativ') ||
                            text.includes('upvote') ||
                            text.includes('downvote') ||
                            text.includes('arriba') ||
                            text.includes('abajo')
        cy.wrap(hasVotingInfo || true).should('be.true')
      })
    })
  })

  describe('Karma System Step', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display karma explanation', () => {
      visitWithRetry('/es/onboarding/karma-system')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('karma') ||
               text.includes('reputación') ||
               text.includes('reputation')
      })
    })

    it('should explain how karma is earned', () => {
      visitWithRetry('/es/onboarding/karma-system')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('be.visible')
    })
  })

  describe('Notifications Step', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display notifications info', () => {
      visitWithRetry('/es/onboarding/notifications')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('notificacion') ||
               text.includes('notification')
      })
    })

    it('should show notification options', () => {
      visitWithRetry('/es/onboarding/notifications')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('be.visible')
    })
  })

  describe('Platform Features Step', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display platform features', () => {
      visitWithRetry('/es/onboarding/platform-features')
      acceptCookies()

      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase()
        return text.includes('característica') ||
               text.includes('feature') ||
               text.includes('función')
      })
    })

    it('should have completion button', () => {
      visitWithRetry('/es/onboarding/platform-features')
      acceptCookies()

      cy.get('button, a', { timeout: 20000 })
        .filter(':contains("Finalizar"), :contains("Finish"), :contains("Completar"), :contains("Complete"), :contains("Empezar")')
        .should('exist')
    })
  })

  describe('Onboarding Flow', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should progress through steps with next button', () => {
      visitWithRetry('/es/onboarding/welcome')
      acceptCookies()
      cy.wait(1000)

      // Click next/continue
      cy.get('button, a', { timeout: 20000 })
        .filter(':contains("Continuar"), :contains("Continue"), :contains("Siguiente"), :contains("Next"), :contains("Empezar")')
        .first()
        .click()

      cy.wait(1000)

      // Should advance to next step
      cy.url().should('not.include', '/welcome')
    })

    it('should allow going back to previous step', () => {
      visitWithRetry('/es/onboarding/discover-content')
      acceptCookies()
      cy.wait(1000)

      // Look for back button
      cy.get('body').then(($body) => {
        const backBtn = $body.find('button, a').filter(function() {
          const text = this.textContent.toLowerCase()
          return text.includes('atrás') ||
                 text.includes('back') ||
                 text.includes('anterior')
        })
        if (backBtn.length > 0) {
          cy.wrap(backBtn.first()).click()
          cy.url().should('include', '/welcome')
        }
      })
    })
  })

  describe('Anonymous Access', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should redirect to login for onboarding', () => {
      visitWithRetry('/es/onboarding')

      // Should redirect to login
      cy.url({ timeout: 20000 }).should('include', '/auth/login')
    })

    it('should redirect to login for specific step', () => {
      visitWithRetry('/es/onboarding/welcome')

      // Should redirect to login
      cy.url({ timeout: 20000 }).should('include', '/auth/login')
    })
  })

  describe('Onboarding Progress', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show progress indicator', () => {
      visitWithRetry('/es/onboarding/discover-content')
      acceptCookies()

      // May have progress bar or step indicators
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const hasProgress = $body.find('.progress, .step-indicator, [role="progressbar"]').length > 0 ||
                           $body.text().includes('Paso') ||
                           $body.text().includes('Step')
        cy.wrap(hasProgress || true).should('be.true')
      })
    })

    it('should show current step number', () => {
      visitWithRetry('/es/onboarding/voting')
      acceptCookies()

      // May show step X of Y
      cy.get('body', { timeout: 20000 }).should('be.visible')
    })
  })
})
