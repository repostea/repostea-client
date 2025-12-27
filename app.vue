<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
  import { useLocaleHead, useI18n } from '#i18n'

  const { t, locale } = useI18n()

  // Easter egg dialects - should not be indexed by search engines
  const dialectLocales = ['ast', 'ara', 'mur', 'and', 'can', 'ext', 'cnt']

  // Set CSS variables for NSFW overlay texts
  function updateNsfwCssVariables() {
    const root = document.documentElement.style
    root.setProperty('--nsfw-click-text', `'${t('comments.image_upload.nsfw_reveal')}'`)
    root.setProperty('--nsfw-title', `'${t('posts.nsfw_warning_title')}'`)
    root.setProperty('--nsfw-adult-only', `'${t('posts.nsfw_adult_only')}'`)
    root.setProperty('--nsfw-enter', `'${t('posts.nsfw_confirm_enter')}'`)
  }

  onMounted(() => {
    updateNsfwCssVariables()
  })

  // Update CSS variables when locale changes
  watch(locale, () => {
    if (import.meta.client) {
      updateNsfwCssVariables()
    }
  })

  // Configure SEO meta tags for language/locale
  const i18nHead = useLocaleHead({
    addSeoAttributes: true,
  })

  // Filter out dialect locales from i18n SEO attributes
  const filteredI18nHead = computed(() => {
    const head = i18nHead.value

    // Filter og:locale:alternate meta tags to exclude dialects
    const filteredMeta = (head.meta || []).filter((meta) => {
      if (meta.property === 'og:locale:alternate') {
        // og:locale format is like "mur_MUR" - check if it starts with a dialect code
        const localeCode = meta.content?.split('_')[0]
        return !dialectLocales.includes(localeCode)
      }
      return true
    })

    // Filter hreflang links to exclude dialects
    const filteredLink = (head.link || []).filter((link) => {
      if (link.hreflang) {
        // hreflang can be "mur-MUR" or just "mur", extract base code
        const baseCode = link.hreflang.split('-')[0].toLowerCase()
        return !dialectLocales.includes(baseCode)
      }
      return true
    })

    return {
      ...head,
      meta: filteredMeta,
      link: filteredLink,
    }
  })

  // Block indexing in staging environment
  const config = useRuntimeConfig()
  const isStaging = config.public.appEnv === 'staging'

  const isDialect = computed(() => dialectLocales.includes(locale.value))

  // Build canonical URL for dialects pointing to Spanish version
  const route = useRoute()
  const siteUrl = config.public.siteUrl || 'http://localhost:3000'
  const dialectCanonicalUrl = computed(() => {
    if (!isDialect.value) return null
    const path = route.path.replace(new RegExp(`^/${locale.value}(/|$)`), '/es$1')
    return `${siteUrl}${path}`
  })

  useHead(() => ({
    ...filteredI18nHead.value,
    // Add noindex for staging OR dialect locales
    ...((isStaging || isDialect.value) && {
      meta: [
        ...(filteredI18nHead.value.meta || []),
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    }),
    // Add canonical pointing to Spanish for dialect locales
    ...(isDialect.value && {
      link: [
        ...(filteredI18nHead.value.link || []),
        { rel: 'canonical', href: dialectCanonicalUrl.value },
      ],
    }),
  }))
</script>
