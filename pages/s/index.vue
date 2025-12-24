<template>
  <div class="container mx-auto p-4">
    <!-- Beta Warning Banner -->
    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <Icon name="fa6-solid:triangle-exclamation" class="text-yellow-600 dark:text-yellow-400 text-lg mt-0.5" aria-hidden="true" />
        <div>
          <h3 class="font-semibold text-yellow-900 dark:text-yellow-200 text-sm mb-1">
            {{ $t('subs.beta_warning.title') }}
          </h3>
          <p class="text-yellow-800 dark:text-yellow-300 text-xs">
            {{ $t('subs.beta_warning.description') }}
          </p>
        </div>
      </div>
    </div>

    <div
      class="subs-card-bg rounded-lg shadow-sm border subs-border mb-6"
    >
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-2">{{ $t('subs.explore_title') }}</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ $t('subs.explore_description') }}
        </p>

        <div class="relative mb-6">
          <input
            type="text"
            :value="searchQuery"
            :placeholder="$t('subs.search_placeholder')"
            :aria-label="$t('subs.search_placeholder')"
            class="w-full pl-10 pr-4 py-2 rounded-md border subs-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            @input="updateSearchQuery($event.target.value)"
          >
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="fa6-solid:magnifying-glass" class="text-gray-400" aria-hidden="true" />
          </div>
        </div>

        <div class="mb-4 overflow-x-auto">
          <div class="flex space-x-2 border-b subs-border">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              :class="`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === tab.value
                  ? 'border-primary text-primary dark:text-primary-light'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`"
              @click="updateActiveTab(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="py-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"
          />
          <p class="mt-2 text-gray-500 dark:text-gray-400">{{ $t('common.loading') }}</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="py-8 text-center">
          <p class="text-red-500">{{ error }}</p>
          <button
            class="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            @click="fetchSubs"
          >
            {{ $t('common.retry') }}
          </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="subs.length === 0" class="py-8 text-center">
          <p class="text-gray-500 dark:text-gray-400">{{ $t('subs.no_subs_found') }}</p>
        </div>

        <!-- Subs list -->
        <div v-else class="space-y-2">
          <div
            v-for="sub in subs"
            :key="sub.id"
            class="subs-card-bg rounded-lg border subs-border p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <!-- Avatar con iniciales -->
              <SubIcon :sub="sub" size="lg" :linked="true" />

              <!-- Info -->
              <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2">
                  <NuxtLink
                    :to="localePath('/s/' + sub.name)"
                    class="font-semibold text-sm hover:text-primary truncate"
                  >
                    s/{{ sub.name }}
                  </NuxtLink>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ sub.description || sub.display_name }}
                </p>
              </div>

              <!-- Stats -->
              <div class="hidden sm:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                <span class="flex items-center gap-1">
                  <Icon name="fa6-solid:users" class="text-[10px]" aria-hidden="true" />
                  {{ (sub.members_count || 0).toLocaleString() }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon name="fa6-solid:file-lines" class="text-[10px]" aria-hidden="true" />
                  {{ sub.posts_count || 0 }}
                </span>
              </div>

              <!-- Button -->
              <button
                v-if="!sub.is_member"
                class="flex-shrink-0 px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-xs font-medium"
                @click="joinSub(sub)"
              >
                {{ $t('subs.join') }}
              </button>
              <button
                v-else
                class="flex-shrink-0 px-4 py-1.5 subs-leave-btn text-gray-600 dark:text-gray-400 rounded-md transition-colors text-xs font-medium"
                @click="leaveSub(sub)"
              >
                {{ $t('subs.leave') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="subs.length > 0" class="mt-6 flex justify-center">
          <button
            v-if="page > 1"
            class="px-4 py-2 mx-1 subs-page-btn rounded-md text-gray-700 dark:text-gray-300"
            @click="page--"
          >
            {{ $t('common.previous') }}
          </button>
          <button
            v-if="hasMorePages"
            class="px-4 py-2 mx-1 subs-page-btn rounded-md text-gray-700 dark:text-gray-300"
            @click="page++"
          >
            {{ $t('common.next') }}
          </button>
        </div>
      </div>
    </div>

    <div
      class="subs-card-bg rounded-lg shadow-sm border subs-border"
    >
      <div class="p-6">
        <h2 class="font-bold text-lg mb-3">{{ $t('subs.create_title') }}</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ $t('subs.create_description') }}
        </p>
        <div class="subs-requirements-bg p-4 rounded-md mb-4">
          <div class="flex items-center text-sm">
            <div
              class="w-8 h-8 subs-star-icon rounded-full flex items-center justify-center mr-3"
            >
              <Icon name="fa6-solid:star" class="text-yellow-500" aria-hidden="true" />
            </div>
            <div>
              <span class="font-medium">{{ $t('subs.requirements_title') }}</span>
              <ul class="list-disc list-inside ml-2 mt-1 text-gray-600 dark:text-gray-400">
                <li>{{ $t('subs.requirement_karma') }}</li>
              </ul>
            </div>
          </div>
        </div>
        <NuxtLink
          :to="localePath('/s/create')"
          class="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark hover:text-white transition-colors"
        >
          {{ $t('subs.create_button') }}
        </NuxtLink>
      </div>
    </div>
  </div>

  <!-- Leave Sub Confirmation Dialog -->
  <ConfirmDialog
    v-model="showLeaveConfirm"
    :title="$t('subs.leave')"
    :message="$t('subs.confirm_leave', { name: subToLeave?.display_name || subToLeave?.name })"
    :confirm-text="$t('subs.leave')"
    :cancel-text="$t('common.cancel')"
    type="warning"
    @confirm="confirmLeaveSub"
  />
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'
  import { useAuthStore } from '~/stores/auth'
  import { useSubsStore } from '~/stores/subs'
  import { useNotification } from '~/composables/useNotification'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const authStore = useAuthStore()
  const subsStore = useSubsStore()
  const { info } = useNotification()

  // State
  const page = ref(1)
  const showLeaveConfirm = ref(false)
  const subToLeave = ref(null)

  // Computed
  const subs = computed(() => subsStore.subs)
  const loading = computed(() => subsStore.loading)
  const error = computed(() => subsStore.error)
  const meta = computed(() => subsStore.meta)
  const activeTab = computed(() => subsStore.activeTab)
  const searchQuery = computed(() => subsStore.searchQuery)

  const hasMorePages = computed(() => page.value < meta.value.lastPage)
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  // Tabs
  const tabs = [
    { label: t('subs.trending'), value: 'trending' },
    { label: t('subs.popular'), value: 'popular' },
    { label: t('subs.all'), value: 'all' },
    { label: t('subs.my_subs'), value: 'my_subs' },
  ]

  // Watch for changes in search, tab, or page
  watch(
    [searchQuery, activeTab, page],
    () => {
      fetchSubs()
    },
    { deep: true }
  )

  // Methods
  async function fetchSubs() {
    const params = {
      page: page.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    // Set category and per_page based on active tab
    if (activeTab.value === 'trending') {
      params.category = 'trending'
      params.per_page = 15
    } else if (activeTab.value === 'popular') {
      params.category = 'popular'
      params.per_page = 15
    } else if (activeTab.value === 'all') {
      params.category = 'all'
      params.per_page = 50
    } else if (activeTab.value === 'my_subs') {
      params.my_subs = true
      params.per_page = 15
    }

    try {
      await subsStore.fetchSubs(params)
    } catch (err) {
      console.error('Error fetching subs:', err)
    }
  }

  async function joinSub(sub) {
    if (!isAuthenticated.value) {
      // Show authentication message to anonymous users
      info(t('subs.join_login_required'))
      return
    }

    try {
      await subsStore.joinSub(sub.id)
    } catch (err) {
      console.error('Error joining sub:', err)
      // Handle error (e.g., show toast notification)
    }
  }

  function leaveSub(sub) {
    subToLeave.value = sub
    showLeaveConfirm.value = true
  }

  async function confirmLeaveSub() {
    if (!subToLeave.value) return

    try {
      await subsStore.leaveSub(subToLeave.value.id)
    } catch (err) {
      console.error('Error leaving sub:', err)
    } finally {
      subToLeave.value = null
    }
  }

  function updateSearchQuery(query) {
    subsStore.setSearchQuery(query)
  }

  function updateActiveTab(tab) {
    subsStore.setActiveTab(tab)
    page.value = 1 // Reset to first page when changing tab
  }

  // Fetch subs on mount
  onMounted(() => {
    fetchSubs()
  })
</script>

<style scoped>
  .subs-card-bg {
    background-color: var(--color-bg-card);
  }

  .subs-border {
    border-color: var(--color-border-default);
  }

  .subs-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .subs-leave-btn {
    background-color: var(--color-bg-subtle);
  }

  .subs-leave-btn:hover {
    background-color: var(--color-bg-active);
  }

  .subs-page-btn {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .subs-page-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .subs-requirements-bg {
    background-color: var(--color-bg-subtle);
  }

  .subs-star-icon {
    background-color: var(--color-bg-active);
  }
</style>
