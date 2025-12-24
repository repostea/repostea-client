<template>
  <div ref="containerRef" class="inline-embed my-3">
    <!-- Loading placeholder (before intersection) -->
    <div
      v-if="!isVisible"
      class="embed-placeholder rounded-lg overflow-hidden border"
    >
      <div class="flex items-center gap-3 p-3">
        <div
          class="provider-icon w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          :class="providerIconClass"
        >
          <Icon :name="providerIcon" class="text-lg text-white" aria-hidden="true" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-text dark:text-text-dark truncate">
            {{ providerName }}
          </p>
          <p class="text-xs text-text-muted dark:text-text-dark-muted">
            {{ t('embed.loading') }}
          </p>
        </div>
        <div class="animate-spin">
          <Icon name="fa6-solid:spinner" class="text-gray-400 text-lg" aria-hidden="true" />
        </div>
      </div>
    </div>

    <!-- Loaded state - actual embed -->
    <div v-else class="embed-loaded">
      <!-- Twitter widget (uses official JS SDK) -->
      <div v-if="isTwitter">
        <div ref="twitterContainer" class="twitter-container"/>
        <div class="flex justify-start pt-1">
          <a
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-text-dark-muted hover:text-primary transition-colors"
          >
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-[10px]" aria-hidden="true" />
            {{ t('embed.view_on_x') }}
          </a>
        </div>
      </div>

      <!-- TikTok iframe (direct embed without widget wrapper) -->
      <div v-else-if="isTikTok">
        <div class="tiktok-embed-wrapper">
          <iframe
            :src="tiktokEmbedUrl"
            class="tiktok-iframe"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"
          />
        </div>
        <div class="flex justify-start pt-1">
          <a
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-text-dark-muted hover:text-primary transition-colors"
          >
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-[10px]" aria-hidden="true" />
            {{ t('embed.view_on', { provider: 'TikTok' }) }}
          </a>
        </div>
      </div>

      <!-- Instagram widget (uses official JS SDK) -->
      <div v-else-if="isInstagram">
        <div ref="instagramContainer" class="instagram-container"/>
        <div class="flex justify-start pt-1">
          <a
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-text-dark-muted hover:text-primary transition-colors"
          >
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-[10px]" aria-hidden="true" />
            {{ t('embed.view_on', { provider: 'Instagram' }) }}
          </a>
        </div>
      </div>

      <!-- YouTube/Vimeo/etc iframe (these work well with iframes) -->
      <div v-else-if="embedUrl">
        <div
          class="embed-wrapper"
          :class="{
            'embed-horizontal': isHorizontalVideo,
            'embed-audio': isAudio
          }"
        >
          <div class="embed-container relative rounded-lg overflow-hidden">
            <iframe
              :src="embedUrl"
              :class="isAudio ? 'w-full h-full' : 'absolute top-0 left-0 w-full h-full'"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              :allowfullscreen="!isAudio"
              loading="lazy"
            />
          </div>
        </div>
        <div class="flex justify-start pt-1">
          <a
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-text-dark-muted hover:text-primary transition-colors"
          >
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-[10px]" aria-hidden="true" />
            {{ t('embed.view_on', { provider: providerName }) }}
          </a>
        </div>
      </div>

      <!-- Fallback - link to original -->
      <div v-else class="py-2">
        <a
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-text-dark-muted hover:text-primary transition-colors"
        >
          <Icon name="fa6-solid:arrow-up-right-from-square" class="text-[10px]" aria-hidden="true" />
          {{ t('embed.view_on', { provider: providerName }) }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from '#i18n'
import { getUrlEmbedInfo } from '~/composables/useEmbedDetection'

const props = defineProps<{
  url: string
  provider?: string
}>()

const { t, locale } = useI18n()

const containerRef = ref<HTMLElement | null>(null)
const twitterContainer = ref<HTMLElement | null>(null)
const instagramContainer = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

// Lazy load: only load embed when visible
onMounted(() => {
  if (!containerRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          // Stop observing after first intersection
          observer?.disconnect()
        }
      })
    },
    {
      rootMargin: '100px', // Start loading 100px before visible
      threshold: 0.1,
    }
  )

  observer.observe(containerRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

// Get embed info
const embedInfo = computed(() => getUrlEmbedInfo(props.url))

const providerName = computed(() => {
  if (props.provider) return props.provider
  return embedInfo.value?.provider || 'Media'
})

const isTwitter = computed(() => {
  return props.url.includes('twitter.com') || props.url.includes('x.com')
})

const isTikTok = computed(() => {
  return props.url.includes('tiktok.com')
})

const isInstagram = computed(() => {
  return props.url.includes('instagram.com')
})

const embedUrl = computed(() => {
  // These platforms use their own JS SDKs or special iframes
  if (isTwitter.value || isTikTok.value || isInstagram.value) return null
  return embedInfo.value?.embedUrl || null
})

// TikTok direct iframe URL (cleaner than widget)
const tiktokEmbedUrl = computed((): string | undefined => {
  if (!isTikTok.value) return undefined
  const videoIdMatch = props.url.match(/video\/(\d+)/)
  const videoId = videoIdMatch ? videoIdMatch[1] : null
  if (!videoId) return undefined
  return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=0`
})

const providerIcon = computed(() => {
  const icons: Record<string, string> = {
    'YouTube': 'fa6-brands:youtube',
    'Vimeo': 'fa6-brands:vimeo-v',
    'Dailymotion': 'fa6-solid:play',
    'X (Twitter)': 'fa6-brands:x-twitter',
    'Instagram': 'fa6-brands:instagram',
    'TikTok': 'fa6-brands:tiktok',
    'Spotify': 'fa6-brands:spotify',
    'SoundCloud': 'fa6-brands:soundcloud',
    'Suno': 'fa6-solid:music',
  }
  return icons[providerName.value] || 'fa6-solid:play'
})

const providerIconClass = computed(() => {
  const classes: Record<string, string> = {
    'YouTube': 'bg-red-600',
    'Vimeo': 'bg-blue-500',
    'Dailymotion': 'bg-blue-600',
    'X (Twitter)': 'bg-black',
    'Instagram': 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600',
    'TikTok': 'bg-black',
    'Spotify': 'bg-green-500',
    'SoundCloud': 'bg-orange-500',
    'Suno': 'bg-gradient-to-r from-purple-500 to-pink-500',
  }
  return classes[providerName.value] || 'bg-gray-500'
})

// Detect if embed is horizontal video (YouTube, Vimeo, Dailymotion)
const isHorizontalVideo = computed(() => {
  const provider = providerName.value.toLowerCase()
  return ['youtube', 'vimeo', 'dailymotion'].includes(provider)
})

// Detect if embed is audio (Spotify, SoundCloud, Suno) - check URL directly for reliability
const isAudio = computed(() => {
  return props.url.includes('spotify.com') || props.url.includes('soundcloud.com') || props.url.includes('suno.com')
})

// Load Twitter widget when expanded
const loadTwitterWidget = () => {
  if (typeof window === 'undefined') return
  if (!isTwitter.value || !isVisible.value) return

  if (!twitterContainer.value) {
    setTimeout(loadTwitterWidget, 50)
    return
  }

  if (!(window as any).twttr) {
    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.onload = () => embedTwitter()
    document.body.appendChild(script)
  } else {
    embedTwitter()
  }
}

const embedTwitter = () => {
  if (!twitterContainer.value || !(window as any).twttr) return

  const tweetIdMatch = props.url.match(/status\/(\d+)/)
  const tweetId = tweetIdMatch ? tweetIdMatch[1] : null

  if (!tweetId) return

  twitterContainer.value.innerHTML = ''

  const isDark = document.documentElement.classList.contains('dark')

  ;(window as any).twttr.widgets.createTweet(
    tweetId,
    twitterContainer.value,
    {
      theme: isDark ? 'dark' : 'light',
      lang: locale.value,
      dnt: true
    }
  )
}

// Load Instagram widget
const loadInstagramWidget = () => {
  if (typeof window === 'undefined') return
  if (!isInstagram.value || !isVisible.value) return

  if (!instagramContainer.value) {
    setTimeout(loadInstagramWidget, 50)
    return
  }

  // Create the blockquote that Instagram's SDK will transform
  instagramContainer.value.innerHTML = `
    <blockquote class="instagram-media" data-instgrm-permalink="${props.url}" data-instgrm-version="14" data-instgrm-captioned>
    </blockquote>
  `

  // Load Instagram embed script if not already loaded
  if (!(window as any).instgrm) {
    const script = document.createElement('script')
    script.src = 'https://www.instagram.com/embed.js'
    script.async = true
    document.body.appendChild(script)
  } else {
    // Re-process embeds if script already loaded
    ;(window as any).instgrm?.Embeds?.process()
  }
}

// Load widgets when visible (TikTok uses iframe, no need for widget loading)
watch(isVisible, (newVal) => {
  if (newVal) {
    if (isTwitter.value) {
      setTimeout(loadTwitterWidget, 100)
    } else if (isInstagram.value) {
      setTimeout(loadInstagramWidget, 100)
    }
  }
})
</script>

<style scoped>
.embed-placeholder {
  background-color: var(--color-bg-card);
  border-color: var(--color-border-default);
}

/* Horizontal videos (YouTube, Vimeo, Dailymotion) - limit width on desktop */
.embed-horizontal {
  max-width: 100%;
}

@media (min-width: 768px) {
  .embed-horizontal {
    max-width: 560px; /* Comfortable size for 16:9 videos on desktop */
  }
}

/* Video embeds use aspect ratio padding trick */
.embed-horizontal .embed-container {
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

/* Audio embeds (Spotify, SoundCloud) - fixed height, no aspect ratio */
.embed-audio {
  max-width: 100%;
}

@media (min-width: 768px) {
  .embed-audio {
    max-width: 400px;
  }
}

.embed-audio .embed-container {
  height: 152px; /* Spotify/SoundCloud compact player height */
}

/* Twitter container */
.twitter-container {
  max-width: 550px;
}

.twitter-container :deep(twitter-widget),
.twitter-container :deep(.twitter-tweet) {
  margin: 0 !important;
}

/* TikTok iframe embed */
.tiktok-embed-wrapper {
  width: 325px;
  max-width: 100%;
  overflow: hidden;
  border-radius: 8px;
}

.tiktok-iframe {
  width: 100%;
  height: 745px; /* Taller to accommodate video + captions + controls */
  border: none;
}

/* Instagram container - let the official widget handle sizing */
.instagram-container {
  max-width: 540px;
}

.instagram-container :deep(.instagram-media),
.instagram-container :deep(iframe) {
  margin: 0 !important;
  max-width: 100% !important;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
