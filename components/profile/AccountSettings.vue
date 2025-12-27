<template>
  <div>
    <form @submit.prevent="savePreferences">
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

      <div class="mb-6">
        <label class="block text-sm font-medium mb-3">
          {{ t('settings.theme') }}
        </label>
        <ClientOnly fallback-tag="div">
          <template #fallback>
            <div class="flex items-center gap-3">
              <div
                class="flex-1 px-4 py-3 account-settings-bg-subtle rounded-md border account-settings-border"
              >
                <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <Icon name="fa6-solid:spinner" class="mr-2 animate-spin" aria-hidden="true" />
                  <span>{{ t('common.loading') }}</span>
                </span>
              </div>
              <button
                type="button"
                disabled
                class="px-4 py-3 account-settings-disabled text-gray-500 dark:text-gray-400 rounded-md cursor-not-allowed whitespace-nowrap"
              >
                {{ t('settings.change_theme') }}
              </button>
            </div>
          </template>

          <div class="flex items-center gap-3">
            <div
              class="flex-1 px-4 py-3 account-settings-bg-subtle rounded-md border account-settings-border"
            >
              <span class="text-sm text-gray-700 dark:text-gray-300 inline-flex items-center">
                <Icon
                  :name="getCurrentThemeIconIconify()"
                  :class="getCurrentThemeIconColor()"
                  class="mr-2"
                  aria-hidden="true"
                />
                <span class="font-medium">{{ getCurrentThemeLabel() }}</span>
              </span>
            </div>
            <button
              type="button"
              class="px-4 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors whitespace-nowrap"
              @click="showThemeSelector = !showThemeSelector"
            >
              {{ t('settings.change_theme') }}
            </button>
          </div>

          <div
            v-if="showThemeSelector"
            class="mt-3 rounded-lg shadow-lg py-1 bg-white dark:bg-card-bg-dark border account-settings-border"
          >
            <div
              class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b account-settings-border"
            >
              {{ t('settings.themes') }}
            </div>

            <button
              v-for="theme in availableThemes"
              :key="theme.name"
              type="button"
              class="inline-flex items-center w-full text-left px-4 py-2 text-sm text-text dark:text-text-dark account-settings-hover"
              :class="{
                'account-settings-active': preferencesStore.theme === theme.name,
              }"
              @click="switchTheme(theme.name)"
            >
              <Icon
                :name="theme.iconify"
                :class="theme.colorClass"
                class="mr-2 flex-shrink-0"
                aria-hidden="true"
              />
              <span>{{ theme.label }}</span>
            </button>
          </div>
        </ClientOnly>
      </div>

      <div class="mb-6">
        <h3 class="text-sm font-medium mb-3">{{ t('profile.display_options') }}</h3>

        <div class="space-y-3">
          <div class="flex items-start">
            <input
              id="show_thumbnails"
              v-model="displayOptions.show_thumbnails"
              type="checkbox"
              class="w-6 h-6 mt-0.5 rounded border-2 account-settings-checkbox-border text-primary focus:ring-2 focus:ring-primary"
            >
            <div class="ml-3">
              <label for="show_thumbnails" class="text-sm font-medium cursor-pointer">
                {{ t('profile.show_thumbnails') }}
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ t('settings.show_thumbnails_description') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-sm font-medium mb-3">{{ t('settings.privacy_options') }}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {{ t('settings.privacy_description') }}
        </p>

        <div class="space-y-3">
          <div class="flex items-start">
            <input
              id="hide_achievements"
              v-model="privacyOptions.hide_achievements"
              type="checkbox"
              class="w-6 h-6 mt-0.5 rounded border-2 account-settings-checkbox-border text-primary focus:ring-2 focus:ring-primary"
            >
            <div class="ml-3">
              <label for="hide_achievements" class="text-sm font-medium cursor-pointer">
                {{ t('settings.hide_achievements') }}
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ t('settings.hide_achievements_description') }}
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <input
              id="hide_comments"
              v-model="privacyOptions.hide_comments"
              type="checkbox"
              class="w-6 h-6 mt-0.5 rounded border-2 account-settings-checkbox-border text-primary focus:ring-2 focus:ring-primary"
            >
            <div class="ml-3">
              <label for="hide_comments" class="text-sm font-medium cursor-pointer">
                {{ t('settings.hide_comments') }}
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ t('settings.hide_comments_description') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          class="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
          />
          {{ t('profile.save_preferences') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useUserPreferencesStore } from '~/stores/userPreferences'
  import { useI18n } from '#i18n'

  const emit = defineEmits(['updated'])

  const { t } = useI18n()
  const authStore = useAuthStore()
  const preferencesStore = useUserPreferencesStore()

  const successMessage = ref('')
  const errorMessage = ref('')
  const loading = ref(false)
  const showThemeSelector = ref(false)

  const availableThemes = [
    {
      name: 'renegados1',
      label: 'Renegados',
      iconify: 'fa6-solid:paw',
      colorClass: 'text-purple-500',
    },
    {
      name: 'yups',
      label: 'Yups',
      iconify: 'fa6-solid:thumbs-up',
      colorClass: 'text-pink-500',
    },
    {
      name: 'repostea',
      label: 'Repostea',
      iconify: 'fa6-solid:share-nodes',
      colorClass: 'text-blue-500',
    },
    {
      name: 'barrapunto',
      label: 'Barrapunto',
      iconify: 'fa6-solid:fire',
      colorClass: 'text-orange-500',
    },
    {
      name: 'dark',
      label: 'Oscuro',
      iconify: 'fa6-solid:moon',
      colorClass: 'text-gray-500',
    },
  ]

  function getCurrentThemeLabel() {
    const theme = availableThemes.find((t) => t.name === preferencesStore.theme)
    return theme?.label || preferencesStore.theme
  }

  function getCurrentThemeIconIconify() {
    const theme = availableThemes.find((t) => t.name === preferencesStore.theme)
    return theme?.iconify || 'fa6-solid:palette'
  }

  function getCurrentThemeIconColor() {
    const theme = availableThemes.find((t) => t.name === preferencesStore.theme)
    return theme?.colorClass || 'text-gray-500'
  }

  function switchTheme(themeName) {
    const theme = availableThemes.find((t) => t.name === themeName)
    if (!theme) return

    if (import.meta.client) {
      document.documentElement.classList.remove(
        'theme-yups',
        'theme-repostea',
        'theme-renegados1',
        'theme-barrapunto',
        'theme-dark'
      )
      document.documentElement.classList.add(`theme-${themeName}`)

      if (themeName === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // Save to database via store
      preferencesStore.setTheme(themeName)
    }

    // Close the theme selector
    showThemeSelector.value = false
  }

  // Opciones reactivas para los ajustes
  const displayOptions = reactive({
    show_thumbnails: true,
  })

  const privacyOptions = reactive({
    hide_achievements: false,
    hide_comments: false,
  })

  async function savePreferences() {
    successMessage.value = ''
    errorMessage.value = ''
    loading.value = true

    try {
      const { $api } = useNuxtApp()

      // Update privacy options via preferences API
      await $api.user.savePreferences({
        hide_achievements: privacyOptions.hide_achievements,
        hide_comments: privacyOptions.hide_comments,
      })

      // Update display_options in user profile
      await authStore.updateProfile({
        preferences: {
          display_options: displayOptions,
        },
      })

      successMessage.value = t('profile.preferences_updated_success')
      emit('updated')
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      errorMessage.value = error.response?.data?.message || t('profile.preferences_update_error')
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    if (authStore.isAuthenticated) {
      try {
        const { $api } = useNuxtApp()

        // Fetch preferences from the database (theme is already loaded by plugins)
        await preferencesStore.fetchPreferences()

        // Load privacy options from preferences API
        const prefsResponse = await $api.user.getPreferences()
        if (prefsResponse?.data) {
          privacyOptions.hide_achievements = prefsResponse.data.hide_achievements ?? false
          privacyOptions.hide_comments = prefsResponse.data.hide_comments ?? false
        }

        // Load user profile for display options
        await authStore.fetchUser()
        const user = authStore.user
        if (user?.preferences) {
          if (user.preferences.display_options) {
            Object.assign(displayOptions, user.preferences.display_options)
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error)
      }
    }
  })
</script>

<style scoped>
  .account-settings-bg-subtle {
    background-color: var(--color-bg-subtle);
  }

  .account-settings-border {
    border-color: var(--color-border-default);
  }

  .account-settings-checkbox-border {
    border-color: var(--color-border-default);
  }

  .account-settings-active {
    background-color: var(--color-bg-subtle);
  }

  .account-settings-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .account-settings-disabled {
    background-color: var(--color-bg-subtle);
  }
</style>
