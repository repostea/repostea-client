<template>
  <div
    class="block md:hidden onboarding-mobile-nav p-4"
  >
    <div class="flex items-center justify-between mb-4">
      <button
        v-if="!isFirstStep"
        class="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        :disabled="isLoading"
        @click="$emit('previous')"
      >
        <Icon name="fa6-solid:arrow-left" class="mr-2" aria-hidden="true" />
        {{ t('onboarding.previous') }}
      </button>
      <div v-else/>

      <button
        v-if="!isLastStep"
        class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        :disabled="isLoading"
        @click="handleSkip"
      >
        {{ t('onboarding.skip') }}
      </button>
    </div>

    <div class="mb-4">
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span>{{
          t('onboarding.step_of', { current: progress.current, total: progress.total })
        }}</span>
        <span>{{ t('onboarding.progress', { percentage: progress.percentage }) }}</span>
      </div>
      <div class="w-full onboarding-progress-bg rounded-full h-2">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress.percentage}%` }"
        />
      </div>
    </div>

    <div class="text-center">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ getStepTitle(currentStep) }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {{ getStepDescription(currentStep) }}
      </p>
    </div>

    <!-- Confirm Skip Dialog -->
    <ConfirmDialog
      v-model="showSkipConfirm"
      :title="t('onboarding.skip')"
      :message="t('onboarding.confirm_skip')"
      :confirm-text="t('onboarding.skip')"
      :cancel-text="t('common.cancel')"
      type="warning"
      @confirm="confirmSkip"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useOnboarding } from '@/composables/useOnboarding'
  import { useI18n } from '#i18n'

  defineProps({
    currentStep: {
      type: String,
      required: true,
    },
    progress: {
      type: Object,
      required: true,
    },
    isFirstStep: {
      type: Boolean,
      default: false,
    },
    isLastStep: {
      type: Boolean,
      default: false,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['previous', 'skip'])

  const { t } = useI18n()
  const { getStepTitle, getStepDescription } = useOnboarding()

  const showSkipConfirm = ref(false)

  function handleSkip() {
    showSkipConfirm.value = true
  }

  function confirmSkip() {
    emit('skip')
  }
</script>

<style scoped>
  .onboarding-mobile-nav {
    background-color: var(--color-bg-card);
    border-bottom: 1px solid var(--color-border-default);
  }

  .onboarding-progress-bg {
    background-color: var(--color-border-default);
  }
</style>
