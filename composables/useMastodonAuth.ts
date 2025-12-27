import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export function useMastodonAuth() {
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const federationEnabled = ref<boolean | null>(null)

  /**
   * Check if Mastodon/federation login is enabled.
   */
  async function checkFederationStatus(): Promise<boolean> {
    try {
      const response = await $api.mastodon.getStatus()
      federationEnabled.value = response.data.enabled
      return response.data.enabled
    } catch {
      federationEnabled.value = false
      return false
    }
  }

  /**
   * Start the Mastodon OAuth flow.
   * Returns the authorization URL to redirect the user to.
   * @param instance - The Mastodon instance to authenticate with
   * @param returnUrl - Optional URL to redirect to after successful login
   */
  async function startMastodonLogin(instance: string, returnUrl?: string): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      // Normalize instance (remove protocol if provided)
      const normalizedInstance = instance
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase()

      const response = await $api.mastodon.getRedirectUrl(normalizedInstance)

      // Store state in sessionStorage for verification on callback
      if (import.meta.client) {
        sessionStorage.setItem('mastodon_oauth_state', response.data.state)
        sessionStorage.setItem('mastodon_oauth_instance', normalizedInstance)
        // Store returnUrl for redirect after successful login
        if (returnUrl) {
          sessionStorage.setItem('mastodon_oauth_return_url', returnUrl)
        } else {
          sessionStorage.removeItem('mastodon_oauth_return_url')
        }
      }

      return response.data.url
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to start Mastodon login'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete the Mastodon OAuth flow with the callback code.
   * Returns an object with success status and optional returnUrl.
   */
  async function completeMastodonLogin(
    code: string,
    state: string
  ): Promise<{ success: boolean; returnUrl?: string }> {
    loading.value = true
    error.value = null

    try {
      // Verify state matches what we stored
      if (import.meta.client) {
        const storedState = sessionStorage.getItem('mastodon_oauth_state')
        if (storedState !== state) {
          error.value = 'Invalid state - possible CSRF attack'
          return { success: false }
        }
      }

      const response = await $api.mastodon.callback(code, state)

      // Store token and user in auth store
      authStore.setToken(response.data.token)
      authStore.setUser(response.data.user)
      authStore.lastFetchTime = Date.now()

      // Get returnUrl before cleaning up
      let returnUrl: string | undefined
      if (import.meta.client) {
        returnUrl = sessionStorage.getItem('mastodon_oauth_return_url') || undefined
        sessionStorage.removeItem('mastodon_oauth_state')
        sessionStorage.removeItem('mastodon_oauth_instance')
        sessionStorage.removeItem('mastodon_oauth_return_url')
      }

      return { success: true, returnUrl }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to complete Mastodon login'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  /**
   * Redirect user to Mastodon for authentication.
   * @param instance - The Mastodon instance to authenticate with
   * @param returnUrl - Optional URL to redirect to after successful login
   */
  async function redirectToMastodon(instance: string, returnUrl?: string): Promise<void> {
    const url = await startMastodonLogin(instance, returnUrl)
    if (url && import.meta.client) {
      window.location.href = url
    }
  }

  return {
    loading,
    error,
    federationEnabled,
    checkFederationStatus,
    startMastodonLogin,
    completeMastodonLogin,
    redirectToMastodon,
  }
}
