<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-center">
      <div class="w-full max-w-md">
        <div class="card-bg rounded-lg shadow-sm border auth-border">
          <div class="auth-header px-6 py-4 border-b auth-border rounded-t-lg">
            <h2 class="text-lg font-medium">
              {{ t('auth.forgot_password') }}
            </h2>
          </div>

          <div class="p-6">
            <div
              v-if="errorMessage"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <div
              v-if="successMessage"
              class="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-md mb-4"
            >
              {{ successMessage }}
            </div>

            <p v-if="!successMessage" class="mb-4 text-text-muted dark:text-text-dark-muted">
              {{ t('auth.forgot_password_info') }}
            </p>

            <form v-if="!successMessage" @submit.prevent="sendResetLink">
              <div class="mb-4">
                <label for="email" class="block text-sm font-medium mb-1">
                  {{ t('auth.email') }}
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
              </div>

              <div class="mb-4">
                <TurnstileCaptcha
                  ref="captchaRef"
                  v-model="turnstileResponse"
                  theme="light"
                  @success="captchaVerified = true"
                  @expired="handleCaptchaExpired"
                  @error="handleCaptchaError"
                />
                <p v-if="errors['cf-turnstile-response']" class="mt-1 text-sm text-red-500">
                  {{ errors['cf-turnstile-response'] }}
                </p>
              </div>

              <button
                type="submit"
                class="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-md transition-colors flex items-center justify-center mt-2"
                :disabled="loading || !captchaVerified"
              >
                <span
                  v-if="loading"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
                {{ t('auth.send_reset_link') }}
              </button>
            </form>

            <div class="mt-6 text-center text-sm text-text-muted dark:text-text-dark-muted">
              <p>
                <NuxtLink :to="localePath('/auth/login')" class="text-primary hover:underline">
                  {{ t('auth.back_to_login') }}
                </NuxtLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath, useI18n } from '#i18n'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const authStore = useAuthStore()

  const email = ref('')
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const turnstileResponse = ref('')
  const captchaVerified = ref(false)
  const captchaRef = ref(null)
  const errors = reactive({})

  // Nuevos manejadores para eventos de captcha
  function handleCaptchaExpired() {
    captchaVerified.value = false
    turnstileResponse.value = ''
    errors['cf-turnstile-response'] = t('auth.captcha_expired')
  }

  function handleCaptchaError(error) {
    captchaVerified.value = false
    turnstileResponse.value = ''
    console.error('Error de captcha:', error)
    errors['cf-turnstile-response'] = t('auth.captcha_error')
  }

  async function sendResetLink() {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    errors['cf-turnstile-response'] = ''

    if (!turnstileResponse.value) {
      errors['cf-turnstile-response'] = t('auth.please_complete_captcha')
      loading.value = false
      return
    }

    try {
      await authStore.forgotPassword({
        email: email.value,
        'cf-turnstile-response': turnstileResponse.value,
      })
      successMessage.value = t('auth.reset_link_sent')
    } catch (error) {
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors
        for (const field in serverErrors) {
          if (field in errors) {
            errors[field] = serverErrors[field][0]
          }
        }
      } else {
        errorMessage.value = error.response?.data?.message || t('auth.reset_link_error')
      }

      // Reiniciar captcha en caso de error
      if (captchaRef.value) {
        captchaRef.value.reset()
        captchaVerified.value = false
      }
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
  .auth-border {
    border-color: var(--color-border-default);
  }

  .auth-header {
    background-color: var(--color-bg-subtle);
  }

  .auth-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }
</style>
