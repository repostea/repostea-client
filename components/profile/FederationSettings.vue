<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>

    <!-- Settings content -->
    <div v-else>
      <!-- Info about federation -->
      <div
        class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <Icon name="fa6-solid:globe" class="text-blue-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm text-blue-800 dark:text-blue-200">
              {{ t('settings.federation.info') }}
            </p>
            <NuxtLink
              :to="localePath('/federation')"
              class="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
            >
              {{ t('settings.federation.learn_more') }}
              <Icon name="fa6-solid:arrow-up-right-from-square" class="text-xs" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Enable federation toggle -->
      <div class="flex items-center justify-between py-4 border-b settings-border">
        <div class="flex-1 mr-4">
          <h3 class="font-medium">{{ t('settings.federation.enable') }}</h3>
          <p class="text-sm text-text-muted dark:text-text-dark-muted mt-1">
            {{ t('settings.federation.enable_description') }}
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="settings?.federation_enabled"
            class="sr-only peer"
            :disabled="updating"
            @change="toggleFederation"
          />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"
          />
        </label>
      </div>

      <!-- User handle (shown when federation is enabled) -->
      <div
        v-if="settings?.federation_enabled && settings?.handle"
        class="py-4 border-b settings-border"
      >
        <h3 class="font-medium mb-2">{{ t('settings.federation.your_handle') }}</h3>
        <div class="flex items-center gap-2">
          <code class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-mono">
            {{ settings.handle }}
          </code>
          <button
            type="button"
            class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            :title="t('common.copy')"
            @click="copyHandle"
          >
            <Icon :name="copied ? 'fa6-solid:check' : 'fa6-solid:copy'" />
          </button>
        </div>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mt-2">
          {{ t('settings.federation.handle_description') }}
        </p>
      </div>

      <!-- Default federate posts toggle (shown when federation is enabled) -->
      <div
        v-if="settings?.federation_enabled"
        class="flex items-center justify-between py-4 border-b settings-border"
      >
        <div class="flex-1 mr-4">
          <h3 class="font-medium">{{ t('settings.federation.default_federate') }}</h3>
          <p class="text-sm text-text-muted dark:text-text-dark-muted mt-1">
            {{ t('settings.federation.default_federate_description') }}
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="settings?.default_federate_posts"
            class="sr-only peer"
            :disabled="updating"
            @change="toggleDefaultFederate"
          />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"
          />
        </label>
      </div>

      <!-- Indexable toggle (shown when federation is enabled) -->
      <div
        v-if="settings?.federation_enabled"
        class="flex items-center justify-between py-4 border-b settings-border"
      >
        <div class="flex-1 mr-4">
          <h3 class="font-medium">{{ t('settings.federation.indexable') }}</h3>
          <p class="text-sm text-text-muted dark:text-text-dark-muted mt-1">
            {{ t('settings.federation.indexable_description') }}
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="settings?.indexable"
            class="sr-only peer"
            :disabled="updating"
            @change="toggleIndexable"
          />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"
          />
        </label>
      </div>

      <!-- Show followers count toggle (shown when federation is enabled) -->
      <div v-if="settings?.federation_enabled" class="flex items-center justify-between py-4">
        <div class="flex-1 mr-4">
          <h3 class="font-medium">{{ t('settings.federation.show_followers') }}</h3>
          <p class="text-sm text-text-muted dark:text-text-dark-muted mt-1">
            {{ t('settings.federation.show_followers_description') }}
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="settings?.show_followers_count"
            class="sr-only peer"
            :disabled="updating"
            @change="toggleShowFollowers"
          />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"
          />
        </label>
      </div>

      <!-- Success message -->
      <div
        v-if="successMessage"
        class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800"
      >
        {{ successMessage }}
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800"
      >
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { useActivityPub, type ActivityPubUserSettings } from '~/composables/useActivityPub'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { fetchUserSettings, updateUserSettings } = useActivityPub()

  const settings = ref<ActivityPubUserSettings | null>(null)
  const loading = ref(true)
  const updating = ref(false)
  const copied = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

  const loadSettings = async () => {
    loading.value = true
    const result = await fetchUserSettings()
    settings.value = result
    loading.value = false
  }

  const toggleFederation = async () => {
    await updateSetting({ federation_enabled: !settings.value?.federation_enabled })
  }

  const toggleDefaultFederate = async () => {
    await updateSetting({ default_federate_posts: !settings.value?.default_federate_posts })
  }

  const toggleIndexable = async () => {
    await updateSetting({ indexable: !settings.value?.indexable })
  }

  const toggleShowFollowers = async () => {
    await updateSetting({ show_followers_count: !settings.value?.show_followers_count })
  }

  const updateSetting = async (data: Partial<ActivityPubUserSettings>) => {
    updating.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const result = await updateUserSettings(data)

    if (result) {
      settings.value = result
      successMessage.value = t('settings.federation.settings_updated')
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = t('settings.federation.update_error')
      setTimeout(() => {
        errorMessage.value = ''
      }, 5000)
    }

    updating.value = false
  }

  const copyHandle = async () => {
    if (!settings.value?.handle) return

    try {
      await navigator.clipboard.writeText(settings.value.handle)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = settings.value.handle
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    }
  }

  onMounted(() => {
    loadSettings()
  })
</script>

<style scoped>
  .settings-border {
    border-color: var(--color-border-default);
  }
</style>
