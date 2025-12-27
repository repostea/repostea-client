<template>
  <div>
    <div class="text-center mb-8">
      <div
        class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
      >
        <Icon name="fa6-solid:check-to-slot" class="text-2xl text-primary" aria-hidden="true" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t('onboarding.steps.voting.content.heading') }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('onboarding.steps.voting.content.subtitle') }}
      </p>
    </div>

    <!-- Resumen breve -->
    <div class="mb-6 text-left">
      <p class="text-gray-800 dark:text-gray-200 mb-3">
        {{ t('onboarding.steps.voting.content.brief_text_1') }}
        <span class="text-green-600 dark:text-green-400 font-semibold">{{
          t('onboarding.steps.voting.content.brief_text_2')
        }}</span>
        {{ t('onboarding.steps.voting.content.brief_text_3') }}
      </p>
      <p class="text-gray-700 dark:text-gray-300 mb-3">
        {{ t('onboarding.steps.voting.content.visibility_text') }}
      </p>
      <p class="text-gray-700 dark:text-gray-300 text-sm">
        {{ t('onboarding.steps.voting.content.tip') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()
</script>
