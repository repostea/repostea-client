<template>
  <div class="space-y-3">
    <!-- Selected language (single display with change button) -->
    <div
      v-if="selectedLanguage"
      class="lang-selector-selected flex items-center justify-between p-2 rounded-lg"
    >
      <div class="flex items-center gap-2">
        <span class="text-xl">{{ selectedLanguage.flag }}</span>
        <div>
          <div class="font-medium text-primary dark:text-primary text-sm">
            {{ selectedLanguage.native }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedLanguage.name }}
          </div>
        </div>
      </div>
      <button
        type="button"
        class="lang-selector-change-btn px-2 py-1 text-xs rounded transition-colors inline-flex items-center"
        :title="t('common.change')"
        @click="removeLanguage()"
      >
        <Icon name="fa6-solid:pen-to-square" class="mr-1" aria-hidden="true" />
        {{ t('common.change') }}
      </button>
    </div>

    <!-- Search input (only show if no language selected or editing) -->
    <div v-if="!selectedLanguage || showDropdown" class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon name="fa6-solid:magnifying-glass" class="text-gray-400 text-sm" aria-hidden="true" />
      </div>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="t('submit.form.search_language')"
        class="lang-selector-input w-full pl-10 pr-4 py-3 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        @focus="showDropdown = true"
        @keydown.escape="closeDropdown"
      >
    </div>

    <!-- Dropdown with filtered languages -->
    <div
      v-if="showDropdown && filteredLanguages.length > 0"
      class="lang-selector-dropdown rounded-lg shadow-lg max-h-80 overflow-y-auto"
    >
      <button
        v-for="lang in filteredLanguages"
        :key="lang.code"
        type="button"
        class="lang-selector-option w-full flex items-center gap-2 px-3 py-2 transition-colors text-left"
        @click="selectLanguage(lang)"
      >
        <span class="text-lg">{{ lang.flag }}</span>
        <div class="flex-1">
          <div class="font-medium text-text dark:text-text-dark text-sm">
            {{ lang.native }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ lang.name }}
          </div>
        </div>
        <Icon name="fa6-solid:plus" class="text-primary text-xs" aria-hidden="true" />
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="showDropdown && searchQuery && filteredLanguages.length === 0"
      class="lang-selector-empty rounded-lg p-6 text-center"
    >
      <Icon
        name="fa6-solid:magnifying-glass"
        class="text-gray-400 text-3xl mb-2"
        aria-hidden="true"
      />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ t('submit.form.no_language_found') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useI18n } from '#i18n'
  import { languages } from '~/utils/language-data.js'

  const { t } = useI18n()

  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const searchQuery = ref('')
  const showDropdown = ref(false)
  const searchInput = ref(null)

  // Active languages from the data
  const activeLanguages = computed(() => {
    return languages.filter((lang) => lang.active)
  })

  // Selected language (single)
  const selectedLanguage = computed(() => {
    if (!props.modelValue) return null
    return activeLanguages.value.find((l) => l.code === props.modelValue) || null
  })

  // Filtered languages based on search query (excluding already selected)
  const filteredLanguages = computed(() => {
    if (!searchQuery.value) {
      // Show all active languages except selected one
      return activeLanguages.value.filter((lang) => lang.code !== props.modelValue)
    }

    const query = searchQuery.value.toLowerCase()
    return activeLanguages.value.filter((lang) => {
      // Exclude already selected
      if (lang.code === props.modelValue) {
        return false
      }
      // Filter by name or native name
      return (
        lang.name.toLowerCase().includes(query) ||
        lang.native.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
      )
    })
  })

  function selectLanguage(lang) {
    emit('update:modelValue', lang.code)
    searchQuery.value = ''
    showDropdown.value = false
  }

  function removeLanguage() {
    emit('update:modelValue', '')
    searchQuery.value = ''
    showDropdown.value = true
    // Focus on search after a tick to ensure dropdown is shown
    setTimeout(() => {
      searchInput.value?.focus()
    }, 50)
  }

  function closeDropdown() {
    showDropdown.value = false
    searchQuery.value = ''
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    const component = searchInput.value?.closest('.space-y-3')
    if (component && !component.contains(event.target)) {
      showDropdown.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<style scoped>
  .lang-selector-selected {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }

  .lang-selector-change-btn {
    color: var(--color-text-muted);
  }

  .lang-selector-change-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .lang-selector-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .lang-selector-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .lang-selector-option {
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .lang-selector-option:last-child {
    border-bottom: none;
  }

  .lang-selector-option:hover {
    background-color: var(--color-bg-hover);
  }

  .lang-selector-empty {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }
</style>
