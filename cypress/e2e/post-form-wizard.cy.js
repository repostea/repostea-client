describe('PostFormWizard E2E Tests', () => {
  let testUser
  const uniqueId = Date.now()

  before(() => {
    cy.createUser({
      username: `formwizarduser_${uniqueId}`,
      email: `formwizard_${uniqueId}@example.com`,
      password: 'password123',
    }).then((user) => {
      testUser = user
    })
  })

  // Helper to wait for step change
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

  describe('Complete Submission Workflows', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
      cy.visit('/es/submit')
      cy.get('[data-testid="step-indicator"]', { timeout: 15000 }).should('be.visible')
    })

    it('should complete link submission workflow', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com/testing-guide')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Amazing Article About Testing')
      cy.get('.ProseMirror').type('This is a comprehensive guide about E2E testing with Cypress')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })

    it('should complete text post submission workflow', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('My First Text Post')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="content-textarea"]', { timeout: 5000 }).should('be.visible').type(
        'This is a comprehensive text post with markdown support and multiple paragraphs.'
      )
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })

    it('should complete poll submission workflow', () => {
      selectContentType('poll')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('What is your favorite testing framework?')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="poll-options"] input').eq(0).type('Cypress')
      cy.get('[data-testid="poll-options"] input').eq(1).type('Playwright')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })

    it('should complete video submission workflow', () => {
      selectContentType('video')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://youtube.com/watch?v=example')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Great Tutorial Video')
      cy.get('.ProseMirror').type('This video explains advanced testing concepts')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })

    it('should complete audio submission workflow', () => {
      selectContentType('audio')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://soundcloud.com/example-podcast')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Interesting Podcast Episode')
      cy.get('.ProseMirror').type('This episode covers modern web development')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })
  })

  describe('Wizard Navigation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
      cy.visit('/es/submit')
      cy.get('[data-testid="step-indicator"]', { timeout: 15000 }).should('be.visible')
    })

    it('should progress through steps correctly for link type', () => {
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'style').and('contain', '0%')

      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Post Title')
      cy.get('.ProseMirror').type('Test description')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
      cy.get('[data-testid="next-button"]').should('not.exist')
    })

    it('should progress through steps correctly for text type', () => {
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'style').and('contain', '0%')

      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Article Title')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="content-textarea"]', { timeout: 5000 }).should('be.visible').type('This is the article content with enough characters')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').should('be.visible')
    })

    it('should allow navigation back through steps', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Title')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="previous-button"]').click()
      waitForStep(2)

      cy.get('[data-testid="previous-button"]').click()
      waitForStep(1)

      cy.get('[data-testid="previous-button"]').should('not.exist')
    })

    it('should preserve data when navigating back', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('My Title')
      cy.get('.ProseMirror').type('My description')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="previous-button"]').click()
      cy.get('[data-testid="title-input"]').should('have.value', 'My Title')

      cy.get('[data-testid="previous-button"]').click()
      cy.get('[data-testid="url-input"]').should('have.value', 'https://example.com')
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
      cy.visit('/es/submit')
      cy.get('[data-testid="step-indicator"]', { timeout: 15000 }).should('be.visible')
    })

    it('should validate URL format', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('invalid-url')
      cy.get('[data-testid="url-input"]').blur()

      cy.get('[data-testid="url-error"]').should('be.visible')
      cy.get('[data-testid="next-button"]').should('be.disabled')
    })

    it('should auto-add https protocol to URLs', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible').type('example.com')
      cy.get('[data-testid="url-input"]').blur()

      cy.get('[data-testid="url-input"]').should('have.value', 'https://example.com')
    })

    it('should validate title length', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('AB')
      cy.get('[data-testid="title-input"]').blur()

      cy.get('[data-testid="title-error"]').should('be.visible')
      cy.get('[data-testid="next-button"]').should('be.disabled')
    })

    it('should show character count for title', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test')
      cy.get('[data-testid="character-count"]').should('contain', '4/255')
    })

    it('should validate poll options', () => {
      selectContentType('poll')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Poll')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="poll-options"] input').eq(0).type('Option 1')
      cy.get('[data-testid="next-button"]').should('be.disabled')

      cy.get('[data-testid="poll-options"] input').eq(1).type('Option 2')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
      cy.visit('/es/submit')
      cy.get('[data-testid="step-indicator"]', { timeout: 15000 }).should('be.visible')
    })

    it('should handle submission errors gracefully', () => {
      cy.intercept('POST', '**/api/**/posts', {
        statusCode: 422,
        body: {
          message: 'Validation error',
          errors: {
            title: ['Title is required'],
          },
        },
      }).as('createPostError')

      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Post Title')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="content-textarea"]', { timeout: 5000 }).should('be.visible').type('This is test content with enough characters')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').click()
      cy.wait('@createPostError')

      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    it('should show loading state during submission', () => {
      cy.intercept('POST', '**/api/**/posts', {
        delay: 2000,
        statusCode: 200,
        body: { data: { id: 1, slug: 'test-post' } },
      }).as('createPost')

      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Post Title')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="content-textarea"]', { timeout: 5000 }).should('be.visible').type('This is test content with enough characters')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="publish-button"]').click()

      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      cy.get('[data-testid="publish-button"]').should('be.disabled')
    })
  })

  describe('Final Step Options', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
      cy.visit('/es/submit')
      cy.get('[data-testid="step-indicator"]', { timeout: 15000 }).should('be.visible')

      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test Post')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="content-textarea"]', { timeout: 5000 }).should('be.visible').type('This is test content with enough characters')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)
    })

    it('should show guest checkbox', () => {
      cy.get('[data-testid="guest-checkbox"]').should('be.visible')
      cy.get('[data-testid="guest-checkbox"]').check({ force: true }).should('be.checked')
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
})
