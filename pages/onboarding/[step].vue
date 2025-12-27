<template>
  <div>
    <Head>
      <Title>{{ getStepTitle(step) }} - {{ t('onboarding.title') }} - {{ appName }}</Title>
      <Meta name="description" :content="getStepDescription(step)" />
    </Head>

    <OnboardingLayout>
      <component :is="stepComponent" :key="step" />
    </OnboardingLayout>
  </div>
</template>

<script setup>
  import { computed, onMounted, watch, defineAsyncComponent } from 'vue'
  import { useRoute } from 'vue-router'
  import { useOnboarding, ONBOARDING_STEPS } from '@/composables/useOnboarding'
  import { useI18n } from '#i18n'

  const runtimeConfig = useRuntimeConfig()
  const appName = runtimeConfig.public.appName || 'Repostea'

  // Lazy load onboarding step components - only loaded when user visits /onboarding
  const WelcomeStep = defineAsyncComponent(
    () => import('@/components/onboarding/steps/WelcomeStep.vue')
  )
  const DiscoverContentStep = defineAsyncComponent(
    () => import('@/components/onboarding/steps/DiscoverContentStep.vue')
  )
  const CreatingPostsStep = defineAsyncComponent(
    () => import('@/components/onboarding/steps/CreatingPostsStep.vue')
  )
  const VotingStep = defineAsyncComponent(
    () => import('@/components/onboarding/steps/VotingStep.vue')
  )
  const KarmaSystemStep = defineAsyncComponent(
    () => import('@/components/onboarding/steps/KarmaSystemStep.vue')
  )
  const NotificationsStep = defineAsyncComponent(
    () => import('@/components/onboarding/steps/NotificationsStep.vue')
  )
  const PlatformFeaturesStep = defineAsyncComponent(
    () => import('@/components/onboarding/steps/PlatformFeaturesStep.vue')
  )

  definePageMeta({
    layout: false,
  })

  const { t } = useI18n()
  const route = useRoute()
  const { currentStep, getStepTitle, getStepDescription } = useOnboarding()

  const step = computed(() => route.params.step)

  const stepComponent = computed(() => {
    const stepComponentMap = {
      welcome: WelcomeStep,
      'discover-content': DiscoverContentStep,
      'creating-posts': CreatingPostsStep,
      voting: VotingStep,
      'karma-system': KarmaSystemStep,
      notifications: NotificationsStep,
      'platform-features': PlatformFeaturesStep,
    }

    return stepComponentMap[step.value] || WelcomeStep
  })

  // Watch for route changes
  watch(
    () => route.params.step,
    (newStep) => {
      if (newStep && ONBOARDING_STEPS.includes(newStep)) {
        currentStep.value = newStep
      }
    }
  )

  onMounted(() => {
    // Auth is already handled by middleware, no need to check here

    if (!ONBOARDING_STEPS.includes(step.value)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invalid onboarding step',
      })
    }

    // Update current step state without navigating (we're already on this page)
    currentStep.value = step.value
  })
</script>
