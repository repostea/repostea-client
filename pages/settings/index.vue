<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
      <div
        class="mb-6 p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i class="fas fa-tools text-xl mt-0.5 mr-3"></i>
          </div>
          <div>
            <h3 class="font-medium mb-1">Fase de desarrollo</h3>
            <p class="text-sm">
              Esta página de ajustes está en fase de desarrollo y puede que algunas funciones no
              estén operativas o no funcionen correctamente. Los cambios que realices pueden no
              guardarse permanentemente.
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-6"
      >
        <div class="px-6 py-4 border-b border-border-color dark:border-neutral-700">
          <h2 class="text-xl font-medium flex items-center">
            <i class="fas fa-cog mr-2"></i>{{ $t('navigation.settings') }}
          </h2>
        </div>
        <div class="p-6">
          <div
            v-if="successMessage"
            class="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-md mb-4"
          >
            {{ successMessage }}
          </div>

          <form @submit.prevent="saveSettings">
            <h3 class="text-lg font-medium mb-4">
              {{ $t('settings.content_preferences') }}
            </h3>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2">
                {{ $t('settings.news_sources') }}
              </label>
              <div class="space-y-4">
                <div
                  v-for="source in availableSources"
                  :key="source.id"
                  class="border border-gray-200 dark:border-neutral-700 rounded-lg p-3"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        :id="source.id"
                        v-model="settings.sources[source.id].enabled"
                        class="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label :for="source.id" class="ml-2 font-medium">
                        {{ source.name }}
                      </label>
                    </div>
                  </div>

                  <div v-if="settings.sources[source.id].enabled" class="pl-6 mt-2">
                    <label
                      :for="`${source.id}-min-votes`"
                      class="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400"
                    >
                      Votos mínimos:
                      {{ settings.sources[source.id].minVotes }}
                    </label>
                    <input
                      type="range"
                      :id="`${source.id}-min-votes`"
                      v-model.number="settings.sources[source.id].minVotes"
                      min="0"
                      max="1000"
                      step="10"
                      class="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {{ $t('settings.sources_help') }}
              </p>
            </div>

            <div class="mb-6">
              <label for="default-sort" class="block text-sm font-medium mb-2">
                {{ $t('settings.default_sorting') }}
              </label>
              <select
                id="default-sort"
                v-model="settings.defaultSort"
                class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="promoted_at">
                  {{ $t('links.recent') }}
                </option>
                <option value="votes">
                  {{ $t('links.popular') }}
                </option>
                <option value="karma">
                  {{ $t('links.most_valued') }}
                </option>
              </select>
            </div>

            <h3 class="text-lg font-medium mt-8 mb-4">
              {{ $t('settings.theme') }}
            </h3>

            <div class="mb-6">
              <label class="block text-sm font-medium mb-2">
                {{ $t('settings.theme_mode') }}
              </label>
              <div class="flex items-center space-x-4">
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="settings.theme"
                    value="light"
                    class="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span class="ml-2 text-sm">{{ $t('common.light_mode') }}</span>
                </label>
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="settings.theme"
                    value="dark"
                    class="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span class="ml-2 text-sm">{{ $t('common.dark_mode') }}</span>
                </label>
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="settings.theme"
                    value="system"
                    class="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span class="ml-2 text-sm">{{ $t('settings.system_preference') }}</span>
                </label>
              </div>
            </div>

            <div class="border-t border-gray-200 dark:border-neutral-700 pt-6 flex justify-end">
              <button
                type="submit"
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                ></span>
                {{ $t('settings.save_settings') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        v-if="authStore.isAuthenticated"
        class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700"
      >
        <div class="px-6 py-4 border-b border-border-color dark:border-neutral-700">
          <h2 class="text-xl font-medium text-red-600 dark:text-red-400 flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>{{ $t('settings.danger_zone') }}
          </h2>
        </div>
        <div class="p-6">
          <p class="mb-4 text-text-muted dark:text-text-dark-muted">
            {{ $t('settings.danger_zone_description') }}
          </p>

          <div class="flex flex-wrap gap-4">
            <button
              @click="showDeleteConfirmation = true"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
            >
              <i class="fas fa-trash-alt mr-2"></i>
              {{ $t('settings.delete_account') }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="showDeleteConfirmation"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white dark:bg-card-dark rounded-lg shadow-lg max-w-md w-full p-6">
          <h3 class="text-lg font-medium mb-4 text-red-600 dark:text-red-400">
            {{ $t('settings.confirm_delete') }}
          </h3>
          <p class="mb-6 text-text-muted dark:text-text-dark-muted">
            {{ $t('settings.delete_warning') }}
          </p>
          <div class="flex justify-end space-x-3">
            <button
              @click="showDeleteConfirmation = false"
              class="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md text-text dark:text-text-dark"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              @click="deleteAccount"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              :disabled="deleteLoading"
            >
              <span
                v-if="deleteLoading"
                class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
              ></span>
              {{ $t('settings.confirm_delete_button') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useRouter } from 'vue-router'

  const authStore = useAuthStore()
  const router = useRouter()
  const loading = ref(false)
  const deleteLoading = ref(false)
  const successMessage = ref('')
  const showDeleteConfirmation = ref(false)

  const availableSources = [
    { id: 'meneame', name: 'Menéame' },
    { id: 'mediatize', name: 'Mediatize' },
    { id: 'reddit', name: 'Reddit' },
    { id: 'slashdot', name: 'Slashdot' },
    { id: 'hackernews', name: 'Hacker News' },
  ]

  const settings = reactive({
    sources: {
      meneame: { enabled: true, minVotes: 100 },
      mediatize: { enabled: true, minVotes: 10 },
      reddit: { enabled: true, minVotes: 500 },
      slashdot: { enabled: true, minVotes: 200 },
      hackernews: { enabled: true, minVotes: 100 },
    },
    defaultSort: 'promoted_at',
    theme: 'light',
  })

  onMounted(() => {
    loadUserSettings()
  })

  function loadUserSettings() {
    if (process.client) {
      try {
        const savedSettings = authStore.isAuthenticated
          ? localStorage.getItem('userSettings')
          : localStorage.getItem('guestSettings')

        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          if (parsedSettings.sources && typeof parsedSettings.sources.meneame === 'boolean') {
            const oldSources = { ...parsedSettings.sources }
            parsedSettings.sources = {}

            for (const source of availableSources) {
              parsedSettings.sources[source.id] = {
                enabled: oldSources[source.id] === true,
                minVotes: parsedSettings.minVotes || 10,
              }
            }

            delete parsedSettings.minVotes
          }

          for (const source of availableSources) {
            if (!parsedSettings.sources[source.id]) {
              parsedSettings.sources[source.id] = {
                enabled: false,
                minVotes: 10,
              }
            }
          }

          Object.assign(settings, parsedSettings)
        }

        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.classList.remove('light')
        } else if (settings.theme === 'light') {
          document.documentElement.classList.remove('dark')
          document.documentElement.classList.add('light')
        } else if (settings.theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            document.documentElement.classList.add('dark')
            document.documentElement.classList.remove('light')
          } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.classList.add('light')
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }

  async function saveSettings() {
    loading.value = true
    try {
      if (authStore.isAuthenticated) {
        localStorage.setItem('userSettings', JSON.stringify(settings))
      } else {
        localStorage.setItem('guestSettings', JSON.stringify(settings))
      }

      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      } else if (settings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          document.documentElement.classList.add('dark')
          document.documentElement.classList.remove('light')
        } else {
          document.documentElement.classList.remove('dark')
          document.documentElement.classList.add('light')
        }
      }

      successMessage.value = 'Configuración guardada correctamente'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      loading.value = false
    }
  }

  async function deleteAccount() {
    deleteLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await authStore.logout()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      deleteLoading.value = false
      showDeleteConfirmation.value = false
    }
  }
</script>
