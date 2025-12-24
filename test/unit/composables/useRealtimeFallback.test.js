import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRealtimeFallback } from '~/composables/useRealtimeFallback'

describe('useRealtimeFallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { isPolling, lastPollTime, pollError, pollCount } = useRealtimeFallback({
        fetchFn,
      })

      expect(isPolling.value).toBe(false)
      expect(lastPollTime.value).toBeNull()
      expect(pollError.value).toBeNull()
      expect(pollCount.value).toBe(0)
    })

    it('should not start polling automatically by default', () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      useRealtimeFallback({ fetchFn })

      expect(fetchFn).not.toHaveBeenCalled()
    })

    it('should start polling automatically when autoStart is true', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { isPolling } = useRealtimeFallback({
        fetchFn,
        autoStart: true,
      })

      // Wait for the immediate poll (async function)
      await Promise.resolve()

      expect(isPolling.value).toBe(true)
      expect(fetchFn).toHaveBeenCalled()
    })
  })

  describe('polling', () => {
    it('should poll at the configured interval', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { startPolling } = useRealtimeFallback({
        fetchFn,
        pollingInterval: 5000,
      })

      startPolling()

      // Initial immediate poll
      await Promise.resolve()
      const initialCalls = fetchFn.mock.calls.length

      // Advance to next interval poll
      await vi.advanceTimersByTimeAsync(5000)
      expect(fetchFn.mock.calls.length).toBe(initialCalls + 1)

      // Another poll
      await vi.advanceTimersByTimeAsync(5000)
      expect(fetchFn.mock.calls.length).toBe(initialCalls + 2)
    })

    it('should update lastPollTime after each poll', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { startPolling, lastPollTime } = useRealtimeFallback({
        fetchFn,
        pollingInterval: 5000,
      })

      expect(lastPollTime.value).toBeNull()

      startPolling()
      await Promise.resolve()

      expect(lastPollTime.value).toBeInstanceOf(Date)
    })

    it('should increment pollCount after each successful poll', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { startPolling, pollCount } = useRealtimeFallback({
        fetchFn,
        pollingInterval: 1000,
      })

      startPolling()

      // Initial poll
      await Promise.resolve()
      const initialCount = pollCount.value
      expect(initialCount).toBeGreaterThanOrEqual(1)

      await vi.advanceTimersByTimeAsync(1000)
      expect(pollCount.value).toBe(initialCount + 1)

      await vi.advanceTimersByTimeAsync(1000)
      expect(pollCount.value).toBe(initialCount + 2)
    })

    it('should not start polling twice if already polling', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { startPolling, isPolling } = useRealtimeFallback({
        fetchFn,
        pollingInterval: 5000,
      })

      startPolling()
      await Promise.resolve()
      expect(isPolling.value).toBe(true)
      const callsAfterFirstStart = fetchFn.mock.calls.length

      // Try to start again - should be ignored
      startPolling()
      await Promise.resolve()

      // Should not have been called again
      expect(fetchFn.mock.calls.length).toBe(callsAfterFirstStart)
    })
  })

  describe('stopPolling', () => {
    it('should stop polling when called', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { startPolling, stopPolling, isPolling } = useRealtimeFallback({
        fetchFn,
        pollingInterval: 1000,
      })

      startPolling()
      await Promise.resolve()
      expect(isPolling.value).toBe(true)
      const callsBeforeStop = fetchFn.mock.calls.length

      stopPolling()
      expect(isPolling.value).toBe(false)

      // Advance time - should not poll anymore
      await vi.advanceTimersByTimeAsync(5000)
      expect(fetchFn.mock.calls.length).toBe(callsBeforeStop)
    })
  })

  describe('restartPolling', () => {
    it('should restart polling', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { startPolling, stopPolling, restartPolling, isPolling } = useRealtimeFallback({
        fetchFn,
        pollingInterval: 1000,
      })

      startPolling()
      await Promise.resolve()
      const callsAfterStart = fetchFn.mock.calls.length

      stopPolling()
      expect(isPolling.value).toBe(false)

      restartPolling()
      await Promise.resolve()
      expect(isPolling.value).toBe(true)
      expect(fetchFn.mock.calls.length).toBeGreaterThan(callsAfterStart)
    })
  })

  describe('manual poll', () => {
    it('should allow manual polling', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { poll, pollCount } = useRealtimeFallback({
        fetchFn,
      })

      await poll()
      expect(fetchFn).toHaveBeenCalledTimes(1)
      expect(pollCount.value).toBe(1)

      await poll()
      expect(fetchFn).toHaveBeenCalledTimes(2)
      expect(pollCount.value).toBe(2)
    })
  })

  describe('error handling', () => {
    it('should capture poll errors', async () => {
      const error = new Error('Network error')
      const fetchFn = vi.fn().mockRejectedValue(error)
      const { poll, pollError, pollCount } = useRealtimeFallback({
        fetchFn,
      })

      await poll()

      expect(pollError.value).toBe('Network error')
      expect(pollCount.value).toBe(0) // Should not increment on error
    })

    it('should clear error on successful poll', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined)

      const { poll, pollError } = useRealtimeFallback({
        fetchFn,
      })

      await poll()
      expect(pollError.value).toBe('First error')

      await poll()
      expect(pollError.value).toBeNull()
    })

    it('should handle non-Error objects in catch', async () => {
      const fetchFn = vi.fn().mockRejectedValue('string error')
      const { poll, pollError } = useRealtimeFallback({
        fetchFn,
      })

      await poll()
      expect(pollError.value).toBe('Polling error')
    })
  })

  describe('default values', () => {
    it('should use default polling interval of 30000ms', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined)
      const { startPolling } = useRealtimeFallback({
        fetchFn,
      })

      startPolling()
      await Promise.resolve()
      const callsAfterStart = fetchFn.mock.calls.length

      // Advance by less than 30s - should not poll again
      await vi.advanceTimersByTimeAsync(29000)
      expect(fetchFn.mock.calls.length).toBe(callsAfterStart)

      // Advance to 30s
      await vi.advanceTimersByTimeAsync(1000)
      expect(fetchFn.mock.calls.length).toBe(callsAfterStart + 1)
    })
  })
})
