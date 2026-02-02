<template>
  <div>
    <div v-if="title" class="mb-3">
      <h2 class="text-xl font-bold text-text dark:text-text-dark">
        {{ title }}
        <span class="text-sm font-normal text-text-muted dark:text-text-dark-muted ml-2">
          ({{ meta.total || posts.length }} {{ $t('links.posts') }})
        </span>
      </h2>
    </div>

    <div
      v-if="loading"
      class="flex flex-col justify-center items-center py-12"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="xl" display="centered" :show-text="true" />
    </div>

    <template v-else-if="posts.length === 0">
      <!-- Empty state for My Subs -->
      <div
        v-if="emptyStateType === 'my-subs'"
        class="card-bg p-8 rounded-lg shadow text-center"
        role="status"
        aria-live="polite"
      >
        <Icon name="fa6-solid:folder-open" class="text-primary text-5xl mb-4" aria-hidden="true" />
        <h3 class="text-xl font-semibold mb-3 text-text dark:text-text-dark">
          {{ $t('subs.no_subscriptions_title') }}
        </h3>
        <p class="text-text-muted dark:text-text-dark-muted mb-6 max-w-md mx-auto">
          {{ $t('subs.no_subscriptions_description') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink
            :to="localePath('/s')"
            class="btn btn-primary px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center shadow-sm"
          >
            <Icon name="fa6-solid:compass" class="mr-2" aria-hidden="true" />
            {{ $t('subs.explore_subs') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/s/create')"
            class="post-list-create-btn px-6 py-3 text-primary dark:text-primary-light border border-primary dark:border-primary-light rounded-lg transition-colors font-medium inline-flex items-center justify-center shadow-sm"
          >
            <Icon name="fa6-solid:plus" class="mr-2" aria-hidden="true" />
            {{ $t('subs.create_sub') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Default empty state -->
      <div
        v-else
        class="card-bg p-6 rounded-lg shadow text-center"
        role="status"
        aria-live="polite"
      >
        <Icon name="fa6-solid:circle-info" class="text-primary text-3xl mb-2" aria-hidden="true" />
        <h3 class="text-lg font-medium mb-2">
          {{ $t('links.no_links_title') }}
        </h3>
        <p class="text-text-muted dark:text-text-dark-muted">
          {{ $t('links.no_links_description') }}
        </p>
        <div class="mt-4">
          <button
            class="btn-primary px-6 py-2 bg-primary rounded-md hover:bg-primary-dark transition-colors font-medium"
            @click="$emit('clear-filters')"
          >
            {{ $t('links.clear_filters') }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- Card layout (default) -->
      <div
        v-if="layout === 'card'"
        class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2 md:gap-4"
      >
        <template v-for="(post, index) in posts" :key="post.id || post.entryId">
          <PostCard
            :post="post"
            :show-full-text="false"
            :layout="layout"
            class="min-w-[300px] virtual-post"
          />
          <!-- Insert Recent Comments after 4th post when sidebar is hidden -->
          <div v-if="index === 3" class="lg:hidden col-span-full mt-0 mb-2 md:mt-4">
            <slot name="after-third-post" />
          </div>
          <!-- Insert Top Comments after 8th post when sidebar is hidden -->
          <div v-if="index === 7" class="lg:hidden col-span-full mt-0 mb-2 md:mt-4">
            <slot name="after-sixth-post" />
          </div>
        </template>
      </div>

      <!-- Compact layout -->
      <div v-else-if="layout === 'compact'" class="space-y-1.5 md:space-y-2">
        <template v-for="(post, index) in posts" :key="post.id || post.entryId">
          <PostCard
            :post="post"
            :show-full-text="false"
            :layout="layout"
            class="compact-card virtual-post-compact"
          />
          <!-- Insert Recent Comments after 4th post when sidebar is hidden -->
          <div v-if="index === 3" class="lg:hidden mt-0 mb-2 md:mt-4">
            <slot name="after-third-post" />
          </div>
          <!-- Insert Top Comments after 8th post when sidebar is hidden -->
          <div v-if="index === 7" class="lg:hidden mt-0 mb-2 md:mt-4">
            <slot name="after-sixth-post" />
          </div>
        </template>
      </div>

      <!-- List layout -->
      <div v-else-if="layout === 'list'" class="card-bg rounded-lg shadow-sm overflow-hidden">
        <template v-for="(post, index) in posts" :key="post.id || post.entryId">
          <ListItemCard
            :post="post"
            class="virtual-post-list"
            @vote="$emit('vote', { postId: post.id || post.entryId, value: $event })"
          />
          <!-- Insert Recent Comments after 20th post when sidebar is hidden -->
          <div v-if="index === 19" class="post-list-slot-divider lg:hidden pt-0 pb-2 md:pt-4">
            <slot name="after-third-post" />
          </div>
          <!-- Insert Top Comments after 30th post when sidebar is hidden -->
          <div v-if="index === 29" class="post-list-slot-divider lg:hidden pt-0 pb-2 md:pt-4">
            <slot name="after-sixth-post" />
          </div>
        </template>
      </div>

      <!-- Pagination -->
      <div v-if="showPagination" class="mt-6 py-4">
        <div v-if="loadMoreLoading" class="text-center py-4" role="status" aria-live="polite">
          <LoadingSpinner
            size="lg"
            display="centered"
            :show-text="true"
            :text="$t('pagination.loading_page')"
          />
        </div>
        <Pagination
          v-else
          :current-page="meta.currentPage || 1"
          :last-page="meta.lastPage || 1"
          @page-change="goToPage"
        />
      </div>

      <!-- End of posts message (only when on last page) -->
      <div
        v-else-if="posts.length > 0 && isLastPage"
        class="text-center py-6 text-text-muted dark:text-text-dark-muted"
      >
        <Icon name="fa6-solid:circle-check" class="text-xl mb-2" aria-hidden="true" />
        <p>{{ $t('pagination.end_of_posts') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
  import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
  import { useI18n, useLocalePath } from '#i18n'

  // Lazy load components based on layout
  const PostCard = defineAsyncComponent(() => import('~/components/posts/PostCard.vue'))
  const ListItemCard = defineAsyncComponent(() => import('~/components/posts/ListItemCard.vue'))
  const Pagination = defineAsyncComponent(() => import('~/components/common/Pagination.vue'))

  useI18n()
  const localePath = useLocalePath()

  const props = defineProps({
    title: {
      type: String,
      default: '',
    },
    posts: {
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
    loadMoreLoading: {
      type: Boolean,
      default: false,
    },
    layout: {
      type: String,
      default: 'card',
      validator: (value) => ['card', 'compact', 'list'].includes(value),
    },
    emptyStateType: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'my-subs'].includes(value),
    },
  })

  const emit = defineEmits(['vote', 'clear-filters', 'page-change'])

  const showTutorial = ref(false)

  // Should show pagination (when there's more than one page)
  const showPagination = computed(() => {
    return props.meta.lastPage > 1
  })

  // Check if we're on the last page
  const isLastPage = computed(() => {
    return props.meta.currentPage >= props.meta.lastPage
  })

  const goToPage = (pageNum) => {
    emit('page-change', pageNum)
  }

  onMounted(async () => {
    try {
      if (props.posts.length > 0) {
        const tutorialSeen = localStorage.getItem('saveTutorialSeen')
        if (!tutorialSeen) {
          showTutorial.value = true
        }
      }
    } catch (e) {
      console.error('Error checking tutorial state:', e)
    }
  })
</script>

<style scoped>
  .spinner {
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

  /* Layout-specific styles */
  .compact-card {
    @apply border-b pb-2;
    border-color: var(--color-border-default);
    padding-bottom: 0;
  }

  .post-list-create-btn {
    background-color: var(--color-bg-card);
  }

  .post-list-create-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .post-list-slot-divider {
    border-top: 1px solid var(--color-border-default);
  }

  .compact-card:last-child {
    @apply border-b-0;
  }

  /* Virtual scrolling - skip rendering off-screen posts */
  .virtual-post {
    content-visibility: auto;
    contain-intrinsic-size: auto 400px;
  }

  .virtual-post-compact {
    content-visibility: auto;
    contain-intrinsic-size: auto 150px;
  }

  .virtual-post-list {
    content-visibility: auto;
    contain-intrinsic-size: auto 80px;
  }
</style>
