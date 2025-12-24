<template>
  <ProfileLayout active-tab="moderation">
    <div class="space-y-6">
      <!-- Title -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('profile.moderation.title') }}
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ t('profile.moderation.description') }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"/>
      </div>

      <!-- Content -->
      <div v-else class="space-y-6">
        <!-- Active Bans -->
        <div
          v-if="moderationData.bans.active.length > 0"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
        >
          <h2 class="text-lg font-semibold text-red-900 dark:text-red-200 mb-4 flex items-center">
            <Icon name="fa6-solid:ban" class="mr-2" aria-hidden="true" />
            {{ t('profile.moderation.active_bans') }}
          </h2>
          <div class="space-y-4">
            <div
              v-for="ban in moderationData.bans.active"
              :key="ban.id"
              class="mod-card-bg rounded-lg p-4 border border-red-300 dark:border-red-700"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded"
                      :class="{
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': ban.type === 'permanent',
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                          ban.type === 'temporary',
                        'mod-badge-shadowban':
                          ban.type === 'shadowban',
                      }"
                    >
                      {{ t(`profile.moderation.ban_type.${ban.type}`) }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(ban.created_at) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span class="font-medium">{{ t('profile.moderation.reason') }}:</span>
                    {{ ban.reason }}
                  </p>
                  <p v-if="ban.expires_at" class="text-xs text-gray-600 dark:text-gray-400">
                    {{ t('profile.moderation.expires') }}: {{ formatDate(ban.expires_at) }}
                  </p>
                  <p v-if="ban.banned_by" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ t('profile.moderation.by') }}: {{ ban.banned_by.username }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Strikes -->
        <div
          v-if="moderationData.strikes.active.length > 0"
          class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6"
        >
          <h2 class="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-4 flex items-center">
            <Icon name="fa6-solid:triangle-exclamation" class="mr-2" aria-hidden="true" />
            {{ t('profile.moderation.active_strikes') }}
          </h2>
          <div class="space-y-4">
            <div
              v-for="strike in moderationData.strikes.active"
              :key="strike.id"
              class="mod-card-bg rounded-lg p-4 border border-yellow-300 dark:border-yellow-700"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded"
                      :class="{
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': strike.type === 'critical',
                        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200':
                          strike.type === 'major',
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                          strike.type === 'minor',
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200':
                          strike.type === 'warning',
                      }"
                    >
                      {{ t(`profile.moderation.strike_type.${strike.type}`) }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(strike.created_at) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span class="font-medium">{{ t('profile.moderation.reason') }}:</span>
                    {{ strike.reason }}
                  </p>
                  <p v-if="strike.expires_at" class="text-xs text-gray-600 dark:text-gray-400">
                    {{ t('profile.moderation.expires') }}: {{ formatDate(strike.expires_at) }}
                  </p>
                  <p v-if="strike.issued_by" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ t('profile.moderation.by') }}: {{ strike.issued_by.username }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Moderated Posts -->
        <div v-if="moderationData.moderated_posts.length > 0" class="card-bg rounded-lg border mod-border p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Icon name="fa6-solid:newspaper" class="mr-2" aria-hidden="true" />
            {{ t('profile.moderation.moderated_posts') }}
          </h2>
          <div class="space-y-3">
            <div
              v-for="post in moderationData.moderated_posts"
              :key="post.id"
              class="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-4 rounded"
            >
              <h3 class="font-medium text-gray-900 dark:text-white mb-1">{{ post.title }}</h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <span class="font-medium">{{ t('profile.moderation.reason') }}:</span>
                {{ post.moderation_reason }}
              </p>
              <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{{ t('profile.moderation.moderated_on') }}: {{ formatDate(post.moderated_at) }}</span>
                <span v-if="post.moderated_by">{{ t('profile.moderation.by') }}: {{ post.moderated_by.username }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Moderated Comments -->
        <div v-if="moderationData.moderated_comments.length > 0" class="card-bg rounded-lg border mod-border p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Icon name="fa6-solid:comments" class="mr-2" aria-hidden="true" />
            {{ t('profile.moderation.moderated_comments') }}
          </h2>
          <div class="space-y-3">
            <div
              v-for="comment in moderationData.moderated_comments"
              :key="comment.id"
              class="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-4 rounded"
            >
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-2 italic">"{{ comment.content }}"</p>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <span class="font-medium">{{ t('profile.moderation.reason') }}:</span>
                {{ comment.moderation_reason }}
              </p>
              <div class="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                <div v-if="comment.post" class="flex items-center gap-2">
                  <span>{{ t('profile.moderation.on_post') }}:</span>
                  <NuxtLink
                    :to="localePath(`/posts/${comment.post.slug}`)"
                    class="text-primary hover:underline"
                  >
                    {{ comment.post.title }}
                  </NuxtLink>
                </div>
                <div class="flex items-center gap-4">
                  <span>{{ t('profile.moderation.moderated_on') }}: {{ formatDate(comment.moderated_at) }}</span>
                  <span v-if="comment.moderated_by">{{ t('profile.moderation.by') }}: {{ comment.moderated_by.username }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- History Section -->
        <div class="card-bg rounded-lg border mod-border p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Icon name="fa6-solid:history" class="mr-2" aria-hidden="true" />
            {{ t('profile.moderation.history') }}
          </h2>

          <!-- Ban History -->
          <div v-if="moderationData.bans.history.length > 0" class="mb-6">
            <h3 class="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
              {{ t('profile.moderation.past_bans') }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="ban in moderationData.bans.history"
                :key="ban.id"
                class="mod-history-bg rounded p-3 text-sm"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 text-xs font-medium rounded mod-badge-history">
                    {{ t(`profile.moderation.ban_type.${ban.type}`) }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(ban.created_at) }}
                  </span>
                </div>
                <p class="text-gray-700 dark:text-gray-300">{{ ban.reason }}</p>
              </div>
            </div>
          </div>

          <!-- Strike History -->
          <div v-if="moderationData.strikes.history.length > 0">
            <h3 class="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
              {{ t('profile.moderation.past_strikes') }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="strike in moderationData.strikes.history"
                :key="strike.id"
                class="mod-history-bg rounded p-3 text-sm"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 text-xs font-medium rounded mod-badge-history">
                    {{ t(`profile.moderation.strike_type.${strike.type}`) }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(strike.created_at) }}
                  </span>
                </div>
                <p class="text-gray-700 dark:text-gray-300">{{ strike.reason }}</p>
              </div>
            </div>
          </div>

          <!-- No History -->
          <p
            v-if="moderationData.bans.history.length === 0 && moderationData.strikes.history.length === 0"
            class="text-sm text-gray-500 dark:text-gray-400 italic"
          >
            {{ t('profile.moderation.no_history') }}
          </p>
        </div>

        <!-- Clean Record Message -->
        <div
          v-if="
            moderationData.bans.active.length === 0 &&
            moderationData.strikes.active.length === 0 &&
            moderationData.moderated_posts.length === 0 &&
            moderationData.moderated_comments.length === 0 &&
            moderationData.bans.history.length === 0 &&
            moderationData.strikes.history.length === 0
          "
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center flex flex-col items-center"
        >
          <Icon name="fa6-solid:circle-check" class="text-green-600 dark:text-green-400 text-3xl mb-3" aria-hidden="true" />
          <p class="text-green-900 dark:text-green-200 font-medium">
            {{ t('profile.moderation.clean_record') }}
          </p>
          <p class="text-sm text-green-700 dark:text-green-300 mt-2">
            {{ t('profile.moderation.clean_record_description') }}
          </p>
        </div>
      </div>
    </div>
  </ProfileLayout>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useI18n, useLocalePath  } from '#i18n'
  
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'

  definePageMeta({
    middleware: ['auth'],
  })

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()

  const loading = ref(true)
  const moderationData = ref({
    bans: {
      active: [],
      history: [],
    },
    strikes: {
      active: [],
      history: [],
    },
    moderated_posts: [],
    moderated_comments: [],
  })

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const fetchModerationHistory = async () => {
    loading.value = true
    try {
      const response = await $api.users.getModerationHistory()
      moderationData.value = response.data
    } catch (error) {
      console.error('Error fetching moderation history:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchModerationHistory()
  })
</script>

<style scoped>
  .mod-card-bg {
    background-color: var(--color-bg-card);
  }

  .mod-border {
    border-color: var(--color-border-default);
  }

  .mod-history-bg {
    background-color: var(--color-bg-subtle);
  }

  .mod-badge-shadowban {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }

  .mod-badge-history {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-secondary);
  }
</style>
