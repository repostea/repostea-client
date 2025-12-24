import { defineNuxtPlugin } from '#app'
import { useI18n } from '#i18n'

export default defineNuxtPlugin((nuxtApp) => {
  const navigateWithLocale = (route, options = {}) => {
    const localePath = nuxtApp.$localePath
    const path = localePath(route)
    return navigateTo(path, options)
  }

  const redirectAfterAuth = (defaultPath = '/', options = {}) => {
    const route = useRoute()

    const returnUrl = route.query.returnUrl

    if (returnUrl && typeof returnUrl === 'string') {
      if (returnUrl.startsWith('/')) {
        return navigateTo(returnUrl, options)
      }
    }

    return navigateWithLocale(defaultPath, options)
  }

  const handleAuthError = (error, returnPath = '/auth/login') => {
    const { t } = useI18n()
    const flashMessage = useCookie('flash_message')
    const flashType = useCookie('flash_type')
    const route = useRoute()

    flashMessage.value = error?.response?.data?.message || t('auth.auth_error')
    flashType.value = 'error'

    const currentPath = route.fullPath
    return navigateWithLocale(`${returnPath}?returnUrl=${encodeURIComponent(currentPath)}`)
  }

  return {
    provide: {
      navigateWithLocale,
      redirectAfterAuth,
      handleAuthError,
    },
  }
})
