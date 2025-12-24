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
              {{ t('auth.login') }}
            </h2>
          </div>

          <div class="p-6">
            <div
              v-if="errorMessage"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <!-- Anonymous login button (only if guest access is enabled) -->
            <ClientOnly>
            <div v-if="guestAccessEnabled" class="mb-6">
              <button
                type="button"
                class="w-full border auth-guest-btn hover:bg-primary hover:border-primary hover:text-white dark:hover:bg-primary dark:hover:border-primary dark:hover:text-white py-2 rounded-md transition-all duration-300 flex items-center justify-center"
                :disabled="loading"
                @click="loginGuest"
              >
                <LoadingSpinner
                  v-if="guestLoading"
                  size="sm"
                  color="neutral"
                  display="inline"
                  custom-class="mr-2"
                />
                <Icon name="fa6-solid:user-secret" class="mr-2" aria-hidden="true" />
                {{ t('auth.enter_as_guest') }}
              </button>
              <p class="mt-2 text-xs text-center text-text-muted dark:text-text-dark-muted">
                {{ t('auth.guest_info') }}
              </p>
            </div>

            <div v-if="guestAccessEnabled" class="relative my-6 flex items-center">
              <div class="flex-grow border-t auth-divider"/>
              <span class="flex-shrink mx-4 text-sm text-gray-500 dark:text-gray-400">{{
                t('auth.or')
              }}</span>
              <div class="flex-grow border-t auth-divider"/>
            </div>
            </ClientOnly>

            <form @submit.prevent="loginWithCredentials">
              <div class="mb-4">
                <label for="email" class="block text-sm font-medium mb-1">
                  {{ t('auth.email_or_username') || t('auth.email') }}
                </label>
                <input
                  id="email"
                  v-model="credentials.email"
                  autocomplete="username email"
                  type="text"
                  :placeholder="t('auth.email_or_username_placeholder') || t('auth.email')"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
              </div>

              <div class="mb-4">
                <label for="password" class="block text-sm font-medium mb-1">
                  {{ t('auth.password') }}
                </label>
                <input
                  id="password"
                  v-model="credentials.password"
                  autocomplete="current-password"
                  type="password"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
              </div>

              <!-- Agregamos el enlace a recuperación de contraseña -->
              <div class="flex justify-end mb-4">
                <NuxtLink
                  :to="localePath('/auth/forgot-password')"
                  class="text-sm text-primary hover:underline"
                >
                  {{ t('auth.forgot_password') }}
                </NuxtLink>
              </div>

              <button
                type="submit"
                class="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-md transition-colors flex items-center justify-center mt-2"
                :disabled="loading"
              >
                <LoadingSpinner
                  v-if="loading && !guestLoading"
                  size="sm"
                  color="white"
                  display="inline"
                  custom-class="mr-2"
                />
                {{ t('auth.login') }}
              </button>
            </form>

            <div class="mt-6 text-center text-sm text-text-muted dark:text-text-dark-muted">
              <p>
                {{ t('auth.need_account') }}
                <NuxtLink :to="localePath('/auth/register')" class="text-primary hover:underline">
                  {{ t('auth.register') }}
                </NuxtLink>
              </p>

              <!-- Agregamos enlace a Magic Link -->
              <p class="mt-2">
                {{ t('auth.or') }}
                <NuxtLink :to="localePath('/auth/magic-link')" class="text-primary hover:underline">
                  {{ t('auth.login_with_magic_link') }}
                </NuxtLink>
              </p>
            </div>

            <!-- Social Login Providers (Telegram, Mastodon, etc.) -->
            <ClientOnly>
              <SocialLoginProviders />
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath, useI18n  } from '#i18n'
  import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
  import { useSystemSettings } from '@/composables/useSystemSettings'
  import SocialLoginProviders from '~/components/auth/SocialLoginProviders.vue'

  
  const { t } = useI18n()

  const route = useRoute()
  const localePath = useLocalePath()
  const { $redirectAfterAuth } = useNuxtApp()
  const authStore = useAuthStore()

  // Use system settings composable
  const { isGuestAccessEnabled } = useSystemSettings()

  // Computed: Check if guest access is enabled
  const guestAccessEnabled = computed(() => isGuestAccessEnabled.value)

  const loading = ref(false)
  const guestLoading = ref(false)
  const errorMessage = ref('')
  const credentials = ref({
    email: '',
    password: '',
  })

  onMounted(async () => {
    if (route.query.error) {
      errorMessage.value = route.query.error
    }

    if (authStore.isAuthenticated) {
      $redirectAfterAuth('/')
    }
  })

  async function loginWithCredentials() {
    if (loading.value) return

    loading.value = true
    errorMessage.value = ''

    try {
      const result = await authStore.login(credentials.value)

      // Check if email verification is required
      if (result.email_verification_required) {
        // Redirect to verification page
        navigateTo('/auth/verify-email')
      } else {
        $redirectAfterAuth('/')
      }
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('auth.auth_error')
    } finally {
      loading.value = false
    }
  }

  async function loginGuest() {
    if (guestLoading.value) return

    guestLoading.value = true
    loading.value = true
    errorMessage.value = ''

    try {
      await authStore.guestLogin()
      $redirectAfterAuth('/')
    } catch (error) {
      errorMessage.value = error.message || t('auth.guest_login_error')
    } finally {
      guestLoading.value = false
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

  .auth-guest-btn {
    background-color: var(--color-bg-subtle);
    border-color: var(--color-border-default);
  }

  .auth-divider {
    border-color: var(--color-border-default);
  }

  .auth-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }
</style>
