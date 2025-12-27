<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-center">
      <div class="w-full max-w-md">
        <div class="card-bg rounded-lg shadow-sm border auth-border">
          <div class="auth-header px-6 py-4 border-b auth-border rounded-t-lg">
            <h2 class="text-lg font-medium">
              {{ t('auth.reset_password') }}
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

            <form v-if="!successMessage" @submit.prevent="resetPassword">
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
                <label for="password" class="block text-sm font-medium mb-1">
                  {{ t('auth.new_password') }}
                </label>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  autocomplete="new-password"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
              </div>

              <div class="mb-4">
                <label for="password_confirmation" class="block text-sm font-medium mb-1">
                  {{ t('auth.password_confirm') }}
                </label>
                <input
                  id="password_confirmation"
                  v-model="passwordConfirmation"
                  type="password"
                  autocomplete="new-password"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
              </div>

              <button
                type="submit"
                class="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-md transition-colors flex items-center justify-center mt-2"
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
                {{ t('auth.reset_password') }}
              </button>
            </form>

            <div v-if="successMessage" class="mt-6 text-center">
              <NuxtLink
                :to="localePath('/auth/login')"
                class="inline-block bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md transition-colors"
              >
                {{ t('auth.back_to_login') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath, useI18n } from '#i18n'

  const { t } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const authStore = useAuthStore()

  const token = ref('')
  const email = ref('')
  const password = ref('')
  const passwordConfirmation = ref('')
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  onMounted(() => {
    token.value = route.params.token
    email.value = route.query.email || ''
  })

  async function resetPassword() {
    loading.value = true
    errorMessage.value = ''

    try {
      await authStore.resetPassword({
        token: token.value,
        email: email.value,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      })

      successMessage.value = t('auth.password_reset_success')
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('auth.password_reset_error')
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
