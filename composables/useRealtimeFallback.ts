import { ref, onUnmounted } from 'vue'

export interface FallbackOptions {
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  pollingInterval?: number
  /** Whether to start polling automatically (default: false) */
  autoStart?: boolean
  /** Function to fetch new data from API */
  fetchFn: () => Promise<void>
  /** Optional: last known timestamp/id for incremental fetching */
  getLastTimestamp?: () => string | number | null
}

export const useRealtimeFallback = (options: FallbackOptions) => {
  const { pollingInterval = 30000, autoStart = false, fetchFn } = options

  const isPolling = ref(false)
  const lastPollTime = ref<Date | null>(null)
  const pollError = ref<string | null>(null)
  const pollCount = ref(0)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  /**
   * Execute a single poll
   */
  const poll = async (): Promise<void> => {
    if (typeof window === 'undefined') return

    try {
      pollError.value = null
      await fetchFn()
      lastPollTime.value = new Date()
      pollCount.value++
    } catch (error: unknown) {
      pollError.value = error instanceof Error ? error.message : 'Polling error'
      console.error('[Fallback] Poll error:', error)
    }
  }

  /**
   * Start polling at the configured interval
   */
  const startPolling = (): void => {
    if (isPolling.value || typeof window === 'undefined') return

    isPolling.value = true

    // Do an immediate poll
    poll()

    // Then poll at interval
    pollTimer = setInterval(poll, pollingInterval)
  }

  /**
   * Stop polling
   */
  const stopPolling = (): void => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    isPolling.value = false
  }

  /**
   * Restart polling (useful after connection recovery)
   */
  const restartPolling = (): void => {
    stopPolling()
    startPolling()
  }

  /**
   * Change polling interval
   */
  const setPollingInterval = (newInterval: number): void => {
    if (isPolling.value) {
      stopPolling()
      // Recurse with new interval
      setTimeout(() => {
        pollTimer = setInterval(poll, newInterval)
        isPolling.value = true
      }, 0)
    }
  }

  // Auto-start if enabled
  if (autoStart && typeof window !== 'undefined') {
    startPolling()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopPolling()
  })

  return {
    // State
    isPolling,
    lastPollTime,
    pollError,
    pollCount,

    // Methods
    poll,
    startPolling,
    stopPolling,
    restartPolling,
    setPollingInterval,
  }
}
