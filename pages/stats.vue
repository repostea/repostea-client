<template>
  <div class="container mx-auto px-4 py-8">
    <PageHeader
      :title="$t('stats.title')"
      :description="$t('stats.description')"
      icon="chart-line"
    />

    <div class="mt-6">
      <PlatformStats />
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  import PageHeader from '~/components/ui/PageHeader.vue'
  import PlatformStats from '~/components/stats/PlatformStats.vue'

  const { t } = useI18n()
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()
  const siteUrl = runtimeConfig.public.siteUrl
  const pageUrl = `${siteUrl}${route.path}`
  const ogImageUrl = `${siteUrl}/logo-wolf.png`

  useSeoMeta({
    title: t('stats.title') + ' | ' + runtimeConfig.public.appName,
    description: t('stats.description'),
    keywords: `${runtimeConfig.public.appName}, estadísticas, plataforma, métricas, comunidad, analytics`,
    ogTitle: t('stats.title') + ' | ' + runtimeConfig.public.appName,
    ogDescription: t('stats.description'),
    ogImage: ogImageUrl,
    ogUrl: pageUrl,
    ogType: 'website',
    ogSiteName: runtimeConfig.public.appName,
    twitterCard: 'summary',
    twitterTitle: t('stats.title') + ' | ' + runtimeConfig.public.appName,
    twitterDescription: t('stats.description'),
    twitterImage: ogImageUrl,
    twitterSite: runtimeConfig.public.twitterHandle || undefined,
  })

  // Set canonical URL
  useCanonical()

  // Add WebPage structured data
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': pageUrl,
          url: pageUrl,
          name: t('stats.title'),
          description: t('stats.description'),
          isPartOf: {
            '@id': `${siteUrl}/#website`
          },
          inLanguage: 'es-ES'
        }),
        tagPosition: 'bodyClose'
      }
    ]
  })
</script>
