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
              {{ t('auth.register') }}
            </h2>
          </div>

          <div class="p-6">
            <!-- Registration Status Messages -->
            <ClientOnly>
              <!-- Loading State -->
              <div
                v-if="!configLoaded"
                class="auth-loading-state p-4 rounded-md mb-4"
              >
                <div class="flex items-start">
                  <Icon name="fa6-solid:spinner" class="mr-2 mt-0.5" aria-hidden="true" />
                  <div class="flex-1">
                    <p class="font-medium">Loading registration settings...</p>
                  </div>
                </div>
              </div>

              <!-- Registration Closed -->
              <div
                v-else-if="configLoaded && registrationMode === 'closed'"
                class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md mb-4"
              >
                <div class="flex items-start">
                  <Icon name="fa6-solid:circle-xmark" class="mr-2 mt-0.5" aria-hidden="true" />
                  <div class="flex-1">
                    <p class="font-medium">Registration is currently closed</p>
                    <p class="text-sm mt-1">
                      New registrations are temporarily disabled. Please check back later.
                    </p>
                    <p class="text-sm mt-2">
                      {{ t('auth.explore_anonymous') }}
                      <NuxtLink
                        :to="localePath('/auth/login')"
                        class="font-medium underline hover:no-underline"
                      >
                        {{ t('auth.explore_anonymous_link') }}
                      </NuxtLink>.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Invite Only - With Invitation -->
              <div
                v-else-if="configLoaded && registrationMode === 'invite_only' && invitationCode"
                class="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-md mb-4"
              >
                <div class="flex items-start">
                  <Icon name="fa6-solid:circle-check" class="mr-2 mt-0.5" aria-hidden="true" />
                  <div class="flex-1">
                    <p class="font-medium">{{ t('auth.invitation_code_detected') }}</p>
                    <p class="text-sm mt-1">{{ t('auth.register_info') }}</p>
                  </div>
                </div>
              </div>

              <!-- Invite Only - Without Invitation -->
              <div
                v-else-if="configLoaded && registrationMode === 'invite_only' && !invitationCode"
                class="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-4 rounded-md mb-4"
              >
                <div class="flex items-start">
                  <Icon name="fa6-solid:circle-info" class="mr-2 mt-0.5" aria-hidden="true" />
                  <div class="flex-1">
                    <p class="font-medium">{{ t('auth.registration_closed') }}</p>
                    <p class="text-sm mt-1">
                      {{ t('auth.registration_closed_message') }}
                    </p>
                    <p class="text-sm mt-2">
                      {{ t('auth.explore_anonymous') }}
                      <NuxtLink
                        :to="localePath('/auth/login')"
                        class="font-medium underline hover:no-underline"
                      >
                        {{ t('auth.explore_anonymous_link') }}
                      </NuxtLink>.
                    </p>
                  </div>
                </div>
              </div>
            </ClientOnly>

            <div
              v-if="errorMessage"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <p v-if="errors.invitation" class="text-sm text-red-500 mb-4">
              {{ errors.invitation }}
            </p>

            <p class="mb-4 text-text-muted dark:text-text-dark-muted">
              {{ t('auth.register_info') }}
            </p>

            <form
              :class="formClasses"
              @submit.prevent="register"
            >
              <div class="mb-4">
                <label for="username" class="block text-sm font-medium mb-1">{{
                  t('auth.username')
                }}</label>
                <input
                  id="username"
                  v-model="formData.username"
                  type="text"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.username,
                  }"
                  :aria-invalid="!!errors.username"
                  :aria-describedby="errors.username ? 'username-error' : undefined"
                  required
                  autocomplete="username"
                  autofocus
                >
                <p v-if="errors.username" id="username-error" role="alert" class="mt-1 text-sm text-red-500">
                  {{ errors.username }}
                </p>
              </div>

              <div class="mb-4">
                <label for="email" class="block text-sm font-medium mb-1">{{
                  t('auth.email')
                }}</label>
                <input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.email,
                  }"
                  :aria-invalid="!!errors.email"
                  :aria-describedby="errors.email ? 'email-error' : undefined"
                  required
                  autocomplete="email"
                >
                <p v-if="errors.email" id="email-error" role="alert" class="mt-1 text-sm text-red-500">
                  {{ errors.email }}
                </p>
              </div>

              <div class="mb-4">
                <label for="password" class="block text-sm font-medium mb-1">{{
                  t('auth.password')
                }}</label>
                <input
                  id="password"
                  v-model="formData.password"
                  type="password"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.password,
                  }"
                  :aria-invalid="!!errors.password"
                  :aria-describedby="errors.password ? 'password-error' : undefined"
                  required
                  autocomplete="new-password"
                >
                <p v-if="errors.password" id="password-error" role="alert" class="mt-1 text-sm text-red-500">
                  {{ errors.password }}
                </p>
              </div>

              <div class="mb-4">
                <label for="password-confirm" class="block text-sm font-medium mb-1">{{
                  t('auth.password_confirm')
                }}</label>
                <input
                  id="password-confirm"
                  v-model="formData.password_confirmation"
                  type="password"
                  class="w-full rounded-md border auth-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.password_confirmation,
                  }"
                  :aria-invalid="!!errors.password_confirmation"
                  :aria-describedby="errors.password_confirmation ? 'password-confirm-error' : undefined"
                  required
                  autocomplete="new-password"
                >
                <p v-if="errors.password_confirmation" id="password-confirm-error" role="alert" class="mt-1 text-sm text-red-500">
                  {{ errors.password_confirmation }}
                </p>
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
                class="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors"
                :disabled="loading || !captchaVerified"
              >
                <span
                  v-if="loading"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
                {{ t('auth.register') }}
              </button>

              <div class="mt-4 text-center">
                <p class="text-sm">
                  {{ t('auth.already_registered') }}
                  <NuxtLink
                    :to="localePath('/auth/login')"
                    class="text-primary hover:text-primary-dark"
                  >
                    {{ t('auth.login') }}
                  </NuxtLink>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useLocalePath, useI18n  } from '#i18n'
  
  import { useRoute } from 'vue-router'
  import { useSystemSettings } from '@/composables/useSystemSettings'
  const { t, locale } = useI18n()

  const authStore = useAuthStore()
  const localePath = useLocalePath()
  const route = useRoute()
  const { $redirectAfterAuth } = useNuxtApp()

  // Use system settings composable (settings are auto-loaded by plugin)
  const {
    settings,
    isLoaded: configLoaded,
    canRegister,
  } = useSystemSettings()

  const loading = ref(false)
  const errors = reactive({})
  const errorMessage = ref('')
  const turnstileResponse = ref('')
  const captchaVerified = ref(false)
  const captchaRef = ref(null)
  const invitationCode = ref(route.query.invitation || '')
  const mounted = ref(false)

  const formData = reactive({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  })

  // Computed: Get registration mode from system settings
  const registrationMode = computed(() => settings.value.registration_mode)

  // Computed: Check if form should be enabled
  const isFormEnabled = computed(() => canRegister(invitationCode.value))

  // Computed: Form classes to avoid hydration mismatch
  // Only apply disabled state after mounting on client
  const formClasses = computed(() => {
    if (!mounted.value) return '' // No conditional classes during SSR
    return !isFormEnabled.value ? 'opacity-50 pointer-events-none' : ''
  })

  onMounted(() => {
    mounted.value = true
    if (authStore.isAuthenticated) {
      $redirectAfterAuth('/')
    }
    // System settings are loaded automatically by the system-settings-init plugin
  })

  async function validateForm() {
    let isValid = true
    errors.username = ''
    errors.email = ''
    errors.password = ''
    errors.password_confirmation = ''
    errors['cf-turnstile-response'] = ''
    errors.invitation = ''
    errorMessage.value = ''

    // Only validate invitation in invite_only mode
    if (settings.value.registration_mode === 'invite_only') {
      if (!invitationCode.value || !invitationCode.value.trim()) {
        errors.invitation = 'Invitation code is required'
        isValid = false
      }
    }

    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es obligatorio'
      isValid = false
    } else if (formData.username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres'
      isValid = false
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio'
      isValid = false
    } else if (!emailPattern.test(formData.email)) {
      errors.email = 'Por favor, introduce un correo electrónico válido'
      isValid = false
    }

    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria'
      isValid = false
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
      isValid = false
    }

    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Las contraseñas no coinciden'
      isValid = false
    }

    if (!turnstileResponse.value) {
      errors['cf-turnstile-response'] = 'Por favor, completa el captcha'
      isValid = false
    }

    return isValid
  }

  async function register() {
    if (!validateForm()) {
      return
    }

    loading.value = true

    try {
      const registerData = {
        ...formData,
        'cf-turnstile-response': turnstileResponse.value,
        invitation: invitationCode.value,
        locale: locale.value,
      }

      const response = await authStore.register(registerData)

      // Check if account is pending approval
      if (response?.status === 'pending') {
        // Show pending approval message and redirect
        errorMessage.value = ''
        await navigateTo(localePath('/auth/pending-approval'))
        return
      }

      // Check if email verification is required
      if (response?.email_verification_required) {
        // Redirect to verification page
        await navigateTo(localePath('/auth/verify-email'))
        return
      }

      await navigateTo(localePath('/onboarding'))
    } catch (error) {
      console.error('Error de registro:', error)

      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors

        for (const field in serverErrors) {
          if (field in errors) {
            errors[field] = serverErrors[field][0]
          }
        }
      } else {
        errorMessage.value = error.response?.data?.message || 'Ocurrió un error durante el registro'
      }

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

  .auth-loading-state {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-secondary);
  }
</style>
