import { useAuthStore } from '~/stores/auth'
import { useUserPreferencesStore } from '~/stores/userPreferences'
import { useSystemSettings } from '~/composables/useSystemSettings'

/**
 * Consolidated app initialization plugin
 * Handles auth, user preferences, and system settings initialization
 *
 * This replaces:
 * - auth-init.client.js
 * - user-preferences-init.client.js
 * - system-settings-init.client.js
 */
export default defineNuxtPlugin(async () => {
  // 1. Initialize auth store (synchronous - uses cached data)
  const authStore = useAuthStore()
  authStore.initialize()

  // 2. Load user preferences from cookie
  const preferencesStore = useUserPreferencesStore()
  const prefsCookie = useCookie('user_prefs', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })

  if (prefsCookie.value) {
    try {
      let cookiePrefs = {}

      if (typeof prefsCookie.value === 'string') {
        cookiePrefs = JSON.parse(prefsCookie.value)
      } else {
        cookiePrefs = prefsCookie.value
      }

      // Initialize preferences from cookie
      if (cookiePrefs.selectedLanguages) {
        preferencesStore.selectedLanguages = cookiePrefs.selectedLanguages
      }
      if (cookiePrefs.theme) {
        preferencesStore.theme = cookiePrefs.theme
      }
      if (cookiePrefs.layout) {
        preferencesStore.layout = cookiePrefs.layout
      }
      if (cookiePrefs.sortBy) {
        preferencesStore.sortBy = cookiePrefs.sortBy
      }
      if (cookiePrefs.sortDir) {
        preferencesStore.sortDir = cookiePrefs.sortDir
      }
    } catch (e) {
      console.error('[APP INIT] Error loading preferences from cookie:', e)
    }
  }

  // 3. Load system settings (async)
  const { fetchSettings } = useSystemSettings()
  try {
    await fetchSettings()
  } catch (error) {
    console.error('[APP INIT] Failed to load system settings:', error)
    // Settings will use secure defaults
  }
})
