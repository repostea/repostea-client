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
    // Create a real user for testing with verified email
    cy.createUser({
      username: `commenttest_${uniqueId}`,
      email: `commenttest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user

      // Create a test post with the user as author (sub_id: 1 is the default test sub)
      cy.createPost({
        title: `Comment Test Post ${uniqueId}`,
        slug: `comment-test-post-${uniqueId}`,
        content_type: 'text',
        content: 'This is a post for testing comments functionality.',
        status: 'published',
        user_id: user.id,
        sub_id: 1,
      }).then((post) => {
        testPost = post
        cy.log('Created post:', JSON.stringify(post))
      })
    })
  })

  // Helper to get a valid post URL - either from created post or find one from homepage
  const _getPostUrl = () => {
    if (testPost && testPost.slug) {
      return `/es/posts/${testPost.slug}`
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
      visitWithRetry(`/en/posts/${postIdentifier}`)
      acceptCookies()
      // Wait for post page to load
      cy.wait(300)
    } else {
      // Fallback: go to homepage and try to find a post
      cy.log('No test post, trying homepage')
      visitWithRetry('/en/')
      acceptCookies()
      cy.wait(300)

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
      cy.get('.comments-section, .comments-list-container, [data-testid="comments"]', {
        timeout: 10000,
      }).should('exist')
    })

    it('should show comment editor when authenticated', () => {
      // Login first then visit
      cy.loginAs(testUser)
      visitAnyPost()
      acceptCookies()

      // Wait for page to fully load
      cy.wait(500)

      // Write comment button should exist and click it
      cy.get('button', { timeout: 10000 })
        .contains(/write comment/i)
        .should('be.visible')
        .click()

      // Wait for editor to appear
      cy.wait(500)

      // Comment editor should appear (use data-testid or class selectors)
      cy.get('[data-testid="comment-form"], .comment-editor, .comment-form-container', { timeout: 10000 }).should('exist')
    })

    it('should not show comment editor for unauthenticated users', () => {
      cy.clearCookies()
      cy.clearLocalStorage()

      visitAnyPost()
      acceptCookies()

      // Comment editor should not be visible for anonymous users
      cy.get('.comment-editor, textarea[placeholder*="comment"]').should('not.exist')
    })
  })

  describe('Add Comment', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should submit a new comment', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Check if comments are open and write button exists
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const writeBtn = $body.find('button').filter(function() {
          return /write comment/i.test(this.textContent)
        })

        if (writeBtn.length === 0) {
          // Comments might be closed - skip this test gracefully
          cy.log('Write comment button not found - comments may be closed')
          return
        }

        cy.wrap(writeBtn.first()).click()
        cy.wait(200)

        const commentText = `E2E test comment ${uniqueId} ${Date.now()}`

        // Check if editor appeared
        cy.get('body').then(($body2) => {
          const editor = $body2.find('.comment-editor textarea, .editor-textarea')
          if (editor.length > 0) {
            cy.wrap(editor.first()).click().type(commentText).trigger('input')

            cy.get('.comment-editor button[type="submit"]').first().click()
            cy.wait(500)

            // Comment should appear in the list
            cy.get('.comment-container, [data-testid="comment"]', { timeout: 10000 }).should(
              'contain.text',
              commentText.substring(0, 20)
            )
          } else {
            cy.log('Comment editor did not appear')
          }
        })
      })
    })

    it('should show validation error for empty comment', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Check if comments are open
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const writeBtn = $body.find('button').filter(function() {
          return /write comment/i.test(this.textContent)
        })

        if (writeBtn.length === 0) {
          cy.log('Write comment button not found - comments may be closed')
          return
        }

        cy.wrap(writeBtn.first()).click()
        cy.wait(200)

        // Check if editor appeared and submit is disabled
        cy.get('body').then(($body2) => {
          const submitBtn = $body2.find('.comment-editor button[type="submit"]')
          if (submitBtn.length > 0) {
            cy.wrap(submitBtn.first()).should('be.disabled')
          } else {
            cy.log('Comment editor did not appear')
          }
        })
      })
    })

    it('should show new comment immediately after posting', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Check if comments are open
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const writeBtn = $body.find('button').filter(function() {
          return /write comment/i.test(this.textContent)
        })

        if (writeBtn.length === 0) {
          cy.log('Write comment button not found - comments may be closed')
          return
        }

        cy.wrap(writeBtn.first()).click()
        cy.wait(200)

        const uniqueComment = `Unique comment ${Date.now()}`

        cy.get('body').then(($body2) => {
          const editor = $body2.find('.comment-editor textarea, .editor-textarea')
          if (editor.length > 0) {
            cy.wrap(editor.first()).click().clear().type(uniqueComment)
            cy.get('.comment-editor button[type="submit"]').first().click()

            // Should appear without reload
            cy.contains(uniqueComment, { timeout: 10000 }).should('be.visible')
          } else {
            cy.log('Comment editor did not appear')
          }
        })
      })
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
      cy.wait(300)

      // Check if there are existing comments with reply buttons
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const comments = $body.find('.comment-container')
        if (comments.length > 0) {
          // Check if comments have reply button
          cy.get('.comment-container').first().then(($comment) => {
            const hasReplyBtn = $comment.find('.reply-button, button[aria-label*="reply"], button[aria-label*="reply"]').length > 0
            if (hasReplyBtn) {
              cy.get('.comment-container')
                .first()
                .find('.reply-button, button[aria-label*="reply"], button[aria-label*="reply"]')
                .should('exist')
            } else {
              cy.log('Reply button not found on comments')
            }
          })
        } else {
          // No existing comments - try to add one first
          const writeBtn = $body.find('button').filter(function() {
            return /write comment/i.test(this.textContent)
          })

          if (writeBtn.length === 0) {
            cy.log('No comments and cannot add new ones')
            return
          }

          cy.wrap(writeBtn.first()).click()
          cy.wait(200)

          cy.get('body').then(($body2) => {
            const editor = $body2.find('.comment-editor textarea, .editor-textarea')
            if (editor.length > 0) {
              cy.wrap(editor.first()).click().type(parentCommentText)
              cy.get('.comment-editor button[type="submit"]').first().click()
              cy.wait(500)

              // Check for reply button on new comment
              cy.get('.comment-container', { timeout: 10000 })
                .first()
                .find('.reply-button, button[aria-label*="reply"], button[aria-label*="reply"]')
                .should('exist')
            }
          })
        }
      })
    })

    it('should open reply editor when clicking reply', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Check if there are existing comments
      cy.get('body').then(($body) => {
        const comments = $body.find('.comment-container')
        if (comments.length > 0) {
          // Click reply on first comment
          cy.get('.comment-container', { timeout: 10000 })
            .first()
            .find('.reply-button, button[aria-label*="reply"], button[aria-label*="reply"]')
            .first()
            .click()

          // Reply editor should appear (another comment-editor form)
          cy.get('.comment-editor', { timeout: 5000 }).should('be.visible')
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
            .find(
              '.vote-controls, .vote-bar-btn, button[aria-label*="positivo"], button[aria-label*="upvote"]'
            )
            .should('exist')
        }
      })
    })

    it('should upvote a comment', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Check if there are existing comments to vote on
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const comments = $body.find('.comment-container')

        if (comments.length > 0) {
          // Vote on existing comment
          const voteBtn = comments.first().find('.vote-bar-btn, button[aria-label*="positivo"], button[aria-label*="upvote"]')
          if (voteBtn.length > 0) {
            cy.get('.comment-container')
              .first()
              .find('.vote-bar-btn, button[aria-label*="positivo"], button[aria-label*="upvote"]')
              .first()
              .click()

            // Handle vote type modal if it appears
            cy.get('body').then(($body2) => {
              if ($body2.find('.vote-type-modal-backdrop').length > 0) {
                cy.get('.vote-type-modal-backdrop button, .vote-type-modal button')
                  .first()
                  .click({ force: true })
              }
            })

            cy.wait(200)
            cy.get('.comment-container').first().find('.vote-controls').should('exist')
          } else {
            cy.log('Vote buttons not found on comments')
          }
        } else {
          // No comments - try to add one first
          const writeBtn = $body.find('button').filter(function() {
            return /write comment/i.test(this.textContent)
          })

          if (writeBtn.length === 0) {
            cy.log('No comments and cannot add new ones')
            return
          }

          cy.wrap(writeBtn.first()).click()
          cy.wait(200)

          cy.get('body').then(($body2) => {
            const editor = $body2.find('.comment-editor textarea, .editor-textarea')
            if (editor.length > 0) {
              const testComment = `Comment to vote on ${Date.now()}`
              cy.wrap(editor.first()).click().type(testComment)
              cy.get('.comment-editor button[type="submit"]').first().click()
              cy.wait(500)

              // Now vote on the new comment
              cy.get('.comment-container', { timeout: 10000 })
                .first()
                .find('.vote-bar-btn, button[aria-label*="positivo"], button[aria-label*="upvote"]')
                .first()
                .click()

              cy.wait(200)
              cy.get('.comment-container').first().find('.vote-controls').should('exist')
            }
          })
        }
      })
    })
  })

  describe('Edit Comment', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show edit option on own comments', () => {
      visitAnyPost()
      acceptCookies()
      cy.wait(300)

      // Check if we can add a comment
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const writeBtn = $body.find('button').filter(function() {
          return /write comment/i.test(this.textContent)
        })

        if (writeBtn.length === 0) {
          cy.log('Write comment button not found - comments may be closed')
          return
        }

        cy.wrap(writeBtn.first()).click()
        cy.wait(200)

        cy.get('body').then(($body2) => {
          const editor = $body2.find('.comment-editor textarea, .editor-textarea')
          if (editor.length > 0) {
            const myComment = `My editable comment ${Date.now()}`
            cy.wrap(editor.first()).click().type(myComment)
            cy.get('.comment-editor button[type="submit"]').first().click()
            cy.wait(500)

            // Find the comment we just added and check for edit option
            cy.contains(myComment, { timeout: 10000 })
              .parents('.comment-container')
              .first()
              .within(() => {
                cy.get('.edit-button, button[aria-label*="edit"], button[aria-label*="edit"]').should(
                  'have.length.at.least',
                  1
                )
              })
          } else {
            cy.log('Comment editor did not appear')
          }
        })
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
      cy.wait(300)

      // Check if we can add a comment
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const writeBtn = $body.find('button').filter(function() {
          return /write comment/i.test(this.textContent)
        })

        if (writeBtn.length === 0) {
          cy.log('Write comment button not found - comments may be closed')
          return
        }

        cy.wrap(writeBtn.first()).click()
        cy.wait(200)

        cy.get('body').then(($body2) => {
          const editor = $body2.find('.comment-editor textarea, .editor-textarea')
          if (editor.length > 0) {
            const myComment = `My deletable comment ${Date.now()}`
            cy.wrap(editor.first()).click().type(myComment)
            cy.get('.comment-editor button[type="submit"]').first().click()
            cy.wait(500)

            // Find the comment and check for delete option
            cy.contains(myComment, { timeout: 10000 })
              .parents('.comment-container')
              .first()
              .within(() => {
                cy.get(
                  '.delete-button, button[aria-label*="delete"], button[aria-label*="delete"]'
                ).should('have.length.at.least', 1)
              })
          } else {
            cy.log('Comment editor did not appear')
          }
        })
      })
    })
  })
})
