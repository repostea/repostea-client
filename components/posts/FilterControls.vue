<template>
  <div ref="filterDropdownRef" class="filter-controls">
    <div class="flex items-center">
      <button
        class="control-button flex items-center justify-between py-0.5 px-2 text-xs font-medium transition-all focus:outline-none rounded-md max-w-[120px] sm:max-w-none"
        :class="{
          active: isExpanded,
          'text-primary dark:text-primary-light bg-primary/10 border border-primary':
            contentTypeFilter,
          'border border-transparent': !contentTypeFilter,
        }"
        :title="$t('filters.content_type')"
        :aria-expanded="isExpanded"
        aria-haspopup="menu"
        @click.stop="toggleDropdown"
      >
        <div class="flex items-center min-w-0">
          <Icon :name="activeFilterIcon" class="mr-1 flex-shrink-0" aria-hidden="true" />
          <span class="truncate">{{ activeFilterLabel }}</span>
        </div>
        <Icon
          :name="isExpanded ? 'fa6-solid:chevron-up' : 'fa6-solid:chevron-down'"
          class="ml-1 text-xs flex-shrink-0"
          aria-hidden="true"
        />
      </button>

      <div
        v-if="isExpanded"
        class="control-dropdown absolute mt-1"
        role="menu"
      >
        <div class="flex flex-col p-2">
          <button
            class="filter-button text-left px-4 py-2 rounded-md"
            :class="{ active: !contentTypeFilter }"
            role="menuitem"
            @click="setContentTypeFilter(null)"
          >
            <Icon name="fa6-solid:globe" class="mr-2" aria-hidden="true" />
            <span>{{ $t('filters.all') }}</span>
          </button>
          <button
            class="filter-button text-left px-4 py-2 rounded-md"
            :class="{ active: contentTypeFilter === 'text' }"
            role="menuitem"
            @click="setContentTypeFilter('text')"
          >
            <Icon name="fa6-solid:file-lines" class="mr-2" aria-hidden="true" />
            <span>{{ $t('filters.text') }}</span>
          </button>
          <button
            class="filter-button text-left px-4 py-2 rounded-md"
            :class="{ active: contentTypeFilter === 'link' }"
            role="menuitem"
            @click="setContentTypeFilter('link')"
          >
            <Icon name="fa6-solid:link" class="mr-2" aria-hidden="true" />
            <span>{{ $t('filters.link') }}</span>
          </button>
          <button
            class="filter-button text-left px-4 py-2 rounded-md"
            :class="{ active: contentTypeFilter === 'video' }"
            role="menuitem"
            @click="setContentTypeFilter('video')"
          >
            <Icon name="fa6-solid:video" class="mr-2" aria-hidden="true" />
            <span>{{ $t('filters.video') }}</span>
          </button>
          <button
            class="filter-button text-left px-4 py-2 rounded-md"
            :class="{ active: contentTypeFilter === 'audio' }"
            role="menuitem"
            @click="setContentTypeFilter('audio')"
          >
            <Icon name="fa6-solid:headphones" class="mr-2" aria-hidden="true" />
            <span>{{ $t('filters.audio') }}</span>
          </button>
          <button
            class="filter-button text-left px-4 py-2 rounded-md"
            :class="{ active: contentTypeFilter === 'poll' }"
            role="menuitem"
            @click="setContentTypeFilter('poll')"
          >
            <Icon name="fa6-solid:square-poll-vertical" class="mr-2" aria-hidden="true" />
            <span>{{ $t('filters.poll') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useUserPreferencesStore } from '~/stores/userPreferences'
  import { useI18n } from '#i18n'

  // We need useI18n for the $t in the template
  useI18n()
  const userPreferencesStore = useUserPreferencesStore()

  // State for dropdown
  const isExpanded = ref(false)
  const filterDropdownRef = ref(null)

  // Get the current content type filter (temporary, not saved)
  const contentTypeFilter = computed(() => {
    return userPreferencesStore.getContentTypeFilter
  })

  // Get the label for the current filter
  const { t } = useI18n()
  const activeFilterLabel = computed(() => {
    if (!contentTypeFilter.value) {
      return t('filters.all')
    }
    return t(`filters.${contentTypeFilter.value}`)
  })

  // Get the icon for the current filter
  const activeFilterIcon = computed(() => {
    const icons = {
      text: 'fa6-solid:file-lines',
      link: 'fa6-solid:link',
      video: 'fa6-solid:video',
      audio: 'fa6-solid:headphones',
      poll: 'fa6-solid:square-poll-vertical',
    }
    return icons[contentTypeFilter.value] || 'fa6-solid:filter'
  })

  function toggleDropdown() {
    isExpanded.value = !isExpanded.value

    // Emit event to close other dropdowns
    if (isExpanded.value && process.client) {
      // Dispatch custom event to close other dropdowns
      window.dispatchEvent(new CustomEvent('close-other-dropdowns', {
        detail: { source: 'filter-controls' }
      }))
    }
  }

  // Set the content type filter (temporary, not saved)
  function setContentTypeFilter(contentType) {
    // Set the temporary filter (not saved to localStorage or database)
    userPreferencesStore.setContentTypeFilter(contentType)

    // Close the dropdown after selection
    isExpanded.value = false

    // Emit an event to notify parent components that the filter has changed
    emit('filter-changed', contentType)
  }

  // Handle clicks outside the dropdown to close it
  function handleClickOutside(event) {
    if (
      isExpanded.value &&
      filterDropdownRef.value &&
      !filterDropdownRef.value.contains(event.target)
    ) {
      isExpanded.value = false
    }
  }

  // Listen for events to close this dropdown when others open
  function handleCloseDropdown(event) {
    if (event.detail?.source !== 'filter-controls') {
      isExpanded.value = false
    }
  }

  // Add event listener for clicks outside the dropdown
  onMounted(() => {
    if (process.client) {
      document.addEventListener('click', handleClickOutside)
      window.addEventListener('close-other-dropdowns', handleCloseDropdown)
    }
  })

  // Clean up event listener
  onUnmounted(() => {
    if (process.client) {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('close-other-dropdowns', handleCloseDropdown)
    }
  })

  // Define emits
  const emit = defineEmits(['filter-changed'])
</script>

<style scoped>
  .filter-controls {
    @apply flex items-center relative;
    z-index: 10;
  }

  .control-button {
    @apply bg-transparent transition-colors;
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

  .filter-button {
    @apply transition-colors;
    color: var(--color-text-secondary);
  }

  .filter-button:hover {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
  }

  .filter-button.active {
    background-color: var(--color-bg-hover);
    color: var(--color-primary);
  }

  .control-dropdown {
    @apply min-w-[200px] shadow-sm rounded-md;
    background-color: var(--color-bg-card);
    top: 100%;
    left: 0;
    z-index: 20;
  }

  @media (max-width: 640px) {
    .control-dropdown {
      left: 0;
      right: auto;
      min-width: 160px;
      max-width: calc(100vw - 32px);
    }
  }
</style>
