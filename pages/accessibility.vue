<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text dark:text-text-dark mb-2">{{ t('accessibility.title') }}</h1>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed">
        {{ t('accessibility.intro') }}
      </p>
    </div>

    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 a11y-border-bottom">
        {{ t('accessibility.standards_title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed">
        {{ t('accessibility.standards_text') }}
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 a11y-border-bottom">
        {{ t('accessibility.measures_title') }}
      </h2>
      <ul class="list-disc list-inside space-y-2 text-text-muted dark:text-text-dark-muted">
        <li>{{ t('accessibility.measure_1') }}</li>
        <li>{{ t('accessibility.measure_2') }}</li>
        <li>{{ t('accessibility.measure_3') }}</li>
        <li>{{ t('accessibility.measure_4') }}</li>
        <li>{{ t('accessibility.measure_5') }}</li>
        <li>{{ t('accessibility.measure_6') }}</li>
        <li>{{ t('accessibility.measure_7') }}</li>
        <li>{{ t('accessibility.measure_8') }}</li>
        <li>{{ t('accessibility.measure_9') }}</li>
      </ul>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 a11y-border-bottom">
        {{ t('accessibility.limitations_title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed">
        {{ t('accessibility.limitations_text') }}
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 a11y-border-bottom">
        {{ t('accessibility.feedback_title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted leading-relaxed mb-4">
        {{ t('accessibility.feedback_text') }}
      </p>
      <p class="text-text-muted dark:text-text-dark-muted">
        <strong>{{ t('accessibility.email_label') }}:</strong>
        <a :href="`mailto:${contactEmail}`" class="text-primary hover:underline ml-1">
          {{ contactEmail }}
        </a>
      </p>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from '#i18n'

const { t } = useI18n()
const runtimeConfig = useRuntimeConfig()
const contactEmail = computed(() => runtimeConfig.public.contactEmail || 'contact@example.com')

useHead({
  title: () => t('accessibility.title'),
  meta: [
    {
      name: 'description',
      content: () => t('accessibility.meta_description'),
    },
  ],
})
</script>

<style scoped>
.a11y-border-bottom {
  border-bottom: 1px solid var(--color-border-default);
}
</style>
