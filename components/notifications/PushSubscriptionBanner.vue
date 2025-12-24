<template>
  <div
    v-if="shouldShow"
    class="px-4 py-3 push-banner transition-all"
  >
    <!-- Permission denied state -->
    <div v-if="isBlocked" class="flex items-start gap-3">
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <Icon name="fa6-solid:bell-slash" class="text-red-500 text-sm" aria-hidden="true" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-text dark:text-text-dark">
          {{ t('notifications.push_banner.blocked_title') }}
        </p>
        <p class="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
          {{ t('notifications.push_banner.blocked_description') }}
        </p>
      </div>
      <button
        class="flex-shrink-0 p-1 text-gray-400 hover:text-gray-500 transition-colors"
        :aria-label="t('common.close')"
        @click="dismiss"
      >
        <Icon name="fa6-solid:xmark" class="text-sm" aria-hidden="true" />
      </button>
    </div>

    <!-- Needs permission state -->
    <div v-else-if="needsPermission" class="flex items-start gap-3">
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon name="fa6-solid:bell" class="text-primary text-sm" aria-hidden="true" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-text dark:text-text-dark">
          {{ t('notifications.push_banner.enable_title') }}
        </p>
        <p class="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
          {{ t('notifications.push_banner.enable_description') }}
        </p>
        <div class="flex items-center gap-2 mt-2">
          <button
            :disabled="loading"
            class="px-3 py-1 text-xs font-medium bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50"
            @click="handleEnable"
          >
            <span v-if="loading" class="inline-block animate-spin h-3 w-3 mr-1 border-2 border-white border-t-transparent rounded-full"/>
            {{ t('notifications.push_banner.enable_button') }}
          </button>
          <button
            class="px-3 py-1 text-xs text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark transition-colors"
            @click="dismiss"
          >
            {{ t('notifications.push_banner.later') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Can subscribe state (permission granted but not subscribed) -->
    <div v-else-if="canSubscribe" class="flex items-start gap-3">
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <Icon name="fa6-solid:bell" class="text-green-500 text-sm" aria-hidden="true" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-text dark:text-text-dark">
          {{ t('notifications.push_banner.ready_title') }}
        </p>
        <p class="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
          {{ t('notifications.push_banner.ready_description') }}
        </p>
        <div class="flex items-center gap-2 mt-2">
          <button
            :disabled="loading"
            class="px-3 py-1 text-xs font-medium bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50"
            @click="handleSubscribe"
          >
            <span v-if="loading" class="inline-block animate-spin h-3 w-3 mr-1 border-2 border-white border-t-transparent rounded-full"/>
            {{ t('notifications.push_banner.activate_button') }}
          </button>
          <button
            class="px-3 py-1 text-xs text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark transition-colors"
            @click="dismiss"
          >
            {{ t('notifications.push_banner.later') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '#i18n'
import { usePushNotifications } from '~/composables/usePushNotifications'

const { t } = useI18n()
const {
  isSupported,
  isSubscribed,
  isBlocked,
  needsPermission,
  canSubscribe,
  loading,
  requestPermission,
  subscribe,
  initialize,
} = usePushNotifications()

const dismissed = ref(false)
const dismissedUntil = ref<number | null>(null)

const shouldShow = computed(() => {
  // Don't show if not supported
  if (!isSupported.value) return false

  // Don't show if already subscribed
  if (isSubscribed.value) return false

  // Don't show if dismissed recently (within 7 days)
  if (dismissed.value) return false
  if (dismissedUntil.value && Date.now() < dismissedUntil.value) return false

  // Show if blocked (to inform user), needs permission, or can subscribe
  return isBlocked.value || needsPermission.value || canSubscribe.value
})

function dismiss() {
  dismissed.value = true
  // Remember dismissal for 7 days
  const until = Date.now() + 7 * 24 * 60 * 60 * 1000
  dismissedUntil.value = until
  if (import.meta.client) {
    localStorage.setItem('push_banner_dismissed_until', until.toString())
  }
}

async function handleEnable() {
  const granted = await requestPermission()
  if (granted) {
    await subscribe()
  }
}

async function handleSubscribe() {
  await subscribe()
}

onMounted(async () => {
  await initialize()

  // Check if was dismissed recently
  if (import.meta.client) {
    const storedUntil = localStorage.getItem('push_banner_dismissed_until')
    if (storedUntil) {
      const until = parseInt(storedUntil, 10)
      if (Date.now() < until) {
        dismissedUntil.value = until
      } else {
        // Clear expired dismissal
        localStorage.removeItem('push_banner_dismissed_until')
      }
    }
  }
})
</script>

<style scoped>
.push-banner {
  background-color: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border-default);
}
</style>
