<template>
  <ProfileLayout active-tab="settings">
    <div class="space-y-6">
      <!-- Email Verification Status -->
      <div
        v-if="authStore.user && !authStore.user.email_verified_at"
        class="card-bg rounded-lg shadow-sm border-2 border-yellow-200 dark:border-yellow-800 overflow-hidden"
      >
        <div
          class="px-6 py-4 border-b border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
        >
          <h2
            class="text-lg font-semibold text-yellow-700 dark:text-yellow-300 inline-flex items-center"
          >
            <Icon
              name="fa6-solid:triangle-exclamation"
              class="mr-2 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{{ t('settings.email_verification_required') }}</span>
          </h2>
        </div>
        <div class="p-6">
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            {{ t('settings.email_verification_description') }}
          </p>

          <div
            v-if="resendSuccess"
            class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800"
          >
            {{ resendSuccess }}
          </div>

          <div
            v-if="resendError"
            class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800"
          >
            {{ resendError }}
          </div>

          <button
            type="button"
            class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            :disabled="resendingEmail"
            @click="resendVerificationEmail"
          >
            <span
              v-if="resendingEmail"
              class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
            /><Icon name="fa6-solid:envelope" class="mr-2 flex-shrink-0" aria-hidden="true" />
            <span>{{ t('settings.resend_verification_email') }}</span>
          </button>
        </div>
      </div>

      <div class="card-bg rounded-lg shadow-sm border settings-border overflow-hidden">
        <div class="px-6 py-4 border-b settings-border">
          <h2 class="text-lg font-medium">{{ t('profile.account_preferences') }}</h2>
        </div>
        <div class="p-6">
          <AccountSettings @updated="handlePreferencesUpdated" />
        </div>
      </div>

      <!-- Federated account info (for Mastodon users) -->
      <div
        v-if="isFederatedUser"
        class="card-bg rounded-lg shadow-sm border settings-border overflow-hidden"
      >
        <div class="px-6 py-4 border-b settings-border bg-[#6364FF]/10">
          <h2 class="text-lg font-medium inline-flex items-center">
            <Icon name="simple-icons:mastodon" class="mr-2 text-[#6364FF]" aria-hidden="true" />
            {{ t('settings.federated_account') }}
          </h2>
        </div>
        <div class="p-6">
          <p class="text-sm text-text-muted dark:text-text-dark-muted mb-4">
            {{ t('settings.federated_account_description') }}
          </p>
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <Icon name="simple-icons:mastodon" class="text-2xl text-[#6364FF]" aria-hidden="true" />
            <div>
              <p class="font-medium">
                {{ authStore.user?.federated_handle || authStore.user?.username }}
              </p>
              <p class="text-sm text-text-muted dark:text-text-dark-muted">
                {{ authStore.user?.federated_instance }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Telegram account info (for Telegram users) -->
      <div
        v-if="isTelegramUser"
        class="card-bg rounded-lg shadow-sm border settings-border overflow-hidden"
      >
        <div class="px-6 py-4 border-b settings-border bg-[#26A5E4]/10">
          <h2 class="text-lg font-medium inline-flex items-center">
            <Icon name="fa6-brands:telegram" class="mr-2 text-[#26A5E4]" aria-hidden="true" />
            {{ t('settings.telegram_account') }}
          </h2>
        </div>
        <div class="p-6">
          <p class="text-sm text-text-muted dark:text-text-dark-muted mb-4">
            {{ t('settings.telegram_account_description') }}
          </p>
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <Icon name="fa6-brands:telegram" class="text-2xl text-[#26A5E4]" aria-hidden="true" />
            <div>
              <p class="font-medium">
                {{
                  authStore.user?.telegram_username
                    ? '@' + authStore.user.telegram_username
                    : authStore.user?.username
                }}
              </p>
              <p class="text-sm text-text-muted dark:text-text-dark-muted">Telegram</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Email section (only for non-social-login users) -->
      <div
        v-if="!isSocialLoginUser"
        class="card-bg rounded-lg shadow-sm border settings-border overflow-hidden"
      >
        <div class="px-6 py-4 border-b settings-border">
          <h2 class="text-lg font-medium">{{ t('profile.change_email') }}</h2>
        </div>
        <div class="p-6">
          <ChangeEmailForm @updated="handleEmailUpdated" />
        </div>
      </div>

      <!-- Password section (only for non-social-login users) -->
      <div
        v-if="!isSocialLoginUser"
        class="card-bg rounded-lg shadow-sm border settings-border overflow-hidden"
      >
        <div class="px-6 py-4 border-b settings-border">
          <h2 class="text-lg font-medium">{{ t('profile.change_password') }}</h2>
        </div>
        <div class="p-6">
          <ChangePasswordForm @updated="handlePasswordUpdated" />
        </div>
      </div>

      <!-- Active Sessions -->
      <div class="card-bg rounded-lg shadow-sm border settings-border overflow-hidden">
        <div class="px-6 py-4 border-b settings-border">
          <h2 class="text-lg font-medium">{{ t('settings.active_sessions') }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t('settings.active_sessions_description') }}
          </p>
        </div>
        <div class="p-6">
          <SessionsManager />
        </div>
      </div>

      <!-- Danger Zone -->
      <div
        class="card-bg rounded-lg shadow-sm border-2 border-red-200 dark:border-red-800 overflow-hidden"
      >
        <div
          class="px-6 py-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
        >
          <h2 class="text-lg font-semibold text-red-600 dark:text-red-400">
            {{ t('settings.danger_zone') }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ t('settings.danger_zone_description') }}
          </p>
        </div>
        <div class="p-6">
          <div
            class="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6"
          >
            <h4 class="text-base font-semibold text-red-700 dark:text-red-300 mb-2">
              {{ t('settings.delete_account') }}
            </h4>
            <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {{ t('settings.delete_warning') }}
            </p>

            <button
              v-if="!showDeleteConfirm"
              type="button"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              @click="showDeleteConfirm = true"
            >
              {{ t('settings.delete_account') }}
            </button>

            <!-- Confirmation form -->
            <div
              v-if="showDeleteConfirm"
              class="mt-4 p-4 settings-confirm-bg rounded-md border border-red-300 dark:border-red-700"
            >
              <p class="text-sm font-semibold mb-4 text-red-700 dark:text-red-300">
                {{ t('settings.confirm_delete') }}
              </p>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ t('settings.current_password') }}
                </label>
                <input
                  v-model="deletePassword"
                  type="password"
                  autocomplete="current-password"
                  class="w-full px-3 py-2 border settings-input rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  :placeholder="t('settings.current_password')"
                />
              </div>

              <div
                v-if="deleteError"
                class="mb-4 p-3 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded-md text-sm"
              >
                {{ deleteError }}
              </div>

              <div class="flex gap-3">
                <button
                  type="button"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                  :disabled="deletingAccount || !deletePassword"
                  @click="confirmDeleteAccount"
                >
                  <span
                    v-if="deletingAccount"
                    class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  {{ t('settings.confirm_delete_button') }}
                </button>
                <button
                  type="button"
                  class="px-4 py-2 settings-cancel-btn text-gray-800 dark:text-white rounded-md transition-colors"
                  @click="showDeleteConfirm = false; deletePassword = ''; deleteError = ''"
                >
                  {{ t('profile.cancel') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ProfileLayout>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n, useLocalePath } from '#i18n'
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'
  import ChangePasswordForm from '~/components/profile/ChangePasswordForm.vue'
  import ChangeEmailForm from '~/components/profile/ChangeEmailForm.vue'
  import AccountSettings from '~/components/profile/AccountSettings.vue'
  import SessionsManager from '~/components/profile/SessionsManager.vue'

  definePageMeta({
    middleware: ['auth'],
  })

  const router = useRouter()
  const authStore = useAuthStore()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()

  // Check if user is federated (logged in via Mastodon)
  const isFederatedUser = computed(() => !!authStore.user?.federated_id)

  // Check if user logged in via Telegram
  const isTelegramUser = computed(() => !!authStore.user?.telegram_id)

  // Check if user is any social login user (no email/password management)
  const isSocialLoginUser = computed(() => isFederatedUser.value || isTelegramUser.value)

  const successMessage = ref('')

  // Email verification state
  const resendingEmail = ref(false)
  const resendSuccess = ref('')
  const resendError = ref('')

  // Delete account state
  const showDeleteConfirm = ref(false)
  const deletePassword = ref('')
  const deleteError = ref('')
  const deletingAccount = ref(false)

  function handlePasswordUpdated() {
    successMessage.value = t('profile.password_updated')
  }

  function handleEmailUpdated() {
    successMessage.value = t('profile.email_change_requested')
  }

  function handlePreferencesUpdated() {
    successMessage.value = t('profile.preferences_updated')
    authStore.fetchUser(true)
  }

  async function resendVerificationEmail() {
    resendingEmail.value = true
    resendSuccess.value = ''
    resendError.value = ''

    try {
      await $api.auth.resendVerificationEmail()
      resendSuccess.value = t('settings.verification_email_sent')

      // Clear success message after 5 seconds
      setTimeout(() => {
        resendSuccess.value = ''
      }, 5000)
    } catch (error) {
      if (error.response?.status === 429) {
        resendError.value = t('settings.verification_email_throttle')
      } else {
        resendError.value = error.response?.data?.message || t('settings.verification_email_error')
      }

      // Clear error message after 5 seconds
      setTimeout(() => {
        resendError.value = ''
      }, 5000)
    } finally {
      resendingEmail.value = false
    }
  }

  async function confirmDeleteAccount() {
    if (!deletePassword.value) {
      deleteError.value = t('settings.password_required')
      return
    }

    deletingAccount.value = true
    deleteError.value = ''

    try {
      const response = await $api.users.deleteAccount({ password: deletePassword.value })

      // Show success message if it comes from the server
      if (response.data?.message) {
        // We could show a toast or notification here
      }

      // Logout user
      await authStore.logout()

      // Redirect to home page
      router.push(localePath('/'))
    } catch (error) {
      // Manejar respuesta normalizada: { success: false, message: "...", errors: ... }
      if (error.response?.data?.message) {
        deleteError.value = error.response.data.message
      } else if (error.response?.status === 422) {
        deleteError.value = t('settings.password_incorrect')
      } else {
        deleteError.value = t('settings.delete_account_error')
      }
      deletingAccount.value = false
    }
  }

  onMounted(async () => {
    if (authStore.shouldRefreshUser) {
      await authStore.fetchUser()
    }
  })
</script>

<style scoped>
  .settings-border {
    border-color: var(--color-border-default);
  }

  .settings-confirm-bg {
    background-color: var(--color-bg-card);
  }

  .settings-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .settings-cancel-btn {
    background-color: var(--color-bg-subtle);
  }

  .settings-cancel-btn:hover {
    background-color: var(--color-bg-active);
  }
</style>
