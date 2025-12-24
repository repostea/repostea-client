import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export function useMbinAuth() {
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const mbinEnabled = ref<boolean | null>(null)

  /**
   * Check if Mbin/Kbin login is enabled.
   */
  async function checkMbinStatus(): Promise<boolean> {
    try {
      const response = await $api.mbin.getStatus()
      mbinEnabled.value = response.data.enabled
      return response.data.enabled
    } catch {
      mbinEnabled.value = false
      return false
    }
  }

  /**
   * Start the Mbin OAuth flow.
   * Returns the authorization URL to redirect the user to.
   * @param instance - The Mbin instance to authenticate with
   * @param returnUrl - Optional URL to redirect to after successful login
   */
  async function startMbinLogin(instance: string, returnUrl?: string): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      // Normalize instance (remove protocol if provided)
      const normalizedInstance = instance
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase()

      const response = await $api.mbin.getRedirectUrl(normalizedInstance)

      // Store state in sessionStorage for verification on callback
      if (import.meta.client) {
        sessionStorage.setItem('mbin_oauth_state', response.data.state)
        sessionStorage.setItem('mbin_oauth_instance', normalizedInstance)
        // Store returnUrl for redirect after successful login
        if (returnUrl) {
          sessionStorage.setItem('mbin_oauth_return_url', returnUrl)
        } else {
          sessionStorage.removeItem('mbin_oauth_return_url')
        }
      }

      return response.data.url
    } catch (e: any) {
      const errorCode = e.response?.data?.error_code
      if (errorCode === 'instance_forbidden') {
        error.value = 'instance_forbidden'
      } else if (errorCode === 'connection_failed') {
        error.value = 'connection_failed'
      } else {
        error.value = e.response?.data?.message || 'Failed to start Mbin login'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete the Mbin OAuth flow with the callback code.
   * Returns an object with success status and optional returnUrl.
   */
  async function completeMbinLogin(code: string, state: string): Promise<{ success: boolean; returnUrl?: string }> {
    loading.value = true
    error.value = null

    try {
      // Verify state matches what we stored
      if (import.meta.client) {
        const storedState = sessionStorage.getItem('mbin_oauth_state')
        if (storedState !== state) {
          error.value = 'Invalid state - possible CSRF attack'
          return { success: false }
        }
      }

      const response = await $api.mbin.callback(code, state)

      // Store token and user in auth store
      authStore.setToken(response.data.token)
      authStore.setUser(response.data.user)
      authStore.lastFetchTime = Date.now()

      // Get returnUrl before cleaning up
      let returnUrl: string | undefined
      if (import.meta.client) {
        returnUrl = sessionStorage.getItem('mbin_oauth_return_url') || undefined
        sessionStorage.removeItem('mbin_oauth_state')
        sessionStorage.removeItem('mbin_oauth_instance')
        sessionStorage.removeItem('mbin_oauth_return_url')
      }

      return { success: true, returnUrl }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to complete Mbin login'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  /**
   * Redirect user to Mbin instance for authentication.
   * @param instance - The Mbin instance to authenticate with
   * @param returnUrl - Optional URL to redirect to after successful login
   */
  async function redirectToMbin(instance: string, returnUrl?: string): Promise<void> {
    const url = await startMbinLogin(instance, returnUrl)
    if (url && import.meta.client) {
      window.location.href = url
    }
  }

  return {
    loading,
    error,
    mbinEnabled,
    checkMbinStatus,
    startMbinLogin,
    completeMbinLogin,
    redirectToMbin,
  }
}
