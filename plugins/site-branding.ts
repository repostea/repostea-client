/**
 * Plugin that automatically injects siteName into all i18n translations.
 *
 * Usage in i18n JSON files:
 * { "welcome": "Welcome to {siteName}!" }
 *
 * The siteName value comes from NUXT_PUBLIC_APP_NAME or NUXT_PUBLIC_SITE_NAME env vars.
 * Default fallback is "Repostea".
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const siteName = config.public.appName || config.public.siteName || 'Repostea'

  // Get the i18n instance
  const i18n = nuxtApp.$i18n as any

  if (!i18n) {
    return
  }

  // Store the original t function
  const originalT = i18n.t.bind(i18n)

  // Override the t function to always inject siteName
  i18n.t = (key: string, ...args: any[]) => {
    // Handle different call signatures of t()
    // t(key), t(key, params), t(key, count), t(key, count, params)

    if (args.length === 0) {
      // t(key) - no params
      return originalT(key, { siteName })
    }

    const firstArg = args[0]

    if (typeof firstArg === 'number') {
      // t(key, count) or t(key, count, params)
      const params = args[1] || {}
      return originalT(key, firstArg, { siteName, ...params })
    }

    if (typeof firstArg === 'object' && firstArg !== null) {
      // t(key, params)
      return originalT(key, { siteName, ...firstArg })
    }

    // Fallback - pass through with siteName
    return originalT(key, { siteName, ...args })
  }

  // Also provide siteName globally for components that need it directly
  return {
    provide: {
      siteName,
    },
  }
})
