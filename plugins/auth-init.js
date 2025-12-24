import { useAuthStore } from '~/stores/auth'

/**
 * Auth initialization plugin that runs on both server and client
 * Initializes auth state from cookie during SSR to prevent hydration mismatch
 */
export default defineNuxtPlugin(async (_nuxtApp) => {
  const authStore = useAuthStore()

  // Get token from cookie (works in both SSR and client)
  const tokenCookie = useCookie('token')
  const userCookie = useCookie('user_data')

  if (tokenCookie.value) {
    authStore.token = tokenCookie.value

    // Try to restore user data from cookie if available
    if (userCookie.value) {
      try {
        if (typeof userCookie.value === 'string') {
          authStore.user = JSON.parse(userCookie.value)
        } else {
          authStore.user = userCookie.value
        }
      } catch (e) {
        console.error('[AUTH INIT] Error parsing user cookie:', e)
      }
    }

    authStore.initialized = true
  }

  // On client side, enhance with localStorage data and fetch fresh user data
  if (import.meta.client) {
    // Restore from localStorage if available
    const savedUser = localStorage.getItem('user')
    if (savedUser && !authStore.user) {
      try {
        authStore.user = JSON.parse(savedUser)
      } catch {
        // Invalid cached user
      }
    }

    // If we have a token, fetch fresh user data in background
    if (authStore.token && authStore.user) {
      // Fetch user data in background without blocking render
      authStore.fetchUser(true, true).catch((error) => {
        // Only clear token on real auth errors (401, 403, 404 with valid response)
        // Not on network errors, timeouts, or server unavailable (deploys, etc.)
        const status = error?.response?.status
        const hasValidResponse = error?.response?.data

        if ((status === 401 || status === 403 || status === 404) && hasValidResponse) {
          console.warn('[AUTH INIT] Session invalid, clearing token:', status)
          authStore.clearToken()
          authStore.user = null
          localStorage.removeItem('user')
          localStorage.removeItem('guest_user')
        } else {
          // Keep cached session on network errors - don't logout users during deploys
          console.warn('[AUTH INIT] Error fetching user (keeping session):', error?.message || error)
        }
      })
    }
  }
})
