<template>
  <div>
    <div class="text-center mb-8">
      <div
        class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
      >
        <Icon name="fa6-solid:compass" class="text-2xl text-primary" aria-hidden="true" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t('onboarding.steps.discover-content.content.heading') }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('onboarding.steps.discover-content.content.subtitle') }}
      </p>
    </div>

    <!-- Main content -->
    <div class="mb-6 text-left">
      <p class="text-gray-800 dark:text-gray-200 mb-4 text-lg">
        {{ t('onboarding.steps.discover-content.content.main_text_1') }} <strong>{{ t('onboarding.steps.discover-content.content.main_text_2') }}</strong>.
      </p>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        {{ t('onboarding.steps.discover-content.content.essence_text_1') }} <strong>{{ t('onboarding.steps.discover-content.content.essence_text_2') }}</strong> {{ t('onboarding.steps.discover-content.content.essence_text_3') }} <strong>{{ t('onboarding.steps.discover-content.content.essence_text_4') }}</strong> {{ t('onboarding.steps.discover-content.content.essence_text_5') }}
      </p>
      <p class="text-gray-700 dark:text-gray-300 text-sm">
        {{ t('onboarding.steps.discover-content.content.tip') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()
</script>
