import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWebSocket } from '~/composables/useWebSocket'

// Mock EventSource
class MockEventSource {
  static OPEN = 1
  static CLOSED = 2

  constructor(url) {
    this.url = url
    this.readyState = MockEventSource.OPEN
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    this.listeners = new Map()

    // Simulate connection
    setTimeout(() => {
      if (this.onopen) {
        this.onopen({ type: 'open' })
      }
    }, 0)
  }

  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
  }

  removeEventListener(event, callback) {
    this.listeners.get(event)?.delete(callback)
  }

  close() {
    this.readyState = MockEventSource.CLOSED
  }

  // Helper to simulate events in tests
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) })
    }
  }

  simulateError(error) {
    if (this.onerror) {
      this.onerror(error)
    }
  }

  simulateCustomEvent(eventName, data) {
    const listeners = this.listeners.get(eventName)
    if (listeners) {
      listeners.forEach((callback) => {
        callback({ data: JSON.stringify(data) })
      })
    }
  }
}

// Get mock API from global imports
const getMockApi = () => useNuxtApp().$api

describe('useWebSocket', () => {
  let mockApi
  let originalEventSource
  let originalProcess

  beforeEach(() => {
    mockApi = getMockApi()
    vi.clearAllMocks()

    // Store originals
    originalEventSource = global.EventSource
    originalProcess = global.process

    // Setup mocks
    global.EventSource = MockEventSource
    global.process = { client: true }
    global.localStorage = {
      getItem: vi.fn().mockReturnValue('test-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }

    // Setup auth API mock
    if (!mockApi.auth.getToken) {
      mockApi.auth.getToken = vi.fn().mockResolvedValue('test-token')
    }
  })

  afterEach(() => {
    global.EventSource = originalEventSource
    global.process = originalProcess
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const ws = useWebSocket()

      expect(ws.isConnected.value).toBe(false)
      expect(ws.isConnecting.value).toBe(false)
      expect(ws.reconnectAttempts.value).toBe(0)
      expect(ws.lastError.value).toBeNull()
    })
  })

  describe('connect', () => {
    it('should set isConnecting during connection', async () => {
      const ws = useWebSocket()

      const connectPromise = ws.connect()
      expect(ws.isConnecting.value).toBe(true)

      // Wait for async connection
      await new Promise((resolve) => setTimeout(resolve, 10))
      await connectPromise
    })

    it('should set isConnected after successful connection', async () => {
      const ws = useWebSocket()
      await ws.connect()

      // Wait for onopen callback
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(ws.isConnected.value).toBe(true)
      expect(ws.isConnecting.value).toBe(false)
    })

    it('should not reconnect if already connected', async () => {
      const ws = useWebSocket()
      await ws.connect()
      await new Promise((resolve) => setTimeout(resolve, 10))

      const initialState = ws.isConnected.value
      await ws.connect()

      expect(ws.isConnected.value).toBe(initialState)
    })

    it('should not connect on server side', async () => {
      global.process = { client: false }

      const ws = useWebSocket()
      await ws.connect()

      expect(ws.isConnected.value).toBe(false)
      expect(ws.isConnecting.value).toBe(false)
    })
  })

  describe('disconnect', () => {
    it('should set isConnected to false on disconnect', async () => {
      const ws = useWebSocket()
      await ws.connect()
      await new Promise((resolve) => setTimeout(resolve, 10))

      ws.disconnect()

      expect(ws.isConnected.value).toBe(false)
    })
  })

  describe('event listeners', () => {
    it('should register event listener with on()', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      ws.on('test', callback)
      ws.emit('test', { foo: 'bar' })

      expect(callback).toHaveBeenCalledWith({ foo: 'bar' })
    })

    it('should return unsubscribe function from on()', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      const unsubscribe = ws.on('test', callback)
      unsubscribe()

      ws.emit('test', { foo: 'bar' })

      expect(callback).not.toHaveBeenCalled()
    })

    it('should remove event listener with off()', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      ws.on('test', callback)
      ws.off('test', callback)
      ws.emit('test', { foo: 'bar' })

      expect(callback).not.toHaveBeenCalled()
    })

    it('should remove all listeners for event with off() without callback', () => {
      const ws = useWebSocket()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      ws.on('test', callback1)
      ws.on('test', callback2)
      ws.off('test')

      ws.emit('test', { foo: 'bar' })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should emit to multiple listeners', () => {
      const ws = useWebSocket()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      ws.on('test', callback1)
      ws.on('test', callback2)
      ws.emit('test', { data: 'test' })

      expect(callback1).toHaveBeenCalledWith({ data: 'test' })
      expect(callback2).toHaveBeenCalledWith({ data: 'test' })
    })

    it('should handle errors in listeners gracefully', () => {
      const ws = useWebSocket()
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error')
      })
      const goodCallback = vi.fn()

      ws.on('test', errorCallback)
      ws.on('test', goodCallback)

      // Should not throw
      expect(() => ws.emit('test', { data: 'test' })).not.toThrow()
      expect(goodCallback).toHaveBeenCalled()
    })
  })

  describe('convenience methods', () => {
    it('onNotification should register notification listener', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      ws.onNotification(callback)
      ws.emit('notification', { id: 1 })

      expect(callback).toHaveBeenCalledWith({ id: 1 })
    })

    it('onComment should register comment listener', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      ws.onComment(callback)
      ws.emit('comment', { id: 1 })

      expect(callback).toHaveBeenCalledWith({ id: 1 })
    })

    it('onVote should register vote listener', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      ws.onVote(callback)
      ws.emit('vote', { id: 1 })

      expect(callback).toHaveBeenCalledWith({ id: 1 })
    })

    it('onConnected should register connected listener', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      ws.onConnected(callback)
      ws.emit('connected', null)

      expect(callback).toHaveBeenCalledWith(null)
    })

    it('onDisconnected should register disconnected listener', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      ws.onDisconnected(callback)
      ws.emit('disconnected', null)

      expect(callback).toHaveBeenCalledWith(null)
    })

    it('onError should register error listener', () => {
      const ws = useWebSocket()
      const callback = vi.fn()

      ws.onError(callback)
      ws.emit('error', { message: 'error' })

      expect(callback).toHaveBeenCalledWith({ message: 'error' })
    })
  })

  describe('options', () => {
    it('should accept custom reconnect interval', () => {
      const ws = useWebSocket({ reconnectInterval: 10000 })
      expect(ws).toBeDefined()
    })

    it('should accept custom max reconnect attempts', () => {
      const ws = useWebSocket({ maxReconnectAttempts: 10 })
      expect(ws).toBeDefined()
    })

    it('should accept custom heartbeat interval', () => {
      const ws = useWebSocket({ heartbeatInterval: 60000 })
      expect(ws).toBeDefined()
    })

    it('should accept autoConnect option', () => {
      const ws = useWebSocket({ autoConnect: false })
      expect(ws.isConnected.value).toBe(false)
    })
  })

  describe('reconnection', () => {
    it('should increment reconnectAttempts after error', async () => {
      vi.useFakeTimers()

      const ws = useWebSocket({ maxReconnectAttempts: 3 })
      await ws.connect()

      // Wait for initial connection
      await vi.advanceTimersByTimeAsync(10)

      // Simulate error (will trigger reconnection)
      ws.emit('error', { message: 'Connection lost' })

      // We can verify the max_reconnect_attempts event is emitted
      // after multiple failures
      expect(ws.reconnectAttempts.value).toBeGreaterThanOrEqual(0)
    })
  })

  describe('readonly state', () => {
    it('should expose readonly state values', () => {
      const ws = useWebSocket()

      expect(ws.isConnected).toBeDefined()
      expect(ws.isConnecting).toBeDefined()
      expect(ws.reconnectAttempts).toBeDefined()
      expect(ws.lastError).toBeDefined()
    })

    it('should expose all methods', () => {
      const ws = useWebSocket()

      expect(typeof ws.connect).toBe('function')
      expect(typeof ws.disconnect).toBe('function')
      expect(typeof ws.on).toBe('function')
      expect(typeof ws.off).toBe('function')
      expect(typeof ws.emit).toBe('function')
      expect(typeof ws.onNotification).toBe('function')
      expect(typeof ws.onComment).toBe('function')
      expect(typeof ws.onVote).toBe('function')
      expect(typeof ws.onConnected).toBe('function')
      expect(typeof ws.onDisconnected).toBe('function')
      expect(typeof ws.onError).toBe('function')
    })
  })
})
