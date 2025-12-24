import { defineNuxtRouteMiddleware } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((_to) => {
  const authStore = useAuthStore()

  // If user is already authenticated and tries to access a "guest" route like login or register
  if (authStore.isAuthenticated) {
    if (import.meta.client) {
      const { $navigateWithLocale } = useNuxtApp()

      // Redirect to homepage
      return $navigateWithLocale('/')
    }
  }
})
