<template>
  <div class="mb-8">
    <div class="flex items-center justify-between mb-2">
      <span
        class="text-sm font-medium text-gray-700 dark:text-gray-300"
        data-testid="step-indicator"
      >
        {{ t('submit.wizard.step') }} {{ currentStep }} {{ t('submit.wizard.of') }}
        {{ totalSteps }}
      </span>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ Math.round(percentage) }}%
      </span>
    </div>
    <div class="w-full wizard-progress-bg rounded-full h-2">
      <div
        class="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
        data-testid="progress-bar"
        :style="{ width: percentage + '%' }"
      />
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    currentStep: {
      type: Number,
      required: true,
    },
    totalSteps: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
  })
</script>
