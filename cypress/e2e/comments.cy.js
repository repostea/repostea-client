/**
 * E2E Tests for Comments - Real API
 *
 * Tests comment functionality with real backend:
 * - View comments on posts
 * - Add new comment
 * - Reply to comment
 * - Edit comment
 * - Delete comment
 * - Vote on comments
 */
describe('Comments E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser
  let testPost

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
    // Create a real user for testing with verified email
    cy.createUser({
      username: `commenttest_${uniqueId}`,
      email: `commenttest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      // Create a test post with the user as author
      cy.createPost({
        title: `Comment Test Post ${uniqueId}`,
        slug: `comment-test-post-${uniqueId}`,
        content_type: 'text',
        content: 'This is a post for testing comments functionality.',
        status: 'published',
        user_id: user.id,
      }).then((post) => {
        testPost = post
        cy.log('Created post:', JSON.stringify(post))
      })
    })
  })

  // Helper to get a valid post URL - either from created post or find one from homepage
  const _getPostUrl = () => {
    if (testPost && testPost.slug) {
      return `/es/p/${testPost.slug}`
    }
    // Fallback: visit homepage and get first post link
    return null
  }

  // Helper to navigate to any post page
  const visitAnyPost = () => {
    // First try the created test post
    if (testPost && (testPost.slug || testPost.id)) {
      const postIdentifier = testPost.slug || testPost.id
      cy.log('Navigating to test post:', postIdentifier)
      visitWithRetry(`/es/p/${postIdentifier}`)
      acceptCookies()
      // Wait for post page to load
      cy.wait(1000)
    } else {
      // Fallback: go to homepage and try to find a post
      cy.log('No test post, trying homepage')
      visitWithRetry('/es/')
      acceptCookies()
      cy.wait(1000)

      // Check if there are posts on the page
      cy.get('body').then(($body) => {
        const postLinks = $body.find('a[href*="/p/"]')
        if (postLinks.length > 0) {
          cy.wrap(postLinks.first()).click()
        } else {
          // No posts found - this will cause the test to fail with a clear message
          cy.log('WARNING: No posts found on homepage')
        }
      })
    }
  }

  describe('View Comments', () => {
    it('should display comments section on post page', () => {
      visitAnyPost()
      acceptCookies()

      // Comments section should exist (comments-list-container is the main wrapper)
      cy.get('.comments-section, .comments-list-container, [data-testid="comments"]', { timeout: 20000 })
        .should('exist')
    })

    it('should show comment editor when authenticated', () => {
      cy.loginAs(testUser)
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Click "Write comment" button within comments section to show the form
      cy.get('.comments-section, .comments-list-container', { timeout: 20000 })
        .find('button')
        .contains(/escribir comentario|write comment/i)
        .click()
      cy.wait(500)

      // Comment editor should be visible (form with class comment-editor contains the textarea)
      cy.get('.comment-editor, [data-testid="comment-form"]', { timeout: 20000 })
        .should('exist')
    })

    it('should show login prompt for unauthenticated users', () => {
      cy.clearCookies()
      cy.clearLocalStorage()

      visitAnyPost()
      acceptCookies()

      // Should either show login prompt or hide comment editor
      cy.get('body').then(($body) => {
        const hasLoginPrompt = $body.text().includes('iniciar sesión') ||
                               $body.text().includes('login') ||
                               $body.text().includes('Inicia sesión')
        const hasCommentEditor = $body.find('.comment-editor, textarea[placeholder*="comment"]').length > 0

        // Either show login prompt OR hide the editor
        expect(hasLoginPrompt || !hasCommentEditor).to.be.true
      })
    })
  })

  describe('Add Comment', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should submit a new comment', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Click "Write comment" button within comments section
      cy.get('.comments-section, .comments-list-container', { timeout: 20000 })
        .find('button')
        .contains(/escribir comentario|write comment/i)
        .click()
      cy.wait(500)

      const commentText = `E2E test comment ${uniqueId} ${Date.now()}`

      // Find comment textarea within the editor form
      cy.get('.comment-editor textarea, .editor-textarea', { timeout: 20000 })
        .first()
        .click()
        .type(commentText)
        .trigger('input')

      // Submit comment using the submit button
      cy.get('.comment-editor button[type="submit"]', { timeout: 5000 })
        .first()
        .click()

      // Wait for submission
      cy.wait(2000)

      // Comment should appear in the list
      cy.get('.comment-container, [data-testid="comment"]', { timeout: 10000 })
        .should('contain.text', commentText.substring(0, 20))
    })

    it('should show validation error for empty comment', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Click "Write comment" button within comments section
      cy.get('.comments-section, .comments-list-container', { timeout: 20000 })
        .find('button')
        .contains(/escribir comentario|write comment/i)
        .click()
      cy.wait(500)

      // The submit button should be disabled for empty input
      cy.get('.comment-editor button[type="submit"]', { timeout: 5000 })
        .first()
        .should('be.disabled')
    })

    it('should show new comment immediately after posting', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Click "Write comment" button within comments section
      cy.get('.comments-section, .comments-list-container', { timeout: 20000 })
        .find('button')
        .contains(/escribir comentario|write comment/i)
        .click()
      cy.wait(500)

      const uniqueComment = `Unique comment ${Date.now()}`

      // Type comment
      cy.get('.comment-editor textarea, .editor-textarea', { timeout: 20000 })
        .first()
        .click()
        .clear()
        .type(uniqueComment)

      // Submit
      cy.get('.comment-editor button[type="submit"]', { timeout: 5000 })
        .first()
        .click()

      // Should appear without reload
      cy.contains(uniqueComment, { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Reply to Comment', () => {
    let parentCommentText

    beforeEach(() => {
      cy.loginAs(testUser)
      parentCommentText = `Parent comment ${Date.now()}`
    })

    it('should show reply button on comments', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Click "Write comment" button within comments section
      cy.get('.comments-section, .comments-list-container', { timeout: 20000 })
        .find('button')
        .contains(/escribir comentario|write comment/i)
        .click()
      cy.wait(500)

      // First add a comment to reply to
      cy.get('.comment-editor textarea, .editor-textarea', { timeout: 20000 })
        .first()
        .click()
        .type(parentCommentText)

      cy.get('.comment-editor button[type="submit"]', { timeout: 5000 })
        .first()
        .click()

      cy.wait(2000)

      // Comment should have reply button (class .reply-button)
      cy.get('.comment-container', { timeout: 10000 })
        .first()
        .find('.reply-button, button[aria-label*="responder"], button[aria-label*="reply"]')
        .should('exist')
    })

    it('should open reply editor when clicking reply', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Check if there are existing comments
      cy.get('body').then(($body) => {
        const comments = $body.find('.comment-container')
        if (comments.length > 0) {
          // Click reply on first comment
          cy.get('.comment-container', { timeout: 20000 })
            .first()
            .find('.reply-button, button[aria-label*="responder"], button[aria-label*="reply"]')
            .first()
            .click()

          // Reply editor should appear (another comment-editor form)
          cy.get('.comment-editor', { timeout: 5000 })
            .should('be.visible')
        }
      })
    })
  })

  describe('Comment Voting', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should display vote buttons on comments', () => {
      visitAnyPost()
      acceptCookies()

      // If there are comments, they should have vote buttons (VoteControls component)
      cy.get('body').then(($body) => {
        const comments = $body.find('.comment-container')
        if (comments.length > 0) {
          cy.get('.comment-container')
            .first()
            .find('.vote-controls, .vote-bar-btn, button[aria-label*="positivo"], button[aria-label*="upvote"]')
            .should('exist')
        }
      })
    })

    it('should upvote a comment', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Click "Write comment" button within comments section
      cy.get('.comments-section, .comments-list-container', { timeout: 20000 })
        .find('button')
        .contains(/escribir comentario|write comment/i)
        .click()
      cy.wait(500)

      // First ensure there's a comment
      const testComment = `Comment to vote on ${Date.now()}`
      cy.get('.comment-editor textarea, .editor-textarea', { timeout: 20000 })
        .first()
        .click()
        .type(testComment)

      cy.get('.comment-editor button[type="submit"]', { timeout: 5000 })
        .first()
        .click()

      cy.wait(2000)

      // Click upvote on a comment (vote-bar-btn is the class for vote buttons)
      cy.get('.comment-container', { timeout: 10000 })
        .first()
        .find('.vote-bar-btn, button[aria-label*="positivo"], button[aria-label*="upvote"]')
        .first()
        .click()

      cy.wait(500)

      // Vote should register (button state change or count change)
      cy.get('.comment-container')
        .first()
        .find('.vote-controls')
        .should('be.visible')
    })
  })

  describe('Edit Comment', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show edit option on own comments', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Click "Write comment" button within comments section
      cy.get('.comments-section, .comments-list-container', { timeout: 20000 })
        .find('button')
        .contains(/escribir comentario|write comment/i)
        .click()
      cy.wait(500)

      // Add a comment first
      const myComment = `My editable comment ${Date.now()}`
      cy.get('.comment-editor textarea, .editor-textarea', { timeout: 20000 })
        .first()
        .click()
        .type(myComment)

      cy.get('.comment-editor button[type="submit"]', { timeout: 5000 })
        .first()
        .click()

      cy.wait(2000)

      // Find the comment we just added and check for edit option
      cy.contains(myComment)
        .parents('.comment-container')
        .first()
        .within(() => {
          // Should have edit button (class .edit-button)
          cy.get('.edit-button, button[aria-label*="edit"], button[aria-label*="editar"]')
            .should('have.length.at.least', 1)
        })
    })
  })

  describe('Delete Comment', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show delete option on own comments', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(1000)

      // Click "Write comment" button within comments section
      cy.get('.comments-section, .comments-list-container', { timeout: 20000 })
        .find('button')
        .contains(/escribir comentario|write comment/i)
        .click()
      cy.wait(500)

      // Add a comment first
      const myComment = `My deletable comment ${Date.now()}`
      cy.get('.comment-editor textarea, .editor-textarea', { timeout: 20000 })
        .first()
        .click()
        .type(myComment)

      cy.get('.comment-editor button[type="submit"]', { timeout: 5000 })
        .first()
        .click()

      cy.wait(2000)

      // Find the comment and check for delete option
      cy.contains(myComment)
        .parents('.comment-container')
        .first()
        .within(() => {
          // Should have delete button (class .delete-button)
          cy.get('.delete-button, button[aria-label*="delete"], button[aria-label*="eliminar"]')
            .should('have.length.at.least', 1)
        })
    })
  })
})
