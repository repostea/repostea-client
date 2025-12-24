import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

const STORAGE_KEY = 'userPreferences'

// Helper functions for localStorage
const loadFromLocalStorage = () => {
  if (process.client) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Error loading preferences from localStorage:', error)
      return {}
    }
  }
  return {}
}

const saveToLocalStorage = (preferences) => {
  if (process.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error)
    }
  }
}

export const useUserPreferencesStore = defineStore('userPreferences', {
  state: () => {
    const stored = loadFromLocalStorage()
    // Default to 'compact' on mobile (< 768px), 'card' on desktop
    const isMobile = process.client && window.innerWidth < 768
    const defaultLayout = isMobile ? 'compact' : 'card'
    return {
      layout: stored.layout || defaultLayout,
      theme: 'renegados1', // Theme is NEVER loaded from localStorage, only from database
      sortBy: stored.sortBy || 'created_at',
      sortDir: stored.sortDir || 'desc',
      filters: stored.filters || null,
      contentTypeFilter: null, // Temporary filter, NOT saved to localStorage or database
      selectedLanguages: [], // Content languages filter - loaded from database/cookie, not localStorage
      loading: false,
      error: null,
      pushNotifications: stored.pushNotifications || {
        enabled: false,
        comments: true,
        votes: true,
        mentions: true,
        system: true,
      },
    }
  },

  getters: {
    getLayout: (state) => state.layout,
    getTheme: (state) => state.theme,
    getSortBy: (state) => state.sortBy,
    getSortDir: (state) => state.sortDir,
    getFilters: (state) => state.filters,
    getContentTypeFilter: (state) => state.contentTypeFilter,
    getSelectedLanguages: (state) => state.selectedLanguages,
    getPushNotifications: (state) => state.pushNotifications,
  },

  actions: {
    async fetchPreferences() {
      const authStore = useAuthStore()

      // Only fetch preferences if user is authenticated and not anonymous
      if (!authStore.isAuthenticated || authStore.user?.is_guest === true) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.user.getPreferences()

        // Check if we have local preferences
        const localPrefs = loadFromLocalStorage()

        // Only update from server if we don't have local preferences
        // This gives priority to local changes over server state
        if (!localPrefs.layout || localPrefs.layout === 'card') {
          this.layout = response.data.layout
        }
        // Always update theme from database (don't check localStorage for theme)
        if (response.data.theme) {
          this.theme = response.data.theme
        }
        // Always update selectedLanguages from database (like theme, never from localStorage)
        if (response.data.content_languages) {
          this.selectedLanguages = response.data.content_languages
        }
        if (!localPrefs.sortBy || localPrefs.sortBy === 'created_at') {
          this.sortBy = response.data.sort_by
        }
        if (!localPrefs.sortDir || localPrefs.sortDir === 'desc') {
          this.sortDir = response.data.sort_dir
        }
        // Don't load filters from database - they should be temporary
        // if (!localPrefs.filters) {
        //   this.filters = response.data.filters
        // }
        if (response.data.push_notifications && !localPrefs.pushNotifications) {
          this.pushNotifications = {
            ...this.pushNotifications,
            ...response.data.push_notifications,
          }
        }

        // Sync current state with localStorage (excluding theme and filters)
        saveToLocalStorage({
          layout: this.layout,
          sortBy: this.sortBy,
          sortDir: this.sortDir,
          pushNotifications: this.pushNotifications,
        })

        // Update preferences cookie with values from database
        this.updatePreferencesCookie()
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading preferences'
        console.error('Error fetching preferences:', error)
      } finally {
        this.loading = false
      }
    },

    async savePreferences(preferences = {}) {
      const authStore = useAuthStore()


      // Only save preferences if user is authenticated and not anonymous
      if (!authStore.isAuthenticated || authStore.user?.is_guest === true) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()

        const data = {
          layout: preferences.layout || this.layout,
          theme: preferences.theme || this.theme,
          sort_by: preferences.sortBy || this.sortBy,
          sort_dir: preferences.sortDir || this.sortDir,
          // Don't send filters to database - they should be temporary
          // filters: preferences.filters || this.filters,
          content_languages: preferences.selectedLanguages || this.selectedLanguages,
          push_notifications: preferences.pushNotifications || this.pushNotifications,
        }

        await $api.user.savePreferences(data)

        // Don't update state from server response - we already updated it locally
        // This prevents race conditions where the server response overwrites local changes
      } catch (error) {
        this.error = error.response?.data?.message || 'Error saving preferences'
        console.error('[THEME STORE] Error saving preferences:', error)
      } finally {
        this.loading = false
      }
    },

    setLayout(layout) {
      this.layout = layout
      this.updatePreferencesCookie()
      // Save to localStorage immediately (excluding theme and filters)
      saveToLocalStorage({
        layout: this.layout,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        pushNotifications: this.pushNotifications,
      })
      // Also save to server if authenticated
      this.savePreferences({ layout })
    },

    updatePreferencesCookie() {
      if (process.client) {
        const prefsCookie = useCookie('user_prefs', {
          maxAge: 60 * 60 * 24 * 365, // 1 year
          sameSite: 'lax'
        })
        prefsCookie.value = JSON.stringify({
          theme: this.theme,
          layout: this.layout,
          sortBy: this.sortBy,
          sortDir: this.sortDir,
          selectedLanguages: this.selectedLanguages
        })
      }
    },

    setTheme(theme) {
      this.theme = theme
      this.updatePreferencesCookie()
      // Save to server database
      this.savePreferences({ theme })
    },

    setSelectedLanguages(languages) {
      this.selectedLanguages = languages
      this.updatePreferencesCookie()
      // Save to server database
      this.savePreferences({ selectedLanguages: languages })
    },

    setSortBy(sortBy) {
      this.sortBy = sortBy
      this.updatePreferencesCookie()
      // Save to localStorage immediately (excluding theme and filters)
      saveToLocalStorage({
        layout: this.layout,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        pushNotifications: this.pushNotifications,
      })
      this.savePreferences({ sortBy })
    },

    setSortDir(sortDir) {
      this.sortDir = sortDir
      this.updatePreferencesCookie()
      // Save to localStorage immediately (excluding theme and filters)
      saveToLocalStorage({
        layout: this.layout,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        pushNotifications: this.pushNotifications,
      })
      this.savePreferences({ sortDir })
    },

    setFilters(_filters) {
      // Deprecated: Use setContentTypeFilter instead
      // This is kept for backward compatibility but does nothing
      console.warn('[STORE] setFilters is deprecated. Filters are no longer saved.')
    },

    setContentTypeFilter(contentType) {
      // Set temporary content type filter (not saved anywhere)
      this.contentTypeFilter = contentType
    },

    setPushNotifications(pushNotifications) {
      this.pushNotifications = { ...this.pushNotifications, ...pushNotifications }
      // Save to localStorage immediately (excluding theme and filters)
      saveToLocalStorage({
        layout: this.layout,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        pushNotifications: this.pushNotifications,
      })
      this.savePreferences({ pushNotifications: this.pushNotifications })
    },

    async savePushNotificationPreferences(preferences) {
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated || authStore.user?.is_guest === true) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.notifications.updatePushPreferences(preferences)
        this.pushNotifications = { ...this.pushNotifications, ...preferences }
      } catch (error) {
        this.error = error.response?.data?.message || 'Error saving push notification preferences'
        console.error('Error saving push notification preferences:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadPushNotificationPreferences() {
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated || authStore.user?.is_guest === true) {
        return
      }

      try {
        const { $api } = useNuxtApp()
        const response = await $api.notifications.getPushPreferences()
        this.pushNotifications = { ...this.pushNotifications, ...response.data }
      } catch (error) {
        console.error('Error loading push notification preferences:', error)
      }
    },

    resetPreferences() {
      this.layout = 'card'
      this.theme = 'renegados1'
      this.sortBy = 'created_at'
      this.sortDir = 'desc'
      this.filters = null
      this.pushNotifications = {
        enabled: false,
        comments: true,
        votes: true,
        mentions: true,
        system: true,
      }
      // Clear localStorage (theme is not stored here)
      if (process.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
      // Save theme reset to database
      this.savePreferences({ theme: 'renegados1' })
    },
  },
})
