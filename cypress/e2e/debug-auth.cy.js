describe('Debug Auth', () => {
  let testUser

  before(() => {
    cy.createUser({
      username: `debug_${Date.now()}`,
      email: `debug_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_verified_at: new Date().toISOString(),
    }).then((user) => {
      testUser = user
    })
  })

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should login and see user menu', () => {
    cy.loginAs(testUser)
    cy.visit('/en/')

    // Set viewport
    cy.viewport(1280, 720)

    // Wait for user menu to be visible
    cy.get('.user-menu', { timeout: 10000 }).should('be.visible')

    // Click the desktop one with retry for SSR hydration
    cy.get('[data-testid="user-menu-button"]', { timeout: 10000 })
      .should('be.visible')
      .clickWithRetry('[data-testid="user-dropdown"]')
  })
})
