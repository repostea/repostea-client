<template>
  <div>
    <div class="text-center mb-8">
      <div
        class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
      >
        <Icon name="fa6-solid:bell" class="text-2xl text-primary" aria-hidden="true" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t('onboarding.steps.notifications.content.heading') }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('onboarding.steps.notifications.content.subtitle') }}
      </p>
    </div>

    <!-- Push Notifications Section -->
    <div class="mb-6">
      <!-- Not supported -->
      <div v-if="!isSupported" class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <Icon name="fa6-solid:circle-info" class="text-gray-400 text-xl mb-2" aria-hidden="true" />
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('onboarding.steps.notifications.push.not_supported') }}
        </p>
      </div>

      <!-- Already subscribed -->
      <div v-else-if="isSubscribed" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="fa6-solid:check" class="text-green-500" aria-hidden="true" />
          </div>
          <div>
            <p class="font-medium text-green-800 dark:text-green-200">
              {{ t('onboarding.steps.notifications.push.enabled') }}
            </p>
            <p class="text-sm text-green-600 dark:text-green-300">
              {{ t('onboarding.steps.notifications.push.enabled_description') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Permission blocked -->
      <div v-else-if="isBlocked" class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="fa6-solid:bell-slash" class="text-red-500" aria-hidden="true" />
          </div>
          <div>
            <p class="font-medium text-red-800 dark:text-red-200">
              {{ t('onboarding.steps.notifications.push.blocked') }}
            </p>
            <p class="text-sm text-red-600 dark:text-red-300">
              {{ t('onboarding.steps.notifications.push.blocked_description') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Can enable push -->
      <div v-else class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="fa6-solid:bell" class="text-blue-500" aria-hidden="true" />
          </div>
          <div class="flex-1">
            <p class="font-medium text-blue-800 dark:text-blue-200 mb-1">
              {{ t('onboarding.steps.notifications.push.title') }}
            </p>
            <p class="text-sm text-blue-600 dark:text-blue-300 mb-3">
              {{ t('onboarding.steps.notifications.push.description') }}
            </p>
            <button
              :disabled="loading"
              class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              @click="handleEnablePush"
            >
              <span v-if="loading" class="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
              <Icon v-else name="fa6-solid:bell" aria-hidden="true" />
              {{ t('onboarding.steps.notifications.push.enable_button') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Info text -->
    <div class="text-left">
      <p class="text-gray-800 dark:text-gray-200 mb-3">
        {{ t('onboarding.steps.notifications.content.brief_text') }}
      </p>
      <p class="text-gray-700 dark:text-gray-300 text-sm">
        {{ t('onboarding.steps.notifications.content.tip') }}
      </p>
    </div>

    <!-- What you'll receive -->
    <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {{ t('onboarding.steps.notifications.push.what_you_receive') }}
      </p>
      <ul class="space-y-2">
        <li class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Icon name="fa6-solid:reply" class="text-blue-500" aria-hidden="true" />
          {{ t('onboarding.steps.notifications.push.receive_replies') }}
        </li>
        <li class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Icon name="fa6-solid:at" class="text-purple-500" aria-hidden="true" />
          {{ t('onboarding.steps.notifications.push.receive_mentions') }}
        </li>
        <li class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Icon name="fa6-solid:trophy" class="text-yellow-500" aria-hidden="true" />
          {{ t('onboarding.steps.notifications.push.receive_achievements') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from '#i18n'
import { usePushNotifications } from '~/composables/usePushNotifications'

const { t } = useI18n()

const {
  isSupported,
  isSubscribed,
  isBlocked,
  needsPermission,
  loading,
  requestPermission,
  subscribe,
  initialize,
} = usePushNotifications()

async function handleEnablePush() {
  if (needsPermission.value) {
    const granted = await requestPermission()
    if (granted) {
      await subscribe()
    }
  } else {
    await subscribe()
  }
}

onMounted(async () => {
  await initialize()
})
</script>
