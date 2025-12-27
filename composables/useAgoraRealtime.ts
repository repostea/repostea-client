import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from '#i18n'
import { useEcho } from './useEcho'
import { useRealtimeFallback } from './useRealtimeFallback'
import { useAuthStore } from '~/stores/auth'
import { useNotification } from '~/composables/useNotification'

interface AuthUser {
  id: number
  username: string
  [key: string]: unknown
}

export interface AgoraRealtimeMessage {
  message: {
    id: number
    content: string
    user: {
      id: number
      username: string
      avatar?: string
    } | null
    parent_id: number | null
    is_anonymous: boolean
    created_at: string
  }
  is_reply: boolean
  parent_id: number | null
  parent_author_id: number | null
  author_id: number
}

export interface AgoraMessageUpdatedEvent {
  message: AgoraRealtimeMessage['message']
}

export interface AgoraMessageDeletedEvent {
  message_id: number
  parent_id: number | null
}

export interface AgoraRealtimeOptions {
  /** Polling interval when in fallback mode (default: 30000ms) */
  fallbackPollingInterval?: number
  /** Enable fallback mode when WebSocket fails (default: true) */
  enableFallback?: boolean
}

export const useAgoraRealtime = (options: AgoraRealtimeOptions = {}) => {
  const { fallbackPollingInterval = 30000, enableFallback = true } = options

  const {
    isConnected,
    connectionError,
    errorType,
    reconnectAttempt,
    usingFallback,
    connect,
    forceReconnect,
    channel,
    privateChannel,
    leaveChannel,
    onReconnect,
    onMaxReconnectAttempts,
  } = useEcho()
  const authStore = useAuthStore()
  const { info } = useNotification()
  const { t } = useI18n()

  const newMessages = ref<AgoraRealtimeMessage[]>([])
  const isListening = ref(false)
  const lastPollTimestamp = ref<string | null>(null)

  // Callbacks for events
  let onNewMessageCallback: ((message: AgoraRealtimeMessage) => void) | null = null
  let onReplyToMeCallback: ((message: AgoraRealtimeMessage) => void) | null = null
  let onMessageUpdatedCallback: ((data: AgoraMessageUpdatedEvent) => void) | null = null
  let onMessageDeletedCallback: ((data: AgoraMessageDeletedEvent) => void) | null = null

  // Track seen message IDs to avoid duplicates when switching between WS and polling
  const seenMessageIds = new Set<number>()

  // API fetch function for fallback polling
  const fetchNewMessages = async (): Promise<void> => {
    if (typeof window === 'undefined') return

    try {
      const { $api } = useNuxtApp()
      const params: Record<string, string | number> = {
        limit: 20,
        sort: '-created_at',
      }

      // If we have a timestamp, only fetch messages after that
      if (lastPollTimestamp.value) {
        params.after = lastPollTimestamp.value
      }

      const response = await $api.agora.getMessages(params)
      const messages = (response.data?.data || []) as AgoraRealtimeMessage['message'][]

      if (messages.length > 0) {
        // Update timestamp to the newest message
        lastPollTimestamp.value = messages[0].created_at

        // Process messages in reverse (oldest first) to maintain order
        for (const msg of messages.reverse()) {
          // Skip if we've already seen this message
          if (seenMessageIds.has(msg.id)) continue

          // Skip if message is from current user
          const currentUser = authStore.user as AuthUser | null
          if (currentUser && msg.user?.id === currentUser.id) continue

          seenMessageIds.add(msg.id)

          // Create a realtime-compatible message object
          const realtimeMessage: AgoraRealtimeMessage = {
            message: msg,
            is_reply: !!msg.parent_id,
            parent_id: msg.parent_id,
            parent_author_id: null, // Not available in API response
            author_id: msg.user?.id || 0,
          }

          newMessages.value.unshift(realtimeMessage)

          if (onNewMessageCallback) {
            onNewMessageCallback(realtimeMessage)
          }
        }
      }
    } catch (error) {
      console.error('[AgoraRealtime] Fallback poll error:', error)
    }
  }

  // Setup fallback polling
  const fallback = useRealtimeFallback({
    pollingInterval: fallbackPollingInterval,
    fetchFn: fetchNewMessages,
  })

  // Register callbacks for Echo reconnection events
  let unsubReconnect: (() => void) | null = null
  let unsubMaxAttempts: (() => void) | null = null

  /**
   * Start listening to Ágora real-time channels
   */
  const startListening = () => {
    if (isListening.value) return

    // Connect to Echo if not already connected
    connect()

    // Setup reconnection handlers
    unsubReconnect = onReconnect(() => {
      fallback.stopPolling()
    })

    unsubMaxAttempts = onMaxReconnectAttempts(() => {
      if (enableFallback) {
        fallback.startPolling()
      }
    })

    // Listen to public Agora channel for all new messages
    const agoraChannel = channel('agora')
    if (agoraChannel) {
      agoraChannel.listen('.message.created', (data: AgoraRealtimeMessage) => {
        // Skip if message is from current user (works for anonymous messages too)
        const currentUser = authStore.user as AuthUser | null
        if (currentUser && data.author_id === currentUser.id) {
          return
        }

        // Track this message ID to avoid duplicates
        seenMessageIds.add(data.message.id)

        // Update timestamp for potential fallback sync
        if (data.message.created_at) {
          lastPollTimestamp.value = data.message.created_at
        }

        newMessages.value.unshift(data)

        if (onNewMessageCallback) {
          onNewMessageCallback(data)
        }
      })

      agoraChannel.listen('.message.updated', (data: AgoraMessageUpdatedEvent) => {
        if (onMessageUpdatedCallback) {
          onMessageUpdatedCallback(data)
        }
      })

      agoraChannel.listen('.message.deleted', (data: AgoraMessageDeletedEvent) => {
        if (onMessageDeletedCallback) {
          onMessageDeletedCallback(data)
        }
      })
    }

    // Listen to private channel for replies to my messages
    const userForPrivate = authStore.user as AuthUser | null
    if (userForPrivate) {
      const userChannel = privateChannel(`user.${userForPrivate.id}`)
      if (userChannel) {
        userChannel.listen('.message.created', (data: AgoraRealtimeMessage) => {
          // Show notification toast
          const authorName = data.message.is_anonymous
            ? t('agora.anonymous_user')
            : data.message.user?.username || 'Someone'

          info(
            t('agora.notification_reply', { user: authorName }) ||
              `${authorName} replied to your message`
          )

          if (onReplyToMeCallback) {
            onReplyToMeCallback(data)
          }
        })
      }
    }

    isListening.value = true

    // If already in fallback mode (e.g., from a previous failed connection), start polling
    if (usingFallback.value && enableFallback) {
      fallback.startPolling()
    }
  }

  /**
   * Stop listening to all channels
   */
  const stopListening = () => {
    if (!isListening.value) return

    leaveChannel('agora')

    const userForLeave = authStore.user as AuthUser | null
    if (userForLeave) {
      leaveChannel(`private-user.${userForLeave.id}`)
    }

    // Stop fallback polling
    fallback.stopPolling()

    // Cleanup reconnection handlers
    if (unsubReconnect) {
      unsubReconnect()
      unsubReconnect = null
    }
    if (unsubMaxAttempts) {
      unsubMaxAttempts()
      unsubMaxAttempts = null
    }

    isListening.value = false
  }

  /**
   * Force reconnect to WebSocket (useful for manual retry)
   */
  const retryConnection = () => {
    fallback.stopPolling()
    forceReconnect()
  }

  /**
   * Register callback for new messages on public channel
   */
  const onNewMessage = (callback: (message: AgoraRealtimeMessage) => void) => {
    onNewMessageCallback = callback
  }

  /**
   * Register callback for replies to user's own messages
   */
  const onReplyToMe = (callback: (message: AgoraRealtimeMessage) => void) => {
    onReplyToMeCallback = callback
  }

  /**
   * Register callback for message updates
   */
  const onMessageUpdated = (callback: (data: AgoraMessageUpdatedEvent) => void) => {
    onMessageUpdatedCallback = callback
  }

  /**
   * Register callback for message deletions
   */
  const onMessageDeleted = (callback: (data: AgoraMessageDeletedEvent) => void) => {
    onMessageDeletedCallback = callback
  }

  /**
   * Clear accumulated new messages
   */
  const clearNewMessages = () => {
    newMessages.value = []
  }

  // Computed count of new messages
  const newMessagesCount = computed(() => newMessages.value.length)

  // Cleanup on unmount
  onUnmounted(() => {
    stopListening()
  })

  return {
    // State
    isConnected,
    isListening,
    connectionError,
    errorType,
    reconnectAttempt,
    usingFallback,
    newMessages,
    newMessagesCount,

    // Fallback state
    isPolling: fallback.isPolling,
    lastPollTime: fallback.lastPollTime,

    // Methods
    startListening,
    stopListening,
    retryConnection,
    onNewMessage,
    onReplyToMe,
    onMessageUpdated,
    onMessageDeleted,
    clearNewMessages,
  }
}
