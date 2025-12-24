import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'

export interface EmbedInfo {
  url: string
  provider: string
  type: 'video' | 'audio' | 'social'
  embedUrl?: string
  id?: string
}

interface EmbedProviderConfig {
  name: string
  type: 'video' | 'audio' | 'social'
  pattern: RegExp
  getEmbedUrl?: (url: string, match: RegExpMatchArray) => string
  getId?: (url: string, match: RegExpMatchArray) => string
}

const EMBED_PROVIDERS: EmbedProviderConfig[] = [
  // Video platforms
  {
    name: 'YouTube',
    type: 'video',
    pattern: /(?:youtube\.com\/(?:shorts\/|[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    getEmbedUrl: (_url, match) => `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`,
    getId: (_url, match) => match[1],
  },
  {
    name: 'Vimeo',
    type: 'video',
    pattern: /vimeo\.com\/(?:video\/)?(\d+)/i,
    getEmbedUrl: (_url, match) => `https://player.vimeo.com/video/${match[1]}?autoplay=0`,
    getId: (_url, match) => match[1],
  },
  {
    name: 'Dailymotion',
    type: 'video',
    pattern: /dailymotion\.com\/(?:video\/|embed\/video\/)([a-zA-Z0-9]+)/i,
    getEmbedUrl: (_url, match) => `https://www.dailymotion.com/embed/video/${match[1]}?autoplay=0`,
    getId: (_url, match) => match[1],
  },
  // Social platforms
  {
    name: 'X (Twitter)',
    type: 'social',
    pattern: /(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/(\d+)/i,
    getId: (_url, match) => match[1],
  },
  {
    name: 'Instagram',
    type: 'social',
    pattern: /instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/i,
    getEmbedUrl: (_url, match) => `https://www.instagram.com/p/${match[1]}/embed/`,
    getId: (_url, match) => match[1],
  },
  {
    name: 'TikTok',
    type: 'social',
    pattern: /tiktok\.com\/@[a-zA-Z0-9_.]+\/video\/(\d+)/i,
    getEmbedUrl: (_url, match) => `https://www.tiktok.com/embed/v2/${match[1]}?autoplay=0`,
    getId: (_url, match) => match[1],
  },
  // Audio platforms
  {
    name: 'Spotify',
    type: 'audio',
    pattern: /spotify\.com\/(?:intl-[a-z]{2}\/)?(show|episode|track|album|playlist)\/([a-zA-Z0-9]+)/i,
    getEmbedUrl: (_url, match) => `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`,
    getId: (_url, match) => match[2],
  },
  {
    name: 'SoundCloud',
    type: 'audio',
    pattern: /soundcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/i,
    getEmbedUrl: (url) => `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&visual=false`,
  },
  {
    name: 'Suno',
    type: 'audio',
    pattern: /suno\.com\/(?:song|embed)\/([a-f0-9-]{36})/i,
    getEmbedUrl: (_url, match) => `https://suno.com/embed/${match[1]}`,
    getId: (_url, match) => match[1],
  },
]

// URL regex to find URLs in text (excludes trailing parentheses to avoid matching inside [embed:...](url))
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]()]+/gi

/**
 * Composable for detecting embeddable URLs in text
 */
export const useEmbedDetection = (text: Ref<string>) => {
  const detectedEmbeds = ref<EmbedInfo[]>([])
  const isProcessing = ref(false)

  /**
   * Check if a URL is embeddable and return embed info
   */
  const detectEmbed = (url: string): EmbedInfo | null => {
    for (const provider of EMBED_PROVIDERS) {
      const match = url.match(provider.pattern)
      if (match) {
        const embedInfo: EmbedInfo = {
          url,
          provider: provider.name,
          type: provider.type,
        }

        if (provider.getEmbedUrl) {
          embedInfo.embedUrl = provider.getEmbedUrl(url, match)
        }

        if (provider.getId) {
          embedInfo.id = provider.getId(url, match)
        }

        return embedInfo
      }
    }
    return null
  }

  /**
   * Extract all URLs from text, excluding those already in markdown link/embed syntax
   */
  const extractUrls = (content: string): string[] => {
    // First, remove URLs that are already inside markdown link syntax: [text](url) or [embed:...](url)
    const contentWithoutMarkdownLinks = content.replace(/\[[^\]]*\]\([^)]+\)/g, '')

    const matches = contentWithoutMarkdownLinks.match(URL_REGEX)
    return matches ? [...new Set(matches)] : []
  }

  /**
   * Detect all embeddable URLs in the text
   */
  const detectEmbeds = () => {
    isProcessing.value = true
    const urls = extractUrls(text.value)
    const embeds: EmbedInfo[] = []

    for (const url of urls) {
      const embed = detectEmbed(url)
      if (embed) {
        embeds.push(embed)
      }
    }

    detectedEmbeds.value = embeds
    isProcessing.value = false
  }

  /**
   * Check if a specific URL is embeddable
   */
  const isEmbeddable = (url: string): boolean => {
    return detectEmbed(url) !== null
  }

  /**
   * Get embed info for a specific URL
   */
  const getEmbedInfo = (url: string): EmbedInfo | null => {
    return detectEmbed(url)
  }

  // Watch for text changes and re-detect (debounced)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  watch(text, (_newText) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(detectEmbeds, 300)
  }, { immediate: true })

  // Computed for quick checks
  const hasEmbeds = computed(() => detectedEmbeds.value.length > 0)
  const firstEmbed = computed(() => detectedEmbeds.value[0] || null)

  return {
    detectedEmbeds,
    hasEmbeds,
    firstEmbed,
    isProcessing,
    detectEmbeds,
    isEmbeddable,
    getEmbedInfo,
    extractUrls,
  }
}

/**
 * Simple function to check if a URL is embeddable (no reactivity needed)
 */
export const isUrlEmbeddable = (url: string): boolean => {
  for (const provider of EMBED_PROVIDERS) {
    if (provider.pattern.test(url)) {
      return true
    }
  }
  return false
}

/**
 * Get embed info for a URL (no reactivity needed)
 */
export const getUrlEmbedInfo = (url: string): EmbedInfo | null => {
  for (const provider of EMBED_PROVIDERS) {
    const match = url.match(provider.pattern)
    if (match) {
      const embedInfo: EmbedInfo = {
        url,
        provider: provider.name,
        type: provider.type,
      }

      if (provider.getEmbedUrl) {
        embedInfo.embedUrl = provider.getEmbedUrl(url, match)
      }

      if (provider.getId) {
        embedInfo.id = provider.getId(url, match)
      }

      return embedInfo
    }
  }
  return null
}
