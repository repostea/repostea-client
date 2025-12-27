<template>
  <div class="comment-list">
    <div v-if="loading && comments.length === 0" class="loading-container">
      <div class="text-center py-8">
        <Icon
          name="fa6-solid:spinner"
          class="text-4xl text-primary animate-spin"
          aria-hidden="true"
        />
        <p class="mt-4 text-gray-600 dark:text-gray-400">{{ $t('common.loading') }}...</p>
      </div>
    </div>

    <div v-else-if="comments.length === 0" class="empty-state">
      <Icon
        name="fa6-solid:comments"
        class="text-6xl text-gray-400 dark:text-gray-600 mb-4"
        aria-hidden="true"
      />
      <p class="text-xl text-gray-600 dark:text-gray-400">{{ $t('comments.no_comments_found') }}</p>
      <p v-if="nextTimeInterval" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {{ $t('comments.try_expanding') }}
        <a
          class="text-primary dark:text-primary-light hover:underline cursor-pointer font-medium"
          @click="$emit('expand-time-range', nextTimeInterval.value)"
        >
          {{ nextTimeInterval.label.toLowerCase() }}
        </a>
      </p>
    </div>

    <div v-else class="comments-container">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :link-id="comment.post?.id"
        :post="comment.post"
        :is-listing-mode="true"
      />

      <!-- Infinite scroll trigger -->
      <div v-if="hasMore" ref="loadMoreTrigger" class="load-more-trigger">
        <div v-if="loadMoreLoading" class="text-center py-4">
          <Icon
            name="fa6-solid:spinner"
            class="text-2xl text-primary animate-spin"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
  import { useI18n } from '#i18n'
  import CommentItem from './CommentItem.vue'

  const { t } = useI18n()

  const props = defineProps({
    comments: {
      type: Array,
      required: true,
    },
    meta: {
      type: Object,
      default: () => ({}),
    },
    loading: {
      type: Boolean,
      default: false,
    },
    hasMore: {
      type: Boolean,
      default: false,
    },
    loadMoreLoading: {
      type: Boolean,
      default: false,
    },
    timeInterval: {
      type: String,
      default: '0',
    },
  })

  const emit = defineEmits(['load-more', 'expand-time-range'])

  const nextTimeInterval = computed(() => {
    const intervals = [
      { value: '2880', label: t('filters.last_48_hours') },
      { value: '10080', label: t('filters.last_7_days') },
      { value: '43200', label: t('filters.last_30_days') },
      { value: '0', label: t('filters.all_time') },
    ]

    const currentIndex = intervals.findIndex((i) => i.value === props.timeInterval)

    // If we're at "all time" or can't find the index, there's no next
    if (currentIndex === -1 || currentIndex === intervals.length - 1) {
      return null
    }

    // Return the next interval
    return intervals[currentIndex + 1]
  })

  const loadMoreTrigger = ref(null)
  let observer = null

  onMounted(() => {
    if (import.meta.client && loadMoreTrigger.value) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && props.hasMore && !props.loadMoreLoading) {
            emit('load-more')
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(loadMoreTrigger.value)
    }
  })

  onBeforeUnmount(() => {
    if (observer && loadMoreTrigger.value) {
      observer.unobserve(loadMoreTrigger.value)
      observer.disconnect()
    }
  })
</script>

<style scoped>
  .comment-list {
    @apply rounded-lg shadow-md p-4;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .loading-container {
    @apply flex items-center justify-center min-h-[300px];
  }

  .empty-state {
    @apply flex flex-col items-center justify-center min-h-[300px] text-center;
  }

  .load-more-trigger {
    @apply min-h-[100px] flex items-center justify-center;
  }

  .comments-container {
    @apply space-y-4;
  }
</style>
