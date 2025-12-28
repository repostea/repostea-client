import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export function useRedditAuth() {
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const redditEnabled = ref<boolean | null>(null)

  /**
   * Check if Reddit login is enabled.
   */
  async function checkRedditStatus(): Promise<boolean> {
    try {
      const response = await $api.reddit.getStatus()
      redditEnabled.value = response.data.enabled
      return response.data.enabled
    } catch {
      redditEnabled.value = false
      return false
    }
  }

  /**
   * Start the Reddit OAuth flow.
   * Returns the authorization URL to redirect the user to.
   * @param returnUrl - Optional URL to redirect to after successful login
   */
  async function startRedditLogin(returnUrl?: string): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $api.reddit.getRedirectUrl()

      // Store state in sessionStorage for verification on callback
      if (import.meta.client) {
        sessionStorage.setItem('reddit_oauth_state', response.data.state)
        // Store returnUrl for redirect after successful login
        if (returnUrl) {
          sessionStorage.setItem('reddit_oauth_return_url', returnUrl)
        } else {
          sessionStorage.removeItem('reddit_oauth_return_url')
        }
      }

      return response.data.url
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to start Reddit login'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete the Reddit OAuth flow with the callback code.
   * Returns an object with success status and optional returnUrl.
   */
  async function completeRedditLogin(
    code: string,
    state: string
  ): Promise<{ success: boolean; returnUrl?: string }> {
    loading.value = true
    error.value = null

    try {
      // Verify state matches what we stored
      if (import.meta.client) {
        const storedState = sessionStorage.getItem('reddit_oauth_state')
        if (storedState !== state) {
          error.value = 'Invalid state - possible CSRF attack'
          return { success: false }
        }
      }

      const response = await $api.reddit.callback(code, state)

      // Store token and user in auth store
      authStore.setToken(response.data.token)
      authStore.setUser(response.data.user)
      authStore.lastFetchTime = Date.now()

      // Get returnUrl before cleaning up
      let returnUrl: string | undefined
      if (import.meta.client) {
        returnUrl = sessionStorage.getItem('reddit_oauth_return_url') || undefined
        sessionStorage.removeItem('reddit_oauth_state')
        sessionStorage.removeItem('reddit_oauth_return_url')
      }

      return { success: true, returnUrl }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to complete Reddit login'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  /**
   * Redirect user to Reddit for authentication.
   * @param returnUrl - Optional URL to redirect to after successful login
   */
  async function redirectToReddit(returnUrl?: string): Promise<void> {
    const url = await startRedditLogin(returnUrl)
    if (url && import.meta.client) {
      window.location.href = url
    }
  }

  return {
    loading,
    error,
    redditEnabled,
    checkRedditStatus,
    startRedditLogin,
    completeRedditLogin,
    redirectToReddit,
  }
}
