<template>
  <div class="space-y-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="inline-block animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"/>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800"
    >
      {{ error }}
    </div>

    <!-- Sessions list -->
    <div v-else>
      <!-- Revoke all button -->
      <div v-if="otherSessions.length > 0" class="mb-4 flex justify-end">
        <button
          type="button"
          class="text-sm px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          :disabled="revokingAll"
          @click="confirmRevokeAll"
        >
          <span v-if="revokingAll" class="inline-block animate-spin h-3 w-3 mr-1 border-2 border-red-600 border-t-transparent rounded-full"/>
          {{ t('sessions.revoke_all') }}
        </button>
      </div>

      <!-- Sessions -->
      <div class="space-y-3">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="flex items-center justify-between p-4 rounded-lg border"
          :class="session.is_current
            ? 'bg-primary/5 border-primary/30 dark:bg-primary/10 dark:border-primary/40'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'"
        >
          <div class="flex items-center gap-4">
            <!-- Device icon -->
            <div class="flex-shrink-0">
              <Icon
                :name="getDeviceIcon(session.device)"
                class="text-2xl"
                :class="session.is_current ? 'text-primary' : 'text-gray-500 dark:text-gray-400'"
                aria-hidden="true"
              />
            </div>

            <!-- Device info -->
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ session.device?.browser || 'Unknown' }} {{ t('sessions.on') }} {{ session.device?.platform || 'Unknown' }}
                </span>
                <span
                  v-if="session.is_current"
                  class="text-xs px-2 py-0.5 bg-primary text-white rounded-full"
                >
                  {{ t('sessions.current') }}
                </span>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span v-if="session.ip_address">{{ session.ip_address }} &middot; </span>
                <span>{{ formatDate(session.last_used_at || session.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Revoke button -->
          <button
            v-if="!session.is_current"
            type="button"
            class="text-sm px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            :disabled="revokingId === session.id"
            @click="revokeSession(session.id)"
          >
            <span v-if="revokingId === session.id" class="inline-block animate-spin h-3 w-3 mr-1 border-2 border-red-600 border-t-transparent rounded-full"/>
            {{ t('sessions.revoke') }}
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="sessions.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        {{ t('sessions.no_sessions') }}
      </div>
    </div>

    <!-- Confirm revoke all modal -->
    <div
      v-if="showRevokeAllConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showRevokeAllConfirm = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ t('sessions.confirm_revoke_all_title') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ t('sessions.confirm_revoke_all_description', { count: otherSessions.length }) }}
        </p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            @click="showRevokeAllConfirm = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            :disabled="revokingAll"
            @click="revokeAllSessions"
          >
            <span v-if="revokingAll" class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"/>
            {{ t('sessions.revoke_all') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '#i18n'

const { t } = useI18n()
const { $api } = useNuxtApp()

const sessions = ref([])
const loading = ref(true)
const error = ref('')
const revokingId = ref(null)
const revokingAll = ref(false)
const showRevokeAllConfirm = ref(false)

const otherSessions = computed(() => sessions.value.filter(s => !s.is_current))

async function fetchSessions() {
  loading.value = true
  error.value = ''

  try {
    const response = await $api.users.getSessions()
    sessions.value = response.data.sessions || []
  } catch (e) {
    error.value = e.response?.data?.message || t('sessions.fetch_error')
  } finally {
    loading.value = false
  }
}

async function revokeSession(tokenId) {
  revokingId.value = tokenId

  try {
    await $api.users.revokeSession(tokenId)
    sessions.value = sessions.value.filter(s => s.id !== tokenId)
  } catch (e) {
    error.value = e.response?.data?.message || t('sessions.revoke_error')
  } finally {
    revokingId.value = null
  }
}

function confirmRevokeAll() {
  showRevokeAllConfirm.value = true
}

async function revokeAllSessions() {
  revokingAll.value = true

  try {
    await $api.users.revokeAllSessions()
    sessions.value = sessions.value.filter(s => s.is_current)
    showRevokeAllConfirm.value = false
  } catch (e) {
    error.value = e.response?.data?.message || t('sessions.revoke_error')
  } finally {
    revokingAll.value = false
  }
}

function getDeviceIcon(device) {
  if (!device) return 'fa6-solid:desktop'

  const deviceType = device.device?.toLowerCase() || ''
  const platform = device.platform?.toLowerCase() || ''

  if (deviceType === 'iphone' || deviceType === 'mobile' || platform === 'android' || platform === 'ios') {
    return 'fa6-solid:mobile-screen'
  }
  if (deviceType === 'ipad' || deviceType === 'tablet') {
    return 'fa6-solid:tablet-screen-button'
  }
  return 'fa6-solid:desktop'
}

function formatDate(dateString) {
  if (!dateString) return t('sessions.never')

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t('sessions.just_now')
  if (diffMins < 60) return t('sessions.minutes_ago', { count: diffMins })
  if (diffHours < 24) return t('sessions.hours_ago', { count: diffHours })
  if (diffDays < 7) return t('sessions.days_ago', { count: diffDays })

  return date.toLocaleDateString()
}

onMounted(() => {
  fetchSessions()
})
</script>
