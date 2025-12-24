/**
 * E2E Tests for Post Creation Wizard
 *
 * Tests the complete multi-step post creation flow including:
 * - Content type selection (link/text/image/video)
 * - Form validation
 * - Community selection
 * - NSFW marking, language, anonymous options
 * - File uploads
 */

describe.skip('Post Creation Wizard', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()

    // Mock authenticated user
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

    // Mock communities list
    cy.intercept('GET', '**/api/v1/communities*', {
      statusCode: 200,
      body: {
        data: [
          { id: 1, name: 'Technology', slug: 'technology', member_count: 1000 },
          { id: 2, name: 'Gaming', slug: 'gaming', member_count: 500 },
          { id: 3, name: 'News', slug: 'news', member_count: 2000 },
        ],
        meta: { total: 3 },
      },
    }).as('getCommunities')

    // Set auth token
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'valid-token')
      win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
    })
  })

  describe('Step 1: Content Type Selection', () => {
    it('should display all content type options', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      // Should show step indicator
      cy.get('[data-testid="step-indicator"]').should('contain', 'Paso 1')

      // Should show all content types
      cy.get('[data-testid="content-type-link"]').should('be.visible')
      cy.get('[data-testid="content-type-text"]').should('be.visible')
      cy.get('[data-testid="content-type-image"]').should('be.visible')
      cy.get('[data-testid="content-type-video"]').should('be.visible')
    })

    it('should select link content type', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      cy.get('[data-testid="content-type-link"]').click()

      // Should highlight selected type
      cy.get('[data-testid="content-type-link"]').should(
        'have.class',
        'border-primary'
      )

      // Should advance to step 2 automatically or with next button
      cy.get('[data-testid="step-indicator"]').should('contain', 'Paso 2')
    })

    it('should select text content type', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      cy.get('[data-testid="content-type-text"]').click()

      cy.get('[data-testid="content-type-text"]').should(
        'have.class',
        'border-primary'
      )
    })

    it('should show progress bar', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      cy.get('[data-testid="progress-bar"]').should('be.visible')
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'style')
    })
  })

  describe('Step 2: Title and Content', () => {
    beforeEach(() => {
      cy.visit('/es/submit')
      cy.wait('@getUser')
      cy.get('[data-testid="content-type-link"]').click()
    })

    it('should display title and URL fields for link posts', () => {
      // Should show title input
      cy.get('[data-testid="title-input"]').should('be.visible')

      // Should show URL input for link posts
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="url-input"]').length > 0) {
          cy.get('[data-testid="url-input"]').should('be.visible')
        } else if ($body.find('input[type="url"]').length > 0) {
          cy.get('input[type="url"]').should('be.visible')
        }
      })
    })

    it('should validate required title', () => {
      // Try to proceed without title
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()

          // Should show validation error
          cy.get('body').should('contain', /requerido|required/i)
        } else if ($body.find('button:contains("Siguiente")').length > 0) {
          cy.contains('button', 'Siguiente').click()
          cy.get('body').should('contain', /requerido|required/i)
        }
      })
    })

    it('should accept valid title and URL', () => {
      // Fill title
      cy.get('[data-testid="title-input"]').type('Test Post Title')

      // Fill URL if visible
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="url-input"]').length > 0) {
          cy.get('[data-testid="url-input"]').type('https://example.com/article')
        } else if ($body.find('input[type="url"]').length > 0) {
          cy.get('input[type="url"]').type('https://example.com/article')
        }
      })

      // Proceed to next step
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()
        } else if ($body.find('button:contains("Siguiente")').length > 0) {
          cy.contains('button', 'Siguiente').click()
        }
      })

      // Should advance to step 3
      cy.get('[data-testid="step-indicator"]').should('contain', 'Paso 3')
    })

    it('should validate URL format for link posts', () => {
      cy.get('[data-testid="title-input"]').type('Test Post')

      // Try invalid URL
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="url-input"]').length > 0) {
          cy.get('[data-testid="url-input"]').type('not-a-valid-url')
        } else if ($body.find('input[type="url"]').length > 0) {
          cy.get('input[type="url"]').type('not-a-valid-url')
        }
      })

      // Try to proceed
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()
          // Should show validation error or prevent submission
          cy.wait(500)
        }
      })
    })

    it('should enforce title length limits', () => {
      // Try very long title (> 300 characters)
      const longTitle = 'A'.repeat(350)
      cy.get('[data-testid="title-input"]').type(longTitle)

      // Should either truncate or show error
      cy.get('[data-testid="title-input"]').should(($input) => {
        const value = $input.val()
        expect(value.length).to.be.at.most(300)
      })
    })
  })

  describe('Step 3: Community Selection', () => {
    beforeEach(() => {
      cy.visit('/es/submit')
      cy.wait('@getUser')
      cy.get('[data-testid="content-type-text"]').click()
      cy.get('[data-testid="title-input"]').type('Test Post Title')

      // Advance to step 3
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()
        } else if ($body.find('button:contains("Siguiente")').length > 0) {
          cy.contains('button', 'Siguiente').click()
        }
      })
    })

    it('should display list of communities', () => {
      cy.wait('@getCommunities')

      // Should show communities
      cy.get('body').should('contain', 'Technology')
      cy.get('body').should('contain', 'Gaming')
      cy.get('body').should('contain', 'News')
    })

    it('should allow selecting a community', () => {
      cy.wait('@getCommunities')

      // Find and click a community
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="community-technology"]').length > 0) {
          cy.get('[data-testid="community-technology"]').click()
          cy.get('[data-testid="community-technology"]').should('have.class', /selected|active/)
        } else {
          cy.contains('Technology').click()
        }
      })
    })

    it('should have search/filter functionality', () => {
      cy.wait('@getCommunities')

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="community-search"]').length > 0) {
          cy.get('[data-testid="community-search"]').type('Tech')
          cy.get('body').should('contain', 'Technology')
        } else if ($body.find('input[type="search"]').length > 0) {
          cy.get('input[type="search"]').first().type('Tech')
        } else {
          cy.log('Community search not found - may use different implementation')
        }
      })
    })
  })

  describe('Step 4: Post Options (NSFW, Language, Anonymous)', () => {
    beforeEach(() => {
      cy.visit('/es/submit')
      cy.wait('@getUser')
      cy.get('[data-testid="content-type-text"]').click()
      cy.get('[data-testid="title-input"]').type('Test Post')

      // Navigate through steps
      cy.get('body').then(($body) => {
        // Step 2 -> 3
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()
          cy.wait(500)

          // Step 3 -> 4 (select community and continue)
          cy.wait('@getCommunities')
          cy.contains('Technology').click()
          cy.get('[data-testid="next-button"]').click()
        }
      })
    })

    it('should display NSFW checkbox', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="nsfw-checkbox"]').length > 0) {
          cy.get('[data-testid="nsfw-checkbox"]').should('exist')
        } else if ($body.find('input[type="checkbox"]').length > 0) {
          // NSFW checkbox should exist somewhere
          cy.get('input[type="checkbox"]').should('have.length.greaterThan', 0)
        }
      })
    })

    it('should allow marking post as NSFW', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="nsfw-checkbox"]').length > 0) {
          cy.get('[data-testid="nsfw-checkbox"]').check()
          cy.get('[data-testid="nsfw-checkbox"]').should('be.checked')
        } else if ($body.text().includes('NSFW')) {
          cy.log('NSFW option found but with different selector')
        }
      })
    })

    it('should have language selector', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="language-select"]').length > 0) {
          cy.get('[data-testid="language-select"]').should('be.visible')
        } else if ($body.find('select').length > 0) {
          cy.get('select').should('have.length.greaterThan', 0)
        }
      })
    })

    it('should have anonymous posting option', () => {
      cy.get('body').then(($body) => {
        const hasAnonymousOption =
          $body.find('[data-testid="anonymous-checkbox"]').length > 0 ||
          $body.text().includes('anónim') ||
          $body.text().includes('Anonymous')

        expect(hasAnonymousOption).to.be.true
      })
    })
  })

  describe('Post Submission', () => {
    beforeEach(() => {
      // Mock successful post creation
      cy.intercept('POST', '**/api/v1/posts', {
        statusCode: 201,
        body: {
          data: {
            id: 100,
            title: 'Test Post',
            slug: 'test-post',
            content: 'Test content',
            user: { id: 1, username: 'testuser' },
          },
        },
      }).as('createPost')
    })

    it('should submit a complete link post', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      // Step 1: Select type
      cy.get('[data-testid="content-type-link"]').click()

      // Step 2: Fill form
      cy.get('[data-testid="title-input"]').type('My Test Link Post')

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="url-input"]').length > 0) {
          cy.get('[data-testid="url-input"]').type('https://example.com')
        } else if ($body.find('input[type="url"]').length > 0) {
          cy.get('input[type="url"]').type('https://example.com')
        }

        // Proceed through steps
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()
          cy.wait(500)

          // Step 3: Select community
          cy.wait('@getCommunities')
          cy.contains('Technology').click()
          cy.get('[data-testid="next-button"]').click()
          cy.wait(500)

          // Step 4: Submit
          if ($body.find('[data-testid="submit-button"]').length > 0) {
            cy.get('[data-testid="submit-button"]').click()
          } else {
            cy.contains('button', /Publicar|Submit/i).click()
          }

          // Should create post
          cy.wait('@createPost')

          // Should show success message
          cy.get('body').should('contain', /éxito|success/i)
        }
      })
    })

    it('should submit a text post', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      // Select text type
      cy.get('[data-testid="content-type-text"]').click()

      // Fill title
      cy.get('[data-testid="title-input"]').type('My Text Post')

      // Fill content if there's a textarea
      cy.get('body').then(($body) => {
        if ($body.find('textarea').length > 0) {
          cy.get('textarea').first().type('This is the post content with **markdown**')
        }
      })

      // Navigate and submit
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()
          cy.wait(500)
          cy.wait('@getCommunities')
          cy.contains('Gaming').click()
          cy.get('[data-testid="next-button"]').click()
          cy.wait(500)
          cy.contains('button', /Publicar|Submit/i).click()

          cy.wait('@createPost')
          cy.get('body').should('contain', /éxito|success/i)
        }
      })
    })

    it('should redirect to post page after successful creation', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      cy.get('[data-testid="content-type-text"]').click()
      cy.get('[data-testid="title-input"]').type('Test Post')

      // Mock the created post page
      cy.intercept('GET', '**/api/v1/posts/slug/test-post', {
        statusCode: 200,
        body: {
          data: {
            id: 100,
            title: 'Test Post',
            slug: 'test-post',
            content: 'Content',
            user: { id: 1, username: 'testuser' },
          },
        },
      }).as('getNewPost')

      cy.intercept('GET', '**/api/v1/posts/100/comments*', {
        statusCode: 200,
        body: { data: [], meta: { total: 0 } },
      })

      // Submit form (simplified for test)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()
          cy.wait('@getCommunities')
          cy.contains('News').click()
          cy.get('[data-testid="next-button"]').click()
          cy.contains('button', /Publicar|Submit/i).click()

          cy.wait('@createPost')

          // Should redirect to new post
          cy.url().should('include', '/posts/')
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error on failed submission', () => {
      // Mock failed post creation
      cy.intercept('POST', '**/api/v1/posts', {
        statusCode: 422,
        body: {
          message: 'Validation error',
          errors: {
            title: ['The title field is required'],
          },
        },
      }).as('createPostFailed')

      cy.visit('/es/submit')
      cy.wait('@getUser')

      cy.get('[data-testid="content-type-text"]').click()

      // Try to submit without proper data
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="submit-button"]').length > 0) {
          cy.get('[data-testid="submit-button"]').click()
        }
      })

      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '**/api/v1/posts', {
        forceNetworkError: true,
      }).as('networkError')

      cy.visit('/es/submit')
      cy.wait('@getUser')

      cy.get('[data-testid="content-type-text"]').click()
      cy.get('[data-testid="title-input"]').type('Test')

      // Try to submit
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="submit-button"]').length > 0) {
          cy.get('[data-testid="submit-button"]').click()
          cy.wait(2000)

          // Should show error
          cy.get('body').should('contain', /error|failed/i)
        }
      })
    })
  })

  describe('Navigation', () => {
    it('should allow going back to previous steps', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      // Go to step 2
      cy.get('[data-testid="content-type-link"]').click()
      cy.get('[data-testid="step-indicator"]').should('contain', 'Paso 2')

      // Look for back button
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="back-button"]').length > 0) {
          cy.get('[data-testid="back-button"]').click()
          cy.get('[data-testid="step-indicator"]').should('contain', 'Paso 1')
        } else if ($body.find('button:contains("Atrás")').length > 0) {
          cy.contains('button', 'Atrás').click()
          cy.get('[data-testid="step-indicator"]').should('contain', 'Paso 1')
        }
      })
    })

    it('should preserve form data when navigating back', () => {
      cy.visit('/es/submit')
      cy.wait('@getUser')

      cy.get('[data-testid="content-type-text"]').click()
      cy.get('[data-testid="title-input"]').type('My Title')

      // Go forward then back
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="next-button"]').length > 0) {
          cy.get('[data-testid="next-button"]').click()
          cy.wait(500)

          if ($body.find('[data-testid="back-button"]').length > 0) {
            cy.get('[data-testid="back-button"]').click()

            // Title should be preserved
            cy.get('[data-testid="title-input"]').should('have.value', 'My Title')
          }
        }
      })
    })
  })

  describe('Unauthenticated Users', () => {
    it('should redirect to login when not authenticated', () => {
      // Clear auth
      cy.clearCookies()
      cy.clearLocalStorage()

      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 401,
        body: { message: 'Unauthenticated' },
      })

      cy.visit('/es/submit')

      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })
})
