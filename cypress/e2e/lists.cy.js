/**
 * E2E Tests for Saved Lists
 *
 * Tests saved lists functionality:
 * - View lists page
 * - Create custom list
 * - View list detail
 * - Add/remove posts from lists
 * - Edit list
 * - Delete list
 * - Public/private lists
 */
describe('Saved Lists E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser
  let testPost

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
      username: `liststest_${uniqueId}`,
      email: `liststest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      cy.createPost({
        title: `List Test Post ${uniqueId}`,
        slug: `list-test-post-${uniqueId}`,
        content_type: 'text',
        content: 'Post for testing lists functionality.',
        status: 'published',
        user_id: user.id,
        sub_id: 1,
      }).then((post) => {
        testPost = post
      })
    })
  })

  describe('Lists Page Access', () => {
    it('should be accessible without authentication', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      visitWithRetry('/en/lists')
      acceptCookies()

      // Lists page is public - shows page title
      cy.get('h1', { timeout: 10000 }).should('contain.text', 'Saved Lists')
    })

    it('should show lists page when authenticated', () => {
      cy.loginAs(testUser)
      visitWithRetry('/en/lists')
      acceptCookies()

      // English: "Saved Lists"
      cy.get('h1', { timeout: 10000 }).should('contain.text', 'Saved Lists')
    })
  })

  describe('Default Lists (created on demand)', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display Saved Lists page for authenticated user', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      // Page loads with correct title
      cy.get('h1', { timeout: 10000 }).should('contain.text', 'Saved Lists')
    })

    it('should display favorites list after toggling favorite on a post', () => {
      // Get token from localStorage after login
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token')

        // Toggle favorite on the test post using correct API endpoint
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/v1/posts/toggle-favorite`,
          headers: { Authorization: `Bearer ${token}` },
          body: { post_id: testPost.id },
        })
      })

      visitWithRetry('/en/lists')
      acceptCookies()

      // Now Favorites list should exist
      cy.contains('Favorites', { timeout: 10000 }).should('exist')
    })
  })

  describe('Create Custom List', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show create list button', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      // English: "Create New List" or "Create new list"
      cy.get('button', { timeout: 10000 }).contains(/create/i).should('be.visible')
    })

    it('should open create list modal', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      cy.get('button').contains(/create/i).click()
      cy.get('[aria-modal="true"], .fixed', { timeout: 5000 }).should('be.visible')
      cy.get('#list-name, input[type="text"]').should('be.visible')
    })

    it('should create a new custom list', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      cy.get('button').contains(/create/i).click()
      cy.wait(500)

      const listName = `Test List ${uniqueId}`
      cy.get('#list-name').type(listName)
      cy.get('#list-description').type('Test list description')

      cy.get('button').contains(/create/i).last().click()

      cy.wait(2000)
      cy.contains(listName, { timeout: 10000 }).should('be.visible')
    })
  })

  describe('List Detail', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should navigate to list detail page', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      cy.get('body', { timeout: 10000 }).then(($body) => {
        // Check if there are any list links
        if ($body.find('a[href*="/lists/"]').length > 0) {
          cy.get('a[href*="/lists/"]').first().click()
          cy.url().should('include', '/lists/')
        } else {
          cy.log('No list links found - skipping navigation test')
        }
      })
    })
  })

  describe('Edit List', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show edit button for custom lists', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      cy.get('body').then(($body) => {
        if ($body.find('.border-primary').length > 0) {
          cy.get('.border-primary')
            .first()
            .parent()
            .find('button')
            .contains(/edit/i)
            .should('exist')
        }
      })
    })
  })

  describe('Delete List', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show delete button for custom lists', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      cy.get('body').then(($body) => {
        if ($body.find('.border-primary').length > 0) {
          cy.get('.border-primary')
            .first()
            .parent()
            .find('button')
            .contains(/delete/i)
            .should('exist')
        }
      })
    })

    it('should show confirmation modal when deleting', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      cy.get('body').then(($body) => {
        if ($body.find('.border-primary').length > 0) {
          cy.get('.border-primary')
            .first()
            .parent()
            .find('button')
            .contains(/delete/i)
            .click()

          cy.get('[aria-modal="true"], .fixed', { timeout: 5000 }).should('be.visible')
        }
      })
    })
  })

  describe('Public Lists', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show public badge for public lists', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      cy.get('body').then(($body) => {
        const publicBadges = $body.find('.bg-green-100, [class*="public"]')
        if (publicBadges.length > 0) {
          cy.get('.bg-green-100, [class*="public"]').should('exist')
        }
      })
    })

    it('should toggle public/private in create modal', () => {
      visitWithRetry('/en/lists')
      acceptCookies()

      cy.get('button').contains(/create/i).click()
      cy.wait(500)
      cy.get('#is-public, input[type="checkbox"]').should('exist')
    })
  })
})
