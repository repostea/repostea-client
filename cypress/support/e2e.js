// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Import cypress-pipe for retrying clicks (SSR hydration workaround)
import 'cypress-pipe'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global error handling
Cypress.on('uncaught:exception', (err, _runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  // Leaflet circular dependency issue - safe to ignore in tests
  if (err.message.includes('Cannot access') && err.message.includes('before initialization')) {
    return false
  }
  return true
})
