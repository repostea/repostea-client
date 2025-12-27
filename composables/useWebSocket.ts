import { ref, onMounted, onUnmounted, readonly, getCurrentInstance } from 'vue'
import { useRuntimeConfig } from '#app'

export interface WebSocketEvent {
  type: string
  data: any
  timestamp: number
  id?: string
}

export interface WebSocketOptions {
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  autoConnect?: boolean
}

export const useWebSocket = (options: WebSocketOptions = {}) => {
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    autoConnect = false,
  } = options

  const config = useRuntimeConfig()

  // State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const reconnectAttempts = ref(0)
  const lastError = ref<string | null>(null)

  // Connection references
  let eventSource: EventSource | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  // Event listeners
  const listeners = new Map<string, Set<Function>>()

  // Get SSE URL from API base
  const getSSEUrl = (): string => {
    const baseUrl = (config.public.apiBaseUrl as string) || 'http://localhost:8000/api'
    const sseUrl = baseUrl.replace('/api', '/sse')
    return `${sseUrl}/notifications`
  }

  // Add event listener
  const on = (event: string, callback: Function) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)?.add(callback)

    return () => {
      listeners.get(event)?.delete(callback)
    }
  }

  // Remove event listener
  const off = (event: string, callback?: Function) => {
    if (!callback) {
      listeners.delete(event)
    } else {
      listeners.get(event)?.delete(callback)
    }
  }

  // Emit event to listeners
  const emit = (event: string, data: any) => {
    const eventListeners = listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error)
        }
      })
    }
  }

  // Connect to SSE
  const connect = async (): Promise<void> => {
    if (isConnecting.value || isConnected.value) {
      return
    }

    if (!process.client) {
      return
    }

    isConnecting.value = true
    lastError.value = null

    try {
      // Get auth token for SSE connection
      const token = process.client
        ? sessionStorage.getItem('token') || localStorage.getItem('token')
        : null

      const sseUrl = getSSEUrl()
      const urlWithAuth = token ? `${sseUrl}?token=${encodeURIComponent(token)}` : sseUrl

      eventSource = new EventSource(urlWithAuth)

      eventSource.onopen = () => {
        isConnected.value = true
        isConnecting.value = false
        reconnectAttempts.value = 0
        lastError.value = null

        emit('connected', null)

        // Start heartbeat
        startHeartbeat()
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const wsEvent: WebSocketEvent = {
            type: data.type || 'message',
            data: data.data || data,
            timestamp: Date.now(),
            id: event.lastEventId,
          }

          emit('message', wsEvent)
          emit(wsEvent.type, wsEvent.data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      eventSource.onerror = (event) => {
        console.error('❌ WebSocket error:', event)
        isConnected.value = false
        isConnecting.value = false
        lastError.value = 'Connection error'

        emit('error', event)

        // Attempt reconnection
        if (reconnectAttempts.value < maxReconnectAttempts) {
          scheduleReconnect()
        } else {
          console.error('Max reconnection attempts reached')
          emit('max_reconnect_attempts', null)
        }
      }

      // Listen for specific notification events
      eventSource.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data)
          emit('notification', notification)
        } catch (error) {
          console.error('Error parsing notification:', error)
        }
      })

      eventSource.addEventListener('comment', (event) => {
        try {
          const comment = JSON.parse(event.data)
          emit('comment', comment)
        } catch (error) {
          console.error('Error parsing comment:', error)
        }
      })

      eventSource.addEventListener('vote', (event) => {
        try {
          const vote = JSON.parse(event.data)
          emit('vote', vote)
        } catch (error) {
          console.error('Error parsing vote:', error)
        }
      })
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error)
      isConnecting.value = false
      lastError.value = error instanceof Error ? error.message : 'Unknown error'
      emit('error', error)
    }
  }

  // Disconnect
  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    stopHeartbeat()
    clearReconnectTimer()

    isConnected.value = false
    isConnecting.value = false

    emit('disconnected', null)
  }

  // Schedule reconnection
  const scheduleReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }

    reconnectAttempts.value++
    const delay = reconnectInterval * Math.min(reconnectAttempts.value, 5) // Exponential backoff

    reconnectTimer = setTimeout(() => {
      if (!isConnected.value) {
        connect()
      }
    }, delay)
  }

  // Start heartbeat
  const startHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
    }

    heartbeatTimer = setInterval(() => {
      if (isConnected.value && eventSource && eventSource.readyState === EventSource.OPEN) {
        // SSE doesn't need manual heartbeat, but we can check connection status
        emit('heartbeat', null)
      } else {
        // Connection lost, attempt reconnection
        disconnect()
        scheduleReconnect()
      }
    }, heartbeatInterval)
  }

  // Stop heartbeat
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  // Clear reconnection timer
  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  // Cleanup
  const cleanup = () => {
    disconnect()
    listeners.clear()
  }

  // Auto-connect on mount (only if in component context)
  if (getCurrentInstance()) {
    onMounted(() => {
      if (autoConnect) {
        connect()
      }
    })

    // Cleanup on unmount
    onUnmounted(() => {
      cleanup()
    })
  } else if (autoConnect) {
    // If not in component context, connect immediately
    connect()
  }

  return {
    // State
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    reconnectAttempts: readonly(reconnectAttempts),
    lastError: readonly(lastError),

    // Methods
    connect,
    disconnect,
    on,
    off,
    emit,

    // Convenience methods for common events
    onNotification: (callback: Function) => on('notification', callback),
    onComment: (callback: Function) => on('comment', callback),
    onVote: (callback: Function) => on('vote', callback),
    onConnected: (callback: Function) => on('connected', callback),
    onDisconnected: (callback: Function) => on('disconnected', callback),
    onError: (callback: Function) => on('error', callback),
  }
}
