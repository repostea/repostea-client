import { useAuthStore } from '~/stores/auth'
import { useSeals } from '~/composables/useSeals'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const { fetchUserSeals, resetSeals } = useSeals()

  // Watch for authentication changes
  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        // Load user seals when user authenticates
        try {
          await fetchUserSeals()
        } catch (error) {
          console.error('[seals-init] Error loading user seals:', error)
        }
      } else {
        // Reset seals when user logs out
        resetSeals()
      }
    },
    { immediate: true }
  )
})
