/**
 * Composable for managing system-wide configuration settings
 *
 * This composable provides centralized access to system settings configured
 * in the admin panel, such as registration mode, guest access, and email verification.
 *
 * Settings are cached in-memory to avoid unnecessary API calls.
 */

import { ref, readonly, computed } from 'vue'

// Types for system settings
export type RegistrationMode = 'open' | 'invite_only' | 'closed'
export type EmailVerification = 'required' | 'optional' | 'disabled'
export type GuestAccess = 'enabled' | 'disabled'
export type RegistrationApproval = 'none' | 'required'

export interface SystemSettings {
  registration_mode: RegistrationMode
  email_verification: EmailVerification
  guest_access: GuestAccess
  registration_approval: RegistrationApproval
}

// Shared state across all instances (singleton pattern)
const settings = ref<SystemSettings>({
  registration_mode: 'invite_only', // Default to most restrictive
  email_verification: 'optional',
  guest_access: 'disabled', // Default to disabled for security
  registration_approval: 'none',
})

const isLoading = ref(false)
const isLoaded = ref(false)
const error = ref<string | null>(null)

/**
 * Composable to access and manage system settings
 */
export const useSystemSettings = () => {
  const config = useRuntimeConfig()

  /**
   * Fetches system settings from the backend API
   * Uses cached values if already loaded unless force = true
   */
  const fetchSettings = async (force = false): Promise<void> => {
    // Return cached settings if already loaded and not forcing refresh
    if (isLoaded.value && !force) {
      return
    }

    // Prevent duplicate requests
    if (isLoading.value) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${config.public.apiBaseUrl}/v1/system/settings`, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`)
      }

      const data = await response.json()

      // Update settings with fetched values, using defaults as fallback
      settings.value = {
        registration_mode: data.registration_mode || 'invite_only',
        email_verification: data.email_verification || 'optional',
        guest_access: data.guest_access || 'disabled',
        registration_approval: data.registration_approval || 'none',
      }

      isLoaded.value = true
    } catch (err) {
      console.error('Error loading system settings:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error'

      // Keep default values on error for security
      settings.value = {
        registration_mode: 'invite_only',
        email_verification: 'optional',
        guest_access: 'disabled',
        registration_approval: 'none',
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refreshes settings from the backend
   */
  const refreshSettings = async (): Promise<void> => {
    await fetchSettings(true)
  }

  /**
   * Helper: Check if registration is open to everyone
   */
  const isRegistrationOpen = computed(() => settings.value.registration_mode === 'open')

  /**
   * Helper: Check if registration requires an invitation
   */
  const isInviteOnly = computed(() => settings.value.registration_mode === 'invite_only')

  /**
   * Helper: Check if registration is closed
   */
  const isRegistrationClosed = computed(() => settings.value.registration_mode === 'closed')

  /**
   * Helper: Check if guest access is enabled
   */
  const isGuestAccessEnabled = computed(() => settings.value.guest_access === 'enabled')

  /**
   * Helper: Check if email verification is required
   */
  const isEmailVerificationRequired = computed(
    () => settings.value.email_verification === 'required'
  )

  /**
   * Helper: Check if email verification is optional
   */
  const isEmailVerificationOptional = computed(
    () => settings.value.email_verification === 'optional'
  )

  /**
   * Helper: Check if email verification is disabled
   */
  const isEmailVerificationDisabled = computed(
    () => settings.value.email_verification === 'disabled'
  )

  /**
   * Helper: Check if registration requires approval
   */
  const isApprovalRequired = computed(() => settings.value.registration_approval === 'required')

  /**
   * Helper: Check if user can register with the given invitation code
   */
  const canRegister = (invitationCode?: string): boolean => {
    if (settings.value.registration_mode === 'closed') {
      return false
    }
    if (settings.value.registration_mode === 'open') {
      return true
    }
    // invite_only mode
    return !!invitationCode && invitationCode.trim().length > 0
  }

  return {
    // State (readonly to prevent external modifications)
    settings: readonly(settings),
    isLoading: readonly(isLoading),
    isLoaded: readonly(isLoaded),
    error: readonly(error),

    // Methods
    fetchSettings,
    refreshSettings,

    // Computed helpers
    isRegistrationOpen,
    isInviteOnly,
    isRegistrationClosed,
    isGuestAccessEnabled,
    isEmailVerificationRequired,
    isEmailVerificationOptional,
    isEmailVerificationDisabled,
    isApprovalRequired,
    canRegister,
  }
}
