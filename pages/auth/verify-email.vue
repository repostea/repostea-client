<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-background-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div
          class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center"
        >
          <Icon
            name="fa6-solid:envelope"
            class="text-3xl text-yellow-600 dark:text-yellow-400"
            aria-hidden="true"
          />
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        {{ t('auth.verify_email_title') }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        {{ authStore.user?.email }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="verify-email-card card-bg py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
        <div class="space-y-6">
          <!-- Message -->
          <div
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <Icon
                  name="fa6-solid:triangle-exclamation"
                  class="text-yellow-400"
                  aria-hidden="true"
                />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {{ t('auth.email_not_verified') }}
                </h3>
                <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <p>{{ t('auth.verify_email_description') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Success message -->
          <div
            v-if="resendSuccess"
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <Icon name="fa6-solid:circle-check" class="text-green-400" aria-hidden="true" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-800 dark:text-green-200">
                  {{ resendSuccess }}
                </p>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div
            v-if="resendError"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <Icon name="fa6-solid:circle-exclamation" class="text-red-400" aria-hidden="true" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800 dark:text-red-200">
                  {{ resendError }}
                </p>
              </div>
            </div>
          </div>

          <!-- Resend button -->
          <button
            type="button"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="resendingEmail"
            @click="resendVerificationEmail"
          >
            <span
              v-if="resendingEmail"
              class="inline-block animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"
            />
            <Icon name="fa6-solid:paper-plane" class="mr-2" aria-hidden="true" />
            {{ resendingEmail ? t('auth.sending') : t('auth.resend_verification_email') }}
          </button>

          <!-- Additional info -->
          <div class="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>{{ t('auth.check_spam_folder') }}</p>
          </div>

          <!-- Logout link -->
          <div class="text-center">
            <button
              type="button"
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              @click="logout"
            >
              {{ t('auth.logout') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n } from 'vue-i18n'
  import { useNuxtApp } from '#app'

  definePageMeta({
    layout: false,
    middleware: 'auth',
  })

  const { t } = useI18n()
  const authStore = useAuthStore()
  const { $api } = useNuxtApp()

  const resendingEmail = ref(false)
  const resendSuccess = ref('')
  const resendError = ref('')

  // Check if user is already verified and redirect
  onMounted(() => {
    if (authStore.user?.email_verified_at) {
      navigateTo('/')
    }
  })

  async function resendVerificationEmail() {
    resendingEmail.value = true
    resendSuccess.value = ''
    resendError.value = ''

    try {
      await $api.auth.resendVerificationEmail()
      resendSuccess.value = t('auth.verification_email_sent')
    } catch (error) {
      resendError.value = error.response?.data?.message || t('auth.error_sending_email')
    } finally {
      resendingEmail.value = false
    }
  }

  async function logout() {
    await authStore.logout()
    navigateTo('/auth/login')
  }
</script>

<style scoped>
  .verify-email-card {
    border: 1px solid var(--color-border-default);
  }
</style>
