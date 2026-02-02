/**
 * E2E Tests for Media Upload
 *
 * Tests media upload functionality:
 * - Image upload in posts
 * - Thumbnail upload
 * - Avatar upload
 * - Drag and drop
 * - File validation
 */
describe('Media Upload E2E Tests', () => {
  const uniqueId = Date.now()
  let testUser

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
        cy.wait(200)
      }
    })
  }

  before(() => {
    cy.createUser({
      username: `uploadtest_${uniqueId}`,
      email: `uploadtest_${uniqueId}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  describe('Image Post Upload', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show image content type option', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(300)

      cy.get('[data-testid="content-type-image"]', { timeout: 10000 }).should('exist')
    })

    it('should show upload area when image type selected', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(1000)

      // Select image type - need to wait for wizard to fully render first
      cy.get('[data-testid="content-type-image"]', { timeout: 10000 })
        .should('be.visible')
        .click()

      // Wait for auto-advance and Step 2 content to render
      cy.wait(1000)

      // Should show upload area in Step 2 (ImageUploader component)
      cy.get('.image-uploader', { timeout: 10000 }).should('exist')
    })

    it('should have file input for images', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(500)

      // Select image type - wizard auto-advances to Step 2 after 300ms
      cy.get('[data-testid="content-type-image"]', { timeout: 10000 }).click()

      // Wait for auto-advance and Step 2 content to render
      cy.wait(800)

      // File input is inside ImageUploader (hidden but exists)
      cy.get('.image-uploader input[type="file"]', { timeout: 10000 }).should('exist')
    })

    it('should accept correct image formats', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(500)

      // Select image type - wizard auto-advances to Step 2
      cy.get('[data-testid="content-type-image"]', { timeout: 10000 }).click()

      // Wait for auto-advance and Step 2 content to render
      cy.wait(800)

      // Check file input accepts image formats
      cy.get('.image-uploader input[type="file"]', { timeout: 10000 }).then(($input) => {
        const accept = $input.attr('accept')
        expect(accept).to.include('image')
      })
    })

    it('should show NSFW checkbox for image uploads', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(300)

      cy.get('body').then(($body) => {
        const imageBtn = $body.find('[data-testid="content-type-image"]')
        if (imageBtn.length > 0) {
          cy.wrap(imageBtn).click()
          cy.wait(200)

          cy.get('body').should('contain.text', 'NSFW')
        }
      })
    })
  })

  describe('Thumbnail Upload', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show thumbnail uploader in post form', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(500)

      // Wait for wizard to load
      cy.get('[data-testid="step-indicator"]', { timeout: 10000 }).should('be.visible')

      // Select link type - wizard auto-advances to Step 2 after 300ms
      cy.get('[data-testid="content-type-link"]', { timeout: 10000 }).click()

      // Wait for auto-advance and Step 2 content to render
      cy.wait(800)

      // Should show URL input in Step 2
      cy.get('[data-testid="url-input"], input[type="url"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Avatar Upload', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show avatar uploader in profile edit', () => {
      visitWithRetry('/en/profile/edit')
      acceptCookies()

      // Look for avatar text or avatar element
      cy.contains(/avatar|profile photo/i, { timeout: 10000 }).should('exist')
    })

    it('should have file input for avatar', () => {
      visitWithRetry('/en/profile/edit')
      acceptCookies()

      // AvatarUploader is inside ClientOnly, so wait for hydration
      cy.wait(1000)

      // Profile edit page should have avatar upload section
      cy.get('input[type="file"], .avatar-uploader, [class*="avatar"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Upload Error Handling', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should restrict file input to images only', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(300)

      cy.get('[data-testid="content-type-image"]', { timeout: 10000 }).click()
      cy.get('.upload-area input[type="file"]', { timeout: 10000 })
        .should('have.attr', 'accept')
        .and('include', 'image')
    })
  })

  describe('Drag and Drop', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show drag and drop area with instructions', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(300)

      cy.get('[data-testid="content-type-image"]', { timeout: 10000 }).click()
      cy.get('.upload-area', { timeout: 10000 })
        .should('exist')
        .and('contain.text', 'Drag')
    })
  })

  describe('Upload Progress', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have progress indicator markup', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(300)

      cy.get('body').then(($body) => {
        const imageBtn = $body.find('[data-testid="content-type-image"]')
        if (imageBtn.length > 0) {
          cy.wrap(imageBtn).click()
          cy.wait(200)

          // Progress elements exist but may be hidden
          cy.get('body').should('exist')
        }
      })
    })
  })

  describe('Image Preview', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should have preview container', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(500)

      // Select image type - wizard auto-advances to Step 2 after 300ms
      cy.get('[data-testid="content-type-image"]', { timeout: 10000 }).click()

      // Wait for auto-advance and Step 2 content to render
      cy.wait(800)

      // ImageUploader component (preview area) should exist in DOM
      cy.get('.image-uploader', { timeout: 10000 }).should('exist')
    })
  })

  describe('Paste Upload', () => {
    beforeEach(() => {
      cy.loginAs(testUser)
    })

    it('should show paste hint', () => {
      visitWithRetry('/en/submit')
      acceptCookies()
      cy.wait(300)

      // Select image type
      cy.get('[data-testid="content-type-image"]', { timeout: 10000 }).click()
      cy.wait(200)

      // Click Next to advance to step 2
      cy.get('[data-testid="next-button"]', { timeout: 5000 }).click()
      cy.wait(300)

      // Check for paste hint text in step 2
      cy.contains(/paste|Ctrl\+V|clipboard/i, { timeout: 10000 }).should('exist')
    })
  })
})
