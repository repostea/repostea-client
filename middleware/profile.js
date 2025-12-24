import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useLocalePath } from '#i18n'

const localePath = useLocalePath()

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo(localePath('/auth/login'))
  }

  if (authStore.username) {
    return navigateTo(localePath('/'))
  }
})
