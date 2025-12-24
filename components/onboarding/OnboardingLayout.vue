<template>
  <div class="min-h-screen onboarding-page-bg">
    <!-- Header con color del tema -->
    <div class="bg-primary dark:bg-primary-dark shadow-md">
      <div class="container mx-auto px-4 py-6">
        <div class="max-w-4xl mx-auto text-center">
          <Logo class="h-12 mx-auto mb-4" />
          <h1 class="text-3xl font-bold text-white mb-2">
            {{ t('onboarding.title') }}
          </h1>
          <p class="text-white/90">
            {{ getStepDescription(currentStep) }}
          </p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">

        <OnboardingMobileNavigation
          :current-step="currentStep"
          :progress="progress"
          :is-first-step="isFirstStep"
          :is-last-step="isLastStep"
          :is-loading="isLoading"
          class="md:hidden"
          @previous="goToPreviousStep"
          @skip="handleSkip"
        />

        <div class="onboarding-card rounded-lg shadow-lg overflow-hidden">
          <div
            class="hidden md:block px-6 py-4 onboarding-header"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-4">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{
                    t('onboarding.step_of', { current: progress.current, total: progress.total })
                  }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('onboarding.progress', { percentage: progress.percentage }) }}
                </span>
              </div>
              <button
                v-if="!isLastStep"
                class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white onboarding-skip-btn rounded-md transition-colors"
                :disabled="isLoading"
                @click="handleSkip"
              >
                <Icon name="fa6-solid:right-from-bracket" class="mr-2" aria-hidden="true" />
                {{ t('onboarding.skip') }}
              </button>
            </div>

            <div class="w-full onboarding-progress-bg rounded-full h-2">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{ width: `${progress.percentage}%` }"
              />
            </div>

            <OnboardingStepper
              :steps="ONBOARDING_STEPS"
              :current-step="currentStep"
              :completed-steps="completedSteps"
              class="mt-6"
              @step-click="goToStep"
            />
          </div>

          <div class="p-8">
            <div v-if="error" class="mb-6">
              <div
                class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md"
              >
                <div class="flex items-center">
                  <Icon name="fa6-solid:triangle-exclamation" class="mr-2" aria-hidden="true" />
                  <p>{{ error }}</p>
                </div>
              </div>
            </div>

            <slot />

            <div
              class="flex items-center justify-between mt-8 pt-6 onboarding-footer-border"
            >
              <button
                v-if="!isFirstStep"
                class="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                :disabled="isLoading"
                @click="goToPreviousStep"
              >
                <Icon name="fa6-solid:arrow-left" class="mr-2" aria-hidden="true" />
                {{ t('onboarding.previous') }}
              </button>
              <div v-else/>

              <button
                v-if="!isLastStep"
                class="flex items-center px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50"
                :disabled="isLoading"
                @click="handleNext"
              >
                <LoadingSpinner v-if="isLoading" class="w-4 h-4 mr-2" />
                {{ nextButtonText }}
                <Icon name="fa6-solid:arrow-right" class="ml-2" aria-hidden="true" />
              </button>
              <button
                v-else
                class="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
                :disabled="isLoading"
                @click="handleFinish"
              >
                <LoadingSpinner v-if="isLoading" class="w-4 h-4 mr-2" />
                {{ t('onboarding.finish') }}
                <Icon name="fa6-solid:check" class="ml-2" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <!-- Registration CTA for non-authenticated users - outside the white card -->
        <div class="mt-6">
          <LargeRegistrationCTA :hide-onboarding-link="true" />
        </div>
      </div>
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
  import { computed, ref } from 'vue'
  import { useOnboarding, ONBOARDING_STEPS } from '@/composables/useOnboarding'
  import { useI18n, useLocalePath } from '#i18n'
  import { useRouter } from 'vue-router'
  import { useNotification } from '@/composables/useNotification'
  import LargeRegistrationCTA from '@/components/common/LargeRegistrationCTA.vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const router = useRouter()
  const { success, error: showError, info } = useNotification()

  const {
    currentStep,
    completedSteps,
    isLoading,
    error,
    progress,
    isFirstStep,
    isLastStep,
    nextStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    getStepDescription,
    clearError,
  } = useOnboarding()

  const emit = defineEmits(['next', 'complete', 'skip'])

  const showSkipConfirm = ref(false)

  const nextButtonText = computed(() => {
    return nextStep.value === 'completed' ? t('onboarding.complete') : t('onboarding.next')
  })

  async function handleNext() {
    clearError()

    try {
      emit('next')
      // Simply navigate to next step without API call
      goToNextStep()
    } catch (_err) {
      console.error('Error completing step:', _err)
      showError(_err.message || t('onboarding.error.complete_step'))
    }
  }

  async function handleFinish() {
    clearError()

    try {
      emit('complete')
      success(t('onboarding.success.welcome'))
      await router.push(localePath('/'))
    } catch (_err) {
      console.error('Error finishing onboarding:', _err)
      showError(_err.message || t('onboarding.error.complete_step'))
    }
  }

  function handleSkip() {
    showSkipConfirm.value = true
  }

  async function confirmSkip() {
    clearError()

    try {
      emit('skip')
      info(t('onboarding.success.onboarding_skipped'))
      await router.push(localePath('/'))
    } catch (_err) {
      console.error('Error skipping onboarding:', _err)
      showError(_err.message || t('onboarding.error.skip'))
    }
  }
</script>

<style scoped>
  .onboarding-page-bg {
    background-color: var(--color-bg-subtle);
  }

  .onboarding-card {
    background-color: var(--color-bg-card);
  }

  .onboarding-header {
    background-color: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border-default);
  }

  .onboarding-skip-btn {
    border: 1px solid var(--color-border-default);
  }

  .onboarding-skip-btn:hover {
    border-color: var(--color-border-strong);
  }

  .onboarding-progress-bg {
    background-color: var(--color-border-default);
  }

  .onboarding-footer-border {
    border-top: 1px solid var(--color-border-default);
  }
</style>
