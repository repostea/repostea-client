<template>
  <div class="card">
    <div v-if="showHeader" class="card-header flex justify-between items-center">
      <h2 class="card-title inline-flex items-center">
        <Icon name="fa6-solid:newspaper" class="mr-2 flex-shrink-0" aria-hidden="true" /><span>{{
          headerTitle
        }}</span>
      </h2>
      <NuxtLink
        v-if="showAddButton"
        :to="localePath('/submit')"
        class="btn-primary text-sm inline-flex items-center justify-center px-4 py-2 rounded-md hover:text-white transition-colors"
        ><Icon name="fa6-solid:plus" class="mr-1 flex-shrink-0" aria-hidden="true" />
        <span>{{ t('posts.submit_new') }}</span>
      </NuxtLink>
    </div>

    <div class="card-body p-0">
      <div v-if="loading" class="p-6 text-center">
        <div class="spinner" />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ t('profile.loading_posts') }}
        </p>
      </div>

      <div v-else-if="!posts.data || posts.data.length === 0" class="p-6 text-center">
        <div class="mb-3 text-gray-400 dark:text-gray-500">
          <Icon name="fa6-solid:newspaper" class="text-4xl" aria-hidden="true" />
        </div>
        <p class="mb-2 text-gray-700 dark:text-gray-300">{{ emptyMessage }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ emptySubMessage }}</p>
        <div v-if="showAddButton" class="mt-4">
          <NuxtLink
            :to="localePath('/submit')"
            class="btn-primary inline-flex items-center justify-center px-4 py-2 rounded-md hover:text-white transition-colors"
          >
            {{ t('posts.create_first_post') }}
          </NuxtLink>
        </div>
      </div>

      <div v-else>
        <div
          class="p-3 posts-compact-border posts-compact-header-bg flex flex-wrap items-center gap-2"
        >
          <div class="flex-1 min-w-40">
            <input
              v-model="searchQuery"
              type="text"
              class="w-full px-3 py-1.5 text-sm rounded-md border posts-compact-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              :placeholder="t('profile.search_posts')"
            />
          </div>

          <div class="flex items-center gap-2">
            <select
              v-if="showStatusFilter"
              v-model="statusFilter"
              :aria-label="t('profile.filter_status')"
              class="px-3 py-1.5 text-sm rounded-md border posts-compact-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">{{ t('profile.all_statuses') }}</option>
              <option value="published">{{ t('profile.published') }}</option>
              <option value="pending">{{ t('profile.pending') }}</option>
              <option value="draft">{{ t('profile.draft') }}</option>
              <option value="hidden">{{ t('profile.hidden') }}</option>
              <option value="rejected">{{ t('profile.rejected') }}</option>
            </select>

            <select
              v-model="contentTypeFilter"
              :aria-label="t('profile.filter_content_type')"
              class="px-3 py-1.5 text-sm rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              :class="{
                'border-primary bg-primary/10 text-primary dark:text-primary-light font-medium':
                  contentTypeFilter !== 'all',
                'posts-compact-input': contentTypeFilter === 'all',
              }"
            >
              <option value="all">{{ t('profile.all_types') }}</option>
              <option value="link">{{ t('posts.type_link') }}</option>
              <option value="text">{{ t('posts.type_text') }}</option>
              <option value="video">{{ t('posts.type_video') }}</option>
              <option value="audio">{{ t('posts.type_audio') }}</option>
            </select>

            <button
              v-if="showRefreshButton"
              class="p-1.5 text-sm rounded-md posts-compact-refresh-btn transition-colors"
              :title="t('common.refresh')"
              :aria-label="t('common.refresh')"
              @click="$emit('refresh')"
            >
              <Icon name="fa6-solid:rotate" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div>
          <div
            v-for="post in filteredPosts"
            :key="post.id"
            class="posts-compact-border last:border-b-0 posts-compact-item-hover transition-colors"
          >
            <div class="p-3">
              <div class="flex items-center">
                <div class="flex-shrink-0 mr-3">
                  <div
                    class="w-8 h-8 rounded posts-compact-icon-bg flex items-center justify-center"
                  >
                    <Icon
                      :name="getContentTypeIcon(post.content_type)"
                      class="text-gray-400 dark:text-gray-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-sm mb-1 truncate">
                    <NuxtLink
                      :to="localePath(post.permalink || `/p/${post.uuid}`)"
                      class="hover:text-primary dark:hover:text-primary-light"
                    >
                      {{ post.title }}
                    </NuxtLink>
                    <span
                      v-if="post.is_anonymous"
                      class="ml-2 px-2 py-0.5 text-xs posts-anon-badge rounded-full inline-flex items-center"
                      :title="t('common.anonymous_post')"
                      ><Icon
                        name="fa6-solid:user-secret"
                        class="mr-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ t('common.anonymous') }}</span>
                    </span>
                    <span
                      v-if="post.frontpage_at"
                      class="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full inline-flex items-center"
                      :title="t('profile.on_frontpage')"
                      ><Icon name="fa6-solid:star" class="mr-1 flex-shrink-0" aria-hidden="true" />
                      <span>{{ t('profile.frontpage') }}</span>
                    </span>
                    <span
                      v-if="post.status === 'draft'"
                      class="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full inline-flex items-center"
                      ><Icon
                        name="fa6-solid:file-lines"
                        class="mr-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ t('profile.draft') }}</span>
                    </span>
                    <span
                      v-if="post.status === 'pending'"
                      class="ml-2 px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-full"
                    >
                      {{ t('profile.pending') }}
                    </span>
                    <span
                      v-if="post.status === 'hidden'"
                      class="ml-2 px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded-full inline-flex items-center"
                      :title="t('posts.post_hidden_by_admin')"
                      ><Icon
                        name="fa6-solid:eye-slash"
                        class="mr-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ t('profile.hidden') }}</span>
                    </span>
                  </h3>

                  <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span class="inline-flex items-center mr-3"
                      ><Icon
                        name="fa6-solid:calendar-days"
                        class="mr-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ formatDate(post.created_at) }}</span>
                    </span>
                    <span class="inline-flex items-center mr-3"
                      ><Icon
                        name="fa6-solid:arrow-up"
                        class="mr-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ post.vote_count || 0 }}</span>
                    </span>
                    <NuxtLink
                      :to="localePath(post.permalink || `/p/${post.uuid}`)"
                      class="inline-flex items-center mr-3 text-primary hover:text-primary-dark"
                      ><Icon
                        name="fa6-solid:comment"
                        class="mr-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ post.comment_count || 0 }}</span>
                    </NuxtLink>
                    <span class="flex items-center">
                      <Icon
                        :name="getContentTypeIcon(post.content_type)"
                        class="mr-1"
                        aria-hidden="true"
                      />
                      {{ t(`posts.type_${post.content_type || 'link'}`) }}
                    </span>
                  </div>
                </div>

                <div v-if="showActionButtons" class="flex items-center ml-3 space-x-2">
                  <slot name="action-buttons" :post="post">
                    <ChangePostStatusModal :post="post" @status-changed="handleStatusChange" />
                    <EditPostModal
                      v-if="showEditButton"
                      :post="post"
                      @post-updated="(updatedPost) => $emit('edit', updatedPost)"
                    />
                    <DeletePostModal
                      v-if="showDeleteButton"
                      :post="post"
                      @delete="$emit('delete', post.id)"
                    />
                  </slot>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="showPagination && posts.meta && posts.meta.last_page > 1"
          class="p-4 posts-compact-border-top flex justify-center"
        >
          <button
            v-if="posts.meta.current_page > 1"
            class="px-3 py-1 mx-1 rounded-md posts-compact-page-btn"
            :aria-label="t('pagination.previous')"
            @click="changePage(posts.meta.current_page - 1)"
          >
            <Icon name="fa6-solid:chevron-left" aria-hidden="true" />
          </button>

          <button
            v-for="page in getPageRange()"
            :key="page"
            class="px-3 py-1 mx-1 rounded-md"
            :class="
              page === posts.meta.current_page ? 'bg-primary text-white' : 'posts-compact-page-btn'
            "
            @click="changePage(page)"
          >
            {{ page }}
          </button>

          <button
            v-if="posts.meta.current_page < posts.meta.last_page"
            class="px-3 py-1 mx-1 rounded-md posts-compact-page-btn"
            :aria-label="t('pagination.next')"
            @click="changePage(posts.meta.current_page + 1)"
          >
            <Icon name="fa6-solid:chevron-right" aria-hidden="true" />
          </button>
        </div>

        <div
          v-if="!showPagination && filteredPosts.length > 0"
          class="p-3 posts-compact-border-top flex justify-between items-center"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{
              $t('profile.showing_posts', { count: filteredPosts.length, total: posts.data.length })
            }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="successMessage"
      class="mt-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded-md"
    >
      {{ successMessage }}
    </div>
    <div
      v-if="errorMessage"
      class="mt-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  const props = defineProps({
    posts: {
      type: Object,
      default: () => ({ data: [] }),
    },
    loading: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      default: '',
    },
    isOwnProfile: {
      type: Boolean,
      default: false,
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
    headerTitle: {
      type: String,
      default: '',
    },
    showAddButton: {
      type: Boolean,
      default: false,
    },
    showActionButtons: {
      type: Boolean,
      default: false,
    },
    showEditButton: {
      type: Boolean,
      default: false,
    },
    showDeleteButton: {
      type: Boolean,
      default: false,
    },
    showStatusFilter: {
      type: Boolean,
      default: false,
    },
    showRefreshButton: {
      type: Boolean,
      default: false,
    },
    showPagination: {
      type: Boolean,
      default: true,
    },
    emptyMessage: {
      type: String,
      default: '',
    },
    emptySubMessage: {
      type: String,
      default: '',
    },
    successMessage: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['refresh', 'edit', 'delete', 'page-changed', 'status-changed'])

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const localePath = useLocalePath()

  const searchQuery = ref('')
  const statusFilter = ref('all')
  const contentTypeFilter = ref('all')
  const currentPage = ref(1)

  const filteredPosts = computed(() => {
    if (!props.posts.data) return []

    let result = [...props.posts.data]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          (post.content && post.content.toLowerCase().includes(query))
      )
    }

    if (statusFilter.value !== 'all') {
      result = result.filter((post) => post.status === statusFilter.value)
    }

    if (contentTypeFilter.value !== 'all') {
      result = result.filter((post) => post.content_type === contentTypeFilter.value)
    }

    return result
  })

  function formatDate(dateString) {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.round(diffMs / 1000)
    const diffMin = Math.round(diffSec / 60)
    const diffHour = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHour / 24)

    if (diffSec < 60) return t('time.just_now')
    if (diffMin < 60) return t('time.minutes_ago', { count: diffMin })
    if (diffHour < 24) return t('time.hours_ago', { count: diffHour })
    if (diffDay < 30) return t('time.days_ago', { count: diffDay })

    return date.toLocaleDateString(locale.value, { timeZone: timezone })
  }

  function getContentTypeIcon(contentType) {
    switch (contentType) {
      case 'link':
        return 'fa6-solid:link'
      case 'text':
        return 'fa6-solid:file-lines'
      case 'video':
        return 'fa6-solid:video'
      case 'audio':
        return 'fa6-solid:headphones'
      case 'image':
        return 'fa6-solid:image'
      case 'poll':
        return 'fa6-solid:square-poll-vertical'
      default:
        return 'fa6-solid:file'
    }
  }

  function changePage(page) {
    currentPage.value = page
    emit('page-changed', page)
  }

  function getPageRange() {
    if (!props.posts.meta) return []

    const total = props.posts.meta.last_page
    const current = props.posts.meta.current_page

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    if (current <= 3) {
      return [1, 2, 3, 4, 5]
    }

    if (current >= total - 2) {
      return [total - 4, total - 3, total - 2, total - 1, total]
    }

    return [current - 2, current - 1, current, current + 1, current + 2]
  }

  function handleStatusChange(postId, newStatus) {
    emit('status-changed', postId, newStatus)
  }
