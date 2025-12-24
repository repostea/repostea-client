// Skipped: These tests use mocked API responses and don't reflect current implementation
// Use communities.real.cy.js for real E2E tests
describe.skip('Orphaned Sub Claiming', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should display orphaned banner for orphaned sub when user can claim', () => {
    cy.intercept('GET', '**/api/v1/subs/orphaned-test*', {
      statusCode: 200,
      body: {
        data: {
          id: 1,
          name: 'orphaned-test',
          display_name: 'Orphaned Test Sub',
          description: 'A sub without an owner',
          icon: '👻',
          members_count: 50,
          posts_count: 10,
          is_member: true,
          is_moderator: false,
          is_orphaned: true,
          can_claim: true,
          has_claim_priority: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      },
    }).as('getOrphanedSub')

    cy.intercept('GET', '**/api/v1/subs/orphaned-test/posts*', {
      statusCode: 200,
      body: { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 } },
    })

    cy.intercept('GET', '**/api/v1/subs/*/rules', {
      statusCode: 200,
      body: { data: [], sub_id: 1 },
    })

    cy.visit('/es/s/orphaned-test')
    cy.wait('@getOrphanedSub')

    // Should show orphaned banner
    cy.contains(/sub sin propietario|orphaned sub/i).should('be.visible')
    cy.contains('button', /reclamar|claim/i).should('be.visible')
  })

  it('should show info banner when user cannot claim but sub is orphaned', () => {
    cy.intercept('GET', '**/api/v1/subs/orphaned-no-claim*', {
      statusCode: 200,
      body: {
        data: {
          id: 2,
          name: 'orphaned-no-claim',
          display_name: 'Orphaned No Claim',
          description: 'A sub without an owner but user cannot claim',
          icon: '👻',
          members_count: 50,
          is_member: true,
          is_moderator: false,
          is_orphaned: true,
          can_claim: false,
          has_claim_priority: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      },
    }).as('getOrphanedNoClaim')

    cy.intercept('GET', '**/api/v1/subs/orphaned-no-claim/posts*', {
      statusCode: 200,
      body: { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 } },
    })

    cy.intercept('GET', '**/api/v1/subs/*/rules', {
      statusCode: 200,
      body: { data: [], sub_id: 2 },
    })

    cy.visit('/es/s/orphaned-no-claim')
    cy.wait('@getOrphanedNoClaim')

    // Should show info banner without claim button
    cy.contains(/sub sin propietario|orphaned sub/i).should('be.visible')
    cy.contains(/tienen prioridad para reclamar|priority to claim|waiting for moderators/i).should('be.visible')
  })

  it('should not show orphaned banner for normal sub', () => {
    cy.intercept('GET', '**/api/v1/subs/normal-sub*', {
      statusCode: 200,
      body: {
        data: {
          id: 3,
          name: 'normal-sub',
          display_name: 'Normal Sub',
          description: 'A normal sub with owner',
          icon: '📄',
          members_count: 100,
          is_member: true,
          is_moderator: false,
          is_orphaned: false,
          can_claim: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      },
    }).as('getNormalSub')

    cy.intercept('GET', '**/api/v1/subs/normal-sub/posts*', {
      statusCode: 200,
      body: { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 } },
    })

    cy.intercept('GET', '**/api/v1/subs/*/rules', {
      statusCode: 200,
      body: { data: [], sub_id: 3 },
    })

    cy.visit('/es/s/normal-sub')
    cy.wait('@getNormalSub')

    // Should NOT show orphaned banner
    cy.contains(/sub sin propietario|orphaned sub/i).should('not.exist')
  })

  it('should successfully claim ownership', () => {
    // Mock authenticated user
    cy.intercept('GET', '**/api/v1/user*', {
      statusCode: 200,
      body: {
        data: {
          id: 1,
          username: 'testuser',
          display_name: 'Test User',
          email: 'test@example.com',
          karma_points: 1500,
        },
      },
    })

    // Set auth token in localStorage to simulate logged in user
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'fake-token-for-testing')
    })

    cy.intercept('GET', '**/api/v1/subs/claimable-sub*', {
      statusCode: 200,
      body: {
        data: {
          id: 4,
          name: 'claimable-sub',
          display_name: 'Claimable Sub',
          description: 'A sub ready to be claimed',
          icon: '🎯',
          members_count: 25,
          is_member: true,
          is_moderator: false,
          is_orphaned: true,
          can_claim: true,
          has_claim_priority: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      },
    }).as('getClaimableSub')

    cy.intercept('GET', '**/api/v1/subs/claimable-sub/posts*', {
      statusCode: 200,
      body: { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 } },
    })

    cy.intercept('GET', '**/api/v1/subs/*/rules', {
      statusCode: 200,
      body: { data: [], sub_id: 4 },
    })

    cy.intercept('POST', '**/api/v1/subs/4/claim*', {
      statusCode: 200,
      body: {
        message: 'Ownership claimed successfully',
        data: {
          id: 4,
          name: 'claimable-sub',
          is_orphaned: false,
          is_owner: true,
        },
      },
    }).as('claimOwnership')

    cy.visit('/es/s/claimable-sub')
    cy.wait('@getClaimableSub')

    // Click claim button
    cy.contains('button', /reclamar|claim/i).click()
    cy.wait('@claimOwnership')

    // Success message should appear (toast notification)
    // Note: This depends on how the notification system works
  })

  it('should show error when claim fails', () => {
    // Mock authenticated user
    cy.intercept('GET', '**/api/v1/user*', {
      statusCode: 200,
      body: {
        data: {
          id: 1,
          username: 'testuser',
          display_name: 'Test User',
          email: 'test@example.com',
          karma_points: 1500,
        },
      },
    })

    // Set auth token in localStorage to simulate logged in user
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'fake-token-for-testing')
    })

    cy.intercept('GET', '**/api/v1/subs/failing-claim*', {
      statusCode: 200,
      body: {
        data: {
          id: 5,
          name: 'failing-claim',
          display_name: 'Failing Claim Sub',
          icon: '❌',
          members_count: 10,
          is_member: true,
          is_orphaned: true,
          can_claim: true,
          has_claim_priority: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      },
    }).as('getFailingClaimSub')

    cy.intercept('GET', '**/api/v1/subs/failing-claim/posts*', {
      statusCode: 200,
      body: { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 } },
    })

    cy.intercept('GET', '**/api/v1/subs/*/rules', {
      statusCode: 200,
      body: { data: [], sub_id: 5 },
    })

    cy.intercept('POST', '**/api/v1/subs/5/claim*', {
      statusCode: 403,
      body: {
        error: 'Moderators have priority',
        message: 'Moderators have priority to claim this sub',
      },
    }).as('claimOwnershipFail')

    cy.visit('/es/s/failing-claim')
    cy.wait('@getFailingClaimSub')

    // Click claim button
    cy.contains('button', /reclamar|claim/i).click()
    cy.wait('@claimOwnershipFail')

    // Claim button should still be visible (claim failed)
    cy.contains('button', /reclamar|claim/i).should('be.visible')
  })
})

