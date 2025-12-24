import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Store the original IntersectionObserver
let mockObserverInstances = []

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
    this.elements = new Set()
    mockObserverInstances.push(this)
  }

  observe(element) {
    this.elements.add(element)
  }

  unobserve(element) {
    this.elements.delete(element)
  }

  disconnect() {
    this.elements.clear()
  }

  // Helper to simulate intersection
  simulateIntersection(element, isIntersecting) {
    this.callback([
      {
        target: element,
        isIntersecting,
        intersectionRatio: isIntersecting ? 0.6 : 0,
      },
    ])
  }
}

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn(() => true)

beforeEach(() => {
  // Reset module state by clearing the module cache
  vi.resetModules()

  // Clear mock instances
  mockObserverInstances = []

  // Setup navigator.sendBeacon mock
  Object.defineProperty(global.navigator, 'sendBeacon', {
    value: mockSendBeacon,
    writable: true,
    configurable: true,
  })

  // Setup IntersectionObserver mock
  global.IntersectionObserver = MockIntersectionObserver

  // Configure useRuntimeConfig
  useRuntimeConfig.mockReturnValue({
    public: {
      apiBaseUrl: 'https://api.example.com',
    },
  })

  mockSendBeacon.mockClear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

// Helper to get fresh composable instance
const getComposable = async () => {
  const module = await import('~/composables/useImpressionTracking')
  return module.useImpressionTracking()
}

describe('useImpressionTracking composable', () => {
  describe('trackImpression', () => {
    it('should observe element with IntersectionObserver', async () => {
      const { trackImpression } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 123)

      expect(mockObserverInstances.length).toBeGreaterThan(0)
      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      expect(observer.elements.has(element)).toBe(true)
      expect(element.dataset.postId).toBe('123')
    })

    it('should handle string post IDs', async () => {
      const { trackImpression } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 'abc-456')

      expect(element.dataset.postId).toBe('abc-456')
    })

    it('should not throw for null elements', async () => {
      const { trackImpression } = await getComposable()

      // Should not throw
      expect(() => trackImpression(null, 123)).not.toThrow()
    })
  })

  describe('untrackImpression', () => {
    it('should stop observing element', async () => {
      const { trackImpression, untrackImpression } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 123)
      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      expect(observer.elements.has(element)).toBe(true)

      untrackImpression(element)
      expect(observer.elements.has(element)).toBe(false)
    })

    it('should handle null elements gracefully', async () => {
      const { untrackImpression } = await getComposable()

      // Should not throw
      expect(() => untrackImpression(null)).not.toThrow()
    })
  })

  describe('intersection handling', () => {
    it('should add post ID to pending impressions when visible', async () => {
      const { trackImpression, flushImpressions } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 123)

      // Get the observer
      const observer = mockObserverInstances[mockObserverInstances.length - 1]

      // Simulate element becoming visible
      observer.simulateIntersection(element, true)

      // Flush to check what was collected
      flushImpressions()

      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
      const calledFormData = mockSendBeacon.mock.calls[0][1]
      expect(calledFormData.get('post_ids')).toBe('["123"]')
    })

    it('should unobserve element after first impression', async () => {
      const { trackImpression } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 123)
      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      expect(observer.elements.has(element)).toBe(true)

      // Simulate intersection
      observer.simulateIntersection(element, true)

      // Element should be unobserved after intersection
      expect(observer.elements.has(element)).toBe(false)
    })

    it('should not add impression when element is not intersecting', async () => {
      const { trackImpression, flushImpressions } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 123)
      const observer = mockObserverInstances[mockObserverInstances.length - 1]

      // Simulate element NOT visible
      observer.simulateIntersection(element, false)

      // Flush
      flushImpressions()

      // Should not have been called since no impressions collected
      expect(mockSendBeacon).not.toHaveBeenCalled()
    })
  })

  describe('flushImpressions', () => {
    it('should send beacon with correct URL', async () => {
      const { trackImpression, flushImpressions } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 123)
      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      observer.simulateIntersection(element, true)

      flushImpressions()

      expect(mockSendBeacon).toHaveBeenCalledWith(
        'https://api.example.com/v1/posts/impressions',
        expect.any(FormData)
      )
    })

    it('should batch multiple impressions', async () => {
      const { trackImpression, flushImpressions } = await getComposable()

      const element1 = document.createElement('div')
      const element2 = document.createElement('div')
      const element3 = document.createElement('div')

      trackImpression(element1, 100)
      trackImpression(element2, 200)
      trackImpression(element3, 300)

      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      observer.simulateIntersection(element1, true)
      observer.simulateIntersection(element2, true)
      observer.simulateIntersection(element3, true)

      flushImpressions()

      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
      const calledFormData = mockSendBeacon.mock.calls[0][1]
      const postIds = JSON.parse(calledFormData.get('post_ids'))
      expect(postIds).toContain('100')
      expect(postIds).toContain('200')
      expect(postIds).toContain('300')
    })

    it('should not send beacon if no impressions pending', async () => {
      const { flushImpressions } = await getComposable()

      flushImpressions()

      expect(mockSendBeacon).not.toHaveBeenCalled()
    })

    it('should clear pending impressions after flush', async () => {
      const { trackImpression, flushImpressions } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 123)
      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      observer.simulateIntersection(element, true)

      flushImpressions()
      expect(mockSendBeacon).toHaveBeenCalledTimes(1)

      // Second flush should not send anything
      flushImpressions()
      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
    })
  })

  describe('automatic flushing', () => {
    it('should schedule flush after impression is recorded', async () => {
      const { trackImpression } = await getComposable()
      const element = document.createElement('div')

      trackImpression(element, 123)
      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      observer.simulateIntersection(element, true)

      // Should not have flushed yet
      expect(mockSendBeacon).not.toHaveBeenCalled()

      // Advance timer by 3 seconds (FLUSH_INTERVAL)
      vi.advanceTimersByTime(3000)

      // Now should have flushed
      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
    })

    it('should debounce multiple impressions within flush interval', async () => {
      const { trackImpression } = await getComposable()

      const element1 = document.createElement('div')
      const element2 = document.createElement('div')

      trackImpression(element1, 100)
      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      observer.simulateIntersection(element1, true)

      vi.advanceTimersByTime(1000) // 1 second

      trackImpression(element2, 200)
      observer.simulateIntersection(element2, true)

      vi.advanceTimersByTime(2000) // +2 seconds = 3 total from first impression

      // Should have flushed once with both impressions
      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
      const calledFormData = mockSendBeacon.mock.calls[0][1]
      const postIds = JSON.parse(calledFormData.get('post_ids'))
      expect(postIds).toHaveLength(2)
    })
  })

  describe('duplicate handling', () => {
    it('should not add duplicate impressions for same post', async () => {
      const { trackImpression, flushImpressions } = await getComposable()

      const element1 = document.createElement('div')
      const element2 = document.createElement('div')

      // Track same post ID twice
      trackImpression(element1, 123)
      trackImpression(element2, 123)

      const observer = mockObserverInstances[mockObserverInstances.length - 1]
      observer.simulateIntersection(element1, true)
      observer.simulateIntersection(element2, true)

      flushImpressions()

      const calledFormData = mockSendBeacon.mock.calls[0][1]
      const postIds = JSON.parse(calledFormData.get('post_ids'))
      // Set deduplicates, so only one entry
      expect(postIds).toHaveLength(1)
      expect(postIds[0]).toBe('123')
    })
  })
})
