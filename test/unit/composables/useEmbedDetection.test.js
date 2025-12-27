import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import {
  useEmbedDetection,
  isUrlEmbeddable,
  getUrlEmbedInfo,
} from '~/composables/useEmbedDetection'

describe('useEmbedDetection composable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isUrlEmbeddable', () => {
    it('should detect YouTube URLs', () => {
      expect(isUrlEmbeddable('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
      expect(isUrlEmbeddable('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
      expect(isUrlEmbeddable('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true)
    })

    it('should detect Vimeo URLs', () => {
      expect(isUrlEmbeddable('https://vimeo.com/123456789')).toBe(true)
      expect(isUrlEmbeddable('https://vimeo.com/video/123456789')).toBe(true)
    })

    it('should detect Twitter/X URLs', () => {
      expect(isUrlEmbeddable('https://twitter.com/user/status/1234567890')).toBe(true)
      expect(isUrlEmbeddable('https://x.com/user/status/1234567890')).toBe(true)
    })

    it('should detect Instagram URLs', () => {
      expect(isUrlEmbeddable('https://www.instagram.com/p/ABC123xyz/')).toBe(true)
      expect(isUrlEmbeddable('https://instagram.com/reel/ABC123xyz/')).toBe(true)
    })

    it('should detect TikTok URLs', () => {
      expect(isUrlEmbeddable('https://www.tiktok.com/@user/video/1234567890123')).toBe(true)
    })

    it('should detect Spotify URLs', () => {
      expect(isUrlEmbeddable('https://open.spotify.com/track/abc123')).toBe(true)
      expect(isUrlEmbeddable('https://open.spotify.com/episode/abc123')).toBe(true)
      expect(isUrlEmbeddable('https://open.spotify.com/playlist/abc123')).toBe(true)
    })

    it('should detect SoundCloud URLs', () => {
      expect(isUrlEmbeddable('https://soundcloud.com/artist/track-name')).toBe(true)
    })

    it('should detect Suno URLs', () => {
      expect(isUrlEmbeddable('https://suno.com/song/b27c29f6-8ab4-47eb-81fd-efb85c848ada')).toBe(
        true
      )
      expect(isUrlEmbeddable('https://suno.com/embed/b27c29f6-8ab4-47eb-81fd-efb85c848ada')).toBe(
        true
      )
    })

    it('should detect Dailymotion URLs', () => {
      expect(isUrlEmbeddable('https://www.dailymotion.com/video/x123abc')).toBe(true)
    })

    it('should return false for non-embeddable URLs', () => {
      expect(isUrlEmbeddable('https://example.com')).toBe(false)
      expect(isUrlEmbeddable('https://google.com/search?q=test')).toBe(false)
      expect(isUrlEmbeddable('not a url')).toBe(false)
    })
  })

  describe('getUrlEmbedInfo', () => {
    describe('YouTube', () => {
      it('should extract YouTube video ID and generate embed URL', () => {
        const info = getUrlEmbedInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('YouTube')
        expect(info.type).toBe('video')
        expect(info.id).toBe('dQw4w9WgXcQ')
        expect(info.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0')
      })

      it('should handle youtu.be short URLs', () => {
        const info = getUrlEmbedInfo('https://youtu.be/dQw4w9WgXcQ')
        expect(info).not.toBeNull()
        expect(info.id).toBe('dQw4w9WgXcQ')
      })
    })

    describe('Vimeo', () => {
      it('should extract Vimeo video ID and generate embed URL', () => {
        const info = getUrlEmbedInfo('https://vimeo.com/123456789')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('Vimeo')
        expect(info.type).toBe('video')
        expect(info.id).toBe('123456789')
        expect(info.embedUrl).toContain('https://player.vimeo.com/video/123456789')
      })
    })

    describe('Twitter/X', () => {
      it('should extract tweet ID from twitter.com', () => {
        const info = getUrlEmbedInfo('https://twitter.com/elonmusk/status/1234567890123456789')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('X (Twitter)')
        expect(info.type).toBe('social')
        expect(info.id).toBe('1234567890123456789')
      })

      it('should extract tweet ID from x.com', () => {
        const info = getUrlEmbedInfo('https://x.com/user/status/1234567890')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('X (Twitter)')
        expect(info.id).toBe('1234567890')
      })
    })

    describe('Instagram', () => {
      it('should extract Instagram post ID and generate embed URL', () => {
        const info = getUrlEmbedInfo('https://www.instagram.com/p/CxYzAbCdEfG/')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('Instagram')
        expect(info.type).toBe('social')
        expect(info.id).toBe('CxYzAbCdEfG')
        expect(info.embedUrl).toBe('https://www.instagram.com/p/CxYzAbCdEfG/embed/')
      })

      it('should handle Instagram reels', () => {
        const info = getUrlEmbedInfo('https://www.instagram.com/reel/CxYzAbCdEfG/')
        expect(info).not.toBeNull()
        expect(info.id).toBe('CxYzAbCdEfG')
      })
    })

    describe('TikTok', () => {
      it('should extract TikTok video ID and generate embed URL', () => {
        const info = getUrlEmbedInfo('https://www.tiktok.com/@username/video/7123456789012345678')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('TikTok')
        expect(info.type).toBe('social')
        expect(info.id).toBe('7123456789012345678')
        expect(info.embedUrl).toContain('https://www.tiktok.com/embed/v2/7123456789012345678')
      })
    })

    describe('Spotify', () => {
      it('should extract Spotify track info', () => {
        const info = getUrlEmbedInfo('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('Spotify')
        expect(info.type).toBe('audio')
        expect(info.id).toBe('4uLU6hMCjMI75M1A2tKUQC')
        expect(info.embedUrl).toContain(
          'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC'
        )
      })

      it('should handle Spotify playlists', () => {
        const info = getUrlEmbedInfo('https://open.spotify.com/playlist/abc123')
        expect(info).not.toBeNull()
        expect(info.embedUrl).toContain('playlist')
      })

      it('should handle Spotify with locale prefix', () => {
        const info = getUrlEmbedInfo('https://open.spotify.com/intl-es/track/abc123')
        expect(info).not.toBeNull()
        expect(info.id).toBe('abc123')
      })
    })

    describe('SoundCloud', () => {
      it('should generate SoundCloud embed URL', () => {
        const url = 'https://soundcloud.com/artist-name/track-name'
        const info = getUrlEmbedInfo(url)
        expect(info).not.toBeNull()
        expect(info.provider).toBe('SoundCloud')
        expect(info.type).toBe('audio')
        expect(info.embedUrl).toContain('w.soundcloud.com/player')
        expect(info.embedUrl).toContain(encodeURIComponent(url))
      })
    })

    describe('Suno', () => {
      it('should extract Suno song ID and generate embed URL', () => {
        const info = getUrlEmbedInfo('https://suno.com/song/b27c29f6-8ab4-47eb-81fd-efb85c848ada')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('Suno')
        expect(info.type).toBe('audio')
        expect(info.id).toBe('b27c29f6-8ab4-47eb-81fd-efb85c848ada')
        expect(info.embedUrl).toBe('https://suno.com/embed/b27c29f6-8ab4-47eb-81fd-efb85c848ada')
      })

      it('should handle Suno embed URLs', () => {
        const info = getUrlEmbedInfo('https://suno.com/embed/b27c29f6-8ab4-47eb-81fd-efb85c848ada')
        expect(info).not.toBeNull()
        expect(info.provider).toBe('Suno')
        expect(info.id).toBe('b27c29f6-8ab4-47eb-81fd-efb85c848ada')
      })
    })

    it('should return null for non-embeddable URLs', () => {
      expect(getUrlEmbedInfo('https://example.com')).toBeNull()
      expect(getUrlEmbedInfo('https://google.com')).toBeNull()
    })
  })

  describe('useEmbedDetection reactive', () => {
    it('should detect embeds in text on initialization', async () => {
      // Start with text containing a URL
      const text = ref('Check out this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      const { detectedEmbeds, hasEmbeds, firstEmbed } = useEmbedDetection(text)

      // Wait for immediate watch + debounce
      vi.advanceTimersByTime(350)
      await nextTick()

      expect(hasEmbeds.value).toBe(true)
      expect(detectedEmbeds.value).toHaveLength(1)
      expect(firstEmbed.value.provider).toBe('YouTube')
    })

    it('should start with no embeds when text is empty', async () => {
      const text = ref('')
      const { detectedEmbeds, hasEmbeds } = useEmbedDetection(text)

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(hasEmbeds.value).toBe(false)
      expect(detectedEmbeds.value).toHaveLength(0)
    })

    it('should detect multiple embeds in text', async () => {
      const text = ref(
        'Video: https://www.youtube.com/watch?v=abc12345678 and music: https://open.spotify.com/track/xyz789abcdef'
      )
      const { detectedEmbeds } = useEmbedDetection(text)

      // Wait for immediate watch to trigger
      vi.advanceTimersByTime(350)
      await nextTick()

      expect(detectedEmbeds.value).toHaveLength(2)
      expect(detectedEmbeds.value[0].provider).toBe('YouTube')
      expect(detectedEmbeds.value[1].provider).toBe('Spotify')
    })

    it('should not duplicate URLs', async () => {
      const text = ref(
        'Same video twice: https://youtu.be/abc12345678 and again https://youtu.be/abc12345678'
      )
      const { detectedEmbeds } = useEmbedDetection(text)

      vi.advanceTimersByTime(350)
      await nextTick()

      // Should only have one embed since it's the same URL
      expect(detectedEmbeds.value).toHaveLength(1)
    })

    it('should have no embeds when text has no embeddable URLs', async () => {
      const text = ref('Just some text with a regular link: https://example.com/page')
      const { hasEmbeds, detectedEmbeds } = useEmbedDetection(text)

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(hasEmbeds.value).toBe(false)
      expect(detectedEmbeds.value).toHaveLength(0)
    })

    it('should extract URLs from mixed content', async () => {
      const text = ref(`
        Hey check this out!
        YouTube: https://www.youtube.com/watch?v=test1234567
        Also this Instagram post: https://www.instagram.com/p/ABC123xyz/
        And my website: https://example.com (this won't be detected)
      `)
      const { detectedEmbeds } = useEmbedDetection(text)

      vi.advanceTimersByTime(350)
      await nextTick()

      // Should detect YouTube and Instagram, but not example.com
      expect(detectedEmbeds.value).toHaveLength(2)
      const providers = detectedEmbeds.value.map((e) => e.provider)
      expect(providers).toContain('YouTube')
      expect(providers).toContain('Instagram')
    })

    it('should provide extractUrls helper', async () => {
      const text = ref(
        'Links: https://youtube.com/watch?v=12345678901 and https://twitter.com/u/status/2'
      )
      const { extractUrls } = useEmbedDetection(text)

      const urls = extractUrls(text.value)
      expect(urls).toHaveLength(2)
      expect(urls).toContain('https://youtube.com/watch?v=12345678901')
      expect(urls).toContain('https://twitter.com/u/status/2')
    })

    it('should provide isEmbeddable helper', () => {
      const text = ref('')
      const { isEmbeddable } = useEmbedDetection(text)

      expect(isEmbeddable('https://www.youtube.com/watch?v=test1234567')).toBe(true)
      expect(isEmbeddable('https://example.com')).toBe(false)
    })

    it('should provide getEmbedInfo helper', () => {
      const text = ref('')
      const { getEmbedInfo } = useEmbedDetection(text)

      const info = getEmbedInfo('https://www.tiktok.com/@user/video/1234567890123')
      expect(info).not.toBeNull()
      expect(info.provider).toBe('TikTok')
    })

    it('should not detect URLs inside markdown link syntax', async () => {
      const text = ref('Check this [link](https://www.youtube.com/watch?v=dQw4w9WgXcQ)')
      const { detectedEmbeds, hasEmbeds } = useEmbedDetection(text)

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(hasEmbeds.value).toBe(false)
      expect(detectedEmbeds.value).toHaveLength(0)
    })

    it('should not detect URLs inside embed syntax', async () => {
      const text = ref('[embed:xtwitter](https://x.com/user/status/1234567890)')
      const { detectedEmbeds, hasEmbeds } = useEmbedDetection(text)

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(hasEmbeds.value).toBe(false)
      expect(detectedEmbeds.value).toHaveLength(0)
    })

    it('should detect bare URLs but not those inside markdown syntax', async () => {
      const text = ref(
        'Check this video https://www.youtube.com/watch?v=abc12345678 and this [embedded](https://x.com/user/status/123)'
      )
      const { detectedEmbeds, hasEmbeds } = useEmbedDetection(text)

      vi.advanceTimersByTime(350)
      await nextTick()

      expect(hasEmbeds.value).toBe(true)
      expect(detectedEmbeds.value).toHaveLength(1)
      expect(detectedEmbeds.value[0].provider).toBe('YouTube')
    })
  })
})
