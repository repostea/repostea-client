<template>
  <div class="responsive-navigation mb-6">
    <!-- Desktop Navigation (hidden on mobile via CSS) -->
    <div class="desktop-navigation hidden md:block">
      <div class="section-tabs">
        <button
          class="section-tab inline-flex items-center"
          :class="{ active: currentSection === 'frontpage' }"
          @click="navigateToFrontpage"
        ><Icon name="fa6-solid:house" class="mr-2" aria-hidden="true" /><span>{{ $t('sections.frontpage') }}</span></button>
        <button
          class="section-tab inline-flex items-center"
          :class="{ active: currentSection === 'my_subs' }"
          @click="handleMySubs"
        >
          <Icon name="fa6-solid:users" class="mr-2" aria-hidden="true" />
          <span>{{ $t('sections.my_subs') }}</span>
        </button>
        <button
          class="section-tab inline-flex items-center"
          :class="{ active: currentSection === 'pending' }"
          @click="navigateToPending"
        ><Icon name="fa6-solid:hourglass-half" class="mr-2" aria-hidden="true" /><span>{{ $t('sections.pending') }}</span><span v-if="pendingCount > 0" class="ml-1.5 px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">{{ pendingCount }}</span></button>
        <button
          class="section-tab inline-flex items-center"
          :class="{ active: currentSection === 'comments' }"
          @click="navigateToComments"
        ><Icon name="fa6-solid:comments" class="mr-2" aria-hidden="true" /><span>{{ $t('sections.comments') }}</span></button>
        <button class="section-tab inline-flex items-center" @click="openSearchModal"><Icon name="fa6-solid:magnifying-glass" class="mr-2" aria-hidden="true" /><span>{{ $t('common.search') }}</span></button>
      </div>

      <div v-if="currentSection !== 'comments'" class="tabs-container mt-2">
        <div class="sort-tabs">
          <button
            class="sort-tab inline-flex items-center"
            :class="{ active: isActiveSort('lastActive', 'desc') }"
            @click="setSort('lastActive', 'desc')"
          ><Icon name="fa6-solid:clock" class="mr-2" aria-hidden="true" /><span>{{ $t('links.recent') }}</span></button>
          <button
            class="sort-tab inline-flex items-center"
            :class="{ active: isActiveSort('favourites', 'desc') }"
            @click="setSort('favourites', 'desc')"
          ><Icon name="fa6-solid:bolt" class="mr-2" aria-hidden="true" /><span>{{ $t('links.most_valued') }}</span></button>
          <button
            class="sort-tab inline-flex items-center"
            :class="{ active: isActiveSort('comments', 'desc') }"
            @click="setSort('comments', 'desc')"
          ><Icon name="fa6-solid:comments" class="mr-2" aria-hidden="true" /><span>{{ $t('links.most_commented') }}</span></button>
          <button
            class="sort-tab inline-flex items-center"
            :class="{ active: isActiveSort('views', 'desc') }"
            @click="setSort('views', 'desc')"
          ><Icon name="fa6-solid:eye" class="mr-2" aria-hidden="true" /><span>{{ $t('links.most_visited') }}</span></button>

          <div v-if="needsTimeFilter(sort)" class="time-filter-container">
            <div class="flex justify-end">
              <select
                v-model="timeIntervalModel"
                :aria-label="$t('filters.time_period')"
                :class="{
                  'time-select-active': timeIntervalModel !== '1440',
                }"
                class="time-select"
              >
                <option value="1440">{{ $t('filters.last_24_hours') }}</option>
                <option value="10080">{{ $t('filters.last_7_days') }}</option>
                <option value="43200">{{ $t('filters.last_30_days') }}</option>
                <option value="0">{{ $t('filters.all_time') }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation (hidden on desktop via CSS) -->
    <div class="mobile-navigation mb-4 md:hidden">
      <div class="tabs-container mb-0">
        <div class="main-tabs-wrapper">
          <div class="section-tabs-mobile">
            <button
              class="section-tab-mobile"
              :class="{ active: currentSection === 'frontpage' }"
              :aria-label="$t('sections.frontpage')"
              @click="navigateToFrontpage"
            >
              <Icon name="fa6-solid:house" aria-hidden="true" />
              <span v-if="activeSection === 'frontpage'" class="ml-2">{{ $t('sections.frontpage') }}</span>
            </button>
            <button
              class="section-tab-mobile"
              :class="{ active: currentSection === 'my_subs' }"
              :aria-label="$t('sections.my_subs')"
              @click="handleMySubs"
            >
              <Icon name="fa6-solid:users" aria-hidden="true" />
              <span v-if="activeSection === 'my_subs'" class="ml-2">{{ $t('sections.my_subs') }}</span>
            </button>
            <button
              class="section-tab-mobile"
              :class="{ active: currentSection === 'pending' }"
              :aria-label="$t('sections.pending')"
              @click="navigateToPending"
            >
              <Icon name="fa6-solid:hourglass-half" aria-hidden="true" />
              <span v-if="activeSection === 'pending'" class="ml-2">{{ $t('sections.pending') }}</span>
              <span
                v-if="pendingCount > 0"
                class="ml-1.5 px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full"
              >
                {{ pendingCount }}
              </span>
            </button>
            <button
              class="section-tab-mobile"
              :class="{ active: currentSection === 'comments' }"
              :aria-label="$t('sections.comments')"
              @click="navigateToComments"
            >
              <Icon name="fa6-solid:comments" aria-hidden="true" />
              <span v-if="activeSection === 'comments'" class="ml-2">{{ $t('sections.comments') }}</span>
            </button>
            <button class="section-tab-mobile" :aria-label="$t('common.search')" @click="openSearchModal">
              <Icon name="fa6-solid:magnifying-glass" aria-hidden="true" />
              <span v-if="activeSection === 'search'" class="ml-2">{{ $t('common.search') }}</span>
            </button>
          </div>

          <div v-if="currentSection !== 'comments'" class="sort-dropdown">
            <button
              type="button"
              class="selected-option"
              :aria-label="$t('links.sort_by')"
              :aria-expanded="isMenuOpen"
              @click="toggleSortMenu"
            >
              <div class="flex items-center">
                <Icon :name="getActiveSortIconify()" aria-hidden="true" />
                <span class="ml-2 text-xs">{{ getActiveSortLabel() }}</span>
              </div>
              <Icon
                :name="isMenuOpen ? 'fa6-solid:chevron-up' : 'fa6-solid:chevron-down'"
                class="text-xs"
                aria-hidden="true"
              />
            </button>

            <div v-if="isMenuOpen" class="dropdown-options">
              <button
                v-for="option in sortOptions"
                :key="option.key"
                class="sort-option"
                :class="{ active: isActiveSort(option.key, option.direction) }"
                @click="selectSort(option)"
              >
                <Icon :name="option.iconify" class="mr-2" aria-hidden="true" />
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>

          <div v-if="currentSection !== 'comments' && needsTimeFilter(sort)" class="time-filter-container">
            <select
              v-model="timeIntervalModel"
              :aria-label="$t('filters.time_period')"
              :class="{
                'time-select-active': timeIntervalModel !== '1440',
              }"
              class="time-select"
            >
              <option value="1440">{{ $t('filters.last_24_hours') }}</option>
              <option value="10080">{{ $t('filters.last_7_days') }}</option>
              <option value="43200">{{ $t('filters.last_30_days') }}</option>
              <option value="0">{{ $t('filters.all_time') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Modal -->
    <SearchModal :is-open="isSearchModalOpen" @close="closeSearchModal" />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { useRouter, useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { useNotification } from '~/composables/useNotification'
  import SearchModal from '~/components/posts/SearchModal.vue'

  const { t } = useI18n()
  const router = useRouter()
  const route = useRoute()
  const localePath = useLocalePath()
  const authStore = useAuthStore()
  const { info } = useNotification()

  const props = defineProps({
    currentSection: {
      type: String,
      default: 'frontpage',
    },
    sort: {
      type: String,
      default: 'lastActive',
    },
    direction: {
      type: String,
      default: 'desc',
    },
    timeInterval: {
      type: String,
      default: '43200',
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits([
    'update:section',
    'update:sort',
    'update:direction',
    'update:timeInterval',
  ])
  const isMenuOpen = ref(false)
  const pendingCount = ref(0)
  const isSearchModalOpen = ref(false)
  const clickedSection = ref(null)

  const fetchPendingCount = async () => {
    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBaseUrl}/v1/posts/pending/count?hours=24`)
      pendingCount.value = response.count || 0
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }

  const timeIntervalModel = computed({
    get: () => props.timeInterval,
    set: (value) => emit('update:timeInterval', value),
  })

  // Use clickedSection if it exists (for immediate UI response), otherwise use currentSection
  const activeSection = computed(() => clickedSection.value || props.currentSection)

  const sortOptions = [
    { key: 'lastActive', direction: 'desc', label: t('links.recent'), iconify: 'fa6-solid:clock' },
    { key: 'favourites', direction: 'desc', label: t('links.most_valued'), iconify: 'fa6-solid:bolt' },
    {
      key: 'comments',
      direction: 'desc',
      label: t('links.most_commented'),
      iconify: 'fa6-solid:comments',
    },
    { key: 'views', direction: 'desc', label: t('links.most_visited'), iconify: 'fa6-solid:eye' },
  ]

  function toggleSortMenu() {
    isMenuOpen.value = !isMenuOpen.value
  }

  function getActiveSortIconify() {
    const activeOption = sortOptions.find((option) => isActiveSort(option.key, option.direction))
    return activeOption ? activeOption.iconify : 'fa6-solid:sort'
  }

  function getActiveSortLabel() {
    const activeOption = sortOptions.find((option) => isActiveSort(option.key, option.direction))
    return activeOption ? activeOption.label : t('links.sort')
  }

  function isActiveSort(sortKey, directionKey) {
    return props.sort === sortKey && props.direction === directionKey
  }

  function selectSort(option) {
    if (props.sort === option.key && props.direction === option.direction) {
      isMenuOpen.value = false
      return
    }

    emit('update:sort', option.key)
    emit('update:direction', option.direction)
    isMenuOpen.value = false
  }

  function setSort(sortKey, directionKey) {
    if (props.sort === sortKey && props.direction === directionKey) return
    emit('update:sort', sortKey)
    emit('update:direction', directionKey)
  }

  function needsTimeFilter(sort) {
    return ['favourites', 'comments', 'views'].includes(sort)
  }

  function navigateToFrontpage() {
    clickedSection.value = 'frontpage'
    router.push(localePath('/'))
  }

  function navigateToPending() {
    clickedSection.value = 'pending'
    router.push(localePath('/pending'))
  }

  function navigateToComments() {
    clickedSection.value = 'comments'
    router.push(localePath('/comments'))
  }

  function handleMySubs() {
    if (!authStore.isAuthenticated) {
      info(t('sections.my_subs_login_required'))
      return
    }
    clickedSection.value = 'my_subs'
    router.push(localePath('/my-subs'))
  }

  function handleClickOutside(event) {
    if (isMenuOpen.value && !event.target.closest('.sort-dropdown')) {
      isMenuOpen.value = false
    }
  }

  function openSearchModal() {
    clickedSection.value = 'search'
    isSearchModalOpen.value = true
  }

  function closeSearchModal() {
    isSearchModalOpen.value = false
  }

  // Reset clickedSection when currentSection changes (navigation completed)
  watch(() => props.currentSection, () => {
    clickedSection.value = null
  })

  // Also reset clickedSection when route changes (ensures clean state after navigation)
  watch(() => route.path, () => {
    clickedSection.value = null
  })

  onMounted(() => {
    if (import.meta.client) {
      document.addEventListener('click', handleClickOutside)
      fetchPendingCount()
      // Actualizar cada 5 minutos
      setInterval(fetchPendingCount, 5 * 60 * 1000)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

<style scoped>
  .section-tabs {
    @apply flex rounded-t-lg overflow-hidden shadow-md w-full;
    background-color: var(--color-navbar-bg);
  }

  .section-tab {
    @apply flex items-center justify-center py-3 px-6 text-sm font-medium transition-all;
    color: var(--color-navbar-text-secondary);
    position: relative;
  }

  .section-tab:hover {
    @apply bg-white/10;
    color: var(--color-navbar-text);
  }

  .section-tab.active {
    @apply font-semibold;
    color: var(--color-navbar-text);
    position: relative;
    background-color: rgba(255, 255, 255, 0.25);
  }

  .section-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: var(--color-navbar-text);
  }

  .section-tab i {
    @apply mr-2;
  }

  .tabs-container {
    @apply rounded-lg overflow-hidden shadow-md border;
    border-color: var(--color-border-default);
  }

  .sort-tabs {
    @apply flex flex-wrap items-center bg-white;
    .dark & {
      background-color: var(--color-bg-card);
    }
  }

  .sort-tab {
    @apply py-3 px-4 flex items-center text-sm transition-colors border-b-2 border-transparent;
    color: var(--color-text-secondary);
  }

  .sort-tab:hover {
    border-color: var(--color-border-default);
    color: var(--color-text-primary);
  }

  .sort-tab.active {
    @apply font-medium;
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .sort-tab i {
    @apply mr-2;
  }

  .time-filter-container {
    @apply ml-auto px-4;
  }

  .time-select {
    @apply px-2 py-1 rounded-md text-xs border focus:outline-none focus:ring-1 focus:ring-primary
    shadow-sm transition-all;
    min-width: 120px;
    background-color: var(--color-bg-card);
    border-color: var(--color-border-default);
    color: var(--color-text-primary);
  }

  .time-select-active {
    @apply font-medium;
    border-color: var(--color-primary);
    color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }

  /* Mobile styles */
  .mobile-navigation .main-tabs-wrapper {
    @apply flex flex-col;
  }

  .mobile-navigation .section-tabs-mobile {
    @apply flex overflow-x-auto;
    background-color: var(--color-navbar-bg);
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  .mobile-navigation .section-tabs-mobile::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  .mobile-navigation .section-tab-mobile {
    @apply flex items-center justify-center py-3 px-4 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0;
    color: var(--color-navbar-text-secondary);
    position: relative;
    min-width: fit-content;
  }

  .mobile-navigation .section-tab-mobile:hover {
    @apply bg-white/10;
    color: var(--color-navbar-text);
  }

  .mobile-navigation .section-tab-mobile.active {
    @apply font-semibold;
    color: var(--color-navbar-text);
    position: relative;
    background-color: rgba(255, 255, 255, 0.25);
  }

  .mobile-navigation .section-tab-mobile.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: var(--color-navbar-text);
  }


  .mobile-navigation .sort-dropdown {
    @apply border-t;
    background-color: var(--color-bg-card);
    border-color: var(--color-border-default);
  }

  .mobile-navigation .selected-option {
    @apply p-3 flex justify-between items-center cursor-pointer;
    color: var(--color-primary);
  }

  .mobile-navigation .dropdown-options {
    @apply p-3 border-t;
    border-color: var(--color-border-default);
  }

  .mobile-navigation .sort-option {
    @apply py-2.5 px-3 my-1 rounded-md text-sm flex items-center w-full text-left transition-all;
    background-color: rgba(var(--color-primary-rgb), 0.05);
    color: var(--color-text-secondary);
  }

  .mobile-navigation .sort-option i {
    @apply text-base mr-3 w-5 text-center;
  }

  .mobile-navigation .sort-option.active {
    background-color: rgba(var(--color-primary-rgb), 0.15);
    color: var(--color-primary);
    font-weight: 500;
  }

  .mobile-navigation .time-filter-container {
    @apply p-2 border-t flex justify-center;
    background-color: var(--color-bg-card);
    border-color: var(--color-border-default);
  }

  .mobile-navigation .time-select {
    width: 85%;
  }

  @media (max-width: 640px) {
    .sort-tabs {
      @apply overflow-x-auto py-2 justify-between;
    }

    .sort-tab {
      @apply border-b-0 border-l-2 px-3;
    }

    .time-filter-container {
      @apply w-full px-3 py-2 mt-2 border-t;
      border-color: var(--color-border-default);
    }
  }
</style>
