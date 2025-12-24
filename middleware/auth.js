import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useLocalePath } from '#i18n'
const localePath = useLocalePath()

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  if (import.meta.client) {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      const returnUrl = encodeURIComponent(to.fullPath)
      return navigateTo(localePath('/auth/login') + '?redirect=' + returnUrl)
    }
  }
})
