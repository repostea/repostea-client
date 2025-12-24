export default defineNuxtPlugin(async (_nuxtApp) => {
  const prefsStore = useUserPreferencesStore()
  const prefsCookie = useCookie('user_prefs')

  // Initialize preferences from cookie during SSR
  if (prefsCookie.value) {
    try {
      const prefs = typeof prefsCookie.value === 'string'
        ? JSON.parse(prefsCookie.value)
        : prefsCookie.value

      if (prefs.theme) {
        prefsStore.theme = prefs.theme
      }
      if (prefs.layout) {
        prefsStore.layout = prefs.layout
      }
      if (prefs.sortBy) {
        prefsStore.sortBy = prefs.sortBy
      }
      if (prefs.sortDir) {
        prefsStore.sortDir = prefs.sortDir
      }
      if (prefs.selectedLanguages) {
        prefsStore.selectedLanguages = prefs.selectedLanguages
      }
    } catch (error) {
      console.error('[PREFS INIT] Error parsing preferences cookie:', error)
    }
  }
})
