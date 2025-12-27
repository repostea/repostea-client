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
    nuxtApp.hook('app:chunkError', () => {
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
        event.preventDefault()
        handleChunkError()
      }
    })

    function handleChunkError() {
      const hasReloaded = sessionStorage.getItem(RELOAD_KEY)

      if (!hasReloaded) {
        // Mark that we've attempted a reload
        sessionStorage.setItem(RELOAD_KEY, 'true')

        // Wait a tiny bit then reload
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
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
