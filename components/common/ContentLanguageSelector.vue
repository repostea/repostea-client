<template>
  <div ref="languageDropdownRef" class="language-selector relative">
    <div>
      <button
        class="control-button flex items-center justify-between py-0.5 px-2 text-xs font-medium transition-all focus:outline-none rounded-md relative max-w-[140px] sm:max-w-none sm:min-w-[130px]"
        :title="t('common.content_language')"
        :aria-expanded="showDropdown"
        aria-haspopup="dialog"
        :class="{
          active: showDropdown,
          'no-filter-highlight': !selectedLanguages || selectedLanguages.length === 0
        }"
        @click="toggleDropdown"
      >
        <div class="flex items-center min-w-0">
          <Icon name="fa6-solid:globe" class="mr-1 flex-shrink-0" aria-hidden="true" />
          <span class="truncate">{{ selectedLanguagesDisplay }}</span>
        </div>
        <Icon
          :name="showDropdown ? 'fa6-solid:chevron-up' : 'fa6-solid:chevron-down'"
          class="ml-1 text-xs flex-shrink-0"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Modal Overlay -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDropdown"
          class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="showDropdown = false"
        >
          <div
            class="modal-content rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            @click.stop
          >
            <!-- Modal Header -->
            <div class="modal-header px-6 py-4 flex justify-between items-center">
              <div>
                <h3 class="text-lg font-semibold" style="color: var(--color-text-primary)">
                  {{ t('common.select_languages') }}
                </h3>
                <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
                  {{ t('common.select_languages_help') }}
                </p>
              </div>
              <button
                class="close-button transition-colors flex items-center justify-center"
                :aria-label="t('common.close')"
                @click="showDropdown = false"
              >
                <Icon name="fa6-solid:xmark" class="text-xl" aria-hidden="true" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="flex-1 overflow-y-auto">
              <!-- Search input -->
              <div class="modal-section px-6 py-4">
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="fa6-solid:magnifying-glass" style="color: var(--color-text-muted)" aria-hidden="true" />
                  </div>
                  <input
                    v-model="searchQuery"
                    type="text"
                    :placeholder="t('submit.form.search_language')"
                    :aria-label="t('submit.form.search_language')"
                    class="modal-input w-full pl-10 pr-3 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                </div>
              </div>

              <!-- Languages List -->
              <div class="px-6 py-4">
        <div
          v-for="locale in filteredAndSortedLocales"
          :key="locale.code"
          class="language-item flex items-center px-4 py-2 text-sm"
        >
          <input
            :id="`lang-${locale.code}`"
            v-model="selectedLanguages"
            type="checkbox"
            :value="locale.code"
            class="w-6 h-6 mr-2 rounded text-primary focus:ring-primary"
            @change="clearSearchOnSelect"
          >
          <label :for="`lang-${locale.code}`" class="flex items-center cursor-pointer flex-1">
            <span class="inline-block w-6 mr-2">{{ locale.flag }}</span>
            <span class="inline-block w-8 font-semibold">{{ locale.code.toUpperCase() }}</span>
            <span class="ml-1">{{ locale.native }}</span>
          </label>
        </div>

                <!-- Empty state -->
                <div v-if="filteredAndSortedLocales.length === 0" class="py-12 text-center">
                  <Icon name="fa6-solid:magnifying-glass" style="color: var(--color-text-muted)" class="text-3xl mb-3" aria-hidden="true" />
                  <p class="text-sm" style="color: var(--color-text-secondary)">
                    {{ t('submit.form.no_language_found') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer px-6 py-4 flex justify-between items-center">
              <button
                class="reset-button text-sm font-medium transition-colors"
                @click="resetLanguages"
              >
                {{ t('common.reset') }}
              </button>
              <button
                class="px-6 py-2.5 bg-primary rounded-lg hover:bg-primary-dark transition-all duration-200 flex items-center font-medium btn-primary-text"
                :disabled="isApplying"
                @click="applyLanguages"
              >
                <Icon v-if="isApplying" name="fa6-solid:spinner" class="mr-2 animate-spin" aria-hidden="true" />
                {{ isApplying ? t('common.applying') : t('common.apply') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
  import { useI18n } from '#i18n'
  import languages from '~/utils/language-data'
  import { usePostsStore } from '~/stores/posts'
  import { useUserPreferencesStore } from '~/stores/userPreferences'

  const { t } = useI18n()
  const postsStore = usePostsStore()
  const userPrefsStore = useUserPreferencesStore()

  const languageDropdownRef = ref(null)
  const showDropdown = ref(false)
  const searchQuery = ref('')

  // Use computed to get selectedLanguages from store
  const selectedLanguages = computed({
    get: () => userPrefsStore.selectedLanguages,
    set: (value) => {
      // Update store directly - it will handle cookie and database
      userPrefsStore.selectedLanguages = value
    }
  })

  // Initialize event listeners
  onMounted(() => {
    // Add event listener for clicks outside the dropdown
    if (import.meta.client) {
      window.addEventListener('click', handleClickOutside)
      // Listen for open-language-filter event from post cards
      window.addEventListener('open-language-filter', handleOpenLanguageFilter)
    }
  })

  // Clean up event listener
  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('open-language-filter', handleOpenLanguageFilter)
    }
  })

  // Handle clicks outside the dropdown
  function handleClickOutside(event) {
    // Check if the dropdown is open and the click is outside the dropdown
    if (
      showDropdown.value &&
      languageDropdownRef.value &&
      !languageDropdownRef.value.contains(event.target)
    ) {
      // Close the dropdown
      showDropdown.value = false
    }
  }

  // Handle open language filter event from post cards
  function handleOpenLanguageFilter(_event) {
    // Use nextTick to open the modal after the current click event has finished propagating
    // This prevents the handleClickOutside from immediately closing the modal
    nextTick(() => {
      showDropdown.value = true
    })
  }

  const availableLocales = computed(() => {
    // Use all languages from language-data.js that are marked as active
    // Exclude hidden interface languages (easter egg dialects)
    return languages
      .filter((lang) => lang.active && !lang.interfaceHidden)
      .map((lang) => {
        return {
          code: lang.code,
          name: lang.name,
          native: lang.native,
          flag: lang.flag,
        }
      })
  })

  // Filtered and sorted locales (selected first, then alphabetically)
  const filteredAndSortedLocales = computed(() => {
    let locales = availableLocales.value

    // Apply search filter if there's a search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      locales = locales.filter(locale => {
        return (
          locale.name.toLowerCase().includes(query) ||
          locale.native.toLowerCase().includes(query) ||
          locale.code.toLowerCase().includes(query)
        )
      })
    }

    // Sort: selected languages first, then alphabetically by native name
    return locales.sort((a, b) => {
      const aSelected = selectedLanguages.value.includes(a.code)
      const bSelected = selectedLanguages.value.includes(b.code)

      // If one is selected and the other is not, selected comes first
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1

      // If both are selected or both are not selected, sort alphabetically by native name
      return a.native.localeCompare(b.native)
    })
  })

  // Display text for selected languages
  const selectedLanguagesDisplay = computed(() => {
    if (!selectedLanguages.value || selectedLanguages.value.length === 0) {
      return t('common.all_languages')
    }

    if (selectedLanguages.value.length === 1) {
      const lang = availableLocales.value.find((l) => l.code === selectedLanguages.value[0])
      return lang ? lang.native : selectedLanguages.value[0].toUpperCase()
    }

    // Show language names for 2-3 languages, otherwise show count
    if (selectedLanguages.value.length <= 3) {
      const languageNames = selectedLanguages.value
        .map(code => {
          const lang = availableLocales.value.find((l) => l.code === code)
          return lang ? lang.native : code.toUpperCase()
        })
        .join(', ')
      return languageNames
    }

    return t('common.multiple_languages', { count: selectedLanguages.value.length })
  })

  function toggleDropdown(event) {
    // Stop propagation to prevent the click outside handler from immediately closing the dropdown
    event.stopPropagation()
    showDropdown.value = !showDropdown.value
  }

  function clearSearchOnSelect() {
    // Clear search query when selecting/deselecting a language
    searchQuery.value = ''
  }

  function resetLanguages() {
    // Reset to show all languages (no filter)
    userPrefsStore.setSelectedLanguages([])
    applyLanguages()
  }

  const isApplying = ref(false)

  function applyLanguages() {
    // Save selected languages to store (will update cookie and database)
    userPrefsStore.setSelectedLanguages(selectedLanguages.value)

    // Show loading state
    isApplying.value = true

    // Refresh posts with selected languages
    refreshPosts().finally(() => {
      // Hide loading state and close dropdown
      isApplying.value = false
      showDropdown.value = false
    })
  }

  async function refreshPosts() {
    try {
      // Refresh posts with selected languages
      // If no languages selected, pass null to show all posts
      const languageFilter = selectedLanguages.value.length === 0 ? null : selectedLanguages.value

      await postsStore.fetchPosts(
        1, // page
        postsStore.sort,
        postsStore.direction,
        43200, // interval
        25, // perPage
        null, // contentType
        languageFilter // languages (null = all languages)
      )
    } catch (error) {
      console.error('Error refreshing posts with language filter:', error)
    }
  }
