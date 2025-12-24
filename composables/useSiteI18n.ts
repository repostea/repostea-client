/**
 * Composable that wraps useI18n and automatically injects siteName
 * into all translations. Use this instead of useI18n when you need
 * translations that include the site name.
 *
 * @example
 * // In i18n JSON:
 * { "welcome": "Welcome to {siteName}!" }
 *
 * // In component:
 * const { t } = useSiteI18n()
 * t('welcome') // "Welcome to Repostea!" (or whatever NUXT_PUBLIC_APP_NAME is)
 */
export const useSiteI18n = () => {
  const i18n = useI18n()
  const config = useRuntimeConfig()

  const siteName = config.public.appName || 'Repostea'

  // Wrap the t function to automatically inject siteName
  const t = (key: string, params: Record<string, unknown> = {}) => {
    return i18n.t(key, { siteName, ...params })
  }

  // Also provide a version that works with pluralization
  const tc = (key: string, count: number, params: Record<string, unknown> = {}) => {
    return (i18n.t as any)(key, count, { siteName, ...params })
  }

  return {
    ...i18n,
    t,
    tc,
    siteName,
  }
}
