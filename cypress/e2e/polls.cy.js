/**
 * E2E Tests for Polls
 *
 * Tests poll functionality with real data:
 * - Create poll via wizard
 * - Display poll on page
 * - Vote in poll
 */
describe('Polls E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser
  let testPoll

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
    // Create test user
    cy.createUser({
      username: `polltest_${uniqueId}`,
      email: `polltest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      // Create test poll post
      cy.createPost({
        user_id: user.id,
        title: `Test Poll ${uniqueId}`,
        content: 'Which option do you prefer?',
        content_type: 'poll',
        status: 'published',
        media_metadata: JSON.stringify({
          poll_options: ['Option A', 'Option B', 'Option C'],
        }),
      }).then((poll) => {
        testPoll = poll
      })
    })
  })

  after(() => {
    // Cleanup
    if (testPoll?.id) {
      cy.deletePost(testPoll.id)
    }
    if (testUser?.id) {
      cy.deleteUser(testUser.id)
    }
  })

  describe('Poll Creation Wizard', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show poll content type option in submit form', () => {
      visitWithRetry('/en/submit')
      acceptCookies()

      // Poll option button should exist
      cy.get('[data-testid="content-type-poll"]', { timeout: 10000 }).should('exist')
      cy.contains('Poll', { timeout: 5000 }).should('be.visible')
    })

    it('should advance to title step after selecting poll type', () => {
      visitWithRetry('/en/submit')
      acceptCookies()

      // Wait for Vue hydration to complete
      cy.get('[data-hydrated="true"]', { timeout: 10000 }).should('exist')

      // Ensure we're on step 1
      cy.get('[data-testid="step-indicator"]').should('contain', '1')

      // Select poll type - wizard auto-advances to step 2 after 300ms
      cy.get('[data-testid="content-type-poll"]', { timeout: 10000 }).should('be.visible').click()

      // Verify we advanced to step 2
      cy.get('[data-testid="step-indicator"]', { timeout: 10000 }).should('contain', '2')

      // Should show Title input field in step 2
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible')
    })
  })

  describe('Poll Display', () => {
    it('should display poll title on post page', () => {
      visitWithRetry(`/en/posts/${testPoll.slug}`)
      acceptCookies()

      cy.contains(testPoll.title, { timeout: 10000 }).should('be.visible')
    })

    it('should display poll options', () => {
      visitWithRetry(`/en/posts/${testPoll.slug}`)
      acceptCookies()

      // Poll options should be visible
      cy.contains('Option A', { timeout: 10000 }).should('be.visible')
      cy.contains('Option B').should('be.visible')
      cy.contains('Option C').should('be.visible')
    })
  })

  describe('Poll Voting', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show vote buttons for authenticated user', () => {
      visitWithRetry(`/en/posts/${testPoll.slug}`)
      acceptCookies()

      // Should have clickable poll options (buttons or radio inputs)
      cy.get('[class*="poll"] button, [class*="poll"] input[type="radio"], .poll-option', {
        timeout: 10000,
      }).should('have.length.at.least', 1)
    })
  })
})
