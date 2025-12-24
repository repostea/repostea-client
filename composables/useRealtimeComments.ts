import { ref, onMounted, onUnmounted } from 'vue'
import { useEcho } from './useEcho'

export interface RealtimeComment {
  id: number
  content: string
  parent_id: number | null
  user: {
    id: number
    username: string
    display_name?: string
    avatar?: string
  }
  created_at: string
  votes_count: number
}

export interface NewCommentEvent {
  comment: RealtimeComment
  post_id: number
  parent_id: number | null
  timestamp: number
}

/**
 * Composable for receiving new comments in real-time on a post detail page.
 */
export const useRealtimeComments = (postId: number | null) => {
  const { channel, leaveChannel, connect, isConnected } = useEcho()

  const newComments = ref<RealtimeComment[]>([])
  const pendingCount = ref(0)
  const lastCommentAt = ref<number>(0)

  // Track comment IDs that were created by the current user in this session
  // This handles both authenticated and anonymous users
  const ownCommentIds = new Set<number>()

  let currentChannel: string | null = null
  let onNewCommentCallback: ((comment: RealtimeComment) => void) | null = null

  // Mark a comment ID as created by the current user
  const markAsOwn = (commentId: number) => {
    ownCommentIds.add(commentId)
    // Clean up old IDs after 5 minutes to prevent memory buildup
    setTimeout(() => {
      ownCommentIds.delete(commentId)
    }, 5 * 60 * 1000)
  }

  // Handle incoming new comment
  const handleNewComment = (event: NewCommentEvent) => {
    if (!event.comment) return

    // Ignore comments created by the current user (already visible in their UI)
    if (ownCommentIds.has(event.comment.id)) {
      return
    }


    newComments.value.push(event.comment)
    pendingCount.value++
    lastCommentAt.value = event.timestamp || Date.now()

    // Call the callback if registered
    if (onNewCommentCallback) {
      onNewCommentCallback(event.comment)
    }
  }

  // Subscribe to post channel for comments
  const subscribe = (id: number) => {
    if (!id || id === 0) return

    const channelName = `post.${id}`

    if (currentChannel === channelName) return

    // Leave previous channel
    if (currentChannel) {
      leaveChannel(currentChannel)
    }

    currentChannel = channelName

    // Connect if not connected
    if (!isConnected.value) {
      connect()
    }

    const chan = channel(channelName)
    if (chan) {
      chan.listen('.comment.created', handleNewComment)
    }
  }

  // Unsubscribe from channel
  const unsubscribe = () => {
    if (currentChannel) {
      leaveChannel(currentChannel)
      currentChannel = null
    }
  }

  // Clear pending comments (e.g., after user clicks "show new comments")
  const clearPending = () => {
    newComments.value = []
    pendingCount.value = 0
  }

  // Register a callback for new comments
  const onNewComment = (callback: (comment: RealtimeComment) => void) => {
    onNewCommentCallback = callback
  }

  // Auto-subscribe if postId is provided
  onMounted(() => {
    if (postId && postId > 0) {
      subscribe(postId)
    }
  })

  onUnmounted(() => {
    unsubscribe()
    onNewCommentCallback = null
  })

  return {
    // State
    newComments,
    pendingCount,
    lastCommentAt,
    isConnected,

    // Methods
    subscribe,
    unsubscribe,
    clearPending,
    onNewComment,
    markAsOwn,
  }
}
