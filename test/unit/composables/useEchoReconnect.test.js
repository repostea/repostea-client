import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Import after mocks are set up
import { useEcho, updateEchoAuth, disconnectEcho, ECHO_ERROR_CODES } from '~/composables/useEcho'

// Mock useRuntimeConfig globally
global.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'http://localhost:8000/api',
    reverbAppKey: 'test-key',
    reverbHost: 'localhost',
    reverbPort: '8080',
    reverbScheme: 'http',
  },
}))

// Mock laravel-echo and pusher-js before importing the module
vi.mock('laravel-echo', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      connector: {
        pusher: {
          connection: {
            bind: vi.fn(),
          },
          connect: vi.fn(),
        },
        options: {
          auth: {
            headers: {
              Authorization: '',
            },
          },
        },
      },
      channel: vi.fn().mockReturnValue({
        listen: vi.fn().mockReturnThis(),
      }),
      private: vi.fn().mockReturnValue({
        listen: vi.fn().mockReturnThis(),
      }),
      join: vi.fn().mockReturnValue({
        listen: vi.fn().mockReturnThis(),
      }),
      leave: vi.fn(),
      disconnect: vi.fn(),
    })),
  }
})

vi.mock('pusher-js', () => ({
  default: vi.fn(),
}))

describe('useEcho', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    // Reset module state by clearing the singleton
    disconnectEcho()

    // Mock storage
    global.sessionStorage = {
      getItem: vi.fn().mockReturnValue('test-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    global.localStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    disconnectEcho()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const {
        isConnected,
        isConnecting,
        connectionError,
        errorType,
        reconnectAttempt,
        usingFallback,
      } = useEcho()

      expect(isConnected.value).toBe(false)
      expect(isConnecting.value).toBe(false)
      expect(connectionError.value).toBeNull()
      expect(errorType.value).toBeNull()
      expect(reconnectAttempt.value).toBe(0)
      expect(usingFallback.value).toBe(false)
    })
  })

  describe('connect', () => {
    it('should set isConnecting to true when connecting', () => {
      const { connect, isConnecting } = useEcho()

      connect()

      expect(isConnecting.value).toBe(true)
    })

    it('should reset fallback state when connecting', () => {
      const { connect, usingFallback, reconnectAttempt } = useEcho()

      // Simulate previous fallback state
      usingFallback.value = true
      reconnectAttempt.value = 3

      connect()

      expect(usingFallback.value).toBe(false)
      expect(reconnectAttempt.value).toBe(0)
    })
  })

  describe('options', () => {
    it('should accept autoReconnect option', () => {
      const echo = useEcho({ autoReconnect: false })
      expect(echo).toBeDefined()
    })

    it('should accept maxReconnectAttempts option', () => {
      const echo = useEcho({ maxReconnectAttempts: 10 })
      expect(echo).toBeDefined()
    })

    it('should accept baseReconnectDelay option', () => {
      const echo = useEcho({ baseReconnectDelay: 2000 })
      expect(echo).toBeDefined()
    })

    it('should accept maxReconnectDelay option', () => {
      const echo = useEcho({ maxReconnectDelay: 60000 })
      expect(echo).toBeDefined()
    })
  })

  describe('forceReconnect', () => {
    it('should reset reconnection state and call connect', () => {
      const { forceReconnect, reconnectAttempt, isConnecting } = useEcho()

      forceReconnect()

      expect(reconnectAttempt.value).toBe(0)
      expect(isConnecting.value).toBe(true)
    })
  })

  describe('onReconnect callback', () => {
    it('should register and return unsubscribe function', () => {
      const { onReconnect } = useEcho()
      const callback = vi.fn()

      const unsubscribe = onReconnect(callback)

      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('onMaxReconnectAttempts callback', () => {
    it('should register and return unsubscribe function', () => {
      const { onMaxReconnectAttempts } = useEcho()
      const callback = vi.fn()

      const unsubscribe = onMaxReconnectAttempts(callback)

      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('disconnect', () => {
    it('should set isConnected to false', () => {
      const { connect, disconnect, isConnected } = useEcho()

      connect()
      disconnect()

      expect(isConnected.value).toBe(false)
    })
  })

  describe('channel methods', () => {
    it('should return channel from channel method', () => {
      const { connect, channel } = useEcho()

      connect()
      const ch = channel('test-channel')

      expect(ch).toBeDefined()
    })

    it('should return private channel from privateChannel method', () => {
      const { connect, privateChannel } = useEcho()

      connect()
      const ch = privateChannel('test-private')

      expect(ch).toBeDefined()
    })

    it('should return presence channel from presenceChannel method', () => {
      const { connect, presenceChannel } = useEcho()

      connect()
      const ch = presenceChannel('test-presence')

      expect(ch).toBeDefined()
    })
  })

  describe('ECHO_ERROR_CODES', () => {
    it('should export correct error codes', () => {
      expect(ECHO_ERROR_CODES.CONNECTION_LIMIT).toBe(4004)
      expect(ECHO_ERROR_CODES.APP_DISABLED).toBe(4003)
      expect(ECHO_ERROR_CODES.INVALID_KEY).toBe(4001)
    })
  })

  describe('updateEchoAuth', () => {
    it('should be a function', () => {
      expect(typeof updateEchoAuth).toBe('function')
    })
  })

  describe('disconnectEcho', () => {
    it('should be a function', () => {
      expect(typeof disconnectEcho).toBe('function')
    })

    it('should disconnect and clear the instance', () => {
      const { connect, getEcho } = useEcho()

      connect()
      disconnectEcho()

      // After disconnect, getEcho should create a new instance
      const newEcho = getEcho()
      expect(newEcho).toBeDefined()
    })
  })

  describe('shared state', () => {
    it('should share state between multiple useEcho calls', () => {
      const echo1 = useEcho()
      const echo2 = useEcho()

      echo1.connect()

      // Both should reflect the same connecting state
      expect(echo1.isConnecting.value).toBe(true)
      expect(echo2.isConnecting.value).toBe(true)
    })
  })
})
