// HMR Error Handler Plugin
// Handles WebSocket connection errors to prevent unhandled rejections

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Handle WebSocket connection errors
    const handleSocketError = (event) => {
      event.preventDefault()
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
        event.preventDefault()
      }
    })
  }
})
