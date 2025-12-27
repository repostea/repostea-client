<template>
  <div class="recent-comments-container px-3 py-2 md:p-4 rounded-lg shadow-sm">
    <div class="flex items-center justify-between mb-3">
      <h4
        class="text-base lg:text-lg font-semibold text-text dark:text-text-dark flex items-center"
      >
        <Icon
          name="fa6-solid:clock"
          class="mr-2 text-primary dark:text-primary-light"
          aria-hidden="true"
        />
        <span class="truncate">{{ t('comments.recent_comments') }}</span>
      </h4>
    </div>

    <div v-if="loading" class="flex items-center justify-center p-6 text-gray-500">
      <div
        class="w-5 h-5 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mr-2"
      />
      <span class="text-sm">{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="error" class="text-red-500 p-3 text-sm bg-red-50 dark:bg-red-900/20 rounded-md">
      <Icon name="fa6-solid:circle-exclamation" class="mr-2" aria-hidden="true" />
      <span class="break-words">{{ error }}</span>
    </div>

    <div v-else-if="items && items.length > 0" class="space-y-3">
      <NuxtLink
        v-for="item in items"
        :key="item.itemKey"
        :to="getItemLink(item)"
        class="recent-comment-item block border-l-2 pl-3 py-2 rounded-r transition-colors no-underline"
        :class="
          item.isAgora
            ? 'border-primary/50 dark:border-primary-light/50'
            : 'border-primary/30 dark:border-primary-light/30'
        "
      >
        <!-- User info and time -->
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5 min-w-0 flex-1">
            <span class="text-xs font-medium text-primary dark:text-primary-light truncate">
              {{ item.user.display_name || item.user.username }}
            </span>
          </div>
          <span class="text-[10px] text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
            {{ formatTimeAgo(item.created_at) }}
          </span>
        </div>

        <!-- Content -->
        <p
          class="text-xs text-text dark:text-text-dark line-clamp-2 mb-1.5 flex items-center gap-1"
        >
          <Icon
            v-if="hasImage(item.content)"
            name="fa6-solid:image"
            class="text-primary dark:text-primary-light flex-shrink-0"
            aria-hidden="true"
          />
          <Icon
            v-else-if="hasEmbed(item.content)"
            name="fa6-solid:link"
            class="text-primary dark:text-primary-light flex-shrink-0"
            aria-hidden="true"
          />
          <span>{{ formatCommentPreview(item.content) }}</span>
        </p>

        <!-- Source (post title for comments, "Agora" for agora messages) -->
        <div
          class="text-[10px] text-gray-600 dark:text-gray-400 transition-colors flex items-center truncate"
        >
          <Icon
            :name="item.isAgora ? 'fa6-solid:landmark' : 'fa6-solid:file-lines'"
            class="mr-1 flex-shrink-0"
            aria-hidden="true"
          />
          <span class="truncate">{{ item.isAgora ? t('agora.title') : item.post.title }}</span>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
      <Icon name="fa6-solid:comment-slash" class="text-2xl mb-2" aria-hidden="true" />
      <p>{{ t('comments.no_recent_comments') }}</p>
    </div>

    <!-- Ver más link -->
    <div class="recent-comments-footer mt-3 pt-3">
      <NuxtLink
        :to="localePath('/comments')"
        class="text-xs text-primary dark:text-primary-light hover:underline flex items-center justify-center gap-1"
      >
        <span>{{ t('comments.view_all') }}</span>
        <Icon name="fa6-solid:arrow-right" class="text-[10px]" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  import { useNuxtApp } from '#app'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()

  // Fixed limit - fetch 5 of each, then merge and take top 5 by date
  const fetchLimit = 5

  // Fetch comments with agora messages included
  const {
    data: itemsData,
    error,
    pending,
  } = await useAsyncData(
    'recent-items',
    async () => {
      try {
        const res = await $api.comments.recent({
          limit: fetchLimit,
          filter: 'recent',
          include_agora: true,
        })
        const items = Array.isArray(res?.data?.data) ? res.data.data : []
        return items.map((item) => ({
          ...item,
          isAgora: item.is_agora || false,
          itemKey: item.is_agora ? `agora-${item.id}` : `comment-${item.id}`,
        }))
      } catch (err) {
        console.error('Error loading recent items:', err)
        return []
      }
    },
    {
      getCachedData: (key) => useNuxtApp().payload.data[key],
    }
  )

  const items = itemsData

  // Only show loading spinner if we don't already have SSR data
  const loading = computed(() => pending.value && !itemsData.value?.length)

  const getItemLink = (item) => {
    if (item.isAgora) {
      return localePath(`/agora/${item.id}`)
    }
    const commentId = item.id
    const hexId = item.hex_id || (commentId ? commentId.toString(16) : 'unknown')
    const postSlug = item.post?.slug || ''
    return localePath(`/posts/${postSlug}#c-${hexId}`)
  }

  const imageRegex = /!\[[^\]]*\]\([^)]+\)/g
  const embedRegex = /\[embed:([^\]]+)\]\([^)]+\)/g

  const hasImage = (content) => {
    if (!content) return false
    return imageRegex.test(content)
  }

  const hasEmbed = (content) => {
    if (!content) return false
    embedRegex.lastIndex = 0
    return embedRegex.test(content)
  }

  const getEmbedProvider = (content) => {
    if (!content) return null
    embedRegex.lastIndex = 0
    const match = embedRegex.exec(content)
    return match ? match[1] : null
  }

  const formatCommentPreview = (content) => {
    if (!content) return ''
    // Replace markdown image syntax
    let cleaned = content.replace(imageRegex, '').trim()
    // Replace embed syntax
    cleaned = cleaned.replace(embedRegex, '').trim()
    // If only images/embeds, show placeholder text
    if (!cleaned) {
      if (hasEmbed(content)) {
        const provider = getEmbedProvider(content)
        const providerName =
          provider === 'xtwitter' ? 'X' : provider?.charAt(0).toUpperCase() + provider?.slice(1)
        return t('comments.embed_content', { provider: providerName || 'embed' })
      }
      return t('comments.image_attachment')
    }
    return cleaned
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return t('common.time.just_now')
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return t('common.time.minutes_ago', { count: minutes })
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return t('common.time.hours_ago', { count: hours })
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      if (days === 1) {
        return t('common.time.yesterday')
      }
      return t('common.time.days_ago', { count: days })
    }
  }
</script>

<style scoped>
  .recent-comments-container {
    background-color: var(--color-card-bg);
    border: 1px solid var(--color-border-default);
  }

  .dark .recent-comments-container {
    background-color: var(--color-card-bg-dark);
  }

  .recent-comment-item:hover {
    background-color: var(--color-bg-hover);
  }

  .recent-comments-footer {
    border-top: 1px solid var(--color-border-default);
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
