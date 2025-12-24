describe('Submit Post Wizard - Complete E2E Tests', () => {
  let testUser
  const uniqueId = Date.now()

  before(() => {
    cy.createUser({
      username: `wizardtester_${uniqueId}`,
      email: `wizard_${uniqueId}@test.com`,
      password: 'password123',
    }).then((user) => {
      testUser = user
    })
  })

  // Helper to wait for step change with auto-advance delay
  const waitForStep = (stepNumber) => {
    cy.get('[data-testid="step-indicator"]', { timeout: 15000 }).should('contain', String(stepNumber))
  }

  // Helper to click content type and wait for auto-advance
  const selectContentType = (type) => {
    // Wait for Vue hydration to complete
    cy.get('[data-hydrated="true"]', { timeout: 10000 }).should('exist')
    // Ensure we're on step 1
    cy.get('[data-testid="step-indicator"]').should('contain', '1')
    // Click the content type button
    cy.get(`[data-testid="content-type-${type}"]`).should('be.visible').click()
    // Verify we advanced to step 2
    waitForStep(2)
  }

  beforeEach(() => {
    cy.loginAs(testUser)
    cy.visit('/es/submit')
    cy.get('[data-testid="step-indicator"]', { timeout: 15000 }).should('be.visible')
  })

  describe('Wizard Navigation', () => {
    it('should show step 1 with 0% progress initially', () => {
      cy.get('[data-testid="step-indicator"]').should('contain', '1')
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'style').and('contain', '0%')
    })

    it('should advance automatically when content type is selected', () => {
      selectContentType('text')
    })

    it('should show correct buttons in each step', () => {
      cy.get('[data-testid="next-button"]').should('be.visible')
      cy.get('[data-testid="previous-button"]').should('not.exist')
      cy.get('[data-testid="publish-button"]').should('not.exist')

      selectContentType('link')

      cy.get('[data-testid="next-button"]').should('be.visible')
      cy.get('[data-testid="previous-button"]').should('be.visible')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Post Title Here')
      cy.get('.ProseMirror').type('Test description content')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="next-button"]').should('not.exist')
      cy.get('[data-testid="previous-button"]').should('be.visible')
      cy.get('[data-testid="publish-button"]').should('be.visible')
    })

    it('should allow navigation back and forth', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="previous-button"]').click()
      waitForStep(2)

      cy.get('[data-testid="url-input"]').should('have.value', 'https://example.com')
    })
  })

  describe('Content Type Selection', () => {
    const contentTypes = [
      { testId: 'content-type-link', type: 'link', name: 'Link' },
      { testId: 'content-type-text', type: 'text', name: 'Text' },
      { testId: 'content-type-video', type: 'video', name: 'Video' },
      { testId: 'content-type-audio', type: 'audio', name: 'Audio' },
      { testId: 'content-type-image', type: 'image', name: 'Image' },
      { testId: 'content-type-poll', type: 'poll', name: 'Poll' },
    ]

    contentTypes.forEach(({ testId, name }) => {
      it(`should handle ${name.toLowerCase()} content type selection`, () => {
        cy.get(`[data-testid="${testId}"]`).click()
        // Check it has the selected classes (border-primary is part of the selected state)
        cy.get(`[data-testid="${testId}"]`).should('have.class', 'border-primary')
        // Wait for auto-advance
        cy.wait(500)
        waitForStep(2)
      })
    })
  })

  describe('Link Content Type Flow', () => {
    beforeEach(() => {
      selectContentType('link')
    })

    it('should show URL input in step 2', () => {
      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible')
    })

    it('should validate URL format', () => {
      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('invalid url')
      cy.get('[data-testid="url-input"]').blur()
      cy.get('[data-testid="url-error"]').should('be.visible')
      cy.get('[data-testid="next-button"]').should('be.disabled')
    })

    it('should add https protocol automatically', () => {
      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('example.com')
      cy.get('[data-testid="url-input"]').blur()
      cy.get('[data-testid="url-input"]').should('have.value', 'https://example.com')
    })

    it('should show title and description in step 3', () => {
      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible')
      cy.get('.ProseMirror').should('be.visible')
    })

    it('should validate title length', () => {
      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('AB')
      cy.get('[data-testid="title-input"]').blur()
      cy.get('[data-testid="title-error"]').should('be.visible')
    })

    it('should complete full link flow', () => {
      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com/article')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Link Post Title')
      cy.get('.ProseMirror').type('This is a test description for the link post')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })
  })

  describe('Text Content Type Flow', () => {
    beforeEach(() => {
      selectContentType('text')
    })

    it('should show title input in step 2', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible')
    })

    it('should validate title minimum length', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('AB')
      cy.get('[data-testid="title-input"]').blur()
      cy.get('[data-testid="title-error"]').should('be.visible')
      cy.get('[data-testid="next-button"]').should('be.disabled')
    })

    it('should show character count', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test')
      cy.get('[data-testid="character-count"]').should('contain', '4/255')
    })

    it('should show markdown editor in step 3', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Article Title')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)
      cy.get('[data-testid="content-textarea"]', { timeout: 5000 }).should('be.visible')
    })

    it('should validate content minimum length', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Article Title')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="content-textarea"]', { timeout: 5000 }).should('be.visible').type('Short')
      cy.get('[data-testid="next-button"]').should('be.disabled')
    })

    it('should complete full text flow', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Article Title')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="content-textarea"]', { timeout: 5000 }).should('be.visible').type(
        'This is a longer content that should be valid for the text post type'
      )
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })
  })

  describe('Poll Content Type Flow', () => {
    beforeEach(() => {
      selectContentType('poll')
    })

    it('should show title input in step 2', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible')
    })

    it('should show poll options in step 3', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Poll Question')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="poll-options"]').should('be.visible')
      cy.get('[data-testid="poll-options"] input').should('have.length', 2)
    })

    it('should validate minimum poll options', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Poll Question')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="poll-options"] input').eq(0).type('Option 1')
      cy.get('[data-testid="next-button"]').should('be.disabled')

      cy.get('[data-testid="poll-options"] input').eq(1).type('Option 2')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })

    it('should complete full poll flow', () => {
      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Poll Question')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="poll-options"] input').eq(0).type('Option A')
      cy.get('[data-testid="poll-options"] input').eq(1).type('Option B')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })
  })

  describe('Final Step Options', () => {
    beforeEach(() => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Complete Test Post')
      cy.get('.ProseMirror').type('Test description for the post')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)
    })

    it('should show anonymous/guest checkbox', () => {
      cy.get('[data-testid="guest-checkbox"]').should('be.visible')
      cy.get('[data-testid="guest-checkbox"]').check({ force: true }).should('be.checked')
      cy.get('[data-testid="guest-checkbox"]').uncheck({ force: true }).should('not.be.checked')
    })

    it('should show NSFW checkbox', () => {
      cy.get('[data-testid="nsfw-checkbox"]').should('be.visible')
      cy.get('[data-testid="nsfw-checkbox"]').check({ force: true }).should('be.checked')
    })

    it('should show publish and draft buttons', () => {
      cy.get('[data-testid="publish-button"]').should('be.visible')
      cy.get('[data-testid="draft-button"]').should('be.visible')
    })
  })

  describe('Progress Bar', () => {
    it('should show correct progress percentages', () => {
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'style').and('contain', '0%')

      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'style').and('contain', '50%')

      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Post')
      cy.get('.ProseMirror').type('Description content')
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'style').and('contain', '75%')

      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'style').and('contain', '100%')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-6')

      cy.get('[data-testid="step-indicator"]').should('be.visible')
      cy.get('[data-testid="progress-bar"]').should('be.visible')

      selectContentType('text')
    })

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2')

      selectContentType('link')
      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle form submission errors gracefully', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Post')
      cy.get('.ProseMirror').type('Test description')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.intercept('POST', '**/api/**/posts', {
        statusCode: 422,
        body: { message: 'Validation error', errors: { title: ['Title already exists'] } },
      }).as('createPost')

      cy.get('[data-testid="publish-button"]').click()
      cy.wait('@createPost')

      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    it('should show loading state during submission', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Post')
      cy.get('.ProseMirror').type('Test description')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.intercept('POST', '**/api/**/posts', {
        delay: 2000,
        statusCode: 200,
        body: { data: { id: 1 } },
      }).as('createPost')

      cy.get('[data-testid="publish-button"]').click()
      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      cy.get('[data-testid="publish-button"]').should('be.disabled')
    })
  })

  describe('Data Persistence', () => {
    it('should maintain form data when navigating between steps', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://persistent-example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Persistent Test Post')
      cy.get('.ProseMirror').type('Persistent description')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="previous-button"]').click()

      cy.get('[data-testid="title-input"]').should('have.value', 'Persistent Test Post')

      cy.get('[data-testid="previous-button"]').click()
      cy.get('[data-testid="url-input"]').should('have.value', 'https://persistent-example.com')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      selectContentType('link')
      cy.get('label[for="url"]').should('be.visible')
      cy.get('[data-testid="url-input"]').should('have.attr', 'id', 'url')
    })

    it('should support keyboard navigation', () => {
      cy.get('[data-testid="content-type-link"]').focus().type('{enter}')
      cy.wait(500)
      waitForStep(2)
    })
  })
})
