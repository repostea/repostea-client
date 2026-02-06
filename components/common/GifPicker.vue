<template>
  <div class="relative">
    <button
      v-if="!hideButton"
      type="button"
      class="gif-toggle-btn rounded-md transition-colors"
      :class="buttonClass"
      :title="t('gifs.insert')"
      :aria-label="t('gifs.insert')"
      :disabled="disabled || !isConfigured"
      @click="togglePicker"
    >
      <Icon name="fa6-solid:photo-film" class="text-base text-primary" aria-hidden="true" />
      <span v-if="showLabel" class="flex flex-col items-start leading-none">
        <span class="text-[10px]">{{ t('gifs.insert_action') }}</span>
        <span class="text-[10px]">GIF</span>
      </span>
    </button>

    <Teleport to="body">
      <!-- Backdrop -->
      <div v-if="isOpen" class="fixed inset-0 bg-black/50 z-40" @click="isOpen = false" />

      <!-- Picker Modal -->
      <div
        v-if="isOpen"
        class="gif-picker fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-xl p-4 z-50 w-[calc(100vw-1rem)] h-[calc(100vh-2rem)] md:w-[700px] md:h-auto md:max-h-[80vh] flex flex-col"
        @click.stop
      >
        <!-- Header with search -->
        <div class="flex items-center gap-2 mb-3">
          <div class="relative flex-1">
            <Icon
              name="fa6-solid:magnifying-glass"
              class="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted text-sm"
              aria-hidden="true"
            />
            <input
              ref="searchInput"
              v-model="searchTerm"
              type="text"
              class="gif-search-input w-full text-sm rounded-md pl-8 pr-3 py-2"
              :placeholder="t('gifs.search_placeholder')"
              :aria-label="t('gifs.search_placeholder')"
              @input="debouncedSearch"
              @keydown.enter.prevent
            />
          </div>
          <button
            type="button"
            class="gif-close-btn p-2 rounded-md transition-colors flex items-center justify-center"
            :title="t('common.close')"
            :aria-label="t('common.close')"
            @click="isOpen = false"
          >
            <Icon
              name="fa6-solid:xmark"
              class="text-text-muted dark:text-text-dark-muted"
              aria-hidden="true"
            />
          </button>
        </div>

        <!-- GIF Grid -->
        <div ref="gridContainer" class="gif-grid flex-1 overflow-y-auto" @scroll="handleScroll">
          <!-- Loading state -->
          <div v-if="isLoading && gifs.length === 0" class="flex items-center justify-center py-8">
            <div
              class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>

          <!-- Error state -->
          <div v-else-if="error" class="text-center py-8">
            <Icon
              name="fa6-solid:circle-exclamation"
              class="text-2xl text-red-500 mb-2"
              aria-hidden="true"
            />
            <p class="text-sm text-text-muted dark:text-text-dark-muted">{{ error }}</p>
            <button
              type="button"
              class="mt-2 text-sm text-primary hover:underline"
              @click="retryLoad"
            >
              {{ t('common.retry') }}
            </button>
          </div>

          <!-- Empty state -->
          <div v-else-if="gifs.length === 0 && !isLoading" class="text-center py-8">
            <Icon
              name="fa6-regular:face-meh"
              class="text-3xl text-text-muted dark:text-text-dark-muted mb-2"
              aria-hidden="true"
            />
            <p class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ t('gifs.no_results') }}
            </p>
          </div>

          <!-- GIF Masonry Grid -->
          <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              v-for="gif in gifs"
              :key="gif.id"
              type="button"
              class="gif-item relative overflow-hidden rounded-md transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary"
              :style="{ aspectRatio: gif.width / gif.height }"
              @click="selectGif(gif)"
            >
              <img
                :src="gif.preview"
                :alt="gif.title"
                class="w-full h-full object-cover"
                loading="lazy"
                @error="handleImageError"
              />
              <!-- Hover overlay -->
              <div class="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
            </button>
          </div>

          <!-- Load more indicator -->
          <div v-if="isLoading && gifs.length > 0" class="flex items-center justify-center py-4">
            <div
              class="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        </div>

        <!-- Tenor attribution -->
        <div class="flex items-center justify-center pt-3 border-t border-default mt-3">
          <a
            href="https://tenor.com"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 text-xs text-text-muted dark:text-text-dark-muted hover:text-primary transition-colors"
          >
            <span>{{ t('gifs.powered_by') }}</span>
            <span class="font-semibold">Tenor</span>
          </a>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
  import { useI18n } from '#i18n'
  import { useGifSearch } from '~/composables/useGifSearch'

  const { t } = useI18n()

  defineProps({
    buttonClass: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showLabel: {
      type: Boolean,
      default: false,
    },
    hideButton: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['select'])

  const isOpen = ref(false)
  const searchTerm = ref('')
  const searchInput = ref(null)
  const gridContainer = ref(null)

  // Debounce timer
  let debounceTimer = null

  const { gifs, isLoading, error, isConfigured, hasMore, search, loadFeatured, loadMore, clear } =
    useGifSearch({ limit: 24 })

  // Debounced search function
  function debouncedSearch() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      if (searchTerm.value.trim()) {
        search(searchTerm.value)
      } else {
        loadFeatured()
      }
    }, 300)
  }

  // Handle scroll for infinite loading
  function handleScroll(event) {
    const container = event.target
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight

    // Load more when near bottom (100px threshold)
    if (scrollBottom < 100 && hasMore.value && !isLoading.value) {
      loadMore()
    }
  }

  // Select a GIF
  function selectGif(gif) {
    emit('select', gif.url, gif.title)
    isOpen.value = false
    searchTerm.value = ''
    clear()
  }

  // Handle image load errors
  function handleImageError(event) {
    // Hide broken images
    event.target.style.display = 'none'
  }

  // Retry loading
  function retryLoad() {
    if (searchTerm.value.trim()) {
      search(searchTerm.value)
    } else {
      loadFeatured()
    }
  }

  // Toggle picker
  function togglePicker() {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      searchTerm.value = ''
      loadFeatured()
      // Focus search input after opening
      nextTick(() => {
        searchInput.value?.focus()
      })
    } else {
      clear()
    }
  }

  // Watch for picker open/close
  watch(isOpen, (newValue) => {
    if (!newValue && debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  // Handle click outside
  function handleClickOutside(event) {
    if (
      isOpen.value &&
      !event.target.closest('.gif-picker') &&
      !event.target.closest('.gif-toggle-btn')
    ) {
      isOpen.value = false
      clear()
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      document.addEventListener('click', handleClickOutside)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      document.removeEventListener('click', handleClickOutside)
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  defineExpose({
    open: () => {
      setTimeout(() => {
        isOpen.value = true
        searchTerm.value = ''
        loadFeatured()
        nextTick(() => {
          searchInput.value?.focus()
        })
      }, 0)
    },
    close: () => {
      isOpen.value = false
      clear()
    },
    toggle: togglePicker,
  })
</script>

<style scoped>
  .gif-toggle-btn:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
  }

  .gif-toggle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .gif-picker {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .gif-search-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .gif-search-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
  }

  .gif-close-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .gif-grid {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-default) transparent;
  }

  .gif-grid::-webkit-scrollbar {
    width: 6px;
  }

  .gif-grid::-webkit-scrollbar-track {
    background: transparent;
  }

  .gif-grid::-webkit-scrollbar-thumb {
    background-color: var(--color-border-default);
    border-radius: 3px;
  }

  .gif-item {
    background-color: var(--color-bg-hover);
    min-height: 80px;
  }

  .gif-item img {
    background-color: var(--color-bg-hover);
  }

  .border-default {
    border-color: var(--color-border-default);
  }
</style>
