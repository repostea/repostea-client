<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="card-bg rounded-lg shadow-lg p-8 text-center">
        <!-- Loading State -->
        <div v-if="loading" class="py-8">
          <div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"/>
          <p class="text-gray-600 dark:text-gray-400">{{ t('profile.confirming_email_change') }}</p>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="py-8">
          <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="fa6-solid:check" class="text-green-600 dark:text-green-400 text-2xl" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ t('profile.email_changed_title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mb-2">
            {{ t('profile.email_changed_description') }}
          </p>
          <p v-if="newEmail" class="text-primary font-medium mb-6">
            {{ newEmail }}
          </p>
          <NuxtLink
            :to="localePath('/profile/settings')"
            class="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            {{ t('profile.go_to_settings') }}
          </NuxtLink>
        </div>

        <!-- Error State -->
        <div v-else class="py-8">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="fa6-solid:xmark" class="text-red-600 dark:text-red-400 text-2xl" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ t('profile.email_change_failed_title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ errorMessage || t('profile.email_change_failed_description') }}
          </p>
          <NuxtLink
            :to="localePath('/profile/settings')"
            class="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            {{ t('profile.try_again') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useI18n, useLocalePath } from '#i18n'
  import { useAuthStore } from '~/stores/auth'

  const route = useRoute()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const loading = ref(true)
  const success = ref(false)
  const errorMessage = ref('')
  const newEmail = ref('')

  onMounted(async () => {
    const token = route.query.token

    if (!token || typeof token !== 'string' || token.length !== 64) {
      loading.value = false
      errorMessage.value = t('profile.invalid_confirmation_link')
      return
    }

    try {
      const response = await $api.users.confirmEmailChange(token)
      success.value = true
      newEmail.value = response.data.email

      // If user is logged in, refresh their data
      if (authStore.isAuthenticated) {
        await authStore.fetchUser(true)
      }
    } catch (error) {
      success.value = false
      errorMessage.value = error.response?.data?.message || t('profile.email_change_failed_description')
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
  .card-bg {
    background-color: var(--color-bg-card);
  }
</style>
