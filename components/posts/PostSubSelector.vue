<template>
  <div class="space-y-3">
    <!-- Selected sub (single display with change button) -->
    <div
      v-if="selectedSub !== undefined"
      class="sub-selector-selected flex items-center justify-between p-2 rounded-lg"
    >
      <div class="flex items-center gap-2">
        <SubIcon v-if="selectedSub" :sub="selectedSub" size="md" />
        <div
          v-else
          class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
        >
          <Icon name="fa6-solid:earth-americas" aria-hidden="true" />
        </div>
        <div>
          <div class="font-medium text-primary dark:text-primary text-sm">
            {{ selectedSub ? `s/${selectedSub.name}` : t('subs.post_in_general') }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{
              selectedSub ? selectedSub.display_name || selectedSub.name : t('subs.visible_to_all')
            }}
          </div>
        </div>
      </div>
      <button
        type="button"
        class="sub-selector-change-btn px-2 py-1 text-xs rounded transition-colors inline-flex items-center"
        :title="t('common.change')"
        @click="changeSub()"
      >
        <Icon name="fa6-solid:pen-to-square" class="mr-1" aria-hidden="true" />
        {{ t('common.change') }}
      </button>
    </div>

    <!-- Warning: will subscribe on submit -->
    <div
      v-if="willSubscribe && selectedSub"
      class="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400"
    >
      <Icon name="fa6-solid:circle-info" class="flex-shrink-0" aria-hidden="true" />
      <span>{{ t('subs.will_subscribe_on_submit') }}</span>
    </div>

    <!-- Search input (only show if no sub selected or editing) -->
    <div v-if="selectedSub === undefined || showDropdown" class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon name="fa6-solid:magnifying-glass" class="text-gray-400 text-sm" aria-hidden="true" />
      </div>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="t('subs.search_placeholder')"
        class="sub-selector-input w-full pl-10 pr-4 py-3 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        @focus="showDropdown = true"
        @keydown.escape="closeDropdown"
      >
    </div>

    <!-- Dropdown with filtered subs (only my subs) -->
    <div
      v-if="showDropdown && filteredSubs.length > 0"
      class="sub-selector-dropdown rounded-lg shadow-lg max-h-80 overflow-y-auto"
    >
      <!-- General option (only if not selected) -->
      <button
        v-if="modelValue !== null"
        type="button"
        class="sub-selector-option w-full flex items-center gap-2 px-3 py-2 transition-colors text-left"
        @click="selectSub(null)"
      >
        <div
          class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        >
          <Icon name="fa6-solid:earth-americas" aria-hidden="true" />
        </div>
        <div class="flex-1">
          <div class="font-medium text-text dark:text-text-dark text-sm">
            {{ t('subs.post_in_general') }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('subs.visible_to_all') }}
          </div>
        </div>
        <Icon name="fa6-solid:plus" class="text-primary text-xs" aria-hidden="true" />
      </button>

      <!-- Filtered subs (my subs only) -->
      <button
        v-for="sub in filteredSubs"
        :key="sub.id"
        type="button"
        class="sub-selector-option w-full flex items-center gap-2 px-3 py-2 transition-colors text-left"
        @click="selectSub(sub.id, sub)"
      >
        <SubIcon :sub="sub" size="md" />
        <div class="flex-1">
          <div class="font-medium text-text dark:text-text-dark text-sm">s/{{ sub.name }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ sub.display_name || sub.name }}
          </div>
        </div>
        <Icon name="fa6-solid:plus" class="text-primary text-xs" aria-hidden="true" />
      </button>

      <!-- Open modal to see all subs -->
      <button
        type="button"
        class="sub-selector-option w-full flex items-center justify-center gap-2 px-3 py-2 transition-colors text-left text-primary"
        @click="openAllSubsModal"
      >
        <Icon name="fa6-solid:globe" class="text-sm" aria-hidden="true" />
        <span class="text-sm">
          {{ t('subs.show_all_subs') }}
        </span>
      </button>
    </div>

    <!-- Empty state for search -->
    <div
      v-else-if="showDropdown && searchQuery && filteredSubs.length === 0"
      class="sub-selector-empty rounded-lg p-6 text-center"
    >
      <Icon
        name="fa6-solid:magnifying-glass"
        class="text-gray-400 text-3xl mb-2"
        aria-hidden="true"
      />
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {{ t('subs.no_subs_found') }}
      </p>
      <button type="button" class="text-sm text-primary hover:underline" @click="openAllSubsModal">
        {{ t('subs.search_in_all_subs') }}
      </button>
    </div>

    <!-- No subs joined message -->
    <p
      v-if="mySubs.length === 0 && selectedSub === undefined"
      class="text-xs text-gray-500 dark:text-gray-400"
    >
      {{ t('subs.no_subs_joined') }} -
      <a :href="localePath('/s')" class="text-primary hover:underline">
        {{ t('subs.explore_subs') }}
      </a>
    </p>

    <!-- All Subs Modal -->
    <SubSelectorModal
      :is-open="showAllSubsModal"
      :my-subs="mySubs"
      :current-sub-id="modelValue"
      @close="showAllSubsModal = false"
      @select="handleModalSelect"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  const { t } = useI18n()
  const localePath = useLocalePath()

  const props = defineProps({
    modelValue: {
      type: [Number, null],
      default: null,
    },
    mySubs: {
      type: Array,
      default: () => [],
    },
    // The current sub of the post being edited (in case user is not subscribed to it)
    currentSub: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'will-subscribe'])

  const searchQuery = ref('')
  const showDropdown = ref(false)
  const searchInput = ref(null)
  const showAllSubsModal = ref(false)
  const selectedFromAllSubs = ref(null)

  // Selected sub (null means General)
  const selectedSub = computed(() => {
    // If no subs and not explicitly selected, return undefined to show search
    if (props.mySubs.length === 0 && props.modelValue === null && !props.currentSub) {
      return undefined
    }

    // null means "General"
    if (props.modelValue === null) {
      return null
    }

    // Find the selected sub in mySubs first
    const foundInMySubs = props.mySubs.find((s) => s.id === props.modelValue)
    if (foundInMySubs) {
      return foundInMySubs
    }

    // If not in mySubs, check if it matches currentSub (for editing posts in subs user isn't subscribed to)
    if (props.currentSub && props.currentSub.id === props.modelValue) {
      return props.currentSub
    }

    // Check in selectedFromAllSubs (when user selected from "show all")
    if (selectedFromAllSubs.value && selectedFromAllSubs.value.id === props.modelValue) {
      return selectedFromAllSubs.value
    }

    // Check in allSubs as fallback
    const foundInAllSubs = allSubs.value.find((s) => s.id === props.modelValue)
    if (foundInAllSubs) {
      return foundInAllSubs
    }

    return null
  })

  // Check if selected sub is not in mySubs (user will be subscribed on submit)
  const willSubscribe = computed(() => {
    if (props.modelValue === null) return false
    return !props.mySubs.some((s) => s.id === props.modelValue)
  })

  // Filtered subs based on search query (only my subs, excluding already selected)
  const filteredSubs = computed(() => {
    let subs = props.mySubs

    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      subs = subs.filter(
        (sub) =>
          sub.name.toLowerCase().includes(query) ||
          (sub.display_name && sub.display_name.toLowerCase().includes(query))
      )
    }

    // Exclude already selected sub
    if (props.modelValue !== null) {
      subs = subs.filter((sub) => sub.id !== props.modelValue)
    }

    return subs
  })

  // Open the modal to see all subs
  function openAllSubsModal() {
    showAllSubsModal.value = true
  }

  // Handle selection from the modal
  function handleModalSelect({ subId, subObj }) {
    if (subObj && !props.mySubs.some((s) => s.id === subId)) {
      selectedFromAllSubs.value = subObj
    } else {
      selectedFromAllSubs.value = null
    }

    emit('update:modelValue', subId)
    searchQuery.value = ''
    showDropdown.value = false
  }

  function selectSub(subId, subObj = null) {
    // Store the sub object if it's from allSubs and not in mySubs
    if (subObj && !props.mySubs.some((s) => s.id === subId)) {
      selectedFromAllSubs.value = subObj
    } else {
      selectedFromAllSubs.value = null
    }

    emit('update:modelValue', subId)
    searchQuery.value = ''
    showDropdown.value = false
  }

  function changeSub() {
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

    // If no subs or modelValue is undefined, start with dropdown open
    if (props.mySubs.length > 0 && selectedSub.value === undefined) {
      showDropdown.value = true
    }
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<style scoped>
  .sub-selector-selected {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }

  .sub-selector-change-btn {
    color: var(--color-text-muted);
  }

  .sub-selector-change-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .sub-selector-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .sub-selector-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .sub-selector-option {
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .sub-selector-option:last-child {
    border-bottom: none;
  }

  .sub-selector-option:hover {
    background-color: var(--color-bg-hover);
  }

  .sub-selector-empty {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }
</style>
