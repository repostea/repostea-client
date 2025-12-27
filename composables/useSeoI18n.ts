/**
 * Composable for setting SEO metadata with i18n support
 *
 * Best practice for Nuxt 3 multi-language apps:
 * - Use this composable in pages to set translated titles and descriptions
 * - The title in nuxt.config.ts serves as a fallback only
 *
 * @example
 * ```vue
 * <script setup>
 * const { t } = useI18n()
 *
 * // Simple usage with translation keys
 * useSeoI18n('site.tagline')
 *
 * // Or with custom title
 * useSeoI18n({
 *   title: t('page.title'),
 *   description: t('page.description')
 * })
 * ```
 */
export const useSeoI18n = (
  options?:
    | string
    | {
        title?: string
        description?: string
        keywords?: string
        ogTitle?: string
        ogDescription?: string
        ogImage?: string
      }
) => {
  const { t } = useI18n()
  const config = useRuntimeConfig()

  // Default app name from runtime config
  const appName = config.public.appName || 'Repostea'
  const defaultTagline = t('site.tagline')
  const defaultDescription = t('site.description')

  // If options is a string, treat it as a translation key for the title
  if (typeof options === 'string') {
    const title = `${appName} - ${t(options)}`
    useSeoMeta({
      title,
      description: defaultDescription,
      ogTitle: title,
      ogDescription: defaultDescription,
    })
    return
  }

  // Build the full title
  const title = options?.title ? `${appName} - ${options.title}` : `${appName} - ${defaultTagline}`

  const description = options?.description || defaultDescription
  const ogTitle = options?.ogTitle || title
  const ogDescription = options?.ogDescription || description

  useSeoMeta({
    title,
    description,
    keywords: options?.keywords,
    ogTitle,
    ogDescription,
    ogImage: options?.ogImage,
  })
}
