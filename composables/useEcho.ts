import { ref, onMounted, onUnmounted } from 'vue'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Make Pusher available globally for Echo
if (typeof window !== 'undefined') {
  ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher
}

 
let echoInstance: Echo<any> | null = null

// Reconnection state (shared across all useEcho instances)
let reconnectAttempts = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let isReconnecting = false

export interface EchoOptions {
  autoConnect?: boolean
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  baseReconnectDelay?: number
  maxReconnectDelay?: number
}

// Error codes from Pusher/Reverb
export const ECHO_ERROR_CODES = {
  CONNECTION_LIMIT: 4004, // Over connection limit
  APP_DISABLED: 4003,
  INVALID_KEY: 4001,
} as const

export type EchoErrorType = 'connection_limit' | 'generic' | null

// Callbacks for reconnection events (global)
type ReconnectCallback = () => void
type MaxReconnectCallback = () => void
const reconnectCallbacks: Set<ReconnectCallback> = new Set()
const maxReconnectCallbacks: Set<MaxReconnectCallback> = new Set()

// Shared reactive state
const sharedIsConnected = ref(false)
const sharedIsConnecting = ref(false)
const sharedConnectionError = ref<string | null>(null)
const sharedErrorType = ref<EchoErrorType>(null)
const sharedReconnectAttempt = ref(0)
const sharedUsingFallback = ref(false)

