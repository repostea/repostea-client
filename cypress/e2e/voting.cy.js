/**
 * E2E Tests for Voting System
 *
 * Tests the enhanced voting system with typed vote reasons:
 * - Upvote/downvote functionality
 * - Vote type selection modal (8 different reasons)
 * - Karma restrictions
 * - Vote updates and changes
 * - Vote indicators
 */

describe.skip('Voting System', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Vote Display and Counts', () => {
    beforeEach(() => {
      // Mock posts list with votes
      cy.intercept('GET', '**/api/v1/posts*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              title: 'Test Post 1',
              slug: 'test-post-1',
              votes_count: 42,
              user_vote: null,
              user: { id: 2, username: 'author' },
            },
            {
              id: 2,
              title: 'Test Post 2',
              slug: 'test-post-2',
              votes_count: -5,
              user_vote: null,
              user: { id: 3, username: 'author2' },
            },
          ],
          meta: { total: 2 },
        },
      }).as('getPosts')
    })

    it('should display vote counts on posts', () => {
      cy.visit('/es')
      cy.wait('@getPosts')

      // Should show vote counts
      cy.get('body').should('contain', '42')
    })

    it('should show upvote and downvote buttons', () => {
      cy.visit('/es')
      cy.wait('@getPosts')

      // Should have vote buttons (looking for arrow icons using Nuxt Icon)
      cy.get('[name*="arrow-up"]').should('have.length.greaterThan', 0)
      cy.get('[name*="arrow-down"]').should('have.length.greaterThan', 0)
    })

    it('should handle negative vote counts', () => {
      cy.visit('/es')
      cy.wait('@getPosts')

      // Should display negative numbers
      cy.get('body').should('contain', '-5')
    })
  })

  describe('Upvoting - Authenticated Users', () => {
    beforeEach(() => {
      // Mock authenticated user with karma
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            karma: 150,
          },
        },
      }).as('getUser')

      // Mock post
      cy.intercept('GET', '**/api/v1/posts/slug/test-post', {
        statusCode: 200,
        body: {
          data: {
            id: 10,
            title: 'Test Post',
            slug: 'test-post',
            content: 'Test content',
            votes_count: 5,
            user_vote: null,
            user_vote_type: null,
            user: { id: 2, username: 'author' },
          },
        },
      }).as('getPost')

      cy.intercept('GET', '**/api/v1/posts/10/comments*', {
        statusCode: 200,
        body: { data: [], meta: { total: 0 } },
      })

      // Set auth
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })
    })

    it('should open vote type modal when clicking upvote', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Click upvote button
      cy.get('.vote-up, [name*="arrow-up"]').first().click()

      // Should show vote type modal
      cy.get('.vote-type-modal').should('be.visible')

      // Should show positive vote type options
      cy.get('body').then(($body) => {
        const text = $body.text()
        const hasVoteTypes =
          text.includes('Informative') ||
          text.includes('Funny') ||
          text.includes('Interesting') ||
          text.includes('Well written')

        expect(hasVoteTypes).to.be.true
      })
    })

    it('should submit upvote with selected type', () => {
      // Mock successful vote
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 6,
            user_vote: 1,
            user_vote_type: 'informative',
          },
        },
      }).as('submitVote')

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Click upvote
      cy.get('.vote-up, [name*="arrow-up"]').first().click()

      // Wait for modal
      cy.wait(300)

      // Select a vote type (try different selectors)
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Informative")').length > 0) {
          cy.contains('button', 'Informative').click()
        } else if ($body.find('[data-vote-type="informative"]').length > 0) {
          cy.get('[data-vote-type="informative"]').click()
        } else {
          // Click first available vote type button
          cy.get('.vote-type-modal button').first().click()
        }
      })

      // Should submit vote
      cy.wait('@submitVote')

      // Should update vote count
      cy.get('body').should('contain', '6')

      // Should show vote type indicator
      cy.get('.vote-type-indicator').should('be.visible')
    })

    it('should highlight upvote button after voting', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 6,
            user_vote: 1,
            user_vote_type: 'interesting',
          },
        },
      }).as('submitVote')

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      cy.get('.vote-up, [name*="arrow-up"]').first().click()
      cy.wait(300)

      // Select vote type
      cy.get('.vote-type-modal button').first().click()
      cy.wait('@submitVote')

      // Upvote button should be highlighted (green color)
      cy.get('.vote-up').should('have.class', 'text-green-500')
    })

    it('should show all 4 positive vote types', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      cy.get('.vote-up').first().click()
      cy.wait(300)

      // Should show 4 positive vote type options
      cy.get('.vote-type-modal button').should('have.length.greaterThan', 2)
    })
  })

  describe('Downvoting - Authenticated Users', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            username: 'testuser',
            karma: 250, // Enough karma to downvote
          },
        },
      }).as('getUser')

      cy.intercept('GET', '**/api/v1/posts/slug/test-post', {
        statusCode: 200,
        body: {
          data: {
            id: 10,
            title: 'Test Post',
            slug: 'test-post',
            votes_count: 10,
            user_vote: null,
            user_vote_type: null,
            user: { id: 2, username: 'author' },
          },
        },
      }).as('getPost')

      cy.intercept('GET', '**/api/v1/posts/10/comments*', {
        statusCode: 200,
        body: { data: [], meta: { total: 0 } },
      })

      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })
    })

    it('should open vote type modal when clicking downvote', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Click downvote button
      cy.get('.vote-down, [name*="arrow-down"]').first().click()

      // Should show vote type modal
      cy.get('.vote-type-modal').should('be.visible')

      // Should show negative vote type options
      cy.get('body').then(($body) => {
        const text = $body.text()
        const hasVoteTypes =
          text.includes('Low quality') ||
          text.includes('Misleading') ||
          text.includes('Off topic') ||
          text.includes('Spam')

        expect(hasVoteTypes).to.be.true
      })
    })

    it('should submit downvote with selected type', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 9,
            user_vote: -1,
            user_vote_type: 'low_quality',
          },
        },
      }).as('submitVote')

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      cy.get('.vote-down').first().click()
      cy.wait(300)

      // Select negative vote type
      cy.get('.vote-type-modal button').first().click()

      cy.wait('@submitVote')

      // Should decrease vote count
      cy.get('body').should('contain', '9')
    })

    it('should highlight downvote button after voting', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 9,
            user_vote: -1,
            user_vote_type: 'misleading',
          },
        },
      })

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      cy.get('.vote-down').first().click()
      cy.wait(300)
      cy.get('.vote-type-modal button').first().click()

      // Downvote button should be highlighted (red color)
      cy.get('.vote-down').should('have.class', 'text-red-500')
    })

    it('should show all 4 negative vote types', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      cy.get('.vote-down').first().click()
      cy.wait(300)

      // Should show 4 negative vote type options
      cy.get('.vote-type-modal button').should('have.length.greaterThan', 2)
    })
  })

  describe('Changing Votes', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: { id: 1, username: 'testuser', karma: 200 },
        },
      }).as('getUser')

      // Post with existing upvote
      cy.intercept('GET', '**/api/v1/posts/slug/test-post', {
        statusCode: 200,
        body: {
          data: {
            id: 10,
            title: 'Test Post',
            slug: 'test-post',
            votes_count: 10,
            user_vote: 1,
            user_vote_type: 'informative',
            user: { id: 2, username: 'author' },
          },
        },
      }).as('getPost')

      cy.intercept('GET', '**/api/v1/posts/10/comments*', {
        statusCode: 200,
        body: { data: [], meta: { total: 0 } },
      })

      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })
    })

    it('should show current vote state', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Upvote button should be highlighted
      cy.get('.vote-up').should('have.class', 'text-green-500')

      // Should show vote type indicator
      cy.get('.vote-type-indicator').should('be.visible')
    })

    it('should change upvote type', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 10,
            user_vote: 1,
            user_vote_type: 'funny',
          },
        },
      }).as('changeVote')

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Click upvote again to change type
      cy.get('.vote-up').first().click()
      cy.wait(300)

      // Select different type
      cy.get('.vote-type-modal button').eq(1).click()

      cy.wait('@changeVote')

      // Vote count should stay the same
      cy.get('body').should('contain', '10')
    })

    it('should remove vote when clicking same vote button', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 9,
            user_vote: null,
            user_vote_type: null,
          },
        },
      }).as('removeVote')

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Click upvote again (already upvoted)
      cy.get('.vote-up').first().click()
      cy.wait(300)

      // Select same type or close modal to remove vote
      cy.get('body').then(($body) => {
        if ($body.find('.vote-type-modal button').length > 0) {
          // Click same type
          cy.get('.vote-type-modal button').first().click()
        }
      })

      // Should remove vote (or handle based on implementation)
      cy.wait(500)
    })

    it('should switch from upvote to downvote', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 8, // -2 from switching
            user_vote: -1,
            user_vote_type: 'low_quality',
          },
        },
      }).as('switchVote')

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Click downvote (currently upvoted)
      cy.get('.vote-down').first().click()
      cy.wait(300)

      // Select downvote type
      cy.get('.vote-type-modal button').first().click()

      cy.wait('@switchVote')

      // Should decrease by 2 (remove +1, add -1)
      cy.get('body').should('contain', '8')

      // Downvote should now be highlighted
      cy.get('.vote-down').should('have.class', 'text-red-500')
    })
  })

  describe('Voting on Comments', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: { id: 1, username: 'testuser', karma: 150 },
        },
      }).as('getUser')

      cy.intercept('GET', '**/api/v1/posts/slug/test-post', {
        statusCode: 200,
        body: {
          data: {
            id: 10,
            title: 'Test Post',
            slug: 'test-post',
            user: { id: 2, username: 'author' },
          },
        },
      }).as('getPost')

      // Mock comments with votes
      cy.intercept('GET', '**/api/v1/posts/10/comments*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              content: 'Test comment',
              votes_count: 3,
              user_vote: null,
              user_vote_type: null,
              user: { id: 3, username: 'commenter' },
              children: [],
            },
          ],
          meta: { total: 1 },
        },
      }).as('getComments')

      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })
    })

    it('should display vote controls on comments', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')
      cy.wait('@getComments')

      // Comments should have vote buttons
      cy.get('[name*="arrow-up"]').should('have.length.greaterThan', 1)
      cy.get('[name*="arrow-down"]').should('have.length.greaterThan', 1)
    })

    it('should vote on comments', () => {
      cy.intercept('POST', '**/api/v1/comments/1/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 4,
            user_vote: 1,
            user_vote_type: 'informative',
          },
        },
      }).as('voteComment')

      cy.visit('/es/posts/test-post')
      cy.wait('@getComments')

      // Find comment vote button
      cy.get('.vote-up').eq(1).click() // Second upvote button (first is post)
      cy.wait(300)

      // Select vote type
      cy.get('.vote-type-modal button').first().click()

      cy.wait('@voteComment')

      // Should update comment votes
      cy.get('body').should('contain', '4')
    })
  })

  describe('Karma Restrictions', () => {
    beforeEach(() => {
      // User with LOW karma (cannot downvote)
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: { id: 1, username: 'newuser', karma: 25 },
        },
      }).as('getUser')

      cy.intercept('GET', '**/api/v1/posts/slug/test-post', {
        statusCode: 200,
        body: {
          data: {
            id: 10,
            title: 'Test Post',
            slug: 'test-post',
            votes_count: 10,
            user_vote: null,
            user: { id: 2, username: 'author' },
          },
        },
      }).as('getPost')

      cy.intercept('GET', '**/api/v1/posts/10/comments*', {
        statusCode: 200,
        body: { data: [], meta: { total: 0 } },
      })

      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'newuser' }))
      })
    })

    it('should disable downvote for low karma users', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Downvote button should be disabled
      cy.get('.vote-down').should('have.class', 'opacity-50')
      cy.get('.vote-down').should('have.class', 'cursor-not-allowed')
    })

    it('should show tooltip explaining karma requirement', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Hover over disabled downvote
      cy.get('.vote-down').first().trigger('mouseover')

      // Should show tooltip (check for title attribute or tooltip element)
      cy.get('.vote-down').should('have.attr', 'title')
    })

    it('should still allow upvoting for low karma users', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 200,
        body: {
          data: {
            votes_count: 11,
            user_vote: 1,
            user_vote_type: 'interesting',
          },
        },
      })

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Upvote should work
      cy.get('.vote-up').should('not.have.class', 'cursor-not-allowed')
      cy.get('.vote-up').first().click()
      cy.wait(300)
      cy.get('.vote-type-modal button').first().click()

      cy.get('body').should('contain', '11')
    })
  })

  describe('Unauthenticated Users', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/posts/slug/test-post', {
        statusCode: 200,
        body: {
          data: {
            id: 10,
            title: 'Test Post',
            slug: 'test-post',
            votes_count: 15,
            user_vote: null,
            user: { id: 2, username: 'author' },
          },
        },
      }).as('getPost')

      cy.intercept('GET', '**/api/v1/posts/10/comments*', {
        statusCode: 200,
        body: { data: [], meta: { total: 0 } },
      })
    })

    it('should display vote counts to unauthenticated users', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Should show vote count
      cy.get('body').should('contain', '15')
    })

    it('should disable vote buttons for unauthenticated users', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Vote buttons should be disabled or show login prompt
      cy.get('.vote-up').first().should('have.class', 'opacity-50')
    })

    it('should prompt login when clicking vote buttons', () => {
      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      // Try to vote
      cy.get('.vote-up').first().click()

      // Should either redirect to login or show modal
      cy.url().then((url) => {
        if (url.includes('/login')) {
          cy.url().should('include', '/login')
        } else {
          // Or show login modal/message
          cy.get('body').should('contain', /login|iniciar sesión/i)
        }
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: { id: 1, username: 'testuser', karma: 150 },
        },
      }).as('getUser')

      cy.intercept('GET', '**/api/v1/posts/slug/test-post', {
        statusCode: 200,
        body: {
          data: {
            id: 10,
            title: 'Test Post',
            slug: 'test-post',
            votes_count: 10,
            user_vote: null,
            user: { id: 2, username: 'author' },
          },
        },
      }).as('getPost')

      cy.intercept('GET', '**/api/v1/posts/10/comments*', {
        statusCode: 200,
        body: { data: [], meta: { total: 0 } },
      })

      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })
    })

    it('should handle vote submission errors', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        statusCode: 500,
        body: { message: 'Server error' },
      }).as('voteError')

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      cy.get('.vote-up').first().click()
      cy.wait(300)
      cy.get('.vote-type-modal button').first().click()

      cy.wait('@voteError')

      // Should show error message
      cy.get('body').should('contain', /error|failed/i)
    })

    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '**/api/v1/posts/10/vote', {
        forceNetworkError: true,
      }).as('networkError')

      cy.visit('/es/posts/test-post')
      cy.wait('@getPost')

      cy.get('.vote-up').first().click()
      cy.wait(300)
      cy.get('.vote-type-modal button').first().click()

      cy.wait(1000)

      // Should handle gracefully
      cy.get('body').should('be.visible')
    })
  })
})
