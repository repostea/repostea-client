// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Laravel Cypress integration commands

/**
 * Login as anonymous user
 */
Cypress.Commands.add('loginAnonymous', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/api/auth/anonymous`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    expect(response.status).to.eq(200)
    // Store auth token if needed
    if (response.body.token) {
      window.localStorage.setItem('auth_token', response.body.token)
    }
  })
})

/**
 * Reset database to clean state
 */
Cypress.Commands.add('resetDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/__cypress__/artisan`,
    body: {
      command: 'migrate:fresh --seed',
    },
  })
})

/**
 * Seed specific data
 */
Cypress.Commands.add('seed', (seederClass = 'DatabaseSeeder') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/__cypress__/artisan`,
    body: {
      command: `db:seed --class=${seederClass}`,
    },
  })
})

/**
 * Create a user via Laravel factory
 */
Cypress.Commands.add('createUser', (attributes = {}) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/__cypress__/factory`,
    body: {
      model: 'App\\Models\\User',
      attributes: attributes,
    },
  }).then((response) => {
    return response.body
  })
})

/**
 * Create a post via Laravel factory
 */
Cypress.Commands.add('createPost', (attributes = {}) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/__cypress__/factory`,
    body: {
      model: 'App\\Models\\Post',
      attributes: attributes,
    },
  }).then((response) => {
    return response.body
  })
})

/**
 * Create a sub/community via Laravel factory
 */
Cypress.Commands.add('createSub', (attributes = {}) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/__cypress__/factory`,
    body: {
      model: 'App\\Models\\Sub',
      attributes: attributes,
    },
  }).then((response) => {
    return response.body
  })
})

/**
 * Delete a post via Laravel factory cleanup endpoint
 */
Cypress.Commands.add('deletePost', (postId) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/__cypress__/cleanup`,
    body: {
      model: 'App\\Models\\Post',
      id: postId,
    },
    failOnStatusCode: false,
  }).then((response) => {
    return response
  })
})

/**
 * Delete a user via Laravel factory cleanup endpoint
 */
Cypress.Commands.add('deleteUser', (userId) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/__cypress__/cleanup`,
    body: {
      model: 'App\\Models\\User',
      id: userId,
    },
    failOnStatusCode: false,
  }).then((response) => {
    return response
  })
})

/**
 * Login as a specific user using Sanctum token
 */
Cypress.Commands.add('loginAs', (user) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('laravelUrl')}/__cypress__/token-login`,
    body: {
      id: user.id,
    },
  }).then((response) => {
    expect(response.status).to.eq(200)
    const { token, user: userData } = response.body

    // Set token in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('token', token)
      win.localStorage.setItem('user', JSON.stringify(userData))
      // Also set cookie consent to prevent cookie banner
      win.localStorage.setItem(
        'cookie-consent',
        JSON.stringify({
          essential: true,
          timestamp: Date.now(),
          version: '1.0',
        })
      )
    })

    // Set token cookie for SSR
    cy.setCookie('token', token, {
      path: '/',
      sameSite: 'lax',
    })

    // Set user data cookie for SSR
    cy.setCookie('user_data', JSON.stringify(userData), {
      path: '/',
      sameSite: 'lax',
    })

    cy.log(`Logged in as ${userData.username}`)
  })
})

/**
 * Visit a page with authentication
 */
Cypress.Commands.add('visitWithAuth', (url, user = null) => {
  if (user) {
    cy.loginAs(user)
  } else {
    cy.loginAnonymous()
  }
  cy.visit(url)
})

/**
 * Fill the PostFormWizard step by step
 */
Cypress.Commands.add('fillPostWizard', (postData) => {
  // Step 1: Select content type
  cy.get(`[data-testid="content-type-${postData.contentType}"]`).click()

  // Wait for automatic advancement to step 2
  cy.wait(500)

  // Step 2: Fill title and description (if needed)
  cy.get('[data-testid="title-input"]').type(postData.title)

  if (postData.description && ['link', 'video', 'audio'].includes(postData.contentType)) {
    cy.get('textarea').first().type(postData.description)
  }

  cy.get('[data-testid="next-button"]').click()

  // Step 3: Fill content based on type
  if (['link', 'video', 'audio'].includes(postData.contentType)) {
    cy.get('[data-testid="url-input"]').type(postData.url)
  } else if (postData.contentType === 'text') {
    cy.get('[data-testid="content-textarea"]').type(postData.content)
  } else if (postData.contentType === 'poll') {
    postData.pollOptions.forEach((option, index) => {
      if (index < 2) {
        cy.get(`input[placeholder="Opción ${index + 1}"]`).type(option)
      } else {
        cy.contains('Añadir opción').click()
        cy.get(`input[placeholder="Opción ${index + 1}"]`).type(option)
      }
    })
  }

  cy.get('[data-testid="next-button"]').click()

  // Step 4: Fill optional details
  if (postData.tags && postData.tags.length > 0) {
    // Add tags if component is available
    postData.tags.forEach((tag) => {
      cy.get('[data-testid="tags-input"]').type(`${tag}{enter}`)
    })
  }

  if (postData.isAnonymous) {
    cy.get('[data-testid="anonymous-checkbox"]').check()
  }
})

/**
 * Submit the post wizard
 */
Cypress.Commands.add('submitPostWizard', () => {
  cy.get('[data-testid="publish-button"]').click()
})

/**
 * Wait for success message
 */
Cypress.Commands.add('waitForSuccess', () => {
  cy.get('.bg-green-50', { timeout: 10000 }).should('be.visible')
})

/**
 * Click with retry for SSR hydration
 * Retries the click until the expected result selector becomes visible
 * This handles the case where Vue hasn't attached event handlers yet
 */
Cypress.Commands.add('clickWithRetry', { prevSubject: 'element' }, (subject, resultSelector) => {
  cy.wrap(subject)
    .pipe(($el) => $el.click())
    .should(() => {
      expect(Cypress.$(`${resultSelector}:visible`)).to.have.length.greaterThan(0)
    })
})
