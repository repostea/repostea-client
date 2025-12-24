<template>
  <ProfileLayout active-tab="notifications">
    <!-- Tabs: List / Preferences -->
    <NotificationTabs active-tab="list" />

    <!-- Notification Summary Panel -->
    <ClientOnly>
      <div class="mb-6">
        <NotificationPanel
          key="notification-panel-fixed"
          ref="notificationPanel"
          @category-selected="handleCategorySelected"
        />
      </div>
    </ClientOnly>

    <!-- Divider -->
    <div class="my-6 border-t notif-border"/>

    <!-- Recent Notifications Section -->
    <ClientOnly>
      <div class="bg-white dark:bg-card-dark rounded-lg shadow-sm border notif-border overflow-hidden">
      <!-- Header -->
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-b notif-border">
        <h2 class="text-lg sm:text-xl font-bold text-text dark:text-text-dark mb-1 flex items-center">
          <template v-if="selectedCategory">
            <Icon v-if="selectedCategory === 'posts'" name="fa6-solid:comment" class="text-blue-500 mr-2 text-sm sm:text-base" aria-hidden="true" />
            <Icon v-else-if="selectedCategory === 'comments'" name="fa6-solid:reply" class="text-blue-500 mr-2 text-sm sm:text-base" aria-hidden="true" />
            <Icon v-else-if="selectedCategory === 'mentions'" name="fa6-solid:at" class="text-purple-500 mr-2 text-sm sm:text-base" aria-hidden="true" />
            <Icon v-else-if="selectedCategory === 'achievements'" name="fa6-solid:trophy" class="text-yellow-500 mr-2 text-sm sm:text-base" aria-hidden="true" />
            {{ $t(`notifications.${selectedCategory === 'posts' ? 'post_comments' : selectedCategory === 'comments' ? 'comment_replies' : selectedCategory === 'mentions' ? 'mentions' : 'achievements_and_karma'}`) }}
          </template>
          <template v-else>
            {{ $t('notifications.recent_notifications') }}
          </template>
        </h2>
        <p class="text-xs sm:text-sm text-text-muted dark:text-text-dark-muted hidden sm:block">
          {{ selectedCategory ? $t(`notifications.${selectedCategory === 'posts' ? 'post_comments_description' : selectedCategory === 'comments' ? 'comment_replies_description' : selectedCategory === 'mentions' ? 'mentions_description' : 'achievements_and_karma_description'}`) : $t('notifications.manage_recent_notifications') }}
        </p>
      </div>

      <!-- Filters -->
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-b notif-border">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter.key"
            class="px-3 py-1 rounded-full text-sm transition-colors"
            :class="
              activeFilter === filter.key
                ? 'bg-primary text-white'
                : 'notif-filter-btn text-text dark:text-text-dark'
            "
            @click="activeFilter = filter.key"
          >
            {{ filter.label }}
            <span v-if="filter.key !== 'all' && filter.total > 0" class="ml-1">
              ({{ filter.total }})
            </span>
          </button>
          </div>

          <!-- Mark All Read -->
          <button
            v-if="currentViewUnreadCount > 0"
            class="px-2 sm:px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-xs whitespace-nowrap"
            @click="markAllAsRead"
          >
            {{ $t('notifications.mark_all_read') }} ({{ currentViewUnreadCount }})
          </button>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="overflow-hidden">
        <!-- Empty State -->
        <div v-if="filteredNotifications.length === 0" class="px-4 sm:px-6 py-8 sm:py-12 text-center">
          <Icon name="fa6-solid:bell-slash" class="text-4xl text-gray-400 mb-4" aria-hidden="true" />
          <h3 class="text-lg font-medium text-text dark:text-text-dark mb-2">
            {{ $t('notifications.no_notifications') }}
          </h3>
          <p class="text-text-muted dark:text-text-dark-muted mb-4">
            {{ $t('notifications.no_notifications_description') }}
          </p>

          <!-- Quick Actions -->
          <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
            <NuxtLink
              :to="localePath('/profile/notifications/preferences')"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm text-center"
            >
              {{ $t('notifications.notification_settings') }}
            </NuxtLink>

            <button
              class="px-4 py-2 notif-secondary-btn text-text dark:text-text-dark rounded-lg transition-colors text-sm"
              @click="refreshNotifications"
            >
              {{ $t('common.refresh') }}
            </button>
          </div>
        </div>

        <!-- Notifications -->
        <div v-else>
          <NotificationItem
            v-for="notification in paginatedNotifications"
            :key="notification.id"
            :notification="notification"
            @click="handleNotificationClick(notification)"
            @mark-read="markAsRead(notification.id)"
            @remove="removeNotification(notification.id)"
          />
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center">
        <nav class="flex items-center space-x-2">
          <button
            v-if="currentPage > 1"
            class="px-3 py-2 notif-page-btn text-text dark:text-text-dark rounded-lg transition-colors"
            :aria-label="$t('pagination.previous')"
            @click="currentPage--"
          >
            <Icon name="fa6-solid:chevron-left" aria-hidden="true" />
          </button>

          <span class="px-4 py-2 text-sm text-text-muted dark:text-text-dark-muted">
            {{ $t('pagination.page_of', { current: currentPage, total: totalPages }) }}
          </span>

          <button
            v-if="currentPage < totalPages"
            class="px-3 py-2 notif-page-btn text-text dark:text-text-dark rounded-lg transition-colors"
            :aria-label="$t('pagination.next')"
            @click="currentPage++"
          >
            <Icon name="fa6-solid:chevron-right" aria-hidden="true" />
          </button>
        </nav>
      </div>

      <!-- Bulk Actions -->
      <div
        v-if="filteredNotifications.length > 0"
        class="px-4 sm:px-6 py-4 sm:py-6 border-t notif-border"
      >
        <div class="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            class="px-3 sm:px-4 py-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors text-xs sm:text-sm"
            @click="clearOldNotifications"
          >
            {{ $t('notifications.clear_old') }}
          </button>

          <button
            class="px-3 sm:px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs sm:text-sm"
            @click="clearAllNotifications"
          >
            {{ $t('notifications.clear_all') }}
          </button>
        </div>
      </div>
    </div>
    </ClientOnly>

    <!-- Notification Modal -->
    <NotificationModal
      v-if="selectedNotification"
      v-model="isModalOpen"
      :notification="selectedNotification"
      @delete="handleModalDelete"
      @close="handleModalClose"
    />

    <!-- Confirmation Dialogs -->
    <ConfirmDialog
      v-model="showClearAllConfirm"
      :title="t('notifications.confirm_clear_all_title')"
      :message="t('notifications.confirm_clear_all')"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      type="danger"
      @confirm="handleClearAllConfirm"
    />

    <ConfirmDialog
      v-model="showClearOldConfirm"
      :title="t('notifications.confirm_clear_old_title')"
      :message="t('notifications.confirm_clear_old')"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      type="warning"
      @confirm="handleClearOldConfirm"
    />
  </ProfileLayout>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRealTimeNotificationsStore } from '~/stores/realTimeNotifications'
  import { useI18n, useLocalePath  } from '#i18n'
  
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'
  import NotificationPanel from '~/components/notifications/NotificationPanel.vue'
  import NotificationItem from '~/components/notifications/NotificationItem.vue'
  import NotificationModal from '~/components/notifications/NotificationModal.vue'
  import ConfirmDialog from '~/components/common/ConfirmDialog.vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const config = useRuntimeConfig()

  // Store and reactive refs
  const notificationsStore = ref(null)
  const notifications = computed(() => notificationsStore.value?.notifications || [])
  const unreadCount = computed(() => notificationsStore.value?.unreadCount || 0)

  const showClearAllConfirm = ref(false)
  const showClearOldConfirm = ref(false)
  const selectedNotification = ref(null)
  const isModalOpen = ref(false)

  // Component refs
  const notificationPanel = ref(null)

  // Local state
  const activeFilter = ref('unread') // Start with unread, will change to 'all' if no unread
  const selectedCategory = ref(null) // null = all categories, 'posts'/'comments'/'mentions'/'achievements'/'system'
  const currentPage = ref(1)
  const itemsPerPage = 20
  const categoryNotifications = ref([])
  const isLoadingCategory = ref(false) // Show loading overlay when switching categories


  // Compute unread count for current view (category or all)
  const currentViewUnreadCount = computed(() => {
    const source = selectedCategory.value ? categoryNotifications.value : notifications.value
    return source.filter(n => !n.read).length
  })

  const filters = computed(() => {
    // Use category notifications if a category is selected
    const source = selectedCategory.value ? categoryNotifications.value : notifications.value
    const categoryUnreadCount = source.filter(n => !n.read).length

    return [
      {
        key: 'all',
        label: t('notifications.all'),
        total: source.length,
        new: 0, // Don't show "new" in general view
        unread: categoryUnreadCount,
      },
      {
        key: 'unread',
        label: t('notifications.unread'),
        total: categoryUnreadCount,
        new: 0, // Don't show "new" in general view
        unread: categoryUnreadCount,
      },
    ]
  })

  const filteredNotifications = computed(() => {
    // If a category is selected, use category notifications
    const source = selectedCategory.value ? categoryNotifications.value : notifications.value

    if (activeFilter.value === 'unread') {
      return source.filter((n) => !n.read)
    }
    // 'all' - no filter
    return source
  })

  const totalPages = computed(() => {
    return Math.ceil(filteredNotifications.value.length / itemsPerPage)
  })

  const paginatedNotifications = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredNotifications.value.slice(start, end)
  })

  // Methods
  const handleNotificationClick = (notification) => {
    selectedNotification.value = notification
    isModalOpen.value = true

    // Mark as read when opening modal
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  const handleModalClose = () => {
    isModalOpen.value = false
    selectedNotification.value = null
  }

  const handleModalDelete = (notificationId) => {
    removeNotification(notificationId)
    handleModalClose()
  }

  const markAsRead = (notificationId) => {
    // Update store
    if (notificationsStore.value) {
      notificationsStore.value.markAsRead(notificationId)
    }

    // Also update categoryNotifications if we're viewing a category
    if (selectedCategory.value && categoryNotifications.value) {
      const index = categoryNotifications.value.findIndex((n) => n.id === notificationId)
      if (index !== -1) {
        categoryNotifications.value[index] = {
          ...categoryNotifications.value[index],
          read: true
        }
      }
    }
  }

  const markAllAsRead = () => {
    if (notificationsStore.value) {
      notificationsStore.value.markAllAsRead()
    }
  }

  const removeNotification = (notificationId) => {
    // Update store
    if (notificationsStore.value) {
      notificationsStore.value.removeNotification(notificationId)
    }

    // Also update categoryNotifications if we're viewing a category
    if (selectedCategory.value && categoryNotifications.value) {
      categoryNotifications.value = categoryNotifications.value.filter((n) => n.id !== notificationId)
    }
  }

  const clearAllNotifications = () => {
    showClearAllConfirm.value = true
  }

  const handleClearAllConfirm = async () => {
    if (!import.meta.client) return

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')
      if (!token) return

      await $fetch(`${config.public.apiBaseUrl}/v1/notifications/all`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Reload notifications
      if (selectedCategory.value) {
        await loadCategoryNotifications(selectedCategory.value)
      }

      // Clear local store as well
      if (notificationsStore.value) {
        notificationsStore.value.clearAllNotifications()
      }
    } catch (err) {
      console.error('Error clearing all notifications:', err)
    }
  }

  const clearOldNotifications = () => {
    showClearOldConfirm.value = true
  }

  const handleClearOldConfirm = async () => {
    if (!import.meta.client) return

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')
      if (!token) return

      await $fetch(`${config.public.apiBaseUrl}/v1/notifications/old`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          days: 7,
        },
      })

      // Reload notifications
      if (selectedCategory.value) {
        await loadCategoryNotifications(selectedCategory.value)
      }
    } catch (err) {
      console.error('Error clearing old notifications:', err)
    }
  }

  const refreshNotifications = () => {
    if (!notificationsStore.value) return

    // Reconnect to refresh notifications
    notificationsStore.value.disconnect()
    setTimeout(() => {
      notificationsStore.value.connect()
    }, 1000)
  }

  const handleCategorySelected = async (category) => {
    // Don't do anything if already on this category
    if (selectedCategory.value === category) return

    // Update URL without reloading - just change browser history
    const router = useRouter()
    const targetPath = category ? localePath(`/profile/notifications/${category}`) : localePath('/profile/notifications')

    // Use router.replace instead of navigateTo to avoid any reload
    // The watch on route.params.category will handle loading the data
    router.replace(targetPath)
  }

  const loadCategoryNotifications = async (category) => {
    if (!import.meta.client) return

    isLoadingCategory.value = true
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')
      if (!token) return

      const data = await $fetch(`${config.public.apiBaseUrl}/v1/notifications`, {
        params: {
          category: category,
          filter: 'all', // Always load all notifications, filter on frontend
          per_page: 50, // Load more since we're showing in one view
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      categoryNotifications.value = data.data || []

      // Auto-switch to 'all' if 'unread' filter has no results
      if (activeFilter.value === 'unread' && data.data) {
        const unreadCount = data.data.filter(n => !n.read).length
        if (unreadCount === 0 && data.data.length > 0) {
          activeFilter.value = 'all'
        }
      }
    } catch (err) {
      console.error(`Error loading ${category} notifications:`, err)
    } finally {
      isLoadingCategory.value = false
    }
  }

  const updateCategoryViewTimestamp = async (category) => {
    if (!import.meta.client) return

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')
      if (!token) return

      await $fetch(`${config.public.apiBaseUrl}/v1/notifications/categories/${category}/view`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Don't refresh the summary panel - it's already loaded
      // The "new" count will update next time the panel refreshes (e.g., on page reload)
    } catch (err) {
      console.error(`Error updating view timestamp for ${category}:`, err)
    }
  }

  // Watch for filter changes to reset pagination
  watch(activeFilter, () => {
    currentPage.value = 1
    // No need to reload - filtering is done on frontend
  })

  // Check cached summary to set initial filter
  const checkInitialFilter = (category) => {
    if (!import.meta.client || !category) return

    const cached = sessionStorage.getItem('notification-summary')
    if (cached) {
      try {
        const summary = JSON.parse(cached)
        const categoryData = summary[category]

        // If no unread in this category, start with 'all' filter
        if (categoryData && categoryData.unread === 0 && activeFilter.value === 'unread') {
          activeFilter.value = 'all'
        }
      } catch {
        // Ignore errors, keep default filter
      }
    }
  }

  // Watch route parameter changes (only for initial load and browser back/forward)
  const route = useRoute()
  watch(() => route.params.category, async (newCategory) => {
    // Only load if it's different from current selection
    // This handles initial page load and browser navigation (back/forward)
    if (newCategory !== selectedCategory.value) {
      selectedCategory.value = newCategory || null
      currentPage.value = 1

      if (newCategory) {
        // Check cached summary to avoid showing empty 'unread' filter
        checkInitialFilter(newCategory)

        // Don't set loading here - it's already set in handleCategorySelected
        // This watch will trigger when user clicks category button, but we don't want double loading
        await loadCategoryNotifications(newCategory)
        await updateCategoryViewTimestamp(newCategory)
      }
    }
  }, { immediate: true })

  // Initialize store and load notifications on mount (client-side only)
  onMounted(() => {
    // Initialize store on client
    notificationsStore.value = useRealTimeNotificationsStore()

    // Watch unread count to auto-switch filter
    watch(unreadCount, (newVal) => {
      // If no unread notifications, switch to 'all' filter
      if (newVal === 0 && activeFilter.value === 'unread') {
        activeFilter.value = 'all'
      }
    })

    // Load notifications
    if (notificationsStore.value) {
      notificationsStore.value.loadNotifications()
    }
  })

  // Page meta
  definePageMeta({
    title: 'Notifications',
    middleware: 'auth', // Require authentication
  })

  // SEO
  useSeoMeta({
    title: () => t('notifications.notifications'),
    description: () => t('notifications.manage_notifications'),
  })
</script>

<style scoped>
  /* Custom animations */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .notif-border {
    border-color: var(--color-border-default);
  }

  .notif-filter-btn {
    background-color: var(--color-bg-subtle);
  }

  .notif-filter-btn:hover {
    background-color: var(--color-bg-active);
  }

  .notif-secondary-btn {
    background-color: var(--color-bg-subtle);
  }

  .notif-secondary-btn:hover {
    background-color: var(--color-bg-active);
  }

  .notif-page-btn {
    background-color: var(--color-bg-subtle);
  }

  .notif-page-btn:hover {
    background-color: var(--color-bg-active);
  }
</style>
