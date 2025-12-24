import { defineNuxtRouteMiddleware, navigateTo } from '#app'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    if (shouldRedirect()) {
      suppressHydrationWarning()
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
      return navigateTo(redirectUrl, { replace: true })
    }
  }
})

function shouldRedirect() {
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect')
  return redirect?.includes('/posts/')
}

function suppressHydrationWarning() {
  const originalError = console.error
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Hydration completed but contains mismatches')
    ) {
      return
    }
    originalError(...args)
  }
}
