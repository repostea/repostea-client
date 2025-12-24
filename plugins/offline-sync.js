import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  // Only run on client
  if (import.meta.client) {
    // Service for offline synchronization
    const offlineSyncService = {
      // Check connectivity
      isOnline: () => {
        return navigator && navigator.onLine
      },

      // Sync data when connection is restored
      syncWhenOnline: async (callback) => {
        if (!callback || typeof callback !== 'function') {
          console.error('A callback function is required for syncing')
          return
        }

        if (navigator) {
          // Listen for connection events
          window.addEventListener('online', async () => {
            await callback()
          })
        }
      },

      // Save data locally for later synchronization
      saveForLater: (key, data) => {
        if (!key || !data) return false

        try {
          // Use localStorage or IndexedDB depending on availability
          localStorage.setItem(`offline_${key}`, JSON.stringify(data))
          return true
        } catch (error) {
          console.error('Error saving offline data:', error)
          return false
        }
      },

      // Retrieve pending sync data
      getPendingData: (key) => {
        if (!key) return null

        try {
          const data = localStorage.getItem(`offline_${key}`)
          return data ? JSON.parse(data) : null
        } catch (error) {
          console.error('Error retrieving offline data:', error)
          return null
        }
      },

      // Clear already synced data
      clearSyncedData: (key) => {
        if (!key) return false

        try {
          localStorage.removeItem(`offline_${key}`)
          return true
        } catch (error) {
          console.error('Error clearing synced data:', error)
          return false
        }
      },
    }

    // Provide plugin functionality to the application
    return {
      provide: {
        offlineSync: offlineSyncService,
      },
    }
  }
})
