<template>
  <div class="top-comments-container px-3 py-2 md:p-4 rounded-lg shadow-sm">
    <div class="flex items-center justify-between mb-3">
      <h4
        class="text-base lg:text-lg font-semibold text-text dark:text-text-dark flex items-center"
      >
        <Icon
          :name="currentTabIcon"
          class="mr-2 text-primary dark:text-primary-light"
          aria-hidden="true"
        />
        <span class="truncate">{{ currentTabTitle }}</span>
      </h4>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-3 overflow-x-auto scrollbar-hide">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="[
          'top-comment-tab px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center justify-center relative group',
          activeTab === tab.value
            ? 'top-comment-tab-active bg-primary text-white'
            : 'text-gray-700 dark:text-gray-300',
        ]"
        :title="t(tab.label)"
        :aria-label="t(tab.label)"
        @click="activeTab = tab.value"
      >
        <Icon :name="tab.icon" class="text-sm" aria-hidden="true" />
        <span
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 top-comment-tooltip text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
          aria-hidden="true"
        >
          {{ t(tab.label) }}
        </span>
      </button>
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
        class="top-comment-item block border-l-2 pl-3 py-2 rounded-r transition-colors no-underline"
        :class="
          item.isAgora
            ? 'border-primary/50 dark:border-primary-light/50'
            : 'border-primary/30 dark:border-primary-light/30'
        "
      >
        <!-- User info and votes -->
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5 min-w-0 flex-1">
            <span class="text-xs font-medium text-primary dark:text-primary-light truncate">
              {{ item.user.display_name || item.user.username }}
            </span>
          </div>
          <div class="flex items-center gap-1 ml-2 flex-shrink-0">
            <Icon
              :name="currentTabIcon"
              class="text-[10px] text-primary dark:text-primary-light"
              aria-hidden="true"
            />
            <span class="text-[10px] font-semibold text-primary dark:text-primary-light">
              {{ getVoteCount(item) }}
            </span>
          </div>
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
      <p>{{ t('comments.no_top_comments') }}</p>
    </div>

    <!-- View more link -->
    <div class="top-comments-footer mt-3 pt-3">
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
  import { ref, computed } from 'vue'
  import { useNuxtApp } from '#app'
  import { useI18n, useLocalePath } from '#i18n'

  const { $api } = useNuxtApp()
  const { t } = useI18n()
  const localePath = useLocalePath()

  const activeTab = ref('top')

  // Fixed limit - fetch 5 of each type, then merge and take top 5
  const fetchLimit = 5

  const tabs = [
    {
      value: 'top',
      label: 'comments.tab_top',
      icon: 'fa6-solid:fire',
      title: 'comments.top_comments_title',
    },
    {
      value: 'funny',
      label: 'comments.vote_types.funny',
      icon: 'fa6-solid:face-laugh',
      title: 'comments.top_funny_title',
    },
    {
      value: 'interesting',
      label: 'comments.vote_types.interesting',
      icon: 'fa6-solid:lightbulb',
      title: 'comments.top_interesting_title',
    },
    {
      value: 'didactic',
      label: 'comments.vote_types.didactic',
      icon: 'fa6-solid:graduation-cap',
      title: 'comments.top_didactic_title',
    },
    {
      value: 'elaborate',
      label: 'comments.vote_types.elaborate',
      icon: 'fa6-solid:list-check',
      title: 'comments.top_elaborate_title',
    },
  ]

  const currentTabIcon = computed(() => {
    const tab = tabs.find((t) => t.value === activeTab.value)
    return tab?.icon || 'fa6-solid:fire'
  })

  const currentTabTitle = computed(() => {
    const tab = tabs.find((t) => t.value === activeTab.value)
    return t(tab?.title || 'comments.top_comments_title')
  })

  // Fetch comments and agora messages in a single API call
  const {
    data: itemsData,
    error,
    pending,
  } = await useAsyncData(
    () => `top-items-${activeTab.value}`,
    async () => {
      try {
        const res = await $api.comments.tops({
          limit: fetchLimit,
          filter: activeTab.value,
          days: 3,
          include_agora: true,
        })

        const itemsArray = Array.isArray(res?.data?.data) ? res.data.data : []
        return itemsArray.map((item) => ({
          ...item,
          isAgora: item.is_agora || false,
          itemKey: item.is_agora ? `agora-${item.id}` : `comment-${item.id}`,
        }))
      } catch (err) {
        console.error('Error loading top items:', err)
        return []
      }
    },
    {
      watch: [activeTab],
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

  const getVoteCount = (item) => {
    if (activeTab.value === 'top') {
      const net = (item.positive_votes || 0) - (item.negative_votes || 0)
      return net > 0 ? `+${net}` : net
    }
    return item.type_votes || 0
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
</script>

<style scoped>
  .top-comments-container {
    background-color: var(--color-card-bg);
    border: 1px solid var(--color-border-default);
  }

  .dark .top-comments-container {
    background-color: var(--color-card-bg-dark);
  }

  .top-comment-tab {
    background-color: var(--color-bg-hover);
  }

  .top-comment-tab:hover:not(.top-comment-tab-active) {
    background-color: var(--color-bg-active);
  }

  .top-comment-item:hover {
    background-color: var(--color-bg-hover);
  }

  .top-comments-footer {
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

  .top-comment-tooltip {
    background-color: var(--color-bg-inverse, #1f2937);
  }
</style>
