// HMR Error Handler Plugin
// This plugin adds error handling for WebSocket connections used by HMR
// to prevent unhandled rejections when connections are aborted

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Handle WebSocket connection errors
    const handleSocketError = (event) => {
      console.warn('WebSocket connection error:', event)
      // Prevent the error from becoming an unhandled rejection
      event.preventDefault()

      // If in development mode, we can attempt to reconnect
      if (process.env.NODE_ENV !== 'production') {
        console.info('Attempting to reconnect HMR WebSocket...')
        // The Vite HMR client will handle reconnection automatically
        // with the timeout we've configured in nuxt.config.ts
      }
    }

    // Add global error handler for WebSocket errors
    window.addEventListener('error', (event) => {
      if (event.target instanceof WebSocket) {
        handleSocketError(event)
      }
    })

    // Handle unhandled promise rejections related to WebSocket
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason
      if (
        error &&
        error.message &&
        (error.message.includes('ECONNABORTED') ||
          error.message.includes('WebSocket') ||
          error.message.includes('socket'))
      ) {
        console.warn('Caught WebSocket related rejection:', error)
        event.preventDefault()
      }
    })
  }
})
