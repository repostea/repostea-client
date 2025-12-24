import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    experimentalStudio: true,
    retries: {
      runMode: 0,
      openMode: 0,
    },
    env: {
      apiUrl: 'http://localhost:8000/api',
      laravelUrl: 'http://localhost:8000',
    },
    setupNodeEvents(on, config) {
      // Register custom task for logging
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      })

      // Fail fast: stop on first test failure
      if (process.env.FAIL_FAST === '1') {
        on('after:spec', (spec, results) => {
          if (results && results.stats && results.stats.failures > 0) {
            console.log('\n❌ Test failed in', spec.relative)
            console.log('Stopping execution (FAIL_FAST mode)\n')
            process.exit(1)
          }
        })
      }
      return config
    },
  },
  component: {
    devServer: {
      framework: 'nuxt',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
})
