import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useLocalePath } from '#i18n'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.client) {
    const authStore = useAuthStore()
    const localePath = useLocalePath()
    if (!authStore.isAuthenticated) {
      const returnUrl = encodeURIComponent(to.fullPath)
      return navigateTo(localePath('/auth/login') + '?redirect=' + returnUrl)
    }
  }
})