</script>

<style scoped>
  .language-selector {
    @apply flex items-center;
  }

  .control-button {
    @apply bg-transparent transition-colors rounded-md;
    color: var(--color-text-secondary);
    height: 24px;
  }

  .control-button:hover {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
  }

  .control-button.active {
    background-color: var(--color-bg-elevated);
    color: var(--color-primary);
  }

  /* Modal styles */
  .modal-overlay {
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  .modal-content {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    background-color: var(--color-bg-card);
  }

  /* Modal animations */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-enter-active .modal-content,
  .modal-leave-active .modal-content {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-from .modal-content,
  .modal-leave-to .modal-content {
    transform: scale(0.9);
    opacity: 0;
  }

  .control-button.no-filter-highlight {
    background-color: rgba(var(--color-primary-rgb), 0.15);
    color: var(--color-primary);
    border: 2px solid rgba(var(--color-primary-rgb), 0.3);
    font-weight: 600;
    animation: pulse-subtle 2s ease-in-out infinite;
  }

  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.85;
    }
  }

  .control-dropdown {
    @apply min-w-[250px] shadow-md;
  }

  /* Modal elements */
  .modal-header,
  .modal-section {
    border-bottom: 1px solid var(--color-border-default);
  }

  .modal-footer {
    border-top: 1px solid var(--color-border-default);
    background-color: var(--color-bg-hover);
  }

  .modal-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .language-item {
    color: var(--color-text-primary);
  }

  .language-item:hover {
    background-color: var(--color-bg-hover);
  }

  .close-button {
    color: var(--color-text-muted);
  }

  .close-button:hover {
    color: var(--color-text-primary);
  }

  .reset-button {
    color: var(--color-text-secondary);
  }

  .reset-button:hover {
    color: var(--color-primary);
  }
</style>
