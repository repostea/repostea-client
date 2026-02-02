import { computed, type Ref, type ComputedRef } from 'vue'
import { extractEmbeds } from '~/utils/markdown'

interface User {
  id: number
  username?: string
  isAdmin?: boolean
}

interface AgoraMessage {
  id: number
  content: string
  user?: User
  parent_id?: number | null
  expires_at?: string | null
  expires_in_hours?: number
  expiry_mode?: 'from_first' | 'from_last'
  is_anonymous?: boolean
  total_replies_count?: number
  replies?: AgoraMessage[]
  vote_type_summary?: Record<string, number>
}

interface ExpiryOption {
  value: number
  label: string
}

interface UseAgoraMessageReturn {
  canEdit: ComputedRef<boolean>
  canDelete: ComputedRef<boolean>
  isTopLevelMessage: ComputedRef<boolean>
  totalRepliesCount: ComputedRef<number>
  messageEmbeds: ComputedRef<Array<{ provider: string; url: string }>>
  voteTypeSummary: ComputedRef<Record<string, number>>
  countAllReplies: (msg: AgoraMessage | null | undefined) => number
  flattenReplies: (
    replies: AgoraMessage[] | null | undefined,
    depth?: number,
    result?: Array<AgoraMessage & { _depth: number }>
  ) => Array<AgoraMessage & { _depth: number }>
  getExpiryLabel: (hours: number, options: ExpiryOption[]) => string
  formatExpiryTime: (expiresAt: string | null | undefined) => string
}

export function useAgoraMessage(
  message: Ref<AgoraMessage>,
  authUser: Ref<User | null>
): UseAgoraMessageReturn {
  /**
   * Check if current user can edit this message (must be the author)
   */
  const canEdit = computed<boolean>(() => {
    return Boolean(authUser.value && authUser.value.id === message.value.user?.id)
  })

  /**
   * Check if current user can delete this message (author or admin)
   */
  const canDelete = computed<boolean>(() => {
    return Boolean(
      authUser.value &&
        (authUser.value.id === message.value.user?.id || authUser.value.isAdmin)
    )
  })

  /**
   * Check if this is a top-level message (not a reply)
   */
  const isTopLevelMessage = computed<boolean>(() => {
    return !message.value.parent_id
  })

  /**
   * Recursively count all nested replies
   */
  function countAllReplies(msg: AgoraMessage | null | undefined): number {
    if (!msg || !msg.replies) return 0
    let count = msg.replies.length
    for (const reply of msg.replies) {
      count += countAllReplies(reply)
    }
    return count
  }

  /**
   * Get total replies count - prefers server-calculated total if available
   */
  const totalRepliesCount = computed<number>(() => {
    if (
      message.value.total_replies_count !== undefined &&
      message.value.total_replies_count > 0
    ) {
      return message.value.total_replies_count
    }
    return countAllReplies(message.value)
  })

  /**
   * Flatten replies for compact preview (max 10, with nesting depth info)
   */
  function flattenReplies(
    replies: AgoraMessage[] | null | undefined,
    depth = 0,
    result: Array<AgoraMessage & { _depth: number }> = []
  ): Array<AgoraMessage & { _depth: number }> {
    if (!replies || result.length >= 10) return result
    for (const reply of replies) {
      if (result.length >= 10) break
      result.push({ ...reply, _depth: depth })
      if (reply.replies && reply.replies.length > 0) {
        flattenReplies(reply.replies, depth + 1, result)
      }
    }
    return result
  }

  /**
   * Get label for expiry hours from options list
   */
  function getExpiryLabel(hours: number, options: ExpiryOption[]): string {
    const option = options.find((o) => o.value === hours)
    return option ? option.label.toLowerCase() : ''
  }

  /**
   * Format expiry time as relative time string (e.g., "3d", "5h", "30m")
   */
  function formatExpiryTime(expiresAt: string | null | undefined): string {
    if (!expiresAt) return ''

    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()

    if (diffMs <= 0) return 'expired'

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) return `${diffDays}d`
    if (diffHours > 0) return `${diffHours}h`
    return `${diffMinutes}m`
  }

  /**
   * Extract embeds from message content
   */
  const messageEmbeds = computed(() => {
    return extractEmbeds(message.value?.content || '')
  })

  /**
   * Get vote type summary
   */
  const voteTypeSummary = computed<Record<string, number>>(() => {
    return message.value.vote_type_summary || {}
  })

  return {
    canEdit,
    canDelete,
    isTopLevelMessage,
    totalRepliesCount,
    messageEmbeds,
    voteTypeSummary,
    countAllReplies,
    flattenReplies,
    getExpiryLabel,
    formatExpiryTime,
  }
}
