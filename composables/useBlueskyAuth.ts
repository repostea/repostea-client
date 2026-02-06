import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'

export function useBlueskyAuth() {
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const blueskyEnabled = ref<boolean | null>(null)

  /**
   * Check if Bluesky login is enabled on the server.
   */
  async function checkBlueskyStatus(): Promise<boolean> {
    try {
      const response = await $api.bluesky.getStatus()
      blueskyEnabled.value = response.data.enabled
      return response.data.enabled
    } catch {
      blueskyEnabled.value = false
      return false
    }
  }

  /**
   * Redirect the user to the backend's Bluesky OAuth redirect endpoint.
   * The backend handles the full Socialite flow with sessions.
   * Bluesky will ask the user for their credentials directly.
   *
   * @param returnUrl - Optional URL to redirect to after successful login
   */
  function redirectToBluesky(returnUrl?: string): void {
    if (import.meta.client) {
      // Store returnUrl for redirect after successful login
      if (returnUrl) {
        sessionStorage.setItem('bluesky_oauth_return_url', returnUrl)
      } else {
        sessionStorage.removeItem('bluesky_oauth_return_url')
      }

      const config = useRuntimeConfig()
      const apiBaseUrl = config.public.apiBaseUrl as string
      // Bluesky uses web routes (not API), so strip the /api suffix
      const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '')
      window.location.href = `${baseUrl}/auth/bluesky/redirect`
    }
  }

  /**
   * Complete the Bluesky OAuth flow by exchanging the one-time code for a Sanctum token.
   * Called from the frontend callback page after the backend redirects back.
   *
   * @param exchangeCode - The one-time exchange code from the URL
   */
  async function completeBlueskyLogin(
    exchangeCode: string
  ): Promise<{ success: boolean; returnUrl?: string }> {
    loading.value = true
    error.value = null

    try {
      const response = await $api.bluesky.exchange(exchangeCode)

      // Store token and user in auth store
      authStore.setToken(response.data.token)
      authStore.setUser(response.data.user)
      authStore.lastFetchTime = Date.now()

      // Get returnUrl before cleaning up
      let returnUrl: string | undefined
      if (import.meta.client) {
        returnUrl = sessionStorage.getItem('bluesky_oauth_return_url') || undefined
        sessionStorage.removeItem('bluesky_oauth_return_url')
      }

      return { success: true, returnUrl }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to complete Bluesky login'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    blueskyEnabled,
    checkBlueskyStatus,
    redirectToBluesky,
    completeBlueskyLogin,
  }
}
