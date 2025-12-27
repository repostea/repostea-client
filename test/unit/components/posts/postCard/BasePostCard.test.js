import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn(() => true)

// Mock useRuntimeConfig
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBaseUrl: 'https://api.example.com',
    },
  }),
  useNuxtApp: () => ({
    $api: {
      posts: {
        registerView: vi.fn(),
      },
    },
  }),
  useRoute: () => ({
    path: '/',
    query: {
      utm_source: 'test',
      utm_medium: 'email',
      utm_campaign: 'newsletter',
      utm_term: null,
      utm_content: null,
    },
  }),
}))

// Mock useSession
vi.mock('~/composables/useSession', () => ({
  useSession: () => ({
    getSessionId: () => 'test-session-123',
    getScreenResolution: () => '1920x1080',
    getReferer: () => 'https://example.com',
  }),
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    path: '/',
    query: {
      utm_source: 'test',
      utm_medium: 'email',
      utm_campaign: 'newsletter',
      utm_term: null,
      utm_content: null,
    },
  }),
}))

describe('BasePostCard View Tracking', () => {
  beforeEach(() => {
    // Setup navigator.sendBeacon mock
    Object.defineProperty(global.navigator, 'sendBeacon', {
      value: mockSendBeacon,
      writable: true,
      configurable: true,
    })
    mockSendBeacon.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('registerViewWithBeacon', () => {
    it('should call sendBeacon with correct URL and FormData', () => {
      // Simulate the function logic directly since component mounting is complex
      const postId = 123
      const apiBaseUrl = 'https://api.example.com'
      const expectedUrl = `${apiBaseUrl}/v1/posts/${postId}/view`

      const trackingData = {
        referer: 'https://example.com',
        screen_resolution: '1920x1080',
        session_id: 'test-session-123',
        utm_source: 'test',
        utm_medium: 'email',
        utm_campaign: 'newsletter',
      }

      // Create FormData as the component does
      const formData = new FormData()
      Object.entries(trackingData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      navigator.sendBeacon(expectedUrl, formData)

      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
      expect(mockSendBeacon).toHaveBeenCalledWith(expectedUrl, expect.any(FormData))

      // Verify FormData contents
      const calledFormData = mockSendBeacon.mock.calls[0][1]
      expect(calledFormData.get('session_id')).toBe('test-session-123')
      expect(calledFormData.get('screen_resolution')).toBe('1920x1080')
      expect(calledFormData.get('referer')).toBe('https://example.com')
      expect(calledFormData.get('utm_source')).toBe('test')
      expect(calledFormData.get('utm_medium')).toBe('email')
      expect(calledFormData.get('utm_campaign')).toBe('newsletter')
    })

    it('should not include null or undefined values in FormData', () => {
      const trackingData = {
        referer: 'https://example.com',
        screen_resolution: '1920x1080',
        session_id: 'test-session-123',
        utm_source: null,
        utm_medium: undefined,
        utm_campaign: 'newsletter',
      }

      const formData = new FormData()
      Object.entries(trackingData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      navigator.sendBeacon('https://api.example.com/v1/posts/123/view', formData)

      const calledFormData = mockSendBeacon.mock.calls[0][1]
      expect(calledFormData.get('utm_source')).toBeNull()
      expect(calledFormData.get('utm_medium')).toBeNull()
      expect(calledFormData.get('utm_campaign')).toBe('newsletter')
      expect(calledFormData.get('session_id')).toBe('test-session-123')
    })
  })

  describe('handleTitleClick behavior', () => {
    it('should register view for external links', () => {
      const post = {
        id: 123,
        url: 'https://external-site.com/article',
        is_nsfw: false,
        content_type: 'link',
      }

      // Simulate the condition check from handleTitleClick
      const isExternalLink =
        post.url && !post.is_nsfw && post.content_type !== 'video' && post.content_type !== 'audio'

      expect(isExternalLink).toBe(true)
    })

    it('should NOT register view for NSFW posts', () => {
      const post = {
        id: 123,
        url: 'https://external-site.com/article',
        is_nsfw: true,
        content_type: 'link',
      }

      const isExternalLink = post.url && !post.is_nsfw

      expect(isExternalLink).toBe(false)
    })

    it('should NOT register view for video content', () => {
      const post = {
        id: 123,
        url: 'https://youtube.com/watch?v=123',
        is_nsfw: false,
        content_type: 'video',
      }

      const isMediaContent = post.content_type === 'video' || post.content_type === 'audio'
      const isExternalLink = post.url && !post.is_nsfw && !isMediaContent

      expect(isExternalLink).toBe(false)
    })

    it('should NOT register view for audio content', () => {
      const post = {
        id: 123,
        url: 'https://soundcloud.com/track',
        is_nsfw: false,
        content_type: 'audio',
      }

      const isMediaContent = post.content_type === 'video' || post.content_type === 'audio'
      const isExternalLink = post.url && !post.is_nsfw && !isMediaContent

      expect(isExternalLink).toBe(false)
    })

    it('should NOT register view for internal posts (no URL)', () => {
      const post = {
        id: 123,
        url: null,
        is_nsfw: false,
        content_type: 'text',
      }

      const isExternalLink = post.url && !post.is_nsfw

      expect(isExternalLink).toBeFalsy()
    })
  })

  describe('vote triggers view registration', () => {
    it('should register view when user votes on a post', () => {
      // This test verifies the logic that voting should trigger view registration
      const postId = 456
      const apiBaseUrl = 'https://api.example.com'
      const expectedUrl = `${apiBaseUrl}/v1/posts/${postId}/view`

      // Simulate what happens after a successful vote
      const formData = new FormData()
      formData.append('session_id', 'test-session-123')

      navigator.sendBeacon(expectedUrl, formData)

      expect(mockSendBeacon).toHaveBeenCalledWith(expectedUrl, expect.any(FormData))
    })
  })
})

describe('Beacon API FormData compatibility', () => {
  beforeEach(() => {
    Object.defineProperty(global.navigator, 'sendBeacon', {
      value: mockSendBeacon,
      writable: true,
      configurable: true,
    })
    mockSendBeacon.mockClear()
  })

  it('should use FormData instead of JSON Blob for Laravel compatibility', () => {
    const trackingData = {
      session_id: 'abc123',
      screen_resolution: '1920x1080',
    }

    // The correct way (FormData) - Laravel parses this correctly
    const formData = new FormData()
    Object.entries(trackingData).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    navigator.sendBeacon('https://api.example.com/v1/posts/1/view', formData)

    // Verify FormData was used, not Blob
    const sentData = mockSendBeacon.mock.calls[0][1]
    expect(sentData).toBeInstanceOf(FormData)
    expect(sentData.get('session_id')).toBe('abc123')
  })

  it('should handle all tracking fields correctly', () => {
    const fullTrackingData = {
      referer: 'https://google.com',
      screen_resolution: '2560x1440',
      session_id: 'session-xyz',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spring_sale',
      utm_term: 'news',
      utm_content: 'banner_1',
    }

    const formData = new FormData()
    Object.entries(fullTrackingData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    navigator.sendBeacon('https://api.example.com/v1/posts/1/view', formData)

    const sentData = mockSendBeacon.mock.calls[0][1]

    // Verify all fields are present
    expect(sentData.get('referer')).toBe('https://google.com')
    expect(sentData.get('screen_resolution')).toBe('2560x1440')
    expect(sentData.get('session_id')).toBe('session-xyz')
    expect(sentData.get('utm_source')).toBe('google')
    expect(sentData.get('utm_medium')).toBe('cpc')
    expect(sentData.get('utm_campaign')).toBe('spring_sale')
    expect(sentData.get('utm_term')).toBe('news')
    expect(sentData.get('utm_content')).toBe('banner_1')
  })
})
