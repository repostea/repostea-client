import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((_nuxtApp) => {
  if (import.meta.client) {
    window.onerror = function (message, source, lineno, colno, error) {
      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Global error:', error)
      }

      // Show user-friendly message using useNotification
      import('~/composables/useNotification').then(({ useNotification }) => {
        const { error: showError } = useNotification()
        showError('An unexpected error occurred. Please try again later.', { timeout: 10000 })
      }).catch(() => {
        console.error('[Error Handler] Failed to show notification')
      })

      return false
    }

    // Handle promise rejections
    window.addEventListener('unhandledrejection', function (event) {
      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Unhandled promise rejection:', event.reason)
      }

      // Show user-friendly message using useNotification
      import('~/composables/useNotification').then(({ useNotification }) => {
        const { error: showError } = useNotification()
        showError('An operation failed. Please try again later.', { timeout: 10000 })
      }).catch(() => {
        console.error('[Error Handler] Failed to show notification')
      })
    })
  }
})
