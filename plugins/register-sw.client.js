/**
 * Service Worker Registration Plugin
 *
 * Only registers the service worker in production to avoid:
 * - Caching issues during development
 * - Console warnings about filesystem access
 * - Slower development workflow
 *
 * To test PWA features locally:
 *   npm run build
 *   npm run preview
 */
export default defineNuxtPlugin(() => {
  // Only register Service Worker in production
  const isProduction = process.env.NODE_ENV === 'production'

  if (import.meta.client && 'serviceWorker' in navigator && isProduction) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((_registration) => {})
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    })
  } else if (import.meta.client && !isProduction) {
  }
})