describe.skip('Communities (Subs) Management', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Create Community', () => {
    describe('Requirements and Authentication', () => {
      it('should show login requirement message for unauthenticated users', () => {
        cy.visit('/es/s/create')
        cy.contains(/necesitas iniciar sesión|login required/i).should('be.visible')
      })

      it('should show requirements warning for users without enough karma', () => {
        // Mock user with low karma
        cy.intercept('GET', '**/api/v1/user', {
          statusCode: 200,
          body: {
            data: {
              id: 1,
              username: 'lowkarmauser',
              display_name: 'Low Karma User',
              karma_points: 500, // Less than 1000 required
              created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days old
            },
          },
        }).as('getUser')

        cy.visit('/es/s/create')
        cy.wait('@getUser')

        // Should show requirements warning
        cy.contains(/requisitos no cumplidos|requirements not met/i).should('be.visible')
        cy.contains(/1000 puntos de karma/i).should('be.visible')

        // Submit button should be disabled
        cy.contains('button', /crear comunidad|create sub/i).should('be.disabled')
      })

      it('should show requirements warning for new accounts', () => {
        // Mock user with new account
        cy.intercept('GET', '**/api/v1/user', {
          statusCode: 200,
          body: {
            data: {
              id: 1,
              username: 'newuser',
              display_name: 'New User',
              karma_points: 1500, // Enough karma
              created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Only 10 days old
            },
          },
        }).as('getUser')

        cy.visit('/es/s/create')
        cy.wait('@getUser')

        // Should show requirements warning
        cy.contains(/requisitos no cumplidos|requirements not met/i).should('be.visible')
        cy.contains(/30 días|30 days/i).should('be.visible')

        // Submit button should be disabled
        cy.contains('button', /crear comunidad|create sub/i).should('be.disabled')
      })

      it('should allow creation for users meeting all requirements', () => {
        // Mock user with enough karma and account age
        cy.intercept('GET', '**/api/v1/user', {
          statusCode: 200,
          body: {
            data: {
              id: 1,
              username: 'eligibleuser',
              display_name: 'Eligible User',
              karma_points: 1500,
              created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days old
            },
          },
        }).as('getUser')

        cy.visit('/es/s/create')
        cy.wait('@getUser')

        // Should NOT show requirements warning
        cy.get('body').then($body => {
          if ($body.text().match(/requisitos no cumplidos|requirements not met/i)) {
            throw new Error('Requirements warning should not be visible')
          }
        })

        // Submit button should be enabled (but may be disabled for other reasons like empty form)
        cy.contains('button', /crear comunidad|create sub/i).should('exist')
      })
    })

    describe('Form Validation', () => {
      beforeEach(() => {
        // Mock eligible user
        cy.intercept('GET', '**/api/v1/user', {
          statusCode: 200,
          body: {
            data: {
              id: 1,
              username: 'testuser',
              display_name: 'Test User',
              karma_points: 1500,
              created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        }).as('getUser')

        cy.visit('/es/s/create')
        cy.wait('@getUser')
      })

      it('should validate community name format', () => {
        // Name too short
        cy.get('#name').type('ab')
        cy.get('#name').blur()
        cy.contains(/al menos 3 caracteres|at least 3/i).should('be.visible')

        // Name too long
        cy.get('#name').clear().type('a'.repeat(30))
        cy.get('#name').blur()
        cy.contains(/no puede tener más de 25|cannot be more than 25/i).should('be.visible')

        // Invalid characters
        cy.get('#name').clear().type('test-comm@unity')
        cy.get('#name').blur()
        cy.contains(/solo se permiten|only allowed/i).should('be.visible')

        // Valid name
        cy.get('#name').clear().type('testcommunity')
        cy.get('#name').blur()
        cy.get('body').then($body => {
          const text = $body.text()
          if (text.match(/al menos 3 caracteres|at least 3/i) ||
              text.match(/no puede tener más de 25|cannot be more than 25/i) ||
              text.match(/solo se permiten|only allowed/i)) {
            throw new Error('Should not show validation errors for valid name')
          }
        })
      })

      it('should require all mandatory fields', () => {
        // Try to submit without filling fields
        cy.contains('button', /crear comunidad|create sub/i).should('be.disabled')

        // Fill name
        cy.get('#name').type('testcommunity')
        cy.contains('button', /crear comunidad|create sub/i).should('be.disabled')

        // Fill title
        cy.get('#title').type('Test Community')
        cy.contains('button', /crear comunidad|create sub/i).should('be.disabled')

        // Fill description
        cy.get('#description').type('This is a test community for testing purposes')

        // Should be able to submit now
        cy.contains('button', /crear comunidad|create sub/i).should('not.be.disabled')
      })

      it('should enforce description character limit', () => {
        cy.get('#description').type('a'.repeat(500))
        cy.contains('500/500').should('be.visible')

        // Typing more should not exceed limit
        cy.get('#description').type('more text')
        cy.get('#description').should('have.value', 'a'.repeat(500))
      })

      it('should require at least one content type', () => {
        // Fill required fields
        cy.get('#name').type('testcommunity')
        cy.get('#title').type('Test Community')
        cy.get('#description').type('This is a test community')

        // Uncheck all content types
        cy.get('#allow_text').uncheck()
        cy.get('#allow_link').uncheck()
        cy.get('#allow_image').uncheck()
        cy.get('#allow_video').uncheck()
        cy.get('#allow_audio').uncheck()
        cy.get('#allow_poll').uncheck()

        // Submit button should be disabled
        cy.contains('button', /crear comunidad|create sub/i).should('be.disabled')

        // Check one content type
        cy.get('#allow_text').check()
        cy.contains('button', /crear comunidad|create sub/i).should('not.be.disabled')
      })
    })

    describe('Icon Selection', () => {
      beforeEach(() => {
        // Mock eligible user
        cy.intercept('GET', '**/api/v1/user', {
          statusCode: 200,
          body: {
            data: {
              id: 1,
              username: 'testuser',
              karma_points: 1500,
              created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        })

        cy.visit('/es/s/create')
      })

      it('should show default icon', () => {
        cy.get('body').should('contain', '📄')
      })

      it('should allow selecting from suggested icons', () => {
        // Click on a suggested icon (e.g., gaming icon)
        cy.contains('button', '🎮').click()

        // Should update the preview
        cy.get('.w-16.h-16').should('contain', '🎮')
      })

      it('should highlight selected icon', () => {
        cy.contains('button', '🎮').click()
        cy.contains('button', '🎮').should('have.class', 'bg-primary')
      })
    })

    describe('Community Rules', () => {
      beforeEach(() => {
        // Mock eligible user
        cy.intercept('GET', '**/api/v1/user', {
          statusCode: 200,
          body: {
            data: {
              id: 1,
              username: 'testuser',
              karma_points: 1500,
              created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        })

        cy.visit('/es/s/create')
      })

      it('should allow adding rules', () => {
        // Should have one rule by default
        cy.get('[class*="border-gray-200"]').contains(/Regla|Rule/).should('exist')

        // Add more rules
        cy.contains('button', /Añadir regla|Add rule/i).click()
        cy.get('input[placeholder*="título"]').should('have.length', 2)

        cy.contains('button', /Añadir regla|Add rule/i).click()
        cy.get('input[placeholder*="título"]').should('have.length', 3)
      })

      it('should allow removing rules', () => {
        // Add a second rule
        cy.contains('button', /Añadir regla|Add rule/i).click()
        cy.get('input[placeholder*="título"]').should('have.length', 2)

        // Remove it
        cy.contains('button', /Eliminar|Remove/i).first().click()
        cy.get('input[placeholder*="título"]').should('have.length', 1)
      })

      it('should limit to 10 rules', () => {
        // Add 9 more rules (1 exists by default)
        for (let i = 0; i < 9; i++) {
          cy.contains('button', /Añadir regla|Add rule/i).click()
        }

        // Add button should not be visible
        cy.contains('button', /Añadir regla|Add rule/i).should('not.exist')
      })
    })

    describe('Community Creation', () => {
      it('should successfully create a community', () => {
        // Mock eligible user
        cy.intercept('GET', '**/api/v1/user', {
          statusCode: 200,
          body: {
            data: {
              id: 1,
              username: 'testuser',
              karma_points: 1500,
              created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        })

        // Mock successful creation
        cy.intercept('POST', '**/api/v1/subs', {
          statusCode: 201,
          body: {
            data: {
              id: 1,
              name: 'testcommunity',
              display_name: 'Test Community',
              description: 'This is a test community',
              icon: '🎮',
              is_private: false,
              member_count: 1,
            },
          },
        }).as('createSub')

        cy.visit('/es/s/create')

        // Fill form
        cy.get('#name').type('testcommunity')
        cy.get('#title').type('Test Community')
        cy.get('#description').type('This is a test community for testing purposes')
        cy.contains('button', '🎮').click()

        // Submit
        cy.contains('button', /crear comunidad|create sub/i).click()
        cy.wait('@createSub')

        // Should redirect to community page
        cy.url().should('include', '/s/testcommunity')
      })

      it('should handle creation errors', () => {
        // Mock eligible user
        cy.intercept('GET', '**/api/v1/user', {
          statusCode: 200,
          body: {
            data: {
              id: 1,
              username: 'testuser',
              karma_points: 1500,
              created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        })

        // Mock error response
        cy.intercept('POST', '**/api/v1/subs', {
          statusCode: 422,
          body: {
            message: 'The name has already been taken.',
            errors: {
              name: ['The name has already been taken.'],
            },
          },
        }).as('createSubError')

        cy.visit('/es/s/create')

        // Fill form
        cy.get('#name').type('existingcommunity')
        cy.get('#title').type('Existing Community')
        cy.get('#description').type('This community already exists')

        // Submit
        cy.contains('button', /crear comunidad|create sub/i).click()
        cy.wait('@createSubError')

        // Should show error message
        cy.contains(/already been taken|ya existe/i).should('be.visible')
      })
    })
  })

  describe('View Community', () => {
    it('should display community information', () => {
      cy.intercept('GET', '**/api/v1/subs/gaming', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            name: 'gaming',
            display_name: 'Gaming',
            description: 'All about gaming',
            icon: '🎮',
            member_count: 1234,
            is_member: false,
            is_private: false,
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      }).as('getSub')

      cy.intercept('GET', '**/api/v1/subs/gaming/posts*', {
        statusCode: 200,
        body: {
          data: [],
          meta: { current_page: 1, last_page: 1, total: 0 },
        },
      })

      cy.visit('/es/s/gaming')
      cy.wait('@getSub')

      // Should display community info
      cy.contains('Gaming').should('be.visible')
      cy.contains('All about gaming').should('be.visible')
      cy.contains('🎮').should('be.visible')
      cy.contains('1234').should('be.visible') // member count
    })

    it('should display join button for non-members', () => {
      cy.intercept('GET', '**/api/v1/subs/gaming', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            name: 'gaming',
            display_name: 'Gaming',
            description: 'All about gaming',
            member_count: 1234,
            is_member: false,
          },
        },
      })

      cy.intercept('GET', '**/api/v1/subs/gaming/posts*', {
        statusCode: 200,
        body: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
      })

      cy.visit('/es/s/gaming')

      // Should show join button
      cy.contains('button', /unirse|join/i).should('be.visible')
    })

    it('should display leave button for members', () => {
      cy.intercept('GET', '**/api/v1/subs/gaming', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            name: 'gaming',
            display_name: 'Gaming',
            is_member: true,
            member_count: 1234,
          },
        },
      })

      cy.intercept('GET', '**/api/v1/subs/gaming/posts*', {
        statusCode: 200,
        body: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
      })

      cy.visit('/es/s/gaming')

      // Should show leave button
      cy.contains('button', /abandonar|leave|joined/i).should('be.visible')
    })
  })

  describe('Join/Leave Community', () => {
    it('should join a community', () => {
      cy.intercept('GET', '**/api/v1/subs/gaming', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            name: 'gaming',
            display_name: 'Gaming',
            is_member: false,
            member_count: 1234,
          },
        },
      }).as('getSub')

      cy.intercept('GET', '**/api/v1/subs/gaming/posts*', {
        statusCode: 200,
        body: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
      })

      cy.intercept('POST', '**/api/v1/subs/1/join', {
        statusCode: 200,
        body: {
          data: {
            is_member: true,
            member_count: 1235,
          },
        },
      }).as('joinSub')

      cy.visit('/es/s/gaming')
      cy.wait('@getSub')

      // Click join button
      cy.contains('button', /unirse|join/i).click()
      cy.wait('@joinSub')

      // Should update to show leave button
      cy.contains('button', /abandonar|leave|joined/i).should('be.visible')
    })

    it('should leave a community', () => {
      cy.intercept('GET', '**/api/v1/subs/gaming', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            name: 'gaming',
            is_member: true,
            member_count: 1234,
          },
        },
      }).as('getSub')

      cy.intercept('GET', '**/api/v1/subs/gaming/posts*', {
        statusCode: 200,
        body: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
      })

      cy.intercept('POST', '**/api/v1/subs/1/leave', {
        statusCode: 200,
        body: {
          data: {
            is_member: false,
            member_count: 1233,
          },
        },
      }).as('leaveSub')

      cy.visit('/es/s/gaming')
      cy.wait('@getSub')

      // Click leave button
      cy.contains('button', /abandonar|leave|joined/i).click()
      cy.wait('@leaveSub')

      // Should update to show join button
      cy.contains('button', /unirse|join/i).should('be.visible')
    })

    it('should handle join/leave errors', () => {
      cy.intercept('GET', '**/api/v1/subs/gaming', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            name: 'gaming',
            is_member: false,
            member_count: 1234,
          },
        },
      })

      cy.intercept('GET', '**/api/v1/subs/gaming/posts*', {
        statusCode: 200,
        body: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
      })

      cy.intercept('POST', '**/api/v1/subs/1/join', {
        statusCode: 500,
        body: {
          message: 'Server error',
        },
      }).as('joinSubError')

      cy.visit('/es/s/gaming')

      // Try to join
      cy.contains('button', /unirse|join/i).click()
      cy.wait('@joinSubError')

      // Should still show join button (join failed)
      cy.contains('button', /unirse|join/i).should('be.visible')
    })
  })

  describe('Community List', () => {
    it('should display list of communities', () => {
      cy.intercept('GET', '**/api/v1/subs*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              name: 'gaming',
              display_name: 'Gaming',
              description: 'All about gaming',
              icon: '🎮',
              member_count: 1234,
              is_member: true,
            },
            {
              id: 2,
              name: 'technology',
              display_name: 'Technology',
              description: 'Tech discussions',
              icon: '💻',
              member_count: 5678,
              is_member: false,
            },
          ],
          meta: {
            current_page: 1,
            last_page: 1,
            total: 2,
          },
        },
      }).as('getSubs')

      cy.visit('/es/s')
      cy.wait('@getSubs')

      // Should display both communities
      cy.contains('Gaming').should('be.visible')
      cy.contains('Technology').should('be.visible')
      cy.contains('1234').should('be.visible')
      cy.contains('5678').should('be.visible')
    })

    it('should filter my communities', () => {
      cy.intercept('GET', '**/api/v1/subs*', (req) => {
        const isMine = req.url.includes('mine=true')
        req.reply({
          statusCode: 200,
          body: {
            data: isMine ? [
              {
                id: 1,
                name: 'gaming',
                display_name: 'Gaming',
                is_member: true,
                member_count: 1234,
              },
            ] : [
              {
                id: 1,
                name: 'gaming',
                display_name: 'Gaming',
                is_member: true,
                member_count: 1234,
              },
              {
                id: 2,
                name: 'technology',
                display_name: 'Technology',
                is_member: false,
                member_count: 5678,
              },
            ],
            meta: {
              current_page: 1,
              last_page: 1,
              total: isMine ? 1 : 2,
            },
          },
        })
      }).as('getSubs')

      cy.visit('/es/s')
      cy.wait('@getSubs')

      // Should show all communities initially
      cy.contains('Gaming').should('be.visible')
      cy.contains('Technology').should('be.visible')

      // Click "My Communities" filter
      cy.get('body').then($body => {
        if ($body.text().match(/mis comunidades|my communities/i)) {
          cy.contains(/mis comunidades|my communities/i).click()
          cy.wait('@getSubs')

          // Should only show joined community
          cy.contains('Gaming').should('be.visible')
          cy.contains('Technology').should('not.exist')
        }
      })
    })

    it('should search communities', () => {
      cy.intercept('GET', '**/api/v1/subs*', (req) => {
        const search = new URL(req.url).searchParams.get('search')
        const data = search === 'tech' ? [
          {
            id: 2,
            name: 'technology',
            display_name: 'Technology',
            member_count: 5678,
          },
        ] : [
          {
            id: 1,
            name: 'gaming',
            display_name: 'Gaming',
            member_count: 1234,
          },
          {
            id: 2,
            name: 'technology',
            display_name: 'Technology',
            member_count: 5678,
          },
        ]

        req.reply({
          statusCode: 200,
          body: {
            data,
            meta: { current_page: 1, last_page: 1, total: data.length },
          },
        })
      }).as('searchSubs')

      cy.visit('/es/s')
      cy.wait('@searchSubs')

      // Search for "tech"
      cy.get('input[type="search"], input[placeholder*="uscar"], input[placeholder*="earch"]').first().type('tech')
      cy.wait('@searchSubs')

      // Should only show technology community
      cy.contains('Technology').should('be.visible')
      cy.get('body').then($body => {
        if ($body.text().includes('Gaming')) {
          throw new Error('Gaming should not be visible in search results')
        }
      })
    })
  })
})
