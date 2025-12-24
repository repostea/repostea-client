<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"/>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isOpen"
              class="notification-modal relative w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="notification-modal-title"
              @click.stop
            >
              <!-- Header -->
              <div class="notification-modal-header px-6 py-4 flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <!-- Icon -->
                    <div class="flex-shrink-0">
                      <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon :name="defaultIconIconify" :class="[defaultIconColor, 'text-xl']" aria-hidden="true" />
                      </div>
                    </div>

                    <!-- Title & Status -->
                    <div class="flex-1">
                      <h2 id="notification-modal-title" class="text-2xl font-bold text-text dark:text-text-dark">
                        {{ notification.title }}
                      </h2>

                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-sm text-text-muted dark:text-text-dark-muted">
                          {{ formatDate(notification.timestamp) }}
                        </span>
                        <span
                          v-if="!notification.read"
                          class="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full"
                        >
                          {{ $t('notifications.unread') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Close Button -->
                <button
                  class="flex-shrink-0 ml-4 p-2 text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark hover:bg-primary/10 rounded-lg transition-colors"
                  :aria-label="$t('common.close')"
                  @click="close"
                >
                  <Icon name="fa6-solid:xmark" class="text-xl" aria-hidden="true" />
                </button>
              </div>

              <!-- Body -->
              <div v-if="notification.body" class="px-6 py-6">
                <div
                  class="text-text dark:text-text-dark text-base leading-relaxed notification-body"
                  v-html="notification.body"
                />
              </div>

              <!-- Footer -->
              <div class="notification-modal-footer px-6 py-4">
                <div class="flex items-center justify-between gap-3">
                  <!-- Delete Button -->
                  <button
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    @click="deleteNotification"
                  >
                    <Icon name="fa6-solid:trash" class="mr-2" aria-hidden="true" />
                    {{ $t('notifications.delete') }}
                  </button>

                  <!-- Close Button -->
                  <button
                    class="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                    @click="close"
                  >
                    {{ $t('common.close') }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="t('notifications.confirm_delete_title')"
      :message="t('notifications.confirm_delete')"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      type="danger"
      @confirm="handleDeleteConfirm"
    />
  </Teleport>
</template>

<script setup>
  import { ref, computed, watch, onUnmounted, defineAsyncComponent } from 'vue'
  import { useI18n } from '#i18n'


  const ConfirmDialog = defineAsyncComponent(() => import('~/components/common/ConfirmDialog.vue'))

  const { t } = useI18n()
  const showDeleteConfirm = ref(false)

  const props = defineProps({
    notification: {
      type: Object,
      required: true,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['update:modelValue', 'delete', 'close'])

  const isOpen = ref(props.modelValue)

  // Icon based on notification type (same as NotificationItem)
  const defaultIconIconify = computed(() => {
    const typeIcons = {
      comment: 'fa6-solid:comment',
      comment_reply: 'fa6-solid:reply',
      vote: 'fa6-solid:thumbs-up',
      mention: 'fa6-solid:at',
      system: 'fa6-solid:bell',
      moderation: 'fa6-solid:shield',
      achievement: 'fa6-solid:trophy',
      karma_level: 'fa6-solid:trophy',
    }
    return typeIcons[props.notification.type] || typeIcons.system
  })

  const defaultIconColor = computed(() => {
    const typeColors = {
      comment: 'text-blue-500',
      comment_reply: 'text-blue-500',
      vote: 'text-green-500',
      mention: 'text-purple-500',
      system: 'text-gray-500',
      moderation: 'text-red-500',
      achievement: 'text-yellow-500',
      karma_level: 'text-yellow-500',
    }
    return typeColors[props.notification.type] || typeColors.system
  })

  watch(
    () => props.modelValue,
    (newValue) => {
      isOpen.value = newValue
    }
  )

  watch(isOpen, (newValue) => {
    emit('update:modelValue', newValue)
    if (!newValue) {
      emit('close')
    }
  })

  // Methods
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('common.time.just_now')
    if (diffMins < 60) return t('common.time.minutes_ago', { count: diffMins })
    if (diffHours < 24) return t('common.time.hours_ago', { count: diffHours })
    if (diffDays < 7) return t('common.time.days_ago', { count: diffDays })

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const close = () => {
    isOpen.value = false
  }

  const deleteNotification = () => {
    showDeleteConfirm.value = true
  }

  const handleDeleteConfirm = () => {
    emit('delete', props.notification.id)
    close()
  }

  // Close on Escape key
  const handleKeydown = (event) => {
    if (event.key === 'Escape' && isOpen.value) {
      close()
    }
  }

  // Add/remove event listener
  watch(isOpen, (newValue) => {
    if (newValue) {
      document.addEventListener('keydown', handleKeydown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  })
</script>

<style scoped>
  /* Ensure modal appears above everything */
  .z-\[9999\] {
    z-index: 9999;
  }

  .notification-modal {
    background-color: var(--color-bg-card);
  }

  .notification-modal-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .notification-modal-footer {
    background-color: var(--color-bg-hover);
    border-top: 1px solid var(--color-border-default);
  }

  /* Smooth scrollbar for modal content */
  .overflow-y-auto::-webkit-scrollbar {
    width: 8px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background-color: var(--color-bg-hover);
    border-radius: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: var(--color-border-strong);
    border-radius: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-text-muted);
  }

  /* Prose styling for dark mode */
  .prose {
    @apply text-text dark:text-text-dark;
  }

  /* Notification body HTML links styling */
  .notification-body :deep(a) {
    @apply transition-colors;
  }
</style>
