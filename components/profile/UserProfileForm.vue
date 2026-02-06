<template>
  <form @submit.prevent="updateProfile">
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
      <label for="username" class="block text-sm font-medium mb-1">{{
        t('profile.username')
      }}</label>
    </div>
    <input
      id="username"
      v-model="form.username"
      type="text"
      class="form-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-1"
      :class="{ 'border-red-500': errors.username }"
      :aria-invalid="!!errors.username"
      :aria-describedby="errors.username ? 'username-error' : undefined"
    />
    <p v-if="errors.username" id="username-error" role="alert" class="mt-1 text-sm text-red-500">
      {{ errors.username }}
    </p>
    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
      {{ t('profile.username_help') }}
    </p>

    <div class="mb-4">
      <label for="email" class="block text-sm font-medium mb-1 text-gray-500">{{
        t('profile.email')
      }}</label>
      <div class="flex items-center gap-2">
        <input
          id="email"
          :value="form.email"
          type="email"
          disabled
          autocomplete="email"
          class="form-input-disabled flex-1 rounded-md px-3 py-2 cursor-not-allowed"
        />
        <NuxtLink
          :to="localePath('/profile/settings')"
          class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors whitespace-nowrap"
        >
          {{ t('profile.change_email') }}
        </NuxtLink>
      </div>
    </div>

    <div class="mb-4">
      <label for="locale" class="block text-sm font-medium mb-1">{{
        t('profile.preferred_language')
      }}</label>
      <select
        id="locale"
        v-model="form.locale"
        class="form-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ t('profile.preferred_language_help') }}
      </p>
    </div>

    <div class="mb-4">
      <label for="bio" class="block text-sm font-medium mb-1">{{ t('profile.bio') }}</label>
      <textarea
        id="bio"
        v-model="form.bio"
        rows="3"
        class="form-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        :class="{ 'border-red-500': errors.bio }"
        :aria-invalid="!!errors.bio"
        :aria-describedby="errors.bio ? 'bio-error' : undefined"
      />
      <p v-if="errors.bio" id="bio-error" role="alert" class="mt-1 text-sm text-red-500">
        {{ errors.bio }}
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ t('profile.bio_description') }}
      </p>
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium mb-2">{{ t('profile.avatar') }}</label>
      <ClientOnly>
        <AvatarUploader
          :current-avatar="avatarPreview || form.avatar_url"
          @avatar-updated="handleAvatarUpdated"
          @avatar-deleted="handleAvatarDeleted"
        />
      </ClientOnly>
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
        {{ t('profile.save_changes') }}
      </button>
    </div>
  </form>
</template>

<script setup>
  import { ref, reactive, watch } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n, useLocalePath } from '#i18n'

  import { useReservedUsernames } from '~/composables/useReservedUsernames'
  import AvatarUploader from '~/components/profile/AvatarUploader.vue'

  const props = defineProps({
    user: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['updated'])

  const { t } = useI18n()
  const localePath = useLocalePath()
  const authStore = useAuthStore()
  const { isReservedUsername } = useReservedUsernames()

  const loading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const avatarPreview = ref('')
  const form = reactive({
    username: '',
    email: '',
    locale: 'en',
    bio: '',
    avatar_url: '',
    professional_title: '',
    institution: '',
    academic_degree: '',
    expertise_areas: '',
  })

  const errors = reactive({
    username: '',
    email: '',
    bio: '',
    avatar_url: '',
    professional_title: '',
    institution: '',
    academic_degree: '',
    expertise_areas: '',
  })

  watch(
    () => props.user,
    (newValue) => {
      if (newValue) {
        form.username = newValue.username || ''
        form.email = newValue.email || ''
        form.locale = newValue.locale || 'en'
        form.bio = newValue.bio || ''

        form.avatar_url = newValue.avatar || ''
        avatarPreview.value = newValue.avatar || ''

        form.professional_title = newValue.professional_title || ''
        form.institution = newValue.institution || ''
        form.academic_degree = newValue.academic_degree || ''
        form.expertise_areas = newValue.expertise_areas || ''
      }
    },
    { immediate: true, deep: true }
  )

  // Watch avatar URL changes for live preview
  watch(
    () => form.avatar_url,
    (newUrl) => {
      if (newUrl && isValidUrl(newUrl)) {
        avatarPreview.value = newUrl
        errors.avatar_url = ''
      } else if (newUrl) {
        errors.avatar_url = t('validation.url.invalid')
      } else {
        avatarPreview.value = ''
        errors.avatar_url = ''
      }
    }
  )

  function isValidUrl(string) {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  async function handleAvatarUpdated(_urls) {
    // Update user avatar in store with the medium size URL
    await authStore.fetchUser()
    successMessage.value = t('profile.avatar_uploaded')
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }

  async function handleAvatarDeleted() {
    // Refresh user data after deletion
    await authStore.fetchUser()
    avatarPreview.value = ''
    form.avatar_url = ''
    successMessage.value = t('profile.avatar_deleted')
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }

  function validateForm() {
    let isValid = true

    for (const key in errors) {
      errors[key] = ''
    }

    if (!form.username) {
      errors.username = t('validation.username.required')
      isValid = false
    } else if (form.username.length < 3) {
      errors.username = t('validation.username.min', { min: 3 })
      isValid = false
    } else if (form.username.length > 30) {
      errors.username = t('validation.username.max', { max: 30 })
      isValid = false
    } else if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) {
      errors.username = t('validation.username.format')
      isValid = false
    } else if (isReservedUsername(form.username)) {
      errors.username = t('validation.username.reserved')
      isValid = false
    }

    if (form.bio && form.bio.length > 500) {
      errors.bio = t('validation.bio.max', { max: 500 })
      isValid = false
    }

    return isValid
  }

  async function updateProfile() {
    if (!validateForm()) return

    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const profileData = {
        username: form.username,
        locale: form.locale,
        bio: form.bio,
        avatar_url: form.avatar_url || null,
        professional_title: form.professional_title,
        institution: form.institution,
        academic_degree: form.academic_degree,
        expertise_areas: form.expertise_areas,
      }

      await authStore.updateProfile(profileData)
      successMessage.value = t('profile.profile_updated_success')
      emit('updated')

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('profile.update_error')

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
  .form-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .form-input-disabled {
    background-color: var(--color-bg-hover);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-muted);
  }
</style>
