<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-4xl mx-auto">
      <div
        class="card-bg rounded-lg shadow-sm border tags-border mb-6"
      >
        <div class="px-6 py-4 border-b tags-border">
          <h2 class="text-xl font-medium inline-flex items-center"><Icon name="fa6-solid:tags" class="mr-2 flex-shrink-0" aria-hidden="true" /><span>{{ t('tags.title') }}</span></h2>
        </div>
        <div class="p-6">
          <div class="mb-6">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                class="w-full pl-10 pr-4 py-2 rounded-md border tags-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                :placeholder="t('tags.search')"
                :aria-label="t('tags.search')"
              >
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="fa6-solid:magnifying-glass" class="text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div v-if="loading" class="flex justify-center py-8">
            <div
              class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
            />
          </div>

          <div v-else>
            <div v-if="filteredTags.length === 0" class="text-center py-8">
              <Icon name="fa6-solid:tag" class="text-gray-300 dark:text-gray-600 text-5xl mb-3" aria-hidden="true" />
              <p class="text-gray-500 dark:text-gray-400">
                {{ t('tags.no_results') }}
              </p>
            </div>

            <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                v-for="tag in filteredTags"
                :key="tag.id"
                class="tag-item p-4 border tags-item-border rounded-lg transition-transform hover:shadow-md hover:-translate-y-1"
              >
                <h3 class="font-medium text-lg mb-2">
                  <NuxtLink
                    :to="localePath(`/tags/${encodeURIComponent(tag.name)}`)"
                    class="text-primary hover:underline"
                  >
                    {{ tag.name }}
                  </NuxtLink>
                </h3>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-500 dark:text-gray-400">
                    {{ t('links.title') }}
                  </span>
                  <span class="font-bold">{{ tag.links_count }}</span>
                </div>
              </div>
            </div>

            <div v-if="meta.lastPage > 1" class="flex justify-center mt-8">
              <div class="flex space-x-1">
                <button
                  v-for="p in paginationRange"
                  :key="p"
                  class="px-3 py-1 rounded-md text-sm"
                  :class="
                    p === page
                      ? 'bg-primary text-white'
                      : 'tags-page-btn text-text dark:text-text-dark'
                  "
                  @click="page = p"
                >
                  {{ p }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="card-bg rounded-lg shadow-sm border tags-border"
      >
        <div class="px-6 py-4 border-b tags-border">
          <h2 class="text-xl font-medium inline-flex items-center"><Icon name="fa6-solid:circle-info" class="mr-2 flex-shrink-0" aria-hidden="true" /> <span>{{ t('tags.about') }}</span>
          </h2>
        </div>
        <div class="p-6">
          <p class="mb-4">{{ t('tags.about_text') }}</p>
          <p>{{ t('tags.usage_text') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useTagsStore } from '@/stores/tags'
  import { useLocalePath, useI18n } from '#i18n'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const tagsStore = useTagsStore()

  const page = ref(1)
  const loading = ref(true)
  const searchQuery = ref('')

  const tags = computed(() => tagsStore.tags)
  const meta = computed(() => tagsStore.meta)

  const filteredTags = computed(() => {
    if (!searchQuery.value.trim()) return tags.value

    const query = searchQuery.value.toLowerCase().trim()
    return tags.value.filter((tag) => tag.name.toLowerCase().includes(query))
  })

  const paginationRange = computed(() => {
    const range = []
    const maxButtons = 5

    if (meta.value.lastPage <= maxButtons) {
      for (let i = 1; i <= meta.value.lastPage; i++) {
        range.push(i)
      }
    } else {
      let start = Math.max(1, page.value - Math.floor(maxButtons / 2))
      const end = Math.min(meta.value.lastPage, start + maxButtons - 1)

      if (end - start < maxButtons - 1) {
        start = Math.max(1, end - maxButtons + 1)
      }

      for (let i = start; i <= end; i++) {
        range.push(i)
      }
    }

    return range
  })

  async function fetchTags() {
    loading.value = true

    try {
      await tagsStore.fetchTags(page.value, 'links_count', 'desc')
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      loading.value = false
    }
  }

  watch(page, () => {
    fetchTags()
  })

  onMounted(() => {
    fetchTags()
  })
</script>

<style scoped>
  .tag-item {
    transition: all 0.2s ease;
  }

  .tags-border {
    border-color: var(--color-border-default);
  }

  .tags-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .tags-item-border {
    border-color: var(--color-border-subtle);
  }

  .tags-page-btn {
    background-color: var(--color-bg-subtle);
  }
</style>
