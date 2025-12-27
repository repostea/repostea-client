import { useAuthStore } from '~/stores/auth'
import { isDarkTheme, availableThemes } from '~/composables/useThemes'

// List of valid theme names for validation
const validThemes = availableThemes.map((t) => t.name)

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.client) return

  const { $api } = nuxtApp
  const authStore = useAuthStore()

  // Check if there's a theme override in URL
  const hasUrlTheme = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlTheme = urlParams.get('theme')
    return urlTheme && validThemes.includes(urlTheme)
  }

  // Only sync if user is authenticated
  // We wait for auth store to be initialized (not an arbitrary timeout)
  const syncPreferences = async () => {
    // If no authenticated user, don't sync
    if (!authStore.isAuthenticated) return

    // If URL has a theme parameter, don't override it
    if (hasUrlTheme()) return

    try {
      const response = await $api.user.getPreferences()
      const dbPrefs = response.data

      const prefsCookie = useCookie('user_prefs', {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })

      let cookiePrefs = {
        theme: 'renegados1',
        layout: 'card',
        sortBy: 'created_at',
        sortDir: 'desc',
      }

      if (prefsCookie.value) {
        try {
          if (typeof prefsCookie.value === 'string') {
            cookiePrefs = { ...cookiePrefs, ...JSON.parse(prefsCookie.value) }
          } else {
            cookiePrefs = { ...cookiePrefs, ...prefsCookie.value }
          }
        } catch (e) {
          console.error('[PREFS SYNC] Error parsing cookie:', e)
        }
      }

      // Only update cookie, DO NOT change theme visually
      // Theme was already correctly applied by theme-cookie.server.js
      // If there's a difference, only update cookie for next visit
      const themesDiffer = dbPrefs.theme !== cookiePrefs.theme
      const languagesDiffer =
        JSON.stringify(dbPrefs.content_languages) !== JSON.stringify(cookiePrefs.selectedLanguages)

      if (themesDiffer || languagesDiffer) {
        const newPrefs = {
          theme: dbPrefs.theme,
          layout: dbPrefs.layout,
          sortBy: dbPrefs.sort_by,
          sortDir: dbPrefs.sort_dir,
          selectedLanguages: dbPrefs.content_languages || [],
        }

        prefsCookie.value = JSON.stringify(newPrefs)

        // Only apply theme if different AND user just logged in
        // (to avoid CLS on normal navigation)
        if (themesDiffer) {
          // Check if current theme in DOM is already correct
          const html = document.documentElement
          const currentTheme = Array.from(html.classList)
            .find((c) => c.startsWith('theme-'))
            ?.replace('theme-', '')

          // Only change if DOM has a different theme than DB
          if (currentTheme !== dbPrefs.theme) {
            // Apply with smooth transition to minimize perceived CLS
            html.style.transition = 'background-color 0.15s ease, color 0.15s ease'

            // Remove all theme classes
            validThemes.forEach((t) => html.classList.remove(`theme-${t}`))
            html.classList.remove('dark')

            // Add new theme
            html.classList.add(`theme-${dbPrefs.theme}`)
            if (isDarkTheme(dbPrefs.theme)) html.classList.add('dark')

            // Clean up transition after
            setTimeout(() => {
              html.style.transition = ''
            }, 200)
          }
        }
      }
    } catch {
      // Silent - user is not authenticated or there's a network error
    }
  }

  // Execute after app is mounted (doesn't block render)
  nuxtApp.hook('app:mounted', () => {
    // Small delay to not interfere with initial render
    requestIdleCallback ? requestIdleCallback(syncPreferences) : setTimeout(syncPreferences, 100)
  })
})