</script>

<style scoped>
  .posts-compact-border {
    border-bottom: 1px solid var(--color-border-default);
  }

  .posts-compact-border-top {
    border-top: 1px solid var(--color-border-default);
  }

  .posts-compact-header-bg {
    background-color: var(--color-bg-subtle);
  }

  .posts-compact-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .posts-compact-item-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .posts-compact-icon-bg {
    background-color: var(--color-bg-subtle);
  }

  .posts-compact-page-btn {
    background-color: var(--color-bg-subtle);
  }

  .posts-compact-page-btn:hover {
    background-color: var(--color-bg-active);
  }

  .posts-compact-refresh-btn {
    border: 1px solid var(--color-border-default);
  }

  .posts-compact-refresh-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .posts-anon-badge {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-secondary);
  }

  .card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    @apply rounded-lg shadow-sm overflow-hidden mb-6;
  }

  .card-header {
    background-color: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border-default);
    @apply px-4 py-3;
  }

  .card-title {
    color: var(--color-text-primary);
    @apply font-medium;
  }

  .card-body > * {
    border-bottom: 1px solid var(--color-border-default);
  }

  .card-body > *:last-child {
    border-bottom: none;
  }

  .btn-primary {
    background-color: var(--color-primary) !important;
    color: var(--color-btn-primary-text) !important;
  }

  .btn-primary:hover {
    background-color: var(--color-primary-dark) !important;
  }

  .btn-icon {
    color: var(--color-text-muted);
    @apply p-1.5 rounded-md transition-colors;
  }

  .btn-icon:hover {
    color: var(--color-text-primary);
    background-color: var(--color-bg-hover);
  }

  .spinner {
    border-color: var(--color-primary) !important;
    border-top-color: transparent !important;
    @apply w-8 h-8 border-4 rounded-full mx-auto;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
