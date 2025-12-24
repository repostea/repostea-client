<template>
  <div class="author-card rounded-lg shadow-sm mb-4">
    <div class="author-card-header px-4 py-3">
      <h3 class="font-medium inline-flex items-center"><Icon name="fa6-solid:user" class="mr-2 flex-shrink-0" aria-hidden="true" /><span>{{ t('links.show.author') }}</span></h3>
    </div>
    <div class="p-4">
      <div class="flex items-center mb-3">
        <div class="mr-3">
          <!-- Show anonymous icon for anonymous posts -->
          <div
            v-if="isAnonymous || user?.is_guest"
            class="w-16 h-16 rounded-full author-anon-avatar flex items-center justify-center text-white text-2xl shadow-sm"
          >
            <Icon name="fa6-solid:user-secret" aria-hidden="true" />
          </div>
          <!-- Show user avatar for non-anonymous posts -->
          <div v-else-if="user?.avatar" class="w-16 h-16">
            <NuxtImg
              :src="user.avatar.storageUrl || user.avatar"
              width="64"
              height="64"
              class="rounded-full w-full h-full object-cover author-avatar-border shadow-sm"
              :alt="user.username"
              loading="lazy"
              format="webp"
              preset="avatar"
            />
          </div>
          <div
            v-else
            class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl shadow-sm"
          >
            <Icon name="fa6-solid:circle-user" aria-hidden="true" />
          </div>
        </div>
        <div>
          <h5 class="font-medium mb-1">
            <template v-if="isAnonymous || user?.is_guest">
              <span class="flex items-center text-gray-600 dark:text-gray-400">
                <Icon name="fa6-solid:user-secret" class="mr-1" aria-hidden="true" />
                {{ t('common.anonymous') }}
              </span>
            </template>
            <template v-else-if="!user">
              <span class="font-medium text-gray-500 dark:text-gray-500 italic">
                [deleted]
              </span>
            </template>
            <template v-else>
              <NuxtLink
                :to="localePath(`/u/${user?.username}`)"
                class="text-primary hover:underline flex items-center"
              >
                {{ user?.username }}
                <span v-if="user?.isAdmin || user?.is_admin" class="ml-1 text-red-500 text-xs">
                  <Icon name="fa6-solid:shield-halved" aria-hidden="true" />
                </span>
                <span
                  v-else-if="user?.isGlobalModerator || user?.is_moderator"
                  class="ml-1 text-green-500 text-xs"
                >
                  <Icon name="fa6-solid:gavel" aria-hidden="true" />
                </span>
                <span v-if="user?.isBot || user?.is_bot" class="ml-1 text-blue-500 text-xs">
                  <Icon name="fa6-solid:robot" aria-hidden="true" />
                </span>
              </NuxtLink>
            </template>
          </h5>
          <div v-if="!isAnonymous && !user?.is_guest && user" class="text-sm text-gray-500 dark:text-gray-400">
            <div>
              {{ t('user.karma') }}:
              <span class="font-bold">{{ formatNumber(user?.karma || user?.karma_points) }}</span>
            </div>
            <div>
              {{ t('user.joined') }}:
              {{ formatDate(user?.created_at) }}
            </div>
          </div>
          <div v-if="isAnonymous || user?.is_guest" class="text-sm text-gray-500 dark:text-gray-400 italic">
            {{ t('user.anonymous_info') }}
          </div>
        </div>
      </div>

      <p
        v-if="user && (user?.bio || user?.body)"
        class="author-bio text-sm mt-3 p-3 rounded-md"
      >
        {{ user.bio || user.body }}
      </p>
      <p v-else-if="!isAnonymous && !user?.is_guest && user" class="text-sm text-gray-500 dark:text-gray-400 italic">
        {{ t('user.no_bio') }}
      </p>

      <div v-if="user?.tags && user.tags.length > 0" class="mt-3 flex flex-wrap">
        <NuxtLink
          v-for="tag in user.tags"
          :key="tag"
          :to="localePath(`/tags/${encodeURIComponent(tag.replace(',', ''))}`)"
          class="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-1 rounded-full mr-1 mb-1 hover:bg-primary hover:text-white transition-colors"
        >
          #{{ tag.replace(',', '') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useLocalePath, useI18n  } from '#i18n'
  
  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()

  const localePath = useLocalePath()

  const { user, isAnonymous } = defineProps({
    user: {
      type: Object,
      required: false,
      default: null,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  })

  function formatNumber(num) {
    if (!num) return '0.0'
    return Number(num).toFixed(1)
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(locale.value, {
      year: 'numeric',
      month: 'long',
      timeZone: timezone
    })
  }
</script>

<style scoped>
  .author-card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .author-card-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .author-bio {
    background-color: var(--color-bg-hover);
  }

  .author-anon-avatar {
    background-color: var(--color-text-muted);
  }

  .author-avatar-border {
    border: 1px solid var(--color-border-default);
  }
</style>
