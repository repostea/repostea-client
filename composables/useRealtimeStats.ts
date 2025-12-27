import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useEcho } from './useEcho'
import { useRoute } from 'vue-router'
import { usePostsStore } from '~/stores/posts'
import { useAuth } from './useAuth'

export interface PostStatsUpdate {
  id: number
  votes?: number
  comments_count?: number
  views?: number
  total_views?: number
}

export interface StatsUpdatedEvent {
  updates: PostStatsUpdate[]
  timestamp: number
}

// Channel names matching backend
const CHANNELS = {
  FRONTPAGE: 'posts.frontpage',
  PENDING: 'posts.pending',
  SUB_PREFIX: 'sub.',
  POST_PREFIX: 'post.',
  PRESENCE: 'realtime.presence',
} as const

/**
 * Composable for managing realtime post stats updates via WebSocket.
 * Automatically subscribes to the appropriate channel based on current route.
 */
export const useRealtimeStats = () => {
  const { channel, presenceChannel, leaveChannel, connect, isConnected } = useEcho()
  const route = useRoute()
  const postsStore = usePostsStore()
  const { isAuthenticated } = useAuth()

  const currentChannel = ref<string | null>(null)
  const lastUpdate = ref<number>(0)
  const updatesReceived = ref(0)
  const heartbeatInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const isRegistered = ref(false)

  // Determine which channel to subscribe to based on current route
  const getChannelForRoute = (): string | null => {
    const path = route.path

    // Post detail page: /p/{slug}
    if (path.startsWith('/p/')) {
      // We'd need the post ID, which we might not have from the slug
      // For now, we'll use frontpage channel and filter client-side
      return CHANNELS.FRONTPAGE
    }

    // Sub page: /s/{name}
    if (path.startsWith('/s/') && route.params.name) {
      // We'd need the sub ID, for now use frontpage
      return CHANNELS.FRONTPAGE
    }

    // Pending page
    if (path === '/pending' || path.endsWith('/pending')) {
      return CHANNELS.PENDING
    }

    // Default: frontpage
    return CHANNELS.FRONTPAGE
  }

  // Handle incoming stats update
  const handleStatsUpdate = (event: StatsUpdatedEvent) => {
    if (!event.updates || !Array.isArray(event.updates)) return

    lastUpdate.value = event.timestamp || Date.now()
    updatesReceived.value++

    // Update posts in the store
    event.updates.forEach((update) => {
      postsStore.updatePostStats(update.id, {
        votes: update.votes,
        comments_count: update.comments_count,
        views: update.views,
        total_views: update.total_views,
      })
    })
  }

  // Subscribe to a channel
  const subscribeToChannel = (channelName: string) => {
    if (currentChannel.value === channelName) return

    // Leave previous channel
    if (currentChannel.value) {
      leaveChannel(currentChannel.value)
    }

    currentChannel.value = channelName

    const chan = channel(channelName)
    if (chan) {
      chan.listen('.stats.updated', handleStatsUpdate)
    }
  }

  // Subscribe to the appropriate channel for current route
  const subscribeForCurrentRoute = () => {
    const channelName = getChannelForRoute()
    if (channelName) {
      subscribeToChannel(channelName)
    }
  }

  // Subscribe to a specific post's channel (for post detail pages)
  const subscribeToPost = (postId: number) => {
    const channelName = `${CHANNELS.POST_PREFIX}${postId}`
    subscribeToChannel(channelName)
  }

  // Subscribe to a sub's channel
  const subscribeToSub = (subId: number) => {
    const channelName = `${CHANNELS.SUB_PREFIX}${subId}`
    subscribeToChannel(channelName)
  }

  // Register connection with backend for counting
  const registerConnection = async () => {
    if (isRegistered.value) return

    try {
      const config = useRuntimeConfig()
      const token = import.meta.client
        ? sessionStorage.getItem('token') || localStorage.getItem('token')
        : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await $fetch(`${config.public.apiBaseUrl}/v1/realtime/connect`, {
        method: 'POST',
        headers,
      })
      isRegistered.value = true

      // Start heartbeat every 60 seconds
      heartbeatInterval.value = setInterval(async () => {
        try {
          await $fetch(`${config.public.apiBaseUrl}/v1/realtime/heartbeat`, {
            method: 'POST',
            headers,
          })
        } catch {
          // Heartbeat failed silently
        }
      }, 60000)
    } catch {
      // Failed to register connection silently
    }
  }

  // Unregister connection
  const unregisterConnection = async () => {
    if (!isRegistered.value) return

    // Clear heartbeat
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }

    try {
      const config = useRuntimeConfig()
      const token = import.meta.client
        ? sessionStorage.getItem('token') || localStorage.getItem('token')
        : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await $fetch(`${config.public.apiBaseUrl}/v1/realtime/disconnect`, {
        method: 'POST',
        headers,
      })
      isRegistered.value = false
    } catch {
      // Ignore errors on disconnect
    }
  }

  // Join presence channel to help with connection counting
  // Only authenticated users can join presence channels
  const joinPresence = () => {
    if (!isAuthenticated.value) return

    const presence = presenceChannel(CHANNELS.PRESENCE)
    if (presence) {
      presence
        .here(() => {})
        .joining(() => {
          // User joined
        })
        .leaving(() => {
          // User left
        })
    }
  }

  // Cleanup
  const cleanup = async () => {
    if (currentChannel.value) {
      leaveChannel(currentChannel.value)
      currentChannel.value = null
    }
    leaveChannel(CHANNELS.PRESENCE)
    await unregisterConnection()
  }

  // Watch for route changes
  watch(
    () => route.path,
    () => {
      subscribeForCurrentRoute()
    }
  )

  // Watch for connection state
  watch(isConnected, (connected) => {
    if (connected) {
      subscribeForCurrentRoute()
      joinPresence()
      registerConnection()
    }
  })

  onMounted(() => {
    // Connect if not already connected
    if (!isConnected.value) {
      connect()
    } else {
      subscribeForCurrentRoute()
      joinPresence()
      registerConnection()
    }
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // State
    currentChannel: computed(() => currentChannel.value),
    isConnected,
    lastUpdate: computed(() => lastUpdate.value),
    updatesReceived: computed(() => updatesReceived.value),

    // Methods
    subscribeToPost,
    subscribeToSub,
    subscribeForCurrentRoute,
    cleanup,
  }
}
