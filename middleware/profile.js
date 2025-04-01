import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  const { $localePath } = useNuxtApp()

  if (!authStore.isAuthenticated) {
    return navigateTo($localePath('/auth/login'))
  }

  if (authStore.username) {
    return navigateTo('/')
  }
})