export const useEcho = (options: EchoOptions = {}) => {
  const {
    autoConnect = false,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    baseReconnectDelay = 1000,
    maxReconnectDelay = 30000,
  } = options

  // Calculate reconnect delay with exponential backoff
  const getReconnectDelay = (): number => {
    const delay = Math.min(
      baseReconnectDelay * Math.pow(2, reconnectAttempts),
      maxReconnectDelay
    )
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5)
    return Math.round(delay + jitter)
  }

  // Attempt reconnection
  const attemptReconnect = () => {
    if (!autoReconnect || isReconnecting) return
    if (reconnectAttempts >= maxReconnectAttempts) {
      sharedUsingFallback.value = true
      maxReconnectCallbacks.forEach((cb) => cb())
      return
    }

    isReconnecting = true
    reconnectAttempts++
    sharedReconnectAttempt.value = reconnectAttempts

    const delay = getReconnectDelay()

    reconnectTimer = setTimeout(() => {
      isReconnecting = false
      if (echoInstance) {
        echoInstance.connector.pusher.connect()
      }
    }, delay)
  }

  // Reset reconnection state on successful connection
  const resetReconnectState = () => {
    reconnectAttempts = 0
    sharedReconnectAttempt.value = 0
    sharedUsingFallback.value = false
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    isReconnecting = false
  }

  // Get or create Echo instance (singleton)
   
  const getEcho = (): Echo<any> | null => {
    if (typeof window === 'undefined') return null

    if (!echoInstance) {
      const config = useRuntimeConfig()

      // Get auth token
      const token =
        sessionStorage.getItem('token') || localStorage.getItem('token')

      const isSecure = config.public.reverbScheme === 'https'
      const wsPort = Number(config.public.reverbPort) || 8080

      echoInstance = new Echo({
        broadcaster: 'reverb',
        key: config.public.reverbAppKey || 'local',
        wsHost: config.public.reverbHost || 'localhost',
        wsPort: wsPort,
        wssPort: wsPort,
        forceTLS: isSecure,
        encrypted: isSecure,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        authEndpoint: `${config.public.apiBaseUrl.replace(/\/api$/, '')}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
        cluster: 'mt1',
      })

      // Listen for connection events
      echoInstance.connector.pusher.connection.bind(
        'connected',
        () => {
          sharedIsConnected.value = true
          sharedIsConnecting.value = false
          sharedConnectionError.value = null
          sharedErrorType.value = null
          resetReconnectState()
          reconnectCallbacks.forEach((cb) => cb())
        }
      )

      echoInstance.connector.pusher.connection.bind(
        'disconnected',
        () => {
          sharedIsConnected.value = false
          // Auto-reconnect on disconnect
          if (autoReconnect && !sharedUsingFallback.value) {
            attemptReconnect()
          }
        }
      )

      echoInstance.connector.pusher.connection.bind(
        'error',
        (error: { error?: { data?: { code?: number } }; data?: { code?: number }; code?: number; message?: string }) => {
          const code = error?.error?.data?.code || error?.data?.code || error?.code

          // Detect connection limit error (code 4004)
          if (code === ECHO_ERROR_CODES.CONNECTION_LIMIT) {
            sharedErrorType.value = 'connection_limit'
            sharedConnectionError.value = 'connection_limit_reached'
          } else {
            sharedErrorType.value = 'generic'
            sharedConnectionError.value = error?.message || 'Connection error'
          }

          sharedIsConnecting.value = false

          // Auto-reconnect on error (unless it's connection limit)
          if (autoReconnect && code !== ECHO_ERROR_CODES.CONNECTION_LIMIT) {
            attemptReconnect()
          } else if (code === ECHO_ERROR_CODES.CONNECTION_LIMIT) {
            // Connection limit: go to fallback immediately
            sharedUsingFallback.value = true
            maxReconnectCallbacks.forEach((cb) => cb())
          }
        }
      )

      // Handle state changes from Pusher
      echoInstance.connector.pusher.connection.bind(
        'state_change',
        (states: { previous: string; current: string }) => {
          if (states.current === 'unavailable' && autoReconnect) {
            attemptReconnect()
          }
        }
      )
    }

    return echoInstance
  }

  // Connect to Echo
  const connect = () => {
    if (typeof window === 'undefined') return

    sharedIsConnecting.value = true
    sharedUsingFallback.value = false
    resetReconnectState()

    const echo = getEcho()

    if (echo) {
      echo.connector.pusher.connect()
    }
  }

  // Disconnect from Echo
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    isReconnecting = false

    if (echoInstance) {
      echoInstance.disconnect()
      sharedIsConnected.value = false
    }
  }

  // Force retry connection (reset attempts and try again)
  const forceReconnect = () => {
    resetReconnectState()
    connect()
  }

  // Register callback for successful reconnection
  const onReconnect = (callback: ReconnectCallback) => {
    reconnectCallbacks.add(callback)
    return () => reconnectCallbacks.delete(callback)
  }

  // Register callback for max reconnect attempts reached (fallback mode)
  const onMaxReconnectAttempts = (callback: MaxReconnectCallback) => {
    maxReconnectCallbacks.add(callback)
    return () => maxReconnectCallbacks.delete(callback)
  }

  // Subscribe to a public channel
  const channel = (channelName: string) => {
    const echo = getEcho()
    return echo?.channel(channelName)
  }

  // Subscribe to a private channel
  const privateChannel = (channelName: string) => {
    const echo = getEcho()
    return echo?.private(channelName)
  }

  // Subscribe to a presence channel
  const presenceChannel = (channelName: string) => {
    const echo = getEcho()
    return echo?.join(channelName)
  }

  // Leave a channel
  const leaveChannel = (channelName: string) => {
    const echo = getEcho()
    echo?.leave(channelName)
  }

  // Auto-connect on mount if option is enabled
  onMounted(() => {
    if (autoConnect && typeof window !== 'undefined') {
      connect()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    // Don't disconnect the singleton, just leave channels if needed
  })

  return {
    // State (shared refs)
    isConnected: sharedIsConnected,
    isConnecting: sharedIsConnecting,
    connectionError: sharedConnectionError,
    errorType: sharedErrorType,
    reconnectAttempt: sharedReconnectAttempt,
    usingFallback: sharedUsingFallback,

    // Methods
    connect,
    disconnect,
    forceReconnect,
    channel,
    privateChannel,
    presenceChannel,
    leaveChannel,

    // Callbacks
    onReconnect,
    onMaxReconnectAttempts,

    // Get raw Echo instance
    getEcho,
  }
}

// Export a function to update auth token (useful after login)
export const updateEchoAuth = (token: string) => {
  if (echoInstance) {
    echoInstance.connector.options.auth.headers.Authorization = `Bearer ${token}`
  }
}

// Export a function to disconnect Echo globally
export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}
