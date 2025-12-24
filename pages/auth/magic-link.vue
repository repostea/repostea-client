<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-center">
      <div class="w-full max-w-md">
        <div
          class="card-bg rounded-lg shadow-sm border auth-border"
        >
          <div
            class="auth-header px-6 py-4 border-b auth-border rounded-t-lg"
          >
            <h2 class="text-lg font-medium">
              {{ t('auth.magic_link') }}
            </h2>
          </div>

          <div class="p-6">
            <div
              v-if="errorMessage"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <div v-if="loading || token" class="text-center mb-4">
              <span
                class="inline-block animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mb-2"
              />
              <p>{{ t('auth.magic_link_verifying') }}</p>
            </div>

            <div v-else-if="!sent">
              <p class="mb-4 text-text-muted dark:text-text-dark-muted">
                {{ t('auth.magic_link_info') }}
              </p>

              <form @submit.prevent="sendMagicLink">
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
                    @expired="captchaVerified = false"
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
                  {{ t('auth.send_magic_link') }}
                </button>
              </form>
            </div>

            <div
              v-else-if="sent"
              class="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-md mb-4"
            >
              <p class="font-medium">{{ t('auth.magic_link_sent') }}</p>
              <p class="mt-2">{{ t('auth.magic_link_check_email') }}</p>
            </div>

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
  import { ref, reactive, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath, useI18n  } from '#i18n'
  

  const { t } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const { $redirectAfterAuth } = useNuxtApp()
  const authStore = useAuthStore()

  const email = ref('')
  const token = ref('')
  const loading = ref(false)
  const errorMessage = ref('')
  const sent = ref(false)
  const turnstileResponse = ref('')
  const captchaVerified = ref(false)
  const captchaRef = ref(null)
  const errors = reactive({})

  onMounted(() => {
    token.value = route.query.token || ''

    if (token.value) {
      verifyMagicLink()
    }
  })

  async function sendMagicLink() {
    loading.value = true
    errorMessage.value = ''
    errors['cf-turnstile-response'] = ''

    if (!turnstileResponse.value) {
      errors['cf-turnstile-response'] = 'Por favor, completa el captcha'
      loading.value = false
      return
    }

    try {
      await authStore.requestMagicLink({
        email: email.value,
        'cf-turnstile-response': turnstileResponse.value,
      })
      sent.value = true
    } catch (error) {
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors
        for (const field in serverErrors) {
          if (field in errors) {
            errors[field] = serverErrors[field][0]
          }
        }
      } else {
        errorMessage.value = error.response?.data?.message || t('auth.magic_link_error')
      }

      if (captchaRef.value) {
        captchaRef.value.reset()
        captchaVerified.value = false
      }
    } finally {
      loading.value = false
    }
  }

  async function verifyMagicLink() {
    loading.value = true
    errorMessage.value = ''

    try {
      await authStore.verifyMagicLink(token.value)
      $redirectAfterAuth('/')
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('auth.magic_link_invalid')
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
