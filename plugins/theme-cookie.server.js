import { isDarkTheme, availableThemes } from '~/composables/useThemes'

// List of valid theme names for validation
const validThemes = availableThemes.map(t => t.name)

export default defineNuxtPlugin((_nuxtApp) => {
  if (!import.meta.server) return

  const event = useRequestEvent()
  if (!event) return

  // Check for theme in URL query parameter
  const route = useRoute()
  const urlTheme = route.query.theme

  // Read preferences from cookie (JSON encoded)
  const prefsCookie = useCookie('user_prefs', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax'
  })

  let preferences = {
    theme: 'renegados1',
    layout: 'card',
    sortBy: 'created_at',
    sortDir: 'desc'
  }

  // Parse cookie if exists
  if (prefsCookie.value) {
    try {
      if (typeof prefsCookie.value === 'string') {
        preferences = { ...preferences, ...JSON.parse(prefsCookie.value) }
      } else {
        preferences = { ...preferences, ...prefsCookie.value }
      }
    } catch (e) {
      console.error('[PREFS SSR] Error parsing preferences cookie:', e)
    }
  }

  // Migration: convert removed themes to dark-neutral
  if (preferences.theme === 'dark-zinc' || preferences.theme === 'dark-stone') {
    preferences.theme = 'dark-neutral'
    // Update cookie with migrated theme
    prefsCookie.value = JSON.stringify(preferences)
  }

  // Override theme with URL parameter if valid (does NOT update cookie)
  let activeTheme = preferences.theme
  if (urlTheme && typeof urlTheme === 'string' && validThemes.includes(urlTheme)) {
    activeTheme = urlTheme
  }

  // Determine if theme is dark
  isDarkTheme(activeTheme)

  // All theme class names for removal
  const allThemeClasses = validThemes.map(t => `theme-${t}`).join("', '")

  // Inject inline script to apply theme BEFORE page renders
  useHead({
    script: [
      {
        children: `
          (function() {
            try {
              // Check for theme in URL (client-side navigation support)
              var urlParams = new URLSearchParams(window.location.search);
              var urlTheme = urlParams.get('theme');
              var validThemes = ['${validThemes.join("', '")}'];
              var theme = (urlTheme && validThemes.indexOf(urlTheme) !== -1) ? urlTheme : '${activeTheme}';

              // Dark themes list
              var darkThemes = ['dark', 'dark-neutral', 'hacker', 'solarized-dark', 'nord', 'dracula', 'high-contrast-dark'];
              var isDark = darkThemes.indexOf(theme) !== -1;

              var html = document.documentElement;
              // Remove all theme classes
              html.classList.remove('${allThemeClasses}', 'dark');
              // Add current theme
              html.classList.add('theme-' + theme);
              if (isDark) html.classList.add('dark');
            } catch (e) {
              console.error('Error applying theme:', e);
            }
          })();
        `,
        type: 'text/javascript',
        tagPosition: 'head',
        key: 'theme-init',
      }
    ]
  })
})
