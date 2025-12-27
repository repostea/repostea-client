<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2">{{ t('faq.title') }}</h1>
    <p class="text-text-muted dark:text-text-dark-muted mb-8">
      {{ t('faq.description') }}
    </p>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
      />
    </div>

    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded"
    >
      {{ error }}
    </div>

    <div v-else class="space-y-8">
      <div
        v-for="category in faqData"
        :key="category.category"
        class="card-bg rounded-lg shadow p-6"
      >
        <h2 class="text-2xl font-bold mb-4 flex items-center">
          <Icon
            :name="getCategoryIcon(category.category)"
            class="mr-2 text-primary"
            aria-hidden="true"
          />
          {{ category.name }}
        </h2>

        <div class="space-y-4">
          <div
            v-for="(item, index) in category.items"
            :key="index"
            class="faq-item border-b last:border-0 pb-4 last:pb-0"
          >
            <button
              class="w-full text-left flex items-start justify-between py-2 hover:text-primary transition-colors"
              :aria-expanded="isOpen(category.category, index)"
              :aria-controls="`faq-answer-${category.category}-${index}`"
              @click="toggleItem(category.category, index)"
            >
              <h3 class="text-lg font-semibold pr-4">{{ item.question }}</h3>
              <Icon
                :name="
                  isOpen(category.category, index)
                    ? 'fa6-solid:chevron-up'
                    : 'fa6-solid:chevron-down'
                "
                class="flex-shrink-0 mt-1 text-primary"
                aria-hidden="true"
              />
            </button>

            <div
              v-show="isOpen(category.category, index)"
              :id="`faq-answer-${category.category}-${index}`"
              class="mt-2 text-text-muted dark:text-text-dark-muted leading-relaxed"
              role="region"
              v-html="sanitizeHtml(item.answer)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useI18n } from '#i18n'
  import DOMPurify from 'dompurify'

  const { t } = useI18n()

  const sanitizeHtml = (html) => {
    if (!html) return ''
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    })
  }

  const faqData = ref([])
  const loading = ref(true)
  const error = ref(null)
  const openItems = ref({})

  const toggleItem = (category, index) => {
    const key = `${category}-${index}`
    openItems.value[key] = !openItems.value[key]
  }

  const isOpen = (category, index) => {
    const key = `${category}-${index}`
    return openItems.value[key] || false
  }

  const getCategoryIcon = (category) => {
    const icons = {
      karma: 'fa6-solid:star',
      seals: 'fa6-solid:certificate',
      voting: 'fa6-solid:arrow-up',
      posts: 'fa6-solid:newspaper',
      lists: 'fa6-solid:bookmark',
      community: 'fa6-solid:users',
      account: 'fa6-solid:user-gear',
      relationships: 'fa6-solid:link',
      search: 'fa6-solid:magnifying-glass',
    }
    return icons[category] || 'fa6-solid:circle-info'
  }

  const fetchFaq = async () => {
    loading.value = true
    error.value = null

    try {
      const { $api } = useNuxtApp()
      const response = await $api.faq.getAll()
      faqData.value = response.data.data
    } catch (err) {
      console.error('Error loading FAQ:', err)
      error.value = t('faq.error_loading')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchFaq()
  })

  useHead({
    title: () => t('faq.title'),
    meta: [
      {
        name: 'description',
        content: () => t('faq.meta_description'),
      },
    ],
  })
</script>

<style scoped>
  .faq-item {
    border-color: var(--color-border-default);
  }
</style>
