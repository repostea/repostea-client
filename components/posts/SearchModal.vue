<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      @click.self="close"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"/>

      <!-- Modal -->
      <div
        class="search-modal relative w-full max-w-3xl rounded-lg shadow-xl max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'search-modal-title'"
        @click.stop
      >
        <!-- Header -->
        <div class="search-header p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 id="search-modal-title" class="text-xl font-semibold text-text dark:text-text-dark flex items-center gap-2">
              <Icon name="fa6-solid:magnifying-glass" class="text-primary" aria-hidden="true" />
              {{ t('common.search') }}
            </h2>
            <button
              class="search-close-btn p-1 rounded"
              :aria-label="t('common.close')"
              @click="close"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>
          <div class="flex gap-2">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              :aria-label="t('search.placeholder')"
              class="search-input flex-1 px-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              @keyup.enter="performSearch"
            >
            <button
              :disabled="searchQuery.length < 2 || loading"
              class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              @click="performSearch"
            >
              <Icon v-if="!loading" name="fa6-solid:magnifying-glass" aria-hidden="true" />
              <Icon v-if="loading" name="fa6-solid:spinner" class="animate-spin" aria-hidden="true" />
              <span>{{ loading ? t('search.searching') : t('search.search_button') }}</span>
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="search-filters p-4">
          <div class="flex flex-wrap gap-3">
            <!-- Content Type Filter -->
            <select
              v-model="filters.contentType"
              :aria-label="t('search.content_type')"
              class="search-select px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{{ t('search.all_types') }}</option>
              <option value="text">{{ t('search.type_text') }}</option>
              <option value="link">{{ t('search.type_link') }}</option>
              <option value="video">{{ t('search.type_video') }}</option>
              <option value="audio">{{ t('search.type_audio') }}</option>
              <option value="poll">{{ t('search.type_poll') }}</option>
            </select>

            <!-- Featured Filter -->
            <select
              v-model="filters.isFeatured"
              :aria-label="t('search.featured_filter')"
              class="search-select px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{{ t('search.all_posts') }}</option>
              <option value="true">{{ t('search.featured_only') }}</option>
              <option value="false">{{ t('search.pending_only') }}</option>
            </select>

            <!-- Sort By -->
            <select
              v-model="filters.sortBy"
              :aria-label="t('search.sort_by')"
              class="search-select px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="created_at">{{ t('search.sort_recent') }}</option>
              <option value="votes_count">{{ t('search.sort_votes') }}</option>
              <option value="comment_count">{{ t('search.sort_comments') }}</option>
              <option value="lastActive">{{ t('search.sort_active') }}</option>
            </select>

            <!-- Search in Comments -->
            <label class="search-checkbox-label flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer rounded-md transition-colors">
              <input
                v-model="filters.searchInComments"
                type="checkbox"
                class="w-4 h-4 rounded text-primary focus:ring-2 focus:ring-primary cursor-pointer"
              >
              <span class="select-none">{{ t('search.include_comments') }}</span>
            </label>
          </div>
        </div>

        <!-- Results -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Loading -->
          <div v-if="loading" class="flex justify-center py-8">
            <span
              class="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!hasSearched"
            class="text-center py-12 text-text-muted dark:text-text-dark-muted"
          >
            <Icon name="fa6-solid:magnifying-glass" class="text-4xl mb-4 opacity-50" aria-hidden="true" />
            <p class="text-lg">{{ t('search.enter_query') }}</p>
            <p class="text-sm mt-2">{{ t('search.help_text') }}</p>
          </div>

          <!-- No Results -->
          <div
            v-else-if="results.length === 0"
            class="text-center py-12 text-text-muted dark:text-text-dark-muted"
          >
            <Icon name="fa6-solid:inbox" class="text-4xl mb-4 opacity-50" aria-hidden="true" />
            <p class="text-lg">{{ t('search.no_results') }}</p>
            <p class="text-sm mt-2">{{ t('search.try_different') }}</p>
          </div>

          <!-- Results List -->
          <div v-else class="space-y-3">
            <div
              v-for="post in results"
              :key="post.id"
              class="search-result-card rounded-lg p-4 transition-colors cursor-pointer"
              @click="goToPost(post)"
            >
              <div class="flex gap-3">
                <!-- Thumbnail -->
                <NuxtImg
                  v-if="post.thumbnail_url"
                  :src="post.thumbnail_url"
                  :alt="post.title"
                  width="96"
                  height="96"
                  class="w-24 h-24 rounded object-cover flex-shrink-0"
                  loading="lazy"
                  format="webp"
                  preset="thumbnail"
                />

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <!-- Title with highlight -->
                  <h3
                    class="font-semibold text-lg text-text dark:text-text-dark mb-2"
                    v-html="highlightMatch(post.title)"
                  />

                  <!-- Content preview with highlight -->
                  <p
                    v-if="post.content"
                    class="text-sm text-text-muted dark:text-text-dark-muted line-clamp-2 mb-2"
                    v-html="highlightMatch(getContentPreview(post.content))"
                  />

                  <!-- Matched comment excerpt -->
                  <div
                    v-if="post.matched_comment"
                    class="text-sm text-text-muted dark:text-text-dark-muted bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400 dark:border-yellow-600 pl-3 py-2 mb-2 rounded-r"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <Icon name="fa6-solid:comment" class="text-xs text-yellow-600 dark:text-yellow-500" aria-hidden="true" />
                      <span class="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                        {{ t('search.found_in_comment') }}
                      </span>
                      <span v-if="post.matched_comment.user" class="text-xs">
                        · @{{ post.matched_comment.user.username }}
                      </span>
                    </div>
                    <p
                      class="text-sm line-clamp-2"
                      v-html="highlightMatch(getContentPreview(post.matched_comment.content))"
                    />
                  </div>

                  <!-- Meta info -->
                  <div class="flex items-center gap-3 text-xs text-text-muted dark:text-text-dark-muted mb-2">
                    <span v-if="post.user" class="flex items-center gap-1">
                      <Icon name="fa6-solid:user" aria-hidden="true" />
                      {{ post.user.username }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Icon name="fa6-solid:clock" aria-hidden="true" />
                      {{ formatDate(post.created_at) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Icon name="fa6-solid:arrow-up" aria-hidden="true" />
                      {{ post.votes_count }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Icon name="fa6-solid:comment" aria-hidden="true" />
                      {{ post.comment_count }}
                    </span>
                    <span v-if="post.frontpage_at" class="text-primary flex items-center gap-1">
                      <Icon name="fa6-solid:star" aria-hidden="true" />
                      {{ t('search.featured') }}
                    </span>
                    <span class="search-type-badge px-2 py-0.5 rounded">
                      {{ formatContentType(post.content_type) }}
                    </span>
                  </div>

                  <!-- Tags with highlight -->
                  <div v-if="post.tags && post.tags.length > 0" class="flex gap-2 flex-wrap">
                    <span
                      v-for="tag in post.tags.slice(0, 5)"
                      :key="tag.id"
                      class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium"
                      v-html="highlightMatch(getTagName(tag))"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Load More -->
            <div v-if="hasMoreResults" class="text-center pt-4">
              <button
                :disabled="loading"
                class="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                @click="loadMore"
              >
                {{ loading ? t('search.loading') : t('search.load_more') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { useRouter } from 'vue-router'

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const router = useRouter()
  const localePath = useLocalePath()
  const config = useRuntimeConfig()

  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['close'])

  const searchInputRef = ref(null)
  const searchQuery = ref('')
  const filters = ref({
    contentType: '',
    isFeatured: '',
    sortBy: 'created_at',
    searchInComments: false,
  })

  const results = ref([])
  const loading = ref(false)
  const hasSearched = ref(false)
  const currentPage = ref(1)
  const hasMoreResults = ref(false)

  // Focus input when modal opens
  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        nextTick(() => {
          searchInputRef.value?.focus()
        })
      } else {
        // Reset on close
        searchQuery.value = ''
        results.value = []
        hasSearched.value = false
        currentPage.value = 1
      }
    }
  )

  // Auto-search on filter change
  watch(
    filters,
    () => {
      if (hasSearched.value && searchQuery.value.length >= 2) {
        currentPage.value = 1
        performSearch()
      }
    },
    { deep: true }
  )

  const performSearch = async () => {
    if (searchQuery.value.length < 2) return

    loading.value = true
    hasSearched.value = true
    currentPage.value = 1

    try {
      const params = new URLSearchParams({
        q: searchQuery.value,
        page: currentPage.value,
      })

      if (filters.value.contentType) {
        params.append('content_type', filters.value.contentType)
      }
      if (filters.value.isFeatured !== '') {
        params.append('is_featured', filters.value.isFeatured)
      }
      if (filters.value.sortBy) {
        params.append('sort_by', filters.value.sortBy)
      }
      if (filters.value.searchInComments) {
        params.append('search_in_comments', 'true')
      }

      const data = await $fetch(`${config.public.apiBaseUrl}/v1/posts/search?${params}`)

      results.value = data.data || []
      hasMoreResults.value = data.meta?.current_page < data.meta?.last_page
    } catch (error) {
      console.error('Search error:', error)
      console.error('API URL:', `${config.public.apiBaseUrl}/v1/posts/search`)
    } finally {
      loading.value = false
    }
  }

  const loadMore = async () => {
    if (!hasMoreResults.value || loading.value) return

    loading.value = true
    currentPage.value++

    try {
      const params = new URLSearchParams({
        q: searchQuery.value,
        page: currentPage.value,
      })

      if (filters.value.contentType) {
        params.append('content_type', filters.value.contentType)
      }
      if (filters.value.isFeatured !== '') {
        params.append('is_featured', filters.value.isFeatured)
      }
      if (filters.value.sortBy) {
        params.append('sort_by', filters.value.sortBy)
      }
      if (filters.value.searchInComments) {
        params.append('search_in_comments', 'true')
      }

      const data = await $fetch(`${config.public.apiBaseUrl}/v1/posts/search?${params}`)

      results.value.push(...(data.data || []))
      hasMoreResults.value = data.meta?.current_page < data.meta?.last_page
    } catch (error) {
      console.error('Load more error:', error)
    } finally {
      loading.value = false
    }
  }

  const goToPost = (post) => {
    router.push(localePath(`/posts/${post.slug}`))
    close()
  }

  const formatContentType = (type) => {
    const types = {
      text: t('search.type_text'),
      link: t('search.type_link'),
      video: t('search.type_video'),
      audio: t('search.type_audio'),
      poll: t('search.type_poll'),
    }
    return types[type] || type
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m`
    } else if (diffHours < 24) {
      return `${diffHours}h`
    } else if (diffDays < 7) {
      return `${diffDays}d`
    } else {
      return d.toLocaleDateString(locale.value, { timeZone: timezone })
    }
  }

  const getContentPreview = (content) => {
    if (!content) return ''

    // Strip HTML tags
    const stripped = content.replace(/<[^>]*>/g, '').trim()

    if (stripped.length <= 200) {
      return stripped
    }

    // If there's a search query, find the first match and show context around it
    if (searchQuery.value) {
      const searchWords = searchQuery.value.toLowerCase().split(/\s+/).filter((w) => w.length > 0)
      const lowerContent = stripped.toLowerCase()

      // Find the first matching word position
      let matchPosition = -1
      for (const word of searchWords) {
        const pos = lowerContent.indexOf(word.toLowerCase())
        if (pos !== -1) {
          matchPosition = pos
          break
        }
      }

      if (matchPosition !== -1) {
        // Show context around the match (80 chars before, 120 after)
        const contextStart = Math.max(0, matchPosition - 80)
        const contextEnd = Math.min(stripped.length, matchPosition + 120)

        let preview = stripped.substring(contextStart, contextEnd)

        // Add ellipsis if needed
        if (contextStart > 0) preview = '...' + preview
        if (contextEnd < stripped.length) preview = preview + '...'

        return preview
      }
    }

    // Default: show first 200 chars
    return stripped.substring(0, 200) + '...'
  }

  const getTagName = (tag) => {
    // Tags might have a name or name_key property
    return tag.name || tag.name_key || tag.slug || ''
  }

  const highlightMatch = (text) => {
    if (!text || !searchQuery.value) return text

    // Split search query into individual words for flexible matching
    const searchWords = searchQuery.value
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0)

    let highlightedText = text

    // Highlight each word independently
    searchWords.forEach((word) => {
      // Escape special regex characters
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedWord})`, 'gi')
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-600 px-0.5 rounded">$1</mark>'
      )
    })

    return highlightedText
  }

  const close = () => {
    emit('close')
  }

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.isOpen) {
      close()
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      document.addEventListener('keydown', handleEscape)
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.client) {
      document.removeEventListener('keydown', handleEscape)
    }
  })
</script>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Search modal styles */
  .search-modal {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .search-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .search-close-btn {
    color: var(--color-text-muted);
    transition: all 0.2s ease;
  }

  .search-close-btn:hover {
    color: var(--color-text-primary);
    background-color: var(--color-bg-hover);
  }

  .search-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .search-filters {
    border-bottom: 1px solid var(--color-border-default);
    background-color: var(--color-bg-hover);
  }

  .search-select {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .search-checkbox-label {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .search-checkbox-label:hover {
    background-color: var(--color-bg-hover);
  }

  .search-result-card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .search-result-card:hover {
    background-color: var(--color-bg-hover);
  }

  .search-type-badge {
    background-color: var(--color-bg-hover);
    color: var(--color-text-secondary);
  }
</style>
