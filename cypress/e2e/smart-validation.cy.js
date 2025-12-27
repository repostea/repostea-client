describe('Smart Validation and Error Navigation - E2E Tests', () => {
  let testUser
  const uniqueId = Date.now()

  before(() => {
    cy.createUser({
      username: `validationuser_${uniqueId}`,
      email: `validation_${uniqueId}@example.com`,
      password: 'password123',
    }).then((user) => {
      testUser = user
    })
  })

  // Helper to wait for step change
  const waitForStep = (stepNumber) => {
    cy.get('[data-testid="step-indicator"]', { timeout: 10000 }).should(
      'contain',
      String(stepNumber)
    )
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
    cy.visit('/en/submit')
    cy.get('[data-testid="step-indicator"]', { timeout: 10000 }).should('be.visible')
  })

  describe('Step-by-Step Validation', () => {
    it('should prevent advancing with invalid URL in step 2 (link type)', () => {
      selectContentType('link')

      // Type invalid URL and try to advance
      cy.get('[data-testid="url-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('not-a-valid-url')

      // Next button should be disabled for invalid URL
      cy.get('[data-testid="next-button"]').should('be.disabled')
    })

    it('should prevent advancing with empty URL in step 2 (link type)', () => {
      selectContentType('link')

      cy.get('[data-testid="next-button"]').should('be.disabled')
    })

    it('should prevent advancing with invalid title in step 3 (link type)', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('AB')
      cy.get('[data-testid="title-input"]').blur()

      cy.get('[data-testid="title-error"]').should('be.visible')
      cy.get('[data-testid="title-input"]').should('have.class', 'border-red-500')
    })

    it('should prevent advancing with invalid title in step 2 (text type)', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('AB')
      cy.get('[data-testid="title-input"]').blur()

      cy.get('[data-testid="title-error"]').should('be.visible')
      cy.get('[data-testid="next-button"]').should('be.disabled')
    })

    it('should validate text content minimum length', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('Valid Article Title')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      // Type into the actual textarea inside the markdown editor
      cy.get('.md-editor-textarea', { timeout: 5000 })
        .should('be.visible')
        .type('Short')
      cy.get('[data-testid="next-button"]').should('be.disabled')

      cy.get('.md-editor-textarea')
        .clear()
        .type('This is a longer content that should be valid')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })

    it('should validate poll options', () => {
      selectContentType('poll')

      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('Test Poll')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="poll-options"] input').first().type('Option 1')
      cy.get('[data-testid="next-button"]').should('be.disabled')

      cy.get('[data-testid="poll-options"] input').eq(1).type('Option 2')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })
  })

  describe('Real-time Validation Feedback', () => {
    it('should show error styling when field loses focus with invalid value', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('AB')
        .blur()

      cy.get('[data-testid="title-error"]').should('be.visible')
      cy.get('[data-testid="title-input"]').should('have.class', 'border-red-500')
    })

    it('should remove error styling when field becomes valid', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('AB')
        .blur()
      cy.get('[data-testid="title-input"]').should('have.class', 'border-red-500')

      cy.get('[data-testid="title-input"]').clear().type('Valid Title').blur()

      cy.get('[data-testid="title-error"]').should('not.exist')
      cy.get('[data-testid="title-input"]').should('not.have.class', 'border-red-500')
    })

    it('should accept valid URLs', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('https://example.com')
        .blur()

      // Next button should be enabled for valid URL
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })

    it('should disable next button for invalid URLs', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('not-valid')
        .blur()

      // Next button should be disabled for invalid URL
      cy.get('[data-testid="next-button"]').should('be.disabled')
    })
  })

  describe('Character Count', () => {
    it('should show real-time character count for title', () => {
      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('Test')
      cy.get('[data-testid="character-count"]').should('contain', '4/255')

      cy.get('[data-testid="title-input"]').type(' Title')
      cy.get('[data-testid="character-count"]').should('contain', '10/255')
    })
  })

  describe('Form State and Navigation', () => {
    it('should maintain form data when navigating between steps', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('Test Title')
      // Link posts use DescriptionEditor which has .editor-textarea class
      cy.get('.editor-textarea').type('Test description')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(4)

      cy.get('[data-testid="previous-button"]').click()

      cy.get('[data-testid="title-input"]').should('have.value', 'Test Title')

      cy.get('[data-testid="previous-button"]').click()
      cy.get('[data-testid="url-input"]').should('have.value', 'https://example.com')
    })

    it('should preserve data after fixing validation errors', () => {
      selectContentType('link')

      cy.get('[data-testid="url-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('https://example.com')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('AB')
      // Link posts use DescriptionEditor which has .editor-textarea class
      cy.get('.editor-textarea').type('Test description')

      cy.get('[data-testid="title-input"]').clear().type('Valid Title')

      cy.get('.editor-textarea').should('contain.value', 'Test description')
    })
  })

  describe('Different Content Types Validation', () => {
    it('should validate link type correctly', () => {
      selectContentType('link')

      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('[data-testid="url-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('https://example.com')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('Valid Title')
      cy.get('[data-testid="next-button"]').should('be.disabled')
      // Link posts use DescriptionEditor which has .editor-textarea class
      cy.get('.editor-textarea').type('Valid description')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })

    it('should validate text type correctly', () => {
      selectContentType('text')

      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('Valid Title')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('.md-editor-textarea', { timeout: 5000 })
        .should('be.visible')
        .type('Short')
      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('.md-editor-textarea')
        .clear()
        .type('This is valid content with enough characters')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })

    it('should validate poll type correctly', () => {
      selectContentType('poll')

      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('Valid Poll Title')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
      cy.get('[data-testid="next-button"]').click()
      waitForStep(3)

      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('[data-testid="poll-options"] input').eq(0).type('Option 1')
      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('[data-testid="poll-options"] input').eq(1).type('Option 2')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })

    it('should validate video type correctly', () => {
      selectContentType('video')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible')
      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('[data-testid="url-input"]').type('https://youtube.com/watch?v=test')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })

    it('should validate audio type correctly', () => {
      selectContentType('audio')

      cy.get('[data-testid="url-input"]', { timeout: 5000 }).should('be.visible')
      cy.get('[data-testid="next-button"]').should('be.disabled')
      cy.get('[data-testid="url-input"]').type('https://soundcloud.com/test')
      cy.get('[data-testid="next-button"]').should('not.be.disabled')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work correctly on mobile viewports', () => {
      cy.viewport('iphone-6')

      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 }).should('be.visible').type('AB')
      cy.get('[data-testid="title-input"]').blur()

      cy.get('[data-testid="title-error"]').should('be.visible')
      cy.get('[data-testid="title-input"]').should('have.class', 'border-red-500')
    })
  })

  describe('Performance', () => {
    it('should validate quickly without blocking UI', () => {
      const start = Date.now()

      selectContentType('text')

      cy.get('[data-testid="title-input"]', { timeout: 5000 })
        .should('be.visible')
        .type('AB')
        .blur()

      cy.get('[data-testid="title-error"]')
        .should('be.visible')
        .then(() => {
          const validationTime = Date.now() - start
          expect(validationTime).to.be.lessThan(5000)
        })
    })
  })
})
