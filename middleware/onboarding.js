import { useAuthStore } from '@/stores/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated || authStore.isAnonymous) {
    return
  }

  try {
    const response = await $api.onboarding.getStatus()
    const { onboarding_completed, current_step } = response.data

    // Allow revisiting onboarding from help page
    const isComingFromHelp = from.path && from.path.startsWith('/help')

    if (!onboarding_completed && !to.path.startsWith('/onboarding')) {
      return navigateTo(`/onboarding/${current_step}`)
    }

    // Don't redirect if coming from help page (allows revisiting onboarding)
    if (onboarding_completed && to.path.startsWith('/onboarding') && !isComingFromHelp) {
      return navigateTo('/')
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
  }
})
