<template>
  <div
    class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-4"
  >
    <div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
      <h3 class="font-medium"><i class="fas fa-link mr-2"></i>{{ $t('links.show.related') }}</h3>
    </div>
    <div v-if="loading" class="p-4 text-center">
      <div
        class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"
      ></div>
    </div>
    <div v-else-if="links.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
      <p>{{ $t('links.show.no_related') }}</p>
    </div>
    <div v-else class="divide-y divide-gray-200 dark:divide-neutral-700">
      <div v-for="link in links" :key="link.id" class="p-3">
        <NuxtLink :to="`/links/${link.id}`" class="hover:text-primary transition-colors">
          <div class="flex">
            <div class="text-primary font-bold mr-2">
              {{ link.votes }}
            </div>
            <div class="flex-grow">
              <div class="text-sm font-medium">
                {{ link.title }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(link.promoted_at || link.created_at) }}
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'

  const props = defineProps({
    linkId: {
      type: [Number, String],
      required: true,
    },
    tagIds: {
      type: Array,
      default: () => [],
    },
  })

  const { $api } = useNuxtApp()
  const links = ref([])
  const loading = ref(true)
  import { useI18n } from 'vue-i18n'

  function formatDate(dateString) {
    const { t } = useI18n()
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

    return date.toLocaleDateString()
  }

  onMounted(async () => {
    links.value = []
    loading.value = false
  })
</script>
