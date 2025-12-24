// Read default locale from environment variable (defaults to 'en' if not set)
const defaultLocale = process.env.NUXT_PUBLIC_DEFAULT_LOCALE || 'en'

// Easter egg dialects that fall back to Spanish
const spanishDialects = ['ast', 'ara', 'mur', 'and', 'can', 'ext', 'cnt']

export default {
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: {
    // Spanish dialects fall back to Spanish first, then English
    ...Object.fromEntries(spanishDialects.map((d) => [d, ['es', 'en']])),
    // Default fallback for all other locales
    default: ['en'],
  },
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  optimizeTranslationDirective: false,
}
