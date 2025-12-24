import { defineNuxtPlugin } from '#app'

/**
 * Plugin to handle chunk loading errors after deployments
 * When a new version is deployed, old JavaScript chunks are deleted
 * This causes errors for users who have the old version loaded
 * This plugin detects those errors and automatically reloads the page
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    // Track if we've already reloaded to prevent infinite loops
    const RELOAD_KEY = 'chunk-reload-attempted'

    // Detect chunk loading errors
    nuxtApp.hook('app:chunkError', ({ error }) => {
      console.warn('Chunk loading error detected:', error)
      handleChunkError()
    })

    // Also handle promise rejections for chunk loading
    window.addEventListener('unhandledrejection', (event) => {
      const errorMessage = event.reason?.message || ''

      // Check if it's a chunk loading error
      if (
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('Unable to preload CSS') ||
        errorMessage.includes('Failed to load module script')
      ) {
        console.warn('Chunk loading error detected in unhandledrejection:', event.reason)
        event.preventDefault() // Prevent default error handling
        handleChunkError()
      }
    })

    function handleChunkError() {
      const hasReloaded = sessionStorage.getItem(RELOAD_KEY)

      if (!hasReloaded) {
        console.info('New version detected. Reloading page to load latest assets...')

        // Mark that we've attempted a reload
        sessionStorage.setItem(RELOAD_KEY, 'true')

        // Wait a tiny bit to ensure the error is logged
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        console.error('Chunk loading failed even after reload. Clearing reload flag.')
        // Clear the flag so user can try again later
        sessionStorage.removeItem(RELOAD_KEY)
      }
    }

    // Clear the reload flag when navigation is successful
    nuxtApp.hook('page:finish', () => {
      sessionStorage.removeItem(RELOAD_KEY)
    })
  }
})
