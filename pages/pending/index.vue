<template>
  <div>
    <div class="mb-4 p-2 bg-primary-light text-white rounded-lg dark:bg-primary-dark">
      <div class="flex overflow-x-auto">
        <button
          @click="setSort('created_at', 'desc')"
          class="px-4 py-2 text-sm whitespace-nowrap rounded-md mr-2"
          :class="isActiveSort('created_at', 'desc') ? 'bg-primary dark:bg-primary-light' : ''"
        >
          <i class="fas fa-clock mr-1"></i> {{ $t('links.recent') }}
        </button>
        <button
          @click="setSort('votes', 'desc')"
          class="px-4 py-2 text-sm whitespace-nowrap rounded-md mr-2"
          :class="isActiveSort('votes', 'desc') ? 'bg-primary dark:bg-primary-light' : ''"
        >
          <i class="fas fa-arrow-up mr-1"></i>
          {{ $t('common.votes') }}
        </button>
        <button
          @click="setSort('karma', 'desc')"
          class="px-4 py-2 text-sm whitespace-nowrap rounded-md mr-2"
          :class="isActiveSort('karma', 'desc') ? 'bg-primary dark:bg-primary-light' : ''"
        >
          <i class="fas fa-bolt mr-1"></i>
          {{ $t('links.most_valued') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <template v-if="loading && page === 1">
          <div class="flex justify-center items-center py-12">
            <div
              class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
        </template>

        <template v-else-if="links.length === 0">
          <div class="bg-white dark:bg-card-dark p-6 rounded-lg shadow text-center">
            <i class="fas fa-info-circle text-primary text-3xl mb-2"></i>
            <p class="text-lg">{{ $t('links.no_links') }}</p>
          </div>
        </template>

        <template v-else>
          <LinkCard v-for="link in links" :key="link.id" :link="link" />

          <div v-if="meta.lastPage > 1" class="flex justify-center mt-4">
            <div class="flex space-x-1">
              <button
                v-for="p in paginationRange"
                :key="p"
                @click="page = p"
                class="px-3 py-1 rounded-md text-sm"
                :class="
                  p === page
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-neutral-700 text-text dark:text-text-dark'
                "
              >
                {{ p }}
              </button>
            </div>
          </div>

          <div v-if="loading && page > 1" class="text-center py-4">
            <div
              class="spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"
            ></div>
          </div>
        </template>
      </div>

      <div class="lg:col-span-1">
        <div
          class="bg-white dark:bg-card-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 mb-4"
        >
          <h3 class="text-lg font-bold mb-3 text-text dark:text-text-dark">
            <i class="fas fa-info-circle mr-1"></i>
            {{ $t('links.pending') }}
          </h3>
          <p class="text-sm mb-4 text-text dark:text-text-dark">
            {{ $t('links.pending_info') }}
          </p>
          <div class="text-sm text-text-muted dark:text-text-dark-muted">
            <p class="mb-2">
              <i class="fas fa-arrow-up mr-1"></i>
              {{ $t('links.pending_vote_info') }}
            </p>
            <p>
              <i class="fas fa-comment mr-1"></i>
              {{ $t('links.pending_comment_info') }}
            </p>
          </div>
        </div>

        <div
          v-if="!authStore.isAuthenticated"
          class="bg-white dark:bg-card-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 mb-4"
        >
          <h3 class="text-lg font-bold mb-3 text-text dark:text-text-dark">
            <i class="fas fa-user-plus mr-1"></i>
            {{ $t('auth.need_account') }}
          </h3>
          <p class="text-sm mb-4 text-text dark:text-text-dark">
            {{ $t('auth.register_info') }}
          </p>
          <div class="grid grid-cols-2 gap-3">
            <NuxtLink
              :to="$localePath('/auth/register')"
              class="bg-primary hover:bg-primary-dark text-white text-center py-2 rounded-md text-sm transition-colors"
            >
              {{ $t('auth.register') }}
            </NuxtLink>
            <NuxtLink
              :to="$localePath('/auth/login')"
              class="border border-primary text-primary dark:text-primary-light hover:bg-primary-light hover:text-white text-center py-2 rounded-md text-sm transition-colors dark:hover:bg-primary-dark"
            >
              {{ $t('auth.login') }}
            </NuxtLink>
          </div>
        </div>

        <div
          class="bg-white dark:bg-card-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700"
        >
          <h3 class="text-lg font-bold mb-3 text-text dark:text-text-dark">
            <i class="fas fa-tags mr-1"></i>
            {{ $t('tags.popular') }}
          </h3>
          <div class="flex flex-wrap mb-3">
            <NuxtLink
              v-for="tag in popularTags"
              :key="tag.id"
              :to="`/tags/${tag.name}`"
              class="inline-block bg-blue-50 dark:bg-blue-900/40 text-primary dark:text-blue-300 rounded-full px-3 py-1 text-xs mr-2 mb-2 no-underline transition-colors border border-blue-100 dark:border-blue-800 hover:bg-primary hover:text-white dark:hover:bg-primary-dark"
            >
              {{ tag.name }}
              <span
                class="ml-1 bg-white dark:bg-blue-800 text-primary dark:text-blue-200 rounded-sm px-1 text-xs"
                >{{ tag.links_count }}</span
              >
            </NuxtLink>
          </div>
          <div class="text-center mt-2">
            <NuxtLink
              :to="$localePath('/tags')"
              class="text-sm text-primary dark:text-primary-light hover:underline"
            >
              {{ $t('tags.all') }}
              <i class="fas fa-chevron-right ml-1"></i>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useLinksStore } from '@/stores/links'
  import { useTagsStore } from '@/stores/tags'
  import LinkCard from '@/components/links/LinkCard.vue'

  const authStore = useAuthStore()
  const linksStore = useLinksStore()
  const tagsStore = useTagsStore()
  const { $api } = useNuxtApp()

  const sort = ref('created_at')
  const direction = ref('desc')
  const page = ref(1)
  const loading = ref(true)

  const popularTags = ref([])

  const links = computed(() => linksStore.pendingLinks)
  const meta = computed(() => linksStore.pendingMeta)

  const paginationRange = computed(() => {
    const range = []
    const maxButtons = 5

    if (meta.value.lastPage <= maxButtons) {
      for (let i = 1; i <= meta.value.lastPage; i++) {
        range.push(i)
      }
    } else {
      let start = Math.max(1, page.value - Math.floor(maxButtons / 2))
      let end = Math.min(meta.value.lastPage, start + maxButtons - 1)

      if (end - start < maxButtons - 1) {
        start = Math.max(1, end - maxButtons + 1)
      }

      for (let i = start; i <= end; i++) {
        range.push(i)
      }
    }

    return range
  })

  function isActiveSort(sortKey, directionKey) {
    return sort.value === sortKey && direction.value === directionKey
  }

  function setSort(sortKey, directionKey) {
    if (sort.value === sortKey && direction.value === directionKey) return

    sort.value = sortKey
    direction.value = directionKey
    page.value = 1

    fetchLinks()
  }

  async function fetchLinks() {
    loading.value = true

    try {
      await linksStore.fetchPendingLinks(page.value, sort.value, direction.value)
    } catch (error) {
      console.error('Error fetching pending links:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchPopularTags() {
    try {
      const response = await $api.tags.getTags({
        sort: 'links_count',
        direction: 'desc',
        per_page: 10,
      })

      popularTags.value = response.data.data
    } catch (error) {
      console.error('Error fetching popular tags:', error)
    }
  }

  watch(page, () => {
    fetchLinks()
  })

  onMounted(() => {
    fetchLinks()
    fetchPopularTags()
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
</style>
