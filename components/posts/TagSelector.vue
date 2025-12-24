<template>
  <div>
    <label class="block text-sm font-medium mb-1">{{ t('submit.form.tags') }}</label>
    <div class="relative">
      <div
        class="tag-selector-container w-full min-h-[42px] flex flex-wrap items-center rounded-md px-3 py-2 mb-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent"
        :class="{ 'border-red-500': error }"
        @click="focusInput"
      >
        <div
          v-for="tag in selectedTags"
          :key="tag.id"
          class="tag-selector-tag flex items-center rounded-full px-3 py-1 text-sm mr-2 mb-1"
        >
          <span>{{ displayName(tag) }}</span>
          <button
            class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            type="button"
            :aria-label="`${t('common.remove')} ${displayName(tag)}`"
            @click.stop.prevent="removeTag(tag)"
          >
            <Icon name="fa6-solid:xmark" class="text-xs" aria-hidden="true" />
          </button>
        </div>
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="flex-1 min-w-[8rem] bg-transparent border-none outline-none focus:ring-0 py-1 text-sm"
          :placeholder="getPlaceholder()"
          @input="handleInput"
          @keydown.backspace="handleBackspace"
          @keydown.enter.prevent="focusInput"
          @focus="focusInput"
        >
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {{ selectedTags.length }}/{{ maxTags }} {{ t('submit.form.tags_selected') }}
      </div>

      <div class="relative mb-4">
        <h4 class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {{ t('submit.form.categories') }}
        </h4>
        <div
          ref="categoriesContainer"
          class="flex overflow-x-auto pb-2 scrollbar-hide whitespace-nowrap scroll-smooth"
        >
          <button
            class="tag-selector-cat-btn px-3 py-2 text-sm rounded-full border mr-2 flex-shrink-0 transition-colors"
            :class="
              selectedCategory === null
                ? 'bg-primary text-white border-primary'
                : 'tag-selector-cat-inactive'
            "
            type="button"
            @click.stop.prevent="selectCategory(null)"
          >
            {{ t('common.all') }}
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            class="tag-selector-cat-btn px-3 py-2 text-sm rounded-full border mr-2 flex-shrink-0 transition-colors shadow-sm"
            :class="
              selectedCategory && selectedCategory.id === category.id
                ? 'bg-primary text-white border-primary'
                : 'tag-selector-cat-inactive'
            "
            type="button"
            @click.stop.prevent="selectCategory(category)"
          >
            {{ displayName(category) }}
          </button>
        </div>

        <button
          v-if="canScrollLeft"
          class="tag-selector-scroll-btn absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full shadow-md"
          type="button"
          :aria-label="t('common.scroll_left')"
          @click.prevent="scrollCategories('left')"
        >
          <Icon name="fa6-solid:chevron-left" aria-hidden="true" />
        </button>
        <button
          v-if="canScrollRight"
          class="tag-selector-scroll-btn absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full shadow-md"
          type="button"
          :aria-label="t('common.scroll_right')"
          @click.prevent="scrollCategories('right')"
        >
          <Icon name="fa6-solid:chevron-right" aria-hidden="true" />
        </button>
      </div>

      <div
        class="tag-selector-list w-full rounded-md shadow-sm overflow-y-auto"
        style="max-height: 240px"
      >
        <div v-if="loading" class="p-4 text-center text-gray-500 flex items-center justify-center"><Icon name="fa6-solid:spinner" class="mr-2 flex-shrink-0 animate-spin" aria-hidden="true" /> <span>{{ t('common.loading') }}</span>
        </div>

        <div v-else-if="filteredTags.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
          <button
            v-for="tag in filteredTags"
            :key="tag.id"
            class="tag-selector-item text-left px-3 py-2 text-sm rounded truncate overflow-hidden"
            :class="{
              'tag-selector-selected': isTagSelected(tag),
              'opacity-50': isTagSelected(tag),
            }"
            type="button"
            @click.stop.prevent="selectTag(tag)"
          >
            <div class="flex items-center">
              <span class="flex-grow truncate">{{ displayName(tag) }}</span>
              <Icon name="fa6-solid:check" class="text-primary ml-1" aria-hidden="true" />
            </div>
            <span
              v-if="tag.category"
              class="text-xs text-gray-500 dark:text-gray-400 block truncate"
            >
              {{ displayName(tag.category) }}
            </span>
          </button>
        </div>

        <div v-else class="p-4 text-center text-gray-500">
          {{ searchQuery ? t('common.no_results') : t('common.no_tags') }}
        </div>
      </div>

      <p v-if="error" class="mt-1 text-sm text-red-500">
        {{ error }}
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ t('submit.form.tags_help') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
  import { useNuxtApp } from '#app'
  import { useI18n } from '#i18n'

  const { t } = useI18n()
  const { $api } = useNuxtApp()

  const props = defineProps({
    modelValue: {
      type: Array,
      default: () => [],
    },
    error: {
      type: String,
      default: '',
    },
    maxTags: {
      type: Number,
      default: 5,
    },
  })

  const emit = defineEmits(['update:modelValue', 'update:value'])

  const inputRef = ref(null)
  const categoriesContainer = ref(null)
  const selectedTags = ref([])
  const searchQuery = ref('')
  const loading = ref(false)
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const categories = ref([])
  const selectedCategory = ref(null)
  const allTags = ref([])
  const updating = ref(false)

  const filteredTags = computed(() => {
    if (loading.value) return []

    let result = allTags.value

    if (selectedCategory.value) {
      result = result.filter((tag) => tag.category_id === selectedCategory.value.id)
    }

    if (searchQuery.value.trim()) {
      const searchText = searchQuery.value.toLowerCase().trim()
      return result.filter((tag) => {
        const tagName = displayName(tag).toLowerCase()
        return tagName.includes(searchText)
      })
    }

    return result
  })

  const isTagSelected = (tag) => {
    return selectedTags.value.some((t) => t.id === tag.id)
  }

  watch(
    () => props.modelValue,
    (newVal) => {
      if (updating.value) return
      if (newVal && Array.isArray(newVal)) {
        selectedTags.value = JSON.parse(JSON.stringify(newVal))
      }
    },
    { immediate: true }
  )

  watch(
    selectedTags,
    (newVal) => {
      if (updating.value) return
      updating.value = true

      // Emitir eventos con una copia profunda para evitar referencias compartidas
      const tagsCopy = JSON.parse(JSON.stringify(newVal))
      emit('update:modelValue', tagsCopy)
      emit('update:value', tagsCopy)

      setTimeout(() => {
        updating.value = false
      }, 0)
    },
    { deep: true }
  )

  onMounted(async () => {
    loading.value = true
    try {
      await fetchAllTagsAndCategories()
      setTimeout(() => {
        updateScrollButtons()
        if (categoriesContainer.value) {
          categoriesContainer.value.addEventListener('scroll', updateScrollButtons)
        }
        window.addEventListener('resize', updateScrollButtons)
      }, 200)
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      loading.value = false
    }
  })

  onBeforeUnmount(() => {
    if (categoriesContainer.value) {
      categoriesContainer.value.removeEventListener('scroll', updateScrollButtons)
    }
    window.removeEventListener('resize', updateScrollButtons)
  })

  const getPlaceholder = () => {
    if (selectedTags.value.length >= props.maxTags) {
      return t('submit.form.max_tags_reached')
    } else if (selectedTags.value.length === 0) {
      return t('submit.form.tags_placeholder')
    } else {
      return t('submit.form.add_more_tags')
    }
  }

  const focusInput = () => {
    if (inputRef.value) {
      inputRef.value.focus()
    }
  }

  const handleInput = () => {
    if (searchQuery.value.trim() && selectedCategory.value !== null) {
      selectedCategory.value = null
    }
  }

  const scrollCategories = (direction) => {
    if (!categoriesContainer.value) return

    const container = categoriesContainer.value
    const scrollAmount = container.clientWidth * 0.8

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }

    setTimeout(updateScrollButtons, 300)
  }

  const updateScrollButtons = () => {
    if (!categoriesContainer.value) return

    const container = categoriesContainer.value
    canScrollLeft.value = container.scrollLeft > 0
    canScrollRight.value = container.scrollLeft < container.scrollWidth - container.clientWidth - 5
  }

  const selectTag = (tag) => {
    if (isTagSelected(tag)) {
      removeTag(tag)
      return
    }

    if (selectedTags.value.length >= props.maxTags) {
      return
    }

    const tagCopy = { ...tag }
    const newTags = selectedTags.value.slice()
    newTags.push(tagCopy)
    selectedTags.value = newTags
    searchQuery.value = ''
    focusInput()
  }

  const removeTag = (tag) => {
    const newTags = selectedTags.value.filter((t) => t.id !== tag.id)
    selectedTags.value = newTags
    focusInput()
  }

  const handleBackspace = (event) => {
    if (searchQuery.value === '' && selectedTags.value.length > 0) {
      event.preventDefault()
      removeTag(selectedTags.value[selectedTags.value.length - 1])
    }
  }

  const displayName = (item) => {
    if (!item) return ''
    return item.name || t('tags.' + item.name_key)
  }

  const selectCategory = (category) => {
    selectedCategory.value = category
    searchQuery.value = ''
  }

  const fetchAllTagsAndCategories = async () => {
    try {
      const response = await $api.tags.getTagCategories()
      categories.value = response.data.data || []
      const tagsArray = []

      categories.value.forEach((category) => {
        if (category.tags && Array.isArray(category.tags)) {
          category.tags.forEach((tag) => {
            tagsArray.push({
              ...tag,
              category_id: category.id,
              category: {
                id: category.id,
                name: category.name,
                name_key: category.name_key,
              },
            })
          })
        }
      })

      allTags.value = tagsArray
      return true
    } catch (error) {
      console.error('Error fetching categories and tags:', error)
      return false
    }
  }
</script>

<style scoped>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .tag-selector-container {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }

  .tag-selector-tag {
    background-color: var(--color-bg-subtle);
  }

  .tag-selector-cat-inactive {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-secondary);
    border-color: var(--color-border-default);
  }

  .tag-selector-scroll-btn {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .tag-selector-list {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .tag-selector-item {
    border: 1px solid var(--color-border-default);
  }

  .tag-selector-item:hover {
    background-color: var(--color-bg-hover);
  }

  .tag-selector-selected {
    background-color: var(--color-bg-subtle);
  }
</style>
