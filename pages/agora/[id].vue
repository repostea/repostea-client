<template>
  <div class="container mx-auto px-1 md:px-4 py-2 md:py-4">
    <!-- Compact Header (same as main Agora) -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="localePath('/agora')"
          class="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Icon name="fa6-solid:landmark" class="text-lg text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
              {{ t('agora.title') }}
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('agora.subtitle') }}
            </p>
          </div>
        </NuxtLink>
      </div>
      <!-- Connection status (only show when offline) -->
      <div v-if="!isConnected" class="flex items-center gap-2">
        <span class="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <span class="w-1.5 h-1.5 bg-red-500 rounded-full" />
          Offline
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content -->
      <div class="lg:col-span-2">
        <!-- Back navigation -->
        <div class="mb-3">
          <NuxtLink
            :to="localePath('/agora')"
            class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
          >
            <Icon name="fa6-solid:arrow-left" class="mr-2" aria-hidden="true" />
            {{ t('agora.back_to_agora') }}
          </NuxtLink>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-12">
          <div
            class="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
          />
          <p class="mt-4 text-gray-600 dark:text-gray-400">{{ t('agora.loading') }}</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center">
          <Icon
            name="fa6-solid:circle-exclamation"
            class="text-3xl text-red-500 mb-3"
            aria-hidden="true"
          />
          <p class="text-red-900 dark:text-red-200 mb-4">{{ t('agora.error_loading') }}</p>
          <NuxtLink
            :to="localePath('/agora')"
            class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            {{ t('agora.back_to_agora') }}
          </NuxtLink>
        </div>

        <!-- Message detail -->
        <div v-else-if="message">
          <!-- Main message and conversation tree -->
          <div class="agora-thread-container rounded-lg shadow-sm p-2 md:p-6">
            <AgoraMessageCard
              :message="message"
              :show-replies-toggle="true"
              :is-detail-view="true"
              @deleted="handleDeleted"
              @updated="loadMessage"
            />
          </div>
        </div>
      </div>

      <!-- Sidebar (desktop) -->
      <div class="hidden lg:block lg:col-span-1 space-y-6">
        <RecentComments />
        <TopComments />
      </div>

      <!-- Comments widgets (mobile only, after thread content) -->
      <div class="lg:hidden lg:col-span-2 space-y-6 mt-6">
        <RecentComments />
        <TopComments />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  import { useNuxtApp } from '#app'
  import { useRoute, useRouter } from 'vue-router'
  import { useNotification } from '~/composables/useNotification'
  import { useAgoraRealtime } from '~/composables/useAgoraRealtime'
  import AgoraMessageCard from '~/components/agora/AgoraMessageCard.vue'
  import RecentComments from '~/components/posts/RecentComments.vue'
  import TopComments from '~/components/posts/TopComments.vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { $api } = useNuxtApp()
  const { info } = useNotification()

  // Real-time
  const {
    isConnected,
    startListening,
    stopListening,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
  } = useAgoraRealtime()

  const message = ref(null)
  const loading = ref(true)
  const error = ref(null)

  // Load message
  async function loadMessage() {
    try {
      loading.value = true
      error.value = null

      const response = await $api.agora.getMessage(route.params.id)
      message.value = response.data.data
    } catch (err) {
      console.error('Error loading message:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Insert a reply into the message tree recursively
  function insertReplyIntoMessage(parentId, reply, msg) {
    if (!msg) return false

    // Check if this is the parent
    if (msg.id === parentId) {
      if (!msg.replies) msg.replies = []
      if (!msg.replies.find((r) => r.id === reply.id)) {
        msg.replies.push(reply)
        msg.replies_count = (msg.replies_count || 0) + 1
      }
      return true
    }

    // Search in nested replies
    if (msg.replies && msg.replies.length > 0) {
      for (const childReply of msg.replies) {
        if (insertReplyIntoMessage(parentId, reply, childReply)) {
          return true
        }
      }
    }
    return false
  }

  // Handle real-time message
  function handleRealtimeMessage(data) {
    if (!message.value) return

    // Only handle replies that belong to this thread
    if (data.is_reply && data.parent_id) {
      // Check if this reply belongs to the current thread
      const rootId = parseInt(route.params.id)

      // Direct reply to the main message
      if (data.parent_id === rootId) {
        insertReplyIntoMessage(rootId, data.message, message.value)
        return
      }

      // Reply to a nested comment - try to insert
      insertReplyIntoMessage(data.parent_id, data.message, message.value)
    }
  }

  // Update message in tree recursively
  function updateMessageInTree(messageId, updatedMessage, msg) {
    if (!msg) return false

    if (msg.id === messageId) {
      // Preserve replies when updating
      const existingReplies = msg.replies
      Object.assign(msg, updatedMessage, { replies: existingReplies })
      return true
    }

    if (msg.replies?.length) {
      for (const reply of msg.replies) {
        if (updateMessageInTree(messageId, updatedMessage, reply)) {
          return true
        }
      }
    }
    return false
  }

  // Remove message from tree recursively
  function removeMessageFromTree(messageId, msg) {
    if (!msg) return false

    if (msg.replies?.length) {
      for (let i = 0; i < msg.replies.length; i++) {
        if (msg.replies[i].id === messageId) {
          msg.replies.splice(i, 1)
          msg.replies_count = Math.max(0, (msg.replies_count || 1) - 1)
          return true
        }
        if (removeMessageFromTree(messageId, msg.replies[i])) {
          return true
        }
      }
    }
    return false
  }

  // Handle real-time message update
  function handleRealtimeMessageUpdate(data) {
    if (!message.value) return
    updateMessageInTree(data.message.id, data.message, message.value)
  }

  // Handle real-time message deletion
  function handleRealtimeMessageDelete(data) {
    if (!message.value) return

    // If the main message was deleted, go back to agora
    if (data.message_id === parseInt(route.params.id)) {
      info(t('agora.message_deleted'))
      router.push(localePath('/agora'))
      return
    }

    // Remove from tree
    removeMessageFromTree(data.message_id, message.value)
  }

  function handleDeleted() {
    // If the main message was deleted, go back to agora
    if (message.value && message.value.id === parseInt(route.params.id)) {
      info(t('agora.message_deleted'))
      router.push(localePath('/agora'))
    } else {
      // If a reply was deleted, reload the conversation
      loadMessage()
    }
  }

  // Scroll to and highlight a specific message by hash
  function scrollToHashMessage() {
    if (!import.meta.client) return

    const hash = window.location.hash
    if (!hash || !hash.startsWith('#agora-')) return

    const messageId = hash.replace('#agora-', '')

    // Use nextTick and longer timeout to ensure DOM is fully rendered
    nextTick(() => {
      setTimeout(() => {
        const element = document.getElementById(`agora-${messageId}`)

        if (element) {
          // Scroll with offset to account for fixed header
          const headerOffset = 80
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          })

          // Add highlight animation
          element.classList.add('highlight-message')
          setTimeout(() => {
            element.classList.remove('highlight-message')
          }, 3000)
        }
      }, 500)
    })
  }

  // Setup on mount
  onMounted(async () => {
    await loadMessage()

    // Start real-time listening
    if (import.meta.client) {
      onNewMessage(handleRealtimeMessage)
      onMessageUpdated(handleRealtimeMessageUpdate)
      onMessageDeleted(handleRealtimeMessageDelete)
      startListening()

      // Scroll to specific message if hash is present
      scrollToHashMessage()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopListening()
  })
</script>

<style scoped>
  .agora-thread-container {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  /* Highlight animation for linked messages */
  :deep(.highlight-message) {
    animation: highlight-pulse 3s ease-out;
    border-radius: 0.5rem;
  }

  @keyframes highlight-pulse {
    0%,
    15% {
      background-color: rgba(251, 191, 36, 0.3);
      box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2);
    }
    100% {
      background-color: transparent;
      box-shadow: none;
    }
  }

  :root.dark :deep(.highlight-message) {
    animation: highlight-pulse-dark 3s ease-out;
  }

  @keyframes highlight-pulse-dark {
    0%,
    15% {
      background-color: rgba(251, 191, 36, 0.2);
      box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.15);
    }
    100% {
      background-color: transparent;
      box-shadow: none;
    }
  }
</style>
