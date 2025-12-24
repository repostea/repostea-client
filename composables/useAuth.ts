import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCookie } from '#app'

export const useAuth = () => {
  const authStore = useAuthStore()

  // Check both store state and cookie for SSR compatibility
  const token = useCookie('token')

  const isAuthenticated = computed(() => {
    // On server, check cookie (use process.client for testability)
    if (!process.client) {
      return !!token.value
    }
    // On client, use auth store
    return authStore.isAuthenticated
  })

  return {
    isAuthenticated,
    user: computed(() => authStore.user),
    isGuest: computed(() => authStore.isGuest),
    isAdmin: computed(() => authStore.isAdmin),
    isModerator: computed(() => authStore.isModerator),
  }
}
