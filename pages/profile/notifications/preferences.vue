<template>
  <ProfileLayout active-tab="notifications">
    <!-- Tabs: List / Preferences -->
    <NotificationTabs active-tab="preferences" />

    <div class="space-y-6">
      <!-- Beta banner -->
      <div
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center"
          >
            <Icon
              name="fa6-solid:flask"
              class="text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 class="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
              {{ t('notifications.preferences.beta_title') }}
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-700 text-amber-700 dark:text-amber-300"
                >Beta</span
              >
            </h3>
            <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {{ t('notifications.preferences.beta_description') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Push Status Section -->
      <div class="card-bg rounded-lg shadow-sm border prefs-border overflow-hidden">
        <div class="px-6 py-4 border-b prefs-border">
          <h2 class="text-lg font-medium">{{ t('notifications.preferences.push_status') }}</h2>
        </div>
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="font-medium">{{ t('notifications.preferences.push_notifications') }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{
                  isSubscribed
                    ? t('notifications.preferences.push_enabled')
                    : t('notifications.preferences.push_disabled')
                }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="isBlocked" class="text-sm text-red-600 dark:text-red-400">
                {{ t('notifications.preferences.permission_denied') }}
              </span>
              <button
                v-if="!isSupported"
                disabled
                class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-md cursor-not-allowed"
              >
                {{ t('notifications.preferences.not_supported') }}
              </button>
              <button
                v-else-if="needsPermission"
                :disabled="loading"
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50"
                @click="handleRequestPermission"
              >
                {{ t('notifications.preferences.request_permission') }}
              </button>
              <button
                v-else-if="!isSubscribed && !isBlocked"
                :disabled="loading"
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50"
                @click="handleSubscribe"
              >
                <span
                  v-if="loading"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
                {{ t('notifications.preferences.enable_push') }}
              </button>
              <button
                v-else-if="isSubscribed"
                :disabled="loading"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                @click="handleUnsubscribe"
              >
                <span
                  v-if="loading"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
                {{ t('notifications.preferences.disable_push') }}
              </button>
            </div>
          </div>

          <!-- Test notification button -->
          <div v-if="isSubscribed" class="mt-4 pt-4 border-t prefs-border">
            <button
              :disabled="testLoading"
              class="px-4 py-2 prefs-secondary-btn rounded-md transition-colors disabled:opacity-50 inline-flex items-center"
              @click="handleTestNotification"
            >
              <span
                v-if="testLoading"
                class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"
              />
              <Icon name="fa6-solid:bell" class="mr-2" aria-hidden="true" />
              {{ t('notifications.preferences.test_notification') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Snooze Section -->
      <div class="card-bg rounded-lg shadow-sm border prefs-border overflow-hidden">
        <div class="px-6 py-4 border-b prefs-border">
          <h2 class="text-lg font-medium">{{ t('notifications.preferences.snooze_section') }}</h2>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {{ t('notifications.preferences.snooze_description') }}
          </p>

          <!-- Snooze status -->
          <div
            v-if="snoozeStatus.is_snoozed"
            class="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <Icon
                  name="fa6-solid:bell-slash"
                  class="text-yellow-600 dark:text-yellow-400 mr-3"
                  aria-hidden="true"
                />
                <div>
                  <p class="font-medium text-yellow-800 dark:text-yellow-200">
                    {{ t('notifications.preferences.snooze_active') }}
                  </p>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300">
                    {{
                      t('notifications.preferences.snooze_until', {
                        time: formatSnoozeTime(snoozeStatus.snoozed_until),
                      })
                    }}
                  </p>
                </div>
              </div>
              <button
                :disabled="snoozeLoading"
                class="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                @click="handleUnsnooze"
              >
                {{ t('notifications.preferences.snooze_cancel') }}
              </button>
            </div>
          </div>

          <!-- Snooze buttons -->
          <div v-else class="flex flex-wrap gap-2">
            <button
              v-for="option in snoozeOptions"
              :key="option.value"
              :disabled="snoozeLoading"
              class="px-3 py-2 prefs-secondary-btn rounded-md transition-colors disabled:opacity-50 text-sm"
              @click="handleSnooze(option.value, option.type)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Instant Notifications Section -->
      <div class="card-bg rounded-lg shadow-sm border prefs-border overflow-hidden">
        <div class="px-6 py-4 border-b prefs-border">
          <h2 class="text-lg font-medium">{{ t('notifications.preferences.instant_section') }}</h2>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {{ t('notifications.preferences.instant_description') }}
          </p>

          <div class="space-y-3">
            <label
              v-for="(enabled, key) in preferences.push?.instant || {}"
              :key="key"
              class="flex items-center justify-between p-3 rounded-lg prefs-option-hover transition-colors cursor-pointer"
            >
              <span class="text-sm">{{ t(`notifications.preferences.instant_${key}`) }}</span>
              <input
                type="checkbox"
                :checked="enabled"
                class="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
                @change="updateInstantPreference(key, ($event.target as HTMLInputElement).checked)"
              >
            </label>
          </div>
        </div>
      </div>

      <!-- Digest Section -->
      <div class="card-bg rounded-lg shadow-sm border prefs-border overflow-hidden">
        <div class="px-6 py-4 border-b prefs-border">
          <h2 class="text-lg font-medium">{{ t('notifications.preferences.digest_section') }}</h2>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {{ t('notifications.preferences.digest_description') }}
          </p>

          <!-- Digest frequency -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">
              {{ t('notifications.preferences.digest_frequency') }}
            </label>
            <select
              v-model="digestFrequency"
              class="w-full md:w-auto px-3 py-2 prefs-input rounded-md focus:ring-2 focus:ring-primary"
              @change="updateDigestFrequency"
            >
              <option value="none">{{ t('notifications.preferences.digest_none') }}</option>
              <option value="daily">{{ t('notifications.preferences.digest_daily') }}</option>
              <option value="weekly">{{ t('notifications.preferences.digest_weekly') }}</option>
            </select>
          </div>

          <!-- Day selector (weekly only) -->
          <div v-if="digestFrequency === 'weekly'" class="mb-6">
            <label class="block text-sm font-medium mb-2">
              {{ t('notifications.preferences.digest_day') }}
            </label>
            <select
              v-model="digestDay"
              class="w-full md:w-auto px-3 py-2 prefs-input rounded-md focus:ring-2 focus:ring-primary"
              @change="updateDigestSettings"
            >
              <option v-for="(day, index) in weekDays" :key="index" :value="index">
                {{ day }}
              </option>
            </select>
          </div>

          <!-- Hour selector -->
          <div v-if="digestFrequency !== 'none'" class="mb-6">
            <label class="block text-sm font-medium mb-2">
              {{ t('notifications.preferences.digest_hour') }}
            </label>
            <select
              v-model="digestHour"
              class="w-full md:w-auto px-3 py-2 prefs-input rounded-md focus:ring-2 focus:ring-primary"
              @change="updateDigestSettings"
            >
              <option v-for="hour in 24" :key="hour - 1" :value="hour - 1">
                {{ formatHour(hour - 1) }}
              </option>
            </select>
          </div>

          <!-- Digest content toggles -->
          <div v-if="digestFrequency !== 'none'" class="space-y-3">
            <p class="text-sm font-medium mb-2">
              {{ t('notifications.preferences.digest_content') }}
            </p>
            <label
              v-for="(enabled, key) in preferences.digest || {}"
              :key="key"
              class="flex items-center justify-between p-3 rounded-lg prefs-option-hover transition-colors cursor-pointer"
            >
              <span class="text-sm">{{ t(`notifications.preferences.digest_${key}`) }}</span>
              <input
                type="checkbox"
                :checked="enabled"
                class="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
                @change="updateDigestPreference(key, ($event.target as HTMLInputElement).checked)"
              >
            </label>
          </div>
        </div>
      </div>

      <!-- Quiet Hours Section -->
      <div class="card-bg rounded-lg shadow-sm border prefs-border overflow-hidden">
        <div class="px-6 py-4 border-b prefs-border">
          <h2 class="text-lg font-medium">
            {{ t('notifications.preferences.quiet_hours_section') }}
          </h2>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {{ t('notifications.preferences.quiet_hours_description') }}
          </p>

          <!-- Enable toggle -->
          <label
            class="flex items-center justify-between p-3 rounded-lg prefs-option-hover transition-colors cursor-pointer mb-4"
          >
            <span class="font-medium">{{ t('notifications.preferences.quiet_hours_enable') }}</span>
            <input
              v-model="quietHoursEnabled"
              type="checkbox"
              class="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
              @change="toggleQuietHours"
            >
          </label>

          <!-- Time selectors -->
          <div v-if="quietHoursEnabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('notifications.preferences.quiet_hours_start') }}
              </label>
              <input
                v-model="quietHoursStart"
                type="time"
                class="w-full px-3 py-2 prefs-input rounded-md focus:ring-2 focus:ring-primary"
                @change="saveQuietHours"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('notifications.preferences.quiet_hours_end') }}
              </label>
              <input
                v-model="quietHoursEnd"
                type="time"
                class="w-full px-3 py-2 prefs-input rounded-md focus:ring-2 focus:ring-primary"
                @change="saveQuietHours"
              >
            </div>
          </div>

          <!-- Timezone selector -->
          <div v-if="quietHoursEnabled" class="mt-4">
            <label class="block text-sm font-medium mb-2">
              {{ t('notifications.preferences.quiet_hours_timezone') }}
            </label>
            <select
              v-model="timezone"
              class="w-full md:w-auto px-3 py-2 prefs-input rounded-md focus:ring-2 focus:ring-primary"
            >
              <option v-for="tz in commonTimezones" :key="tz" :value="tz">
                {{ tz }}
              </option>
            </select>
          </div>

          <!-- Save button -->
          <div v-if="quietHoursEnabled" class="mt-6 pt-4 border-t prefs-border">
            <button
              :disabled="savingQuietHours"
              class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50 inline-flex items-center"
              @click="saveQuietHours"
            >
              <span
                v-if="savingQuietHours"
                class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
              />
              <Icon v-else name="fa6-solid:floppy-disk" class="mr-2" aria-hidden="true" />
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </ProfileLayout>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useI18n } from '#i18n'
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'
  import { usePushNotifications } from '~/composables/usePushNotifications'
  import { useNotification } from '~/composables/useNotification'

  definePageMeta({
    middleware: ['auth'],
  })

  const { t } = useI18n()
  const { $api } = useNuxtApp()
  const notification = useNotification()

  const {
    isSupported,
    isSubscribed,
    isBlocked,
    needsPermission,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
    initialize: initializePush,
  } = usePushNotifications()

  // Local state
  const preferencesLoading = ref(false)
  const testLoading = ref(false)
  const snoozeLoading = ref(false)
  const savingQuietHours = ref(false)
  const saveTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  // Preferences state
  const preferences = ref({
    push: {
      enabled: true,
      instant: {
        comment_replies: true,
        post_comments: true,
        mentions: true,
        agora_messages: true,
        agora_replies: true,
        achievements: false,
        karma_events: false,
        system: true,
      },
    },
    digest: {
      enabled: false,
      include_popular_posts: true,
      include_activity_summary: true,
      include_subscribed_subs: true,
    },
  })

  // Digest settings
  const digestFrequency = ref('none')
  const digestDay = ref(1) // Monday
  const digestHour = ref(9) // 9 AM

  // Quiet hours settings
  const quietHoursEnabled = ref(false)
  const quietHoursStart = ref('23:00')
  const quietHoursEnd = ref('08:00')
  const timezone = ref('Europe/Madrid')

  // Snooze state
  const snoozeStatus = ref({
    is_snoozed: false,
    snoozed_until: null as string | null,
    remaining_minutes: null as number | null,
  })

  // Computed
  const weekDays = computed(() => [
    t('common.sunday'),
    t('common.monday'),
    t('common.tuesday'),
    t('common.wednesday'),
    t('common.thursday'),
    t('common.friday'),
    t('common.saturday'),
  ])

  const snoozeOptions = computed(() => [
    { value: 1, type: 'hours', label: t('notifications.preferences.snooze_1h') },
    { value: 2, type: 'hours', label: t('notifications.preferences.snooze_2h') },
    { value: 4, type: 'hours', label: t('notifications.preferences.snooze_4h') },
    { value: 8, type: 'hours', label: t('notifications.preferences.snooze_8h') },
    { value: 24, type: 'hours', label: t('notifications.preferences.snooze_24h') },
    {
      value: 0,
      type: 'until_tomorrow',
      label: t('notifications.preferences.snooze_until_tomorrow'),
    },
  ])

  const commonTimezones = [
    'Europe/Madrid',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]

  // Methods
  function formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  function formatSnoozeTime(dateString: string | null): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  async function loadPreferences() {
    preferencesLoading.value = true
    try {
      const response = await $api.notifications.getPreferences()
      const data = response.data

      // Update snooze status
      snoozeStatus.value = {
        is_snoozed: data.snooze?.is_snoozed || false,
        snoozed_until: data.snooze?.snoozed_until || null,
        remaining_minutes: data.snooze?.remaining_minutes || null,
      }

      // Update preferences
      if (data.notification_preferences) {
        preferences.value = {
          ...preferences.value,
          ...data.notification_preferences,
        }
      }

      // Update digest settings
      digestFrequency.value = data.digest_frequency || 'none'
      digestDay.value = data.digest_day ?? 1
      digestHour.value = data.digest_hour ?? 9

      // Update quiet hours
      quietHoursEnabled.value = data.quiet_hours_enabled || false
      quietHoursStart.value = data.quiet_hours_start || '23:00'
      quietHoursEnd.value = data.quiet_hours_end || '08:00'
      timezone.value = data.timezone || 'Europe/Madrid'
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      preferencesLoading.value = false
    }
  }

  async function savePreferences() {
    // Debounce saves
    if (saveTimeout.value) {
      clearTimeout(saveTimeout.value)
    }

    saveTimeout.value = setTimeout(async () => {
      try {
        await $api.notifications.updatePreferences({
          notification_preferences: preferences.value,
          digest_frequency: digestFrequency.value,
          digest_day: digestDay.value,
          digest_hour: digestHour.value,
          quiet_hours_enabled: quietHoursEnabled.value,
          quiet_hours_start: quietHoursStart.value,
          quiet_hours_end: quietHoursEnd.value,
          timezone: timezone.value,
        })
        notification.success(t('notifications.preferences.saved'))
      } catch (error) {
        console.error('Error saving preferences:', error)
        notification.error(t('notifications.preferences.save_error'))
      }
    }, 500)
  }

  function updateInstantPreference(key: string, value: boolean) {
    if (preferences.value.push?.instant) {
      ;(preferences.value.push.instant as Record<string, boolean>)[key] = value
    }
    savePreferences()
  }

  function updateDigestPreference(key: string, value: boolean) {
    if (preferences.value.digest) {
      ;(preferences.value.digest as Record<string, boolean>)[key] = value
    }
    savePreferences()
  }

  function updateDigestFrequency() {
    savePreferences()
  }

  function updateDigestSettings() {
    savePreferences()
  }

  async function toggleQuietHours() {
    // Auto-save when toggling enabled/disabled
    savingQuietHours.value = true
    try {
      await $api.notifications.updatePreferences({
        quiet_hours_enabled: quietHoursEnabled.value,
        quiet_hours_start: quietHoursStart.value,
        quiet_hours_end: quietHoursEnd.value,
        timezone: timezone.value,
      })
      if (quietHoursEnabled.value) {
        notification.success(t('notifications.preferences.quiet_hours_enabled'))
      } else {
        notification.success(t('notifications.preferences.quiet_hours_disabled'))
      }
    } catch (error) {
      console.error('Error toggling quiet hours:', error)
      notification.error(t('notifications.preferences.save_error'))
    } finally {
      savingQuietHours.value = false
    }
  }

  async function saveQuietHours() {
    savingQuietHours.value = true
    try {
      await $api.notifications.updatePreferences({
        quiet_hours_enabled: quietHoursEnabled.value,
        quiet_hours_start: quietHoursStart.value,
        quiet_hours_end: quietHoursEnd.value,
        timezone: timezone.value,
      })
      notification.success(t('notifications.preferences.saved'))
    } catch (error) {
      console.error('Error saving quiet hours:', error)
      notification.error(t('notifications.preferences.save_error'))
    } finally {
      savingQuietHours.value = false
    }
  }

  async function handleRequestPermission() {
    await requestPermission()
  }

  async function handleSubscribe() {
    await subscribe()
  }

  async function handleUnsubscribe() {
    await unsubscribe()
  }

  async function handleTestNotification() {
    testLoading.value = true
    try {
      await testNotification()
    } finally {
      testLoading.value = false
    }
  }

  async function handleSnooze(value: number, type: string) {
    snoozeLoading.value = true
    try {
      const response = await $api.notifications.snooze({
        hours: type === 'hours' ? value : undefined,
        until_tomorrow: type === 'until_tomorrow',
      })
      snoozeStatus.value = {
        is_snoozed: true,
        snoozed_until: response.data.snoozed_until,
        remaining_minutes: response.data.remaining_minutes,
      }
      notification.success(t('notifications.preferences.snooze_activated'))
    } catch (error) {
      console.error('Error snoozing:', error)
    } finally {
      snoozeLoading.value = false
    }
  }

  async function handleUnsnooze() {
    snoozeLoading.value = true
    try {
      await $api.notifications.unsnooze()
      snoozeStatus.value = {
        is_snoozed: false,
        snoozed_until: null,
        remaining_minutes: null,
      }
      notification.success(t('notifications.preferences.snooze_cancelled'))
    } catch (error) {
      console.error('Error unsnoozing:', error)
    } finally {
      snoozeLoading.value = false
    }
  }

  onMounted(async () => {
    await initializePush()
    await loadPreferences()
  })
</script>

<style scoped>
  .prefs-border {
    border-color: var(--color-border-default);
  }

  .prefs-secondary-btn {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-default);
  }

  .prefs-secondary-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .prefs-option-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .prefs-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }
</style>
