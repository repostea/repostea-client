import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useViewTracking } from '~/composables/useViewTracking'

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn(() => true)

// Configure useRoute and useRuntimeConfig with specific values for this test
beforeEach(() => {
  // Setup navigator.sendBeacon mock
  Object.defineProperty(global.navigator, 'sendBeacon', {
    value: mockSendBeacon,
    writable: true,
    configurable: true,
  })

  // Configure mocks with test-specific values
  useRoute.mockReturnValue({
    path: '/',
    params: {},
    query: {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spring_sale',
      utm_term: null,
      utm_content: null,
    },
    hash: '',
    fullPath: '/',
    matched: [],
  })

  useRuntimeConfig.mockReturnValue({
    public: {
      apiBaseUrl: 'https://api.example.com',
    },
  })

  useSession.mockReturnValue({
    getSessionId: () => 'test-session-123',
    getScreenResolution: () => '1920x1080',
    getReferer: () => 'https://example.com',
  })

  mockSendBeacon.mockClear()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useViewTracking composable', () => {
  describe('registerView', () => {
    it('should call sendBeacon with correct URL', () => {
      const { registerView } = useViewTracking()

      registerView(123)

      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
      expect(mockSendBeacon).toHaveBeenCalledWith(
        'https://api.example.com/v1/posts/123/view',
        expect.any(FormData)
      )
    })

    it('should include tracking data in FormData', () => {
      const { registerView } = useViewTracking()

      registerView(456)

      const calledFormData = mockSendBeacon.mock.calls[0][1]
      expect(calledFormData.get('session_id')).toBe('test-session-123')
      expect(calledFormData.get('screen_resolution')).toBe('1920x1080')
      expect(calledFormData.get('referer')).toBe('https://example.com')
      expect(calledFormData.get('utm_source')).toBe('google')
      expect(calledFormData.get('utm_medium')).toBe('cpc')
      expect(calledFormData.get('utm_campaign')).toBe('spring_sale')
    })

    it('should not include null/undefined values in FormData', () => {
      const { registerView } = useViewTracking()

      registerView(789)

      const calledFormData = mockSendBeacon.mock.calls[0][1]
      expect(calledFormData.get('utm_term')).toBeNull()
      expect(calledFormData.get('utm_content')).toBeNull()
    })

    it('should handle string post IDs', () => {
      const { registerView } = useViewTracking()

      registerView('abc-123')

      expect(mockSendBeacon).toHaveBeenCalledWith(
        'https://api.example.com/v1/posts/abc-123/view',
        expect.any(FormData)
      )
    })
  })

  describe('shouldTrackOnClick', () => {
    it('should return true for external links', () => {
      const { shouldTrackOnClick } = useViewTracking()

      const result = shouldTrackOnClick({
        url: 'https://external-site.com/article',
        is_nsfw: false,
        content_type: 'link',
      })

      expect(result).toBe(true)
    })

    it('should return false for NSFW posts', () => {
      const { shouldTrackOnClick } = useViewTracking()

      const result = shouldTrackOnClick({
        url: 'https://external-site.com/article',
        is_nsfw: true,
        content_type: 'link',
      })

      expect(result).toBe(false)
    })

    it('should return false for video content', () => {
      const { shouldTrackOnClick } = useViewTracking()

      const result = shouldTrackOnClick({
        url: 'https://youtube.com/watch?v=123',
        is_nsfw: false,
        content_type: 'video',
      })

      expect(result).toBe(false)
    })

    it('should return false for audio content', () => {
      const { shouldTrackOnClick } = useViewTracking()

      const result = shouldTrackOnClick({
        url: 'https://soundcloud.com/track',
        is_nsfw: false,
        content_type: 'audio',
      })

      expect(result).toBe(false)
    })

    it('should return false for posts without URL', () => {
      const { shouldTrackOnClick } = useViewTracking()

      const result = shouldTrackOnClick({
        url: null,
        is_nsfw: false,
        content_type: 'text',
      })

      expect(result).toBeFalsy()
    })

    it('should return false for posts with empty URL', () => {
      const { shouldTrackOnClick } = useViewTracking()

      const result = shouldTrackOnClick({
        url: '',
        is_nsfw: false,
        content_type: 'text',
      })

      expect(result).toBeFalsy()
    })
  })

  describe('getTrackingData', () => {
    it('should return all tracking fields', () => {
      const { getTrackingData } = useViewTracking()

      const data = getTrackingData()

      expect(data).toHaveProperty('referer')
      expect(data).toHaveProperty('screen_resolution')
      expect(data).toHaveProperty('session_id')
      expect(data).toHaveProperty('utm_source')
      expect(data).toHaveProperty('utm_medium')
      expect(data).toHaveProperty('utm_campaign')
      expect(data).toHaveProperty('utm_term')
      expect(data).toHaveProperty('utm_content')
    })

    it('should include session data from useSession', () => {
      const { getTrackingData } = useViewTracking()

      const data = getTrackingData()

      expect(data.session_id).toBe('test-session-123')
      expect(data.screen_resolution).toBe('1920x1080')
      expect(data.referer).toBe('https://example.com')
    })

    it('should include UTM params from route', () => {
      const { getTrackingData } = useViewTracking()

      const data = getTrackingData()

      expect(data.utm_source).toBe('google')
      expect(data.utm_medium).toBe('cpc')
      expect(data.utm_campaign).toBe('spring_sale')
    })
  })
})
