/**
 * Composable to set canonical URL for SEO
 * Handles easter egg dialects by pointing canonical to Spanish version
 * Note: noindex meta for dialect locales is handled globally in app.vue
 */
export const useCanonical = () => {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const { locale } = useI18n()

  const siteUrl = runtimeConfig.public.siteUrl || 'http://localhost:3000'

  // Easter egg dialects - canonical should point to Spanish version
  const dialectLocales = ['ast', 'ara', 'mur', 'and', 'can', 'ext', 'cnt']

  // Build canonical URL with locale prefix
  // For dialects, replace the dialect code with 'es' to point to Spanish version
  const canonicalUrl = computed(() => {
    let path = route.path
    const currentLocale = locale.value

    // If current locale is a dialect, point canonical to Spanish version
    if (dialectLocales.includes(currentLocale)) {
      path = path.replace(new RegExp(`^/${currentLocale}(/|$)`), '/es$1')
    }

    return `${siteUrl}${path}`
  })

  // Set canonical link in head using a function for reactivity
  useHead(() => ({
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl.value
      }
    ]
  }))

  return {
    canonicalUrl
  }
}
