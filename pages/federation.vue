<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text dark:text-text-dark mb-2">
        {{ $t('federation.page.title') }}
      </h1>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed">
        {{ $t('federation.page.subtitle') }}
      </p>
    </div>

    <!-- What is the Fediverse -->
    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 section-border">
        {{ $t('federation.page.what_is_fediverse.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed mb-4">
        {{ $t('federation.page.what_is_fediverse.description') }}
      </p>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed">
        {{ $t('federation.page.what_is_fediverse.protocol') }}
      </p>
    </section>

    <!-- Popular Platforms -->
    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 section-border">
        {{ $t('federation.page.platforms.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed mb-6">
        {{ $t('federation.page.platforms.description') }}
      </p>

      <ul class="space-y-2 text-text-muted dark:text-text-dark-muted">
        <li>
          <strong class="text-text dark:text-text-dark">Mastodon</strong> —
          {{ $t('federation.page.platforms.mastodon') }}
        </li>
        <li>
          <strong class="text-text dark:text-text-dark">Lemmy</strong> —
          {{ $t('federation.page.platforms.lemmy') }}
        </li>
        <li>
          <strong class="text-text dark:text-text-dark">PeerTube</strong> —
          {{ $t('federation.page.platforms.peertube') }}
        </li>
        <li>
          <strong class="text-text dark:text-text-dark">Pixelfed</strong> —
          {{ $t('federation.page.platforms.pixelfed') }}
        </li>
        <li>
          <strong class="text-text dark:text-text-dark">Friendica</strong> —
          {{ $t('federation.page.platforms.friendica') }}
        </li>
        <li>
          <strong class="text-text dark:text-text-dark">Mbin</strong> —
          {{ $t('federation.page.platforms.mbin') }}
        </li>
      </ul>
    </section>

    <!-- Our Approach -->
    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 section-border">
        {{ $t('federation.page.our_approach.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed mb-6">
        {{ $t('federation.page.our_approach.description') }}
      </p>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- What we do -->
        <div class="card-bg rounded-lg p-5 border border-color">
          <h3 class="font-semibold text-text dark:text-text-dark mb-4 flex items-center">
            <Icon
              name="fa6-solid:check"
              class="mr-2 text-green-600 dark:text-green-500"
              aria-hidden="true"
            />
            {{ $t('federation.page.our_approach.what_we_do') }}
          </h3>
          <ul class="space-y-3 text-sm text-text-muted dark:text-text-dark-muted">
            <li v-for="(item, index) in doItems" :key="index" class="flex items-start gap-2">
              <span class="text-green-600 dark:text-green-500 mt-0.5">•</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>

        <!-- What we don't do -->
        <div class="card-bg rounded-lg p-5 border border-color">
          <h3 class="font-semibold text-text dark:text-text-dark mb-4 flex items-center">
            <Icon name="fa6-solid:xmark" class="mr-2 text-gray-500" aria-hidden="true" />
            {{ $t('federation.page.our_approach.what_we_dont') }}
          </h3>
          <ul class="space-y-3 text-sm text-text-muted dark:text-text-dark-muted">
            <li v-for="(item, index) in dontItems" :key="index" class="flex items-start gap-2">
              <span class="text-gray-500 mt-0.5">•</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Why This Model -->
    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 section-border">
        {{ $t('federation.page.why_this_model.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed mb-4">
        {{ $t('federation.page.why_this_model.description') }}
      </p>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed">
        {{ $t('federation.page.why_this_model.benefits') }}
      </p>
    </section>

    <!-- Privacy and Control -->
    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 section-border">
        {{ $t('federation.page.privacy.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed mb-4">
        {{ $t('federation.page.privacy.description') }}
      </p>
      <ul class="list-disc list-inside space-y-2 text-text-muted dark:text-text-dark-muted">
        <li v-for="(item, index) in privacyItems" :key="index">{{ item }}</li>
      </ul>
    </section>

    <!-- Metrics Explanation -->
    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 section-border">
        {{ $t('federation.page.metrics.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed mb-6">
        {{ $t('federation.page.metrics.description') }}
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-color">
              <th class="text-left py-3 px-4 font-semibold text-text dark:text-text-dark">
                {{ $t('federation.page.metrics.type') }}
              </th>
              <th class="text-left py-3 px-4 font-semibold text-text dark:text-text-dark">
                {{ $t('federation.page.metrics.local') }}
              </th>
              <th class="text-left py-3 px-4 font-semibold text-text dark:text-text-dark">
                {{ $t('federation.page.metrics.federated') }}
              </th>
            </tr>
          </thead>
          <tbody class="text-text-muted dark:text-text-dark-muted">
            <tr class="border-b border-color">
              <td class="py-3 px-4">{{ $t('federation.page.metrics.votes_row') }}</td>
              <td class="py-3 px-4">{{ $t('federation.page.metrics.votes_local') }}</td>
              <td class="py-3 px-4">{{ $t('federation.page.metrics.votes_federated') }}</td>
            </tr>
            <tr class="border-b border-color">
              <td class="py-3 px-4">{{ $t('federation.page.metrics.comments_row') }}</td>
              <td class="py-3 px-4">{{ $t('federation.page.metrics.comments_local') }}</td>
              <td class="py-3 px-4">{{ $t('federation.page.metrics.comments_federated') }}</td>
            </tr>
            <tr>
              <td class="py-3 px-4">{{ $t('federation.page.metrics.karma_row') }}</td>
              <td class="py-3 px-4">{{ $t('federation.page.metrics.karma_local') }}</td>
              <td class="py-3 px-4">{{ $t('federation.page.metrics.karma_federated') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- How to Enable -->
    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 section-border">
        {{ $t('federation.page.how_to_enable.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed mb-4">
        {{ $t('federation.page.how_to_enable.description') }}
      </p>
      <ol class="list-decimal list-inside space-y-2 text-text-muted dark:text-text-dark-muted">
        <li v-for="(step, index) in enableSteps" :key="index">{{ step }}</li>
      </ol>
    </section>

    <!-- Back link -->
    <div class="mt-8 pt-6 border-t border-color">
      <NuxtLink :to="localePath('/')" class="text-primary hover:underline inline-flex items-center">
        <Icon name="fa6-solid:arrow-left" class="mr-2" aria-hidden="true" />
        {{ $t('common.back_to_home') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const config = useRuntimeConfig()

  // Computed arrays for translations (avoiding $tm() raw object issues)
  const doItems = computed(() => [
    t('federation.page.our_approach.do_item_1'),
    t('federation.page.our_approach.do_item_2'),
    t('federation.page.our_approach.do_item_3'),
    t('federation.page.our_approach.do_item_4'),
  ])

  const dontItems = computed(() => [
    t('federation.page.our_approach.dont_item_1'),
    t('federation.page.our_approach.dont_item_2'),
    t('federation.page.our_approach.dont_item_3'),
  ])

  const privacyItems = computed(() => [
    t('federation.page.privacy.item_1'),
    t('federation.page.privacy.item_2'),
    t('federation.page.privacy.item_3'),
    t('federation.page.privacy.item_4'),
    t('federation.page.privacy.item_5'),
  ])

  const enableSteps = computed(() => [
    t('federation.page.how_to_enable.step_1'),
    t('federation.page.how_to_enable.step_2'),
    t('federation.page.how_to_enable.step_3'),
    t('federation.page.how_to_enable.step_4'),
  ])

  // SEO
  const route = useRoute()
  const siteUrl = config.public.siteUrl
  const pageUrl = `${siteUrl}${route.path}`
  const ogImageUrl = `${siteUrl}/logo-wolf.png`

  useSeoMeta({
    title: t('federation.page.title') + ' | ' + config.public.appName,
    description: t('federation.page.subtitle'),
    keywords: 'fediverse, mastodon, lemmy, activitypub, federación, descentralizado',
    robots: 'index, follow',
    ogTitle: t('federation.page.title') + ' | ' + config.public.appName,
    ogDescription: t('federation.page.subtitle'),
    ogImage: ogImageUrl,
    ogUrl: pageUrl,
    ogType: 'website',
    ogSiteName: config.public.appName,
    twitterCard: 'summary',
    twitterTitle: t('federation.page.title') + ' | ' + config.public.appName,
    twitterDescription: t('federation.page.subtitle'),
    twitterImage: ogImageUrl,
    twitterSite: config.public.twitterHandle || undefined,
  })

  useCanonical()

  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': pageUrl,
          url: pageUrl,
          name: t('federation.page.title'),
          description: t('federation.page.subtitle'),
          isPartOf: {
            '@id': `${siteUrl}/#website`,
          },
          inLanguage: locale.value,
        }),
        tagPosition: 'bodyClose',
      },
    ],
  })
</script>

<style scoped>
  .section-border {
    border-bottom: 1px solid var(--color-border-default);
  }

  .border-color {
    border-color: var(--color-border-default);
  }
</style>
