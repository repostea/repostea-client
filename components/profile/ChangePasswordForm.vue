<template>
  <form @submit.prevent="updatePassword">
    <div
      v-if="successMessage"
      class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800"
    >
      {{ successMessage }}
    </div>

    <div
      v-if="errorMessage"
      class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800"
    >
      {{ errorMessage }}
    </div>

    <div class="mb-4">
      <label for="current_password" class="block text-sm font-medium mb-1">{{
        t('profile.current_password')
      }}</label>
      <div class="relative">
        <input
          id="current_password"
          v-model="form.current_password"
          :type="showCurrentPassword ? 'text' : 'password'"
          autocomplete="current-password"
          class="password-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
          :class="{ 'border-red-500': errors.current_password }"
          :aria-invalid="!!errors.current_password"
          :aria-describedby="errors.current_password ? 'current-password-error' : undefined"
          required
        >
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3 flex items-center"
          :aria-label="showCurrentPassword ? t('common.hide_password') : t('common.show_password')"
          @click="showCurrentPassword = !showCurrentPassword"
        >
          <Icon
            :name="showCurrentPassword ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'"
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

    <div class="mb-4">
      <label for="password" class="block text-sm font-medium mb-1">{{
        t('profile.new_password')
      }}</label>
      <div class="relative">
        <input
          id="password"
          v-model="form.password"
          :type="showNewPassword ? 'text' : 'password'"
          autocomplete="new-password"
          class="password-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
          :class="{ 'border-red-500': errors.password }"
          :aria-invalid="!!errors.password"
          :aria-describedby="errors.password ? 'new-password-error' : undefined"
          required
        >
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3 flex items-center"
          :aria-label="showNewPassword ? t('common.hide_password') : t('common.show_password')"
          @click="showNewPassword = !showNewPassword"
        >
          <Icon
            :name="showNewPassword ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'"
            class="text-gray-500"
            aria-hidden="true"
          />
        </button>
      </div>
      <p
        v-if="errors.password"
        id="new-password-error"
        role="alert"
        class="mt-1 text-sm text-red-500"
      >
        {{ errors.password }}
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ t('profile.password_requirements') }}
      </p>
    </div>

    <div class="mb-6">
      <label for="password_confirmation" class="block text-sm font-medium mb-1">{{
        t('profile.password_confirm')
      }}</label>
      <div class="relative">
        <input
          id="password_confirmation"
          v-model="form.password_confirmation"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          class="password-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
          :class="{ 'border-red-500': errors.password_confirmation }"
          :aria-invalid="!!errors.password_confirmation"
          :aria-describedby="errors.password_confirmation ? 'password-confirm-error' : undefined"
          required
        >
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3 flex items-center"
          :aria-label="showConfirmPassword ? t('common.hide_password') : t('common.show_password')"
          @click="showConfirmPassword = !showConfirmPassword"
        >
          <Icon
            :name="showConfirmPassword ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'"
            class="text-gray-500"
            aria-hidden="true"
          />
        </button>
      </div>
      <p
        v-if="errors.password_confirmation"
        id="password-confirm-error"
        role="alert"
        class="mt-1 text-sm text-red-500"
      >
        {{ errors.password_confirmation }}
      </p>
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
        :disabled="loading"
      >
        <span
          v-if="loading"
          class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
        />
        {{ t('profile.update_password') }}
      </button>
    </div>
  </form>
</template>

<script setup>
  import { ref, reactive } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n } from '#i18n'

  const emit = defineEmits(['updated'])

  const { t } = useI18n()
  const authStore = useAuthStore()

  const loading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const showCurrentPassword = ref(false)
  const showNewPassword = ref(false)
  const showConfirmPassword = ref(false)

  const form = reactive({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const errors = reactive({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  function validateForm() {
    let isValid = true

    for (const key in errors) {
      errors[key] = ''
    }

    if (!form.current_password) {
      errors.current_password = t('validation.current_password.required')
      isValid = false
    }

    if (!form.password) {
      errors.password = t('validation.password.required')
      isValid = false
    } else if (form.password.length < 8) {
      errors.password = t('validation.password.min', { min: 8 })
      isValid = false
    }

    if (!form.password_confirmation) {
      errors.password_confirmation = t('validation.password_confirmation.required')
      isValid = false
    } else if (form.password !== form.password_confirmation) {
      errors.password_confirmation = t('validation.password_confirmation.match')
      isValid = false
    }

    return isValid
  }

  async function updatePassword() {
    if (!validateForm()) return

    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      await authStore.updatePassword(form)

      successMessage.value = t('profile.password_updated_success')
      emit('updated')

      form.current_password = ''
      form.password = ''
      form.password_confirmation = ''

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('profile.password_update_error')

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
</script>

<style scoped>
  .password-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }
</style>
