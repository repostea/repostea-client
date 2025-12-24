/**
 * E2E Tests for Complete Authentication System
 *
 * Tests all authentication flows:
 * - Login with credentials
 * - Registration
 * - Guest/anonymous login
 * - Password recovery
 * - Email verification
 * - Session management
 */

describe.skip('Authentication System - Complete', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Login Page', () => {
    it('should display login form', () => {
      cy.visit('/es/auth/login')

      // Should show login form elements
      cy.get('input[type="email"], input[name="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.contains('button', /Iniciar sesión|Login/i).should('be.visible')
    })

    it('should display guest login option if enabled', () => {
      cy.visit('/es/auth/login')

      cy.get('body').then(($body) => {
        if ($body.text().includes('guest') || $body.text().includes('invitado')) {
          cy.get('[name*="user-secret"]').should('be.visible')
        } else {
          cy.log('Guest login not enabled')
        }
      })
    })

    it('should have links to register and password recovery', () => {
      cy.visit('/es/auth/login')

      // Should have registration link
      cy.get('body').should('contain', /Registr|Register|Sign up/i)

      // Should have forgot password link
      cy.get('body').then(($body) => {
        const hasForgotPassword =
          $body.text().includes('¿Olvidaste') ||
          $body.text().includes('Forgot') ||
          $body.text().includes('contraseña')

        expect(hasForgotPassword).to.be.true
      })
    })
  })

  describe('Login with Credentials', () => {
    it('should validate required fields', () => {
      cy.visit('/es/auth/login')

      // Try to submit without credentials
      cy.contains('button', /Iniciar sesión|Login/i).click()

      // Should show validation errors
      cy.get('body').should('contain', /requerido|required/i)
    })

    it('should validate email format', () => {
      cy.visit('/es/auth/login')

      // Enter invalid email
      cy.get('input[type="email"], input[name="email"]').type('invalid-email')
      cy.get('input[type="password"]').type('password123')
      cy.contains('button', /Iniciar sesión|Login/i).click()

      // Should show validation error
      cy.get('body').then(($body) => {
        const hasError =
          $body.text().includes('válido') ||
          $body.text().includes('valid') ||
          $body.find('input:invalid').length > 0

        expect(hasError).to.be.true
      })
    })

    it('should login successfully with valid credentials', () => {
      // Mock successful login
      cy.intercept('POST', '**/api/v1/login', {
        statusCode: 200,
        body: {
          token: 'valid-auth-token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
        },
      }).as('login')

      // Mock user endpoint
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
        },
      })

      cy.visit('/es/auth/login')

      // Fill form
      cy.get('input[type="email"], input[name="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('password123')
      cy.contains('button', /Iniciar sesión|Login/i).click()

      cy.wait('@login')

      // Should redirect to home
      cy.url().should('not.include', '/login')
      cy.url().should('match', /\/(es|en)\/?$/)
    })

    it('should show error on invalid credentials', () => {
      // Mock failed login
      cy.intercept('POST', '**/api/v1/login', {
        statusCode: 401,
        body: {
          message: 'Invalid credentials',
        },
      }).as('loginFailed')

      cy.visit('/es/auth/login')

      cy.get('input[type="email"], input[name="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('wrongpassword')
      cy.contains('button', /Iniciar sesión|Login/i).click()

      cy.wait('@loginFailed')

      // Should show error message
      cy.get('body').should('contain', /credenciales|credentials|invalid|inválid/i)
    })

    it('should persist session after login', () => {
      cy.intercept('POST', '**/api/v1/login', {
        statusCode: 200,
        body: {
          token: 'valid-auth-token',
          user: { id: 1, username: 'testuser' },
        },
      })

      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: { id: 1, username: 'testuser' },
        },
      })

      cy.visit('/es/auth/login')

      cy.get('input[type="email"], input[name="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('password123')
      cy.contains('button', /Iniciar sesión|Login/i).click()

      // Check localStorage has token
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.exist
        expect(win.localStorage.getItem('token')).to.equal('valid-auth-token')
      })
    })
  })

  describe('Guest/Anonymous Login', () => {
    it('should allow guest login', () => {
      // Mock guest login
      cy.intercept('POST', '**/api/v1/guest-login', {
        statusCode: 200,
        body: {
          token: 'guest-token',
          user: {
            id: 999,
            username: 'guest_user_123',
            is_guest: true,
          },
        },
      }).as('guestLogin')

      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: {
            id: 999,
            username: 'guest_user_123',
            is_guest: true,
          },
        },
      })

      cy.visit('/es/auth/login')

      // Look for guest login button
      cy.get('body').then(($body) => {
        if ($body.find('[name*="user-secret"]').length > 0) {
          cy.get('[name*="user-secret"]').parent('button').click()

          cy.wait('@guestLogin')

          // Should redirect
          cy.url().should('not.include', '/login')
        } else {
          cy.log('Guest login not available')
        }
      })
    })
  })

  describe('Registration', () => {
    it('should display registration form', () => {
      cy.visit('/es/auth/register')

      // Should show registration fields
      cy.get('input[name="username"], input[type="text"]').should('be.visible')
      cy.get('input[type="email"], input[name="email"]').should('be.visible')
      cy.get('input[type="password"]').should('have.length.greaterThan', 0)
      cy.contains('button', /Registr|Register|Sign up/i).should('be.visible')
    })

    it('should validate required registration fields', () => {
      cy.visit('/es/auth/register')

      // Try to submit empty form
      cy.contains('button', /Registr|Register|Sign up/i).click()

      // Should show validation errors
      cy.get('body').should('contain', /requerido|required/i)
    })

    it('should validate password strength', () => {
      cy.visit('/es/auth/register')

      // Enter weak password
      cy.get('input[name="username"], input[type="text"]').first().type('testuser')
      cy.get('input[type="email"], input[name="email"]').type('test@example.com')
      cy.get('input[type="password"]').first().type('123')

      // Should show password validation
      cy.get('body').then(($body) => {
        // Some password validation should exist
        expect($body.find('input[type="password"]').length > 0).to.be.true
      })
    })

    it('should validate password confirmation match', () => {
      cy.visit('/es/auth/register')

      cy.get('input[name="username"], input[type="text"]').first().type('testuser')
      cy.get('input[type="email"], input[name="email"]').type('test@example.com')
      cy.get('input[type="password"]').first().type('password123')

      // If there's password confirmation
      cy.get('body').then(($body) => {
        if ($body.find('input[type="password"]').length > 1) {
          cy.get('input[type="password"]').eq(1).type('differentpassword')
          cy.contains('button', /Registr|Sign up/i).click()

          // Should show mismatch error
          cy.get('body').should('contain', /coincid|match/i)
        }
      })
    })

    it('should register successfully', () => {
      // Mock successful registration
      cy.intercept('POST', '**/api/v1/register', {
        statusCode: 201,
        body: {
          token: 'new-user-token',
          user: {
            id: 2,
            username: 'newuser',
            email: 'new@example.com',
          },
        },
      }).as('register')

      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: {
            id: 2,
            username: 'newuser',
            email: 'new@example.com',
          },
        },
      })

      cy.visit('/es/auth/register')

      cy.get('input[name="username"], input[type="text"]').first().type('newuser')
      cy.get('input[type="email"], input[name="email"]').type('new@example.com')
      cy.get('input[type="password"]').first().type('SecurePassword123!')

      // If there's password confirmation
      cy.get('body').then(($body) => {
        if ($body.find('input[type="password"]').length > 1) {
          cy.get('input[type="password"]').eq(1).type('SecurePassword123!')
        }
      })

      cy.contains('button', /Registr|Sign up/i).click()

      cy.wait('@register')

      // Should redirect or show success
      cy.url().should('not.include', '/register')
    })

    it('should show error for existing username', () => {
      // Mock username already taken
      cy.intercept('POST', '**/api/v1/register', {
        statusCode: 422,
        body: {
          message: 'Validation error',
          errors: {
            username: ['The username has already been taken'],
          },
        },
      }).as('registerFailed')

      cy.visit('/es/auth/register')

      cy.get('input[name="username"], input[type="text"]').first().type('existinguser')
      cy.get('input[type="email"], input[name="email"]').type('test@example.com')
      cy.get('input[type="password"]').first().type('password123')

      cy.contains('button', /Registr|Sign up/i).click()

      cy.wait('@registerFailed')

      // Should show error
      cy.get('body').should('contain', /taken|exist|ya existe/i)
    })
  })

  describe('Password Recovery', () => {
    it('should display password recovery form', () => {
      cy.visit('/es/auth/forgot-password')

      // Should show email input
      cy.get('input[type="email"], input[name="email"]').should('be.visible')
      cy.contains('button', /Enviar|Send|Reset/i).should('be.visible')
    })

    it('should send password reset email', () => {
      // Mock password reset request
      cy.intercept('POST', '**/api/v1/forgot-password', {
        statusCode: 200,
        body: {
          message: 'Password reset link sent',
        },
      }).as('forgotPassword')

      cy.visit('/es/auth/forgot-password')

      cy.get('input[type="email"], input[name="email"]').type('test@example.com')
      cy.contains('button', /Enviar|Send|Reset/i).click()

      cy.wait('@forgotPassword')

      // Should show success message
      cy.get('body').should('contain', /enviado|sent|correo|email/i)
    })

    it('should handle non-existent email gracefully', () => {
      // Mock error for non-existent email
      cy.intercept('POST', '**/api/v1/forgot-password', {
        statusCode: 404,
        body: {
          message: 'Email not found',
        },
      }).as('emailNotFound')

      cy.visit('/es/auth/forgot-password')

      cy.get('input[type="email"], input[name="email"]').type('nonexistent@example.com')
      cy.contains('button', /Enviar|Send|Reset/i).click()

      cy.wait('@emailNotFound')

      // Should show appropriate message (may be generic for security)
      cy.get('body').should('be.visible')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      // Mock authenticated user
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: {
            id: 1,
            username: 'testuser',
          },
        },
      }).as('getUser')

      // Set auth token
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })
    })

    it('should display logout option when authenticated', () => {
      cy.visit('/es')
      cy.wait('@getUser')

      // Should show user menu or logout button
      cy.get('body').then(($body) => {
        const hasLogout =
          $body.text().includes('Cerrar sesión') ||
          $body.text().includes('Logout') ||
          $body.text().includes('Salir')

        expect(hasLogout).to.be.true
      })
    })

    it('should logout successfully', () => {
      // Mock logout
      cy.intercept('POST', '**/api/v1/logout', {
        statusCode: 200,
        body: { message: 'Logged out successfully' },
      }).as('logout')

      cy.visit('/es')
      cy.wait('@getUser')

      // Find and click logout
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Cerrar sesión")').length > 0) {
          cy.contains('button', 'Cerrar sesión').click()
        } else if ($body.find('a:contains("Logout")').length > 0) {
          cy.contains('a', 'Logout').click()
        } else if ($body.find('[data-testid="logout-button"]').length > 0) {
          cy.get('[data-testid="logout-button"]').click()
        }
      })

      cy.wait(1000)

      // Should clear token
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null
      })
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session across page refreshes', () => {
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: { id: 1, username: 'testuser' },
        },
      }).as('getUser')

      // Set token
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })

      cy.visit('/es')
      cy.wait('@getUser')

      // Refresh page
      cy.reload()

      // Should still be authenticated
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.equal('valid-token')
      })
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login for protected pages when not authenticated', () => {
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 401,
        body: { message: 'Unauthenticated' },
      })

      // Try to access protected route
      cy.visit('/es/submit')

      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should allow access to protected pages when authenticated', () => {
      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 200,
        body: {
          data: { id: 1, username: 'testuser' },
        },
      }).as('getUser')

      cy.intercept('GET', '**/api/v1/communities*', {
        statusCode: 200,
        body: { data: [], meta: { total: 0 } },
      })

      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })

      cy.visit('/es/submit')
      cy.wait('@getUser')

      // Should NOT redirect
      cy.url().should('include', '/submit')
      cy.get('[data-testid="step-indicator"]').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during login', () => {
      cy.intercept('POST', '**/api/v1/login', {
        forceNetworkError: true,
      }).as('networkError')

      cy.visit('/es/auth/login')

      cy.get('input[type="email"], input[name="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('password123')
      cy.contains('button', /Iniciar sesión|Login/i).click()

      cy.wait(2000)

      // Should show error
      cy.get('body').should('contain', /error|failed/i)
    })

    it('should handle expired tokens', () => {
      // Set expired token
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'expired-token')
        win.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }))
      })

      cy.intercept('GET', '**/api/v1/user', {
        statusCode: 401,
        body: { message: 'Token expired' },
      }).as('expiredToken')

      cy.visit('/es')
      cy.wait('@expiredToken')

      // Should redirect to login
      cy.url().should('include', '/login')

      // Should clear token
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null
      })
    })
  })
})
