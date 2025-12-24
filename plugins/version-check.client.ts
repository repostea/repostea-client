export default defineNuxtPlugin(() => {
  // Version identifier - change this when you deploy critical updates
  const CURRENT_VERSION = '2025.11.21.1'
  const STORAGE_KEY = 'app_version'

  if (import.meta.client) {
    const storedVersion = localStorage.getItem(STORAGE_KEY)

    // If version has changed, force reload to clear cache
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)

      // Force hard reload to clear cache
      window.location.reload()
    } else if (!storedVersion) {
      // First visit, store version
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
    }
  }
})
