<template>
  <div class="card">
    <div v-if="showHeader" class="card-header flex justify-between items-center">
      <h2 class="card-title inline-flex items-center">
        <Icon name="fa6-solid:comments" class="mr-2 flex-shrink-0" aria-hidden="true" /><span>{{
          headerTitle
        }}</span>
      </h2>
    </div>

    <div class="card-body p-0">
      <div v-if="loading" class="p-6 text-center">
        <div class="spinner" />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ t('profile.loading_comments') }}
        </p>
      </div>

      <div v-else-if="!comments.data || comments.data.length === 0" class="p-6 text-center">
        <div class="mb-3 text-gray-400 dark:text-gray-500">
          <Icon name="fa6-solid:comments" class="text-4xl" aria-hidden="true" />
        </div>
        <p class="mb-2 text-gray-700 dark:text-gray-300">{{ emptyMessage }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ emptySubMessage }}</p>
      </div>

      <div v-else>
        <div
          class="p-3 comments-compact-border comments-compact-header-bg flex flex-wrap items-center gap-2"
        >
          <div class="flex-1 min-w-40">
            <input
              v-model="searchQuery"
              type="text"
              class="w-full px-3 py-1.5 text-sm rounded-md border comments-compact-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              :placeholder="t('profile.search_comments')"
              :aria-label="t('profile.search_comments')"
            />
          </div>

          <button
            v-if="showRefreshButton"
            class="p-1.5 text-sm rounded-md comments-compact-refresh-btn transition-colors"
            :title="t('common.refresh')"
            :aria-label="t('common.refresh')"
            @click="$emit('refresh')"
          >
            <Icon name="fa6-solid:rotate" aria-hidden="true" />
          </button>
        </div>

        <div>
          <div
            v-for="comment in filteredComments"
            :key="comment.id"
            class="comments-compact-border last:border-b-0 comments-compact-item-hover transition-colors"
          >
            <div class="p-3">
              <div class="flex">
                <div class="flex-1 min-w-0">
                  <div v-if="comment.post" class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <NuxtLink
                      :to="localePath(comment.post.permalink || `/p/${comment.post.uuid}`)"
                      class="font-medium text-primary hover:underline"
                    >
                      {{ comment.post.title }}
                    </NuxtLink>
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-400 mb-2 italic">
                    {{ t('comments.post_deleted') }}
                  </div>
                  <div class="prose dark:prose-invert prose-sm max-w-none">
                    {{ comment.content }}
                  </div>
                  <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                    <span class="flex items-center mr-4">
                      <Icon name="fa6-solid:calendar-days" class="mr-1" aria-hidden="true" />
                      <TimeAgo :datetime="comment.created_at" />
                    </span>
                    <span class="flex items-center">
                      <Icon name="fa6-solid:arrow-up" class="mr-1" aria-hidden="true" />
                      {{ comment.votes_count || 0 }}
                    </span>
                  </div>
                </div>

                <div v-if="showActionButtons" class="flex items-center ml-3 space-x-2">
                  <slot name="action-buttons" :comment="comment">
                    <button
                      v-if="showEditButton"
                      class="btn-icon"
                      :title="t('common.edit')"
                      :aria-label="t('common.edit')"
                      @click="$emit('edit', comment)"
                    >
                      <Icon name="fa6-solid:pen" aria-hidden="true" />
                    </button>
                    <button
                      v-if="showDeleteButton"
                      class="btn-icon text-red-500"
                      :title="t('common.delete')"
                      :aria-label="t('common.delete')"
                      @click="$emit('delete', comment.id)"
                    >
                      <Icon name="fa6-solid:trash-can" aria-hidden="true" />
                    </button>
                  </slot>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="showPagination && comments.meta && comments.meta.last_page > 1"
          class="p-4 comments-compact-border-top flex justify-center"
        >
          <button
            v-if="comments.meta.current_page > 1"
            class="px-3 py-1 mx-1 rounded-md comments-compact-page-btn"
            :aria-label="t('pagination.previous')"
            @click="changePage(comments.meta.current_page - 1)"
          >
            <Icon name="fa6-solid:chevron-left" aria-hidden="true" />
          </button>

          <button
            v-for="page in getPageRange()"
            :key="page"
            class="px-3 py-1 mx-1 rounded-md"
            :class="
              page === comments.meta.current_page
                ? 'bg-primary text-white'
                : 'comments-compact-page-btn'
            "
            @click="changePage(page)"
          >
            {{ page }}
          </button>

          <button
            v-if="comments.meta.current_page < comments.meta.last_page"
            class="px-3 py-1 mx-1 rounded-md comments-compact-page-btn"
            :aria-label="t('pagination.next')"
            @click="changePage(comments.meta.current_page + 1)"
          >
            <Icon name="fa6-solid:chevron-right" aria-hidden="true" />
          </button>
        </div>

        <div
          v-if="!showPagination && filteredComments.length > 0"
          class="p-3 comments-compact-border-top flex justify-between items-center"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{
              $t('profile.showing_comments', {
                count: filteredComments.length,
                total: comments.data.length,
              })
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

  import TimeAgo from '~/components/ui/TimeAgo.vue'

  const props = defineProps({
    comments: {
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

  const emit = defineEmits(['refresh', 'edit', 'delete', 'page-changed'])

  const { t } = useI18n()
  const localePath = useLocalePath()

  const searchQuery = ref('')
  const currentPage = ref(1)

  const filteredComments = computed(() => {
    if (!props.comments.data) return []

    let result = [...props.comments.data]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (comment) =>
          comment.content?.toLowerCase().includes(query) ||
          comment.post?.title?.toLowerCase().includes(query)
      )
    }

    return result
  })

  function changePage(page) {
    currentPage.value = page
    emit('page-changed', page)
  }

  function getPageRange() {
    if (!props.comments.meta) return []

    const total = props.comments.meta.last_page
    const current = props.comments.meta.current_page

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
</script>

<style scoped>
  .comments-compact-border {
    border-bottom: 1px solid var(--color-border-default);
  }

  .comments-compact-border-top {
    border-top: 1px solid var(--color-border-default);
  }

  .comments-compact-header-bg {
    background-color: var(--color-bg-subtle);
  }

  .comments-compact-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .comments-compact-item-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .comments-compact-page-btn {
    background-color: var(--color-bg-subtle);
  }

  .comments-compact-page-btn:hover {
    background-color: var(--color-bg-active);
  }

  .comments-compact-refresh-btn {
    border: 1px solid var(--color-border-default);
  }

  .comments-compact-refresh-btn:hover {
    background-color: var(--color-bg-hover);
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
