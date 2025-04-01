<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <template v-else-if="tag">
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold flex items-center">
            <i class="fas fa-tag mr-2"></i>
            <span class="text-primary">#{{ tag.name }}</span>
          </h1>

          <div class="flex gap-2">
            <button
              @click="setStatus('published')"
              class="px-3 py-1.5 text-sm rounded-md border"
              :class="
                status === 'published'
                  ? 'bg-primary text-white border-primary'
                  : 'border-border-color dark:border-neutral-700 hover:border-primary'
              "
            >
              {{ $t('links.published') }}
            </button>
            <button
              @click="setStatus('pending')"
              class="px-3 py-1.5 text-sm rounded-md border"
              :class="
                status === 'pending'
                  ? 'bg-primary text-white border-primary'
                  : 'border-border-color dark:border-neutral-700 hover:border-primary'
              "
            >
              {{ $t('links.pending') }}
            </button>
          </div>
        </div>

        <div class="text-text-muted dark:text-text-dark-muted mt-2">
          {{ tag.links_count }} {{ $t('links.title') }}
        </div>
      </div>

      <div v-if="links.length > 0">
        <LinkCard v-for="link in links" :key="link.id" :link="link" />

        <div v-if="meta.lastPage > 1" class="flex justify-center mt-6">
          <div class="flex gap-1">
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
      </div>

      <div
        v-else
        class="bg-white dark:bg-card-dark border border-border-color dark:border-neutral-700 rounded-lg shadow-sm p-6 text-center"
      >
        <i class="fas fa-info-circle text-3xl text-primary mb-3"></i>
        <p>
          {{
            $t('links.no_links_for_tag', {
              tag: tag.name,
              status: status,
            })
          }}
        </p>

        <div v-if="status === 'pending'" class="mt-4">
          <button @click="setStatus('published')" class="text-primary hover:underline">
            {{ $t('links.view_published_links') }}
          </button>
        </div>
        <div v-else-if="status === 'published'" class="mt-4">
          <button @click="setStatus('pending')" class="text-primary hover:underline">
            {{ $t('links.view_pending_links') }}
          </button>
        </div>
      </div>
    </template>

    <div
      v-else-if="!loading"
      class="bg-white dark:bg-card-dark p-6 rounded-lg shadow-sm border border-border-color dark:border-neutral-700 text-center"
    >
      <i class="fas fa-exclamation-triangle text-3xl text-danger mb-3"></i>
      <h2 class="text-xl font-bold mb-2">{{ $t('errors.404.title') }}</h2>
      <p>{{ $t('errors.404.message') }}</p>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import LinkCard from '@/components/links/LinkCard.vue'

  const route = useRoute()
  const router = useRouter()
  const { $api } = useNuxtApp()

  const loading = ref(true)
  const tag = ref(null)
  const links = ref([])
  const meta = ref({})
  const page = ref(1)
  const status = ref('published')

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

  function setStatus(newStatus) {
    if (status.value !== newStatus) {
      status.value = newStatus
      page.value = 1
      fetchTagData()
    }
  }

  async function fetchTagData() {
    loading.value = true

    try {
      const tagName = route.params.name
      const response = await $api.tags.getTag(tagName, {
        status: status.value,
        page: page.value,
      })

      tag.value = response.data.data.tag
      links.value = response.data.data.links.data
      meta.value = {
        currentPage: response.data.data.links.meta.current_page,
        from: response.data.data.links.meta.from,
        lastPage: response.data.data.links.meta.last_page,
        path: response.data.data.links.meta.path,
        perPage: response.data.data.links.meta.per_page,
        to: response.data.data.links.meta.to,
        total: response.data.data.links.meta.total,
      }
    } catch (error) {
      console.error('Error fetching tag:', error)
      tag.value = null
      links.value = []
    } finally {
      loading.value = false
    }
  }

  watch(page, () => {
    fetchTagData()
  })

  onMounted(() => {
    if (route.query.status && ['published', 'pending'].includes(route.query.status)) {
      status.value = route.query.status
    }

    fetchTagData()
  })

  watch(status, (newStatus) => {
    router.replace({
      path: route.path,
      query: {
        ...route.query,
        status: newStatus,
      },
    })
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
