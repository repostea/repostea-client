import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

// Declare Telegram widget global
declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: TelegramUser) => void
    }
    onTelegramAuth?: (user: TelegramUser) => void
  }
}

export function useTelegramAuth() {
  const { $api, $redirectAfterAuth } = useNuxtApp()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const telegramEnabled = ref<boolean | null>(null)
  const botUsername = ref<string | null>(null)

  /**
   * Check if Telegram login is enabled and get bot username.
   */
  async function checkTelegramStatus(): Promise<boolean> {
    try {
      const response = await $api.telegram.getStatus()
      telegramEnabled.value = response.data.enabled
      botUsername.value = response.data.bot_username || null
      return response.data.enabled
    } catch {
      telegramEnabled.value = false
      return false
    }
  }

  /**
   * Initialize the Telegram Login Widget in the given container.
   * @param container - The HTML element to render the widget in
   * @param overrideBotUsername - Bot username from system settings (avoids extra API call)
   */
  async function initializeTelegramWidget(
    container: HTMLElement,
    overrideBotUsername?: string | null
  ): Promise<void> {
    if (overrideBotUsername) {
      botUsername.value = overrideBotUsername
      telegramEnabled.value = true
    } else if (!telegramEnabled.value || !botUsername.value) {
      await checkTelegramStatus()
    }

    if (!telegramEnabled.value || !botUsername.value) {
      error.value = 'Telegram login is not available'
      return
    }

    loading.value = true
    error.value = null

    try {
      // Clear any existing content
      container.innerHTML = ''

      // Set up global callback function
      window.onTelegramAuth = async (user: TelegramUser) => {
        await completeTelegramLogin(user)
      }

      // Create the Telegram script element
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://telegram.org/js/telegram-widget.js?22'
      script.setAttribute('data-telegram-login', botUsername.value)
      script.setAttribute('data-size', 'large')
      script.setAttribute('data-onauth', 'onTelegramAuth(user)')
      script.setAttribute('data-request-access', 'write')
      script.setAttribute('data-radius', '8')

      // Handle script load error
      script.onerror = () => {
        error.value = 'Failed to load Telegram widget'
        loading.value = false
      }

      script.onload = () => {
        loading.value = false
      }

      container.appendChild(script)
    } catch (e: any) {
      error.value = e.message || 'Failed to initialize Telegram widget'
      loading.value = false
    }
  }

  /**
   * Complete the Telegram login with user data from the widget.
   */
  async function completeTelegramLogin(telegramUser: TelegramUser): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await $api.telegram.callback(telegramUser)

      // Store token and user in auth store
      authStore.setToken(response.data.token)
      authStore.setUser(response.data.user)
      authStore.lastFetchTime = Date.now()

      // Redirect to home
      if (import.meta.client) {
        $redirectAfterAuth('/')
      }

      return true
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to complete Telegram login'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Clean up the global callback when component unmounts.
   */
  function cleanup() {
    if (import.meta.client) {
      delete window.onTelegramAuth
    }
  }

  return {
    loading,
    error,
    telegramEnabled,
    botUsername,
    checkTelegramStatus,
    initializeTelegramWidget,
    completeTelegramLogin,
    cleanup,
  }
}
