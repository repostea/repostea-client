import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n, useLocalePath } from '#i18n'
import { useRouter } from 'vue-router'

export const ONBOARDING_STEPS = [
  'welcome',
  'discover-content',
  'creating-posts',
  'voting',
  'karma-system',
  'notifications',
  'platform-features',
] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

// Global state - singleton
const globalIsLoading = ref(false)
const globalError = ref<string | null>(null)
const globalCurrentStep = ref<OnboardingStep>('welcome')
const globalCompletedSteps = ref<OnboardingStep[]>([])

export function useOnboarding() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const router = useRouter()
  const authStore = useAuthStore()

  // Use global state instead of local
  const isLoading = globalIsLoading
  const error = globalError
  const currentStep = globalCurrentStep
  const completedSteps = globalCompletedSteps

  const totalSteps = computed(() => ONBOARDING_STEPS.length)

  const currentStepIndex = computed(() => ONBOARDING_STEPS.indexOf(currentStep.value))

  const progress = computed(() => ({
    current: currentStepIndex.value + 1,
    total: totalSteps.value,
    percentage: Math.round(((currentStepIndex.value + 1) / totalSteps.value) * 100),
  }))

  const isFirstStep = computed(() => currentStep.value === 'welcome')
  const isLastStep = computed(() => currentStep.value === 'platform-features')

  const nextStep = computed(() => {
    const index = currentStepIndex.value
    if (index >= ONBOARDING_STEPS.length - 1) return null
    return ONBOARDING_STEPS[index + 1]
  })

  const previousStep = computed(() => {
    const index = currentStepIndex.value
    if (index <= 0) return null
    return ONBOARDING_STEPS[index - 1]
  })

  async function markStepCompleted(step: OnboardingStep) {
    if (!authStore.isAuthenticated) {
      throw new Error('User must be authenticated')
    }

    isLoading.value = true
    error.value = null

    try {
      const { $api } = useNuxtApp()
      await $api.onboarding.completeStep(step)

      if (!completedSteps.value.includes(step)) {
        completedSteps.value.push(step)
      }

      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || t('onboarding.error.complete_step')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateNotificationPreferences(preferences: {
    email_notifications: boolean
    push_notifications: boolean
    notification_types: string[]
  }) {
    if (!authStore.isAuthenticated) {
      throw new Error('User must be authenticated')
    }

    isLoading.value = true
    error.value = null

    try {
      const { $api } = useNuxtApp()
      await $api.onboarding.updateNotificationPreferences(preferences)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || t('onboarding.error.update_preferences')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function skipOnboarding() {
    if (!authStore.isAuthenticated) {
      throw new Error('User must be authenticated')
    }

    isLoading.value = true
    error.value = null

    try {
      const { $api } = useNuxtApp()
      const response = await $api.onboarding.skip()

      if (response.data.redirect) {
        await router.push(response.data.redirect)
      }

      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || t('onboarding.error.skip')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function goToStep(step: OnboardingStep) {
    if (!ONBOARDING_STEPS.includes(step)) {
      throw new Error(`Invalid step: ${step}`)
    }
    currentStep.value = step
    router.push(localePath(`/onboarding/${step}`))
  }

  function goToNextStep() {
    if (nextStep.value) {
      goToStep(nextStep.value)
    }
  }

  function goToPreviousStep() {
    if (previousStep.value) {
      goToStep(previousStep.value)
    }
  }

  async function completeStepAndAdvance(step: OnboardingStep) {
    await markStepCompleted(step)

    if (step === 'platform-features') {
      await router.push(localePath('/'))
    } else if (nextStep.value) {
      goToNextStep()
    }
  }

  function getStepTitle(step: OnboardingStep): string {
    return t(`onboarding.steps.${step}.title`)
  }

  function getStepDescription(step: OnboardingStep): string {
    return t(`onboarding.steps.${step}.description`)
  }

  function isStepCompleted(step: OnboardingStep): boolean {
    return completedSteps.value.includes(step)
  }

  function isStepAccessible(step: OnboardingStep): boolean {
    const stepIndex = ONBOARDING_STEPS.indexOf(step)
    const currentIndex = currentStepIndex.value

    return stepIndex <= currentIndex + 1
  }

  function clearError() {
    error.value = null
  }

  return {
    currentStep,
    completedSteps,
    isLoading,
    error,
    totalSteps,
    currentStepIndex,
    progress,
    isFirstStep,
    isLastStep,
    nextStep,
    previousStep,
    markStepCompleted,
    updateNotificationPreferences,
    skipOnboarding,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    completeStepAndAdvance,
    getStepTitle,
    getStepDescription,
    isStepCompleted,
    isStepAccessible,
    clearError,
  }
}
