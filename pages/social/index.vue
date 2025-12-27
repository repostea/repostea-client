<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto card-bg p-6 rounded-lg border border-border-color shadow-sm">
      <h1 class="text-2xl font-semibold mb-4">{{ t('social.title') }}</h1>

      <p class="mb-4">
        {{ t('social.description') }}
      </p>

      <p class="mb-4">
        {{ t('social.collaboration') }}
        <a :href="`mailto:${contactEmail}`" class="text-primary hover:underline">{{
          contactEmail
        }}</a
        >.
      </p>

      <p class="text-sm text-neutral-500 mt-6">
        {{ t('social.meanwhile') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()
  const runtimeConfig = useRuntimeConfig()
  const contactEmail = computed(() => runtimeConfig.public.contactEmail || 'contact@example.com')

  useHead({
    title: () => t('social.title'),
  })
</script>
