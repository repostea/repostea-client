import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    const flashMessage = useCookie('flash_message')
    const flashType = useCookie('flash_type')

    flashMessage.value = 'You must login to access this page'
    flashType.value = 'error'

    return navigateTo(`/auth/login`)
  }
})
