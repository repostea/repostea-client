<template>
  <form @submit.prevent="requestEmailChange">
    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800"
    >
      {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800"
    >
      {{ errorMessage }}
    </div>

    <!-- Pending Change Alert -->
    <div
      v-if="pendingChange && !pendingChange.is_expired"
      class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md border border-yellow-200 dark:border-yellow-800"
    >
      <p class="font-medium">{{ t('profile.email_change_pending') }}</p>
      <p class="text-sm mt-1">
        {{ t('profile.email_change_pending_to', { email: pendingChange.pending_email }) }}
      </p>
      <p class="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
        {{ t('profile.email_change_expires', { date: formatDate(pendingChange.expires_at) }) }}
      </p>
      <button
        type="button"
        class="mt-2 text-sm text-yellow-700 dark:text-yellow-300 underline hover:no-underline"
        :disabled="cancelLoading"
        @click="cancelEmailChange"
      >
        {{ t('profile.email_change_cancel') }}
      </button>
    </div>

    <!-- Current Email (read-only) -->
    <div class="mb-4">
      <label class="block text-sm font-medium mb-1">{{ t('profile.current_email') }}</label>
      <div class="text-sm text-gray-600 dark:text-gray-400 py-2">
        {{ authStore.user?.email }}
      </div>
    </div>

    <!-- New Email Field -->
    <div class="mb-4">
      <label for="new_email" class="block text-sm font-medium mb-1">{{
        t('profile.new_email')
      }}</label>
      <input
        id="new_email"
        v-model="form.email"
        type="email"
        autocomplete="email"
        class="email-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        :class="{ 'border-red-500': errors.email }"
        :aria-invalid="!!errors.email"
        :aria-describedby="errors.email ? 'email-error' : undefined"
        :disabled="pendingChange && !pendingChange.is_expired"
        required
      />
      <p v-if="errors.email" id="email-error" role="alert" class="mt-1 text-sm text-red-500">
        {{ errors.email }}
      </p>
    </div>

    <!-- Current Password Field -->
    <div class="mb-4">
      <label for="current_password_email" class="block text-sm font-medium mb-1">{{
        t('profile.current_password')
      }}</label>
      <div class="relative">
        <input
          id="current_password_email"
          v-model="form.current_password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          class="password-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
          :class="{ 'border-red-500': errors.current_password }"
          :aria-invalid="!!errors.current_password"
          :aria-describedby="errors.current_password ? 'current-password-error' : undefined"
          :disabled="pendingChange && !pendingChange.is_expired"
          required
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3 flex items-center"
          :aria-label="showPassword ? t('common.hide_password') : t('common.show_password')"
          @click="showPassword = !showPassword"
        >
          <Icon
            :name="showPassword ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'"
            class="text-gray-500"
            aria-hidden="true"
          />
        </button>
      </div>
      <p
        v-if="errors.current_password"
        id="current-password-error"
        role="alert"
        class="mt-1 text-sm text-red-500"
      >
        {{ errors.current_password }}
      </p>
    </div>

    <!-- Info text -->
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
      {{ t('profile.email_change_info') }}
    </p>

    <!-- Submit Button -->
    <div class="flex justify-end">
      <button
        type="submit"
        class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading || (pendingChange && !pendingChange.is_expired)"
      >
        <span
          v-if="loading"
          class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
        />
        {{ t('profile.request_email_change') }}
      </button>
    </div>
  </form>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n } from '#i18n'

  const emit = defineEmits(['updated'])

  const { t, d } = useI18n()
  const authStore = useAuthStore()
  const { $api } = useNuxtApp()

  const loading = ref(false)
  const cancelLoading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const showPassword = ref(false)
  const pendingChange = ref(null)

  const form = reactive({
    email: '',
    current_password: '',
  })

  const errors = reactive({
    email: '',
    current_password: '',
  })

  function formatDate(dateString) {
    if (!dateString) return ''
    return d(new Date(dateString), 'short')
  }

  function validateForm() {
    let isValid = true

    for (const key in errors) {
      errors[key] = ''
    }

    if (!form.email) {
      errors.email = t('validation.email.required')
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t('validation.email.invalid')
      isValid = false
    }

    if (!form.current_password) {
      errors.current_password = t('validation.current_password.required')
      isValid = false
    }

    return isValid
  }

  async function checkPendingChange() {
    try {
      const response = await $api.users.getEmailChangeStatus()
      if (response.data.has_pending_change) {
        pendingChange.value = response.data
      } else {
        pendingChange.value = null
      }
    } catch {
      // Silently ignore errors when checking status
    }
  }

  async function requestEmailChange() {
    if (!validateForm()) return

    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      await $api.users.requestEmailChange(form)

      successMessage.value = t('profile.email_change_requested_success')
      emit('updated')

      form.email = ''
      form.current_password = ''

      // Refresh pending change status
      await checkPendingChange()

      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('profile.email_change_error')

      const backendErrors = error.response?.data?.errors
      if (backendErrors) {
        Object.keys(backendErrors).forEach((key) => {
          if (errors[key] !== undefined) {
            errors[key] = backendErrors[key][0]
          }
        })
      }
    } finally {
      loading.value = false
    }
  }

  async function cancelEmailChange() {
    cancelLoading.value = true
    errorMessage.value = ''

    try {
      await $api.users.cancelEmailChange()
      pendingChange.value = null
      successMessage.value = t('profile.email_change_cancelled_success')

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('profile.email_change_cancel_error')
    } finally {
      cancelLoading.value = false
    }
  }

  onMounted(() => {
    checkPendingChange()
  })
</script>

<style scoped>
  .email-input,
  .password-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }
</style>
