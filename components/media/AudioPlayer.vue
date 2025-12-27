<template>
  <div class="audio-player">
    <!-- Clickable preview in listing -->
    <div
      v-if="!expanded"
      class="audio-preview preview-container cursor-pointer rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all"
      @click="$emit('expand')"
    >
      <div class="flex items-center gap-3">
        <div class="flex-grow min-w-0">
          <p class="font-semibold text-text dark:text-text-dark truncate mb-0.5 text-base">
            {{ title }}
          </p>
          <div class="flex items-center gap-2 text-xs text-text-muted dark:text-text-dark-muted">
            <Icon name="fa6-solid:circle" class="text-[4px]" aria-hidden="true" />
            <span>{{ provider }}</span>
          </div>
        </div>
        <div class="ml-2 flex-shrink-0">
          <div
            class="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center transition-colors"
          >
            <Icon name="fa6-solid:play" class="text-white text-sm ml-0.5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>

    <!-- Embedded player in expanded view -->
    <div v-else class="w-full mb-4">
      <div v-if="embedUrl">
        <div class="mb-3">
          <a
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-sm text-primary dark:text-primary hover:underline transition-colors"
          >
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-xs" aria-hidden="true" />
            <span>{{ t('audio.listen_on_platform', { provider: provider }) }}</span>
          </a>
        </div>
        <iframe
          :src="embedUrl"
          class="w-full rounded-lg"
          :style="frameStyle"
          frameborder="0"
          allow="autoplay; clipboard-write; encrypted-media;"
          loading="lazy"
        />
      </div>
      <div v-else class="audio-fallback w-full py-4 flex items-center justify-center rounded-md">
        <a
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col items-center text-text-muted dark:text-text-dark-muted"
        >
          <Icon name="fa6-solid:headphones" class="text-4xl mb-2" aria-hidden="true" />
          <span>{{ noEmbedMessage }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  const props = defineProps({
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Audio',
    },
    expanded: {
      type: Boolean,
      default: false,
    },
    noEmbedMessage: {
      type: String,
      default: 'Escuchar en la fuente original',
    },
    mediaMetadata: {
      type: Object,
      default: null,
    },
  })

  defineEmits(['expand'])

  // Detectar proveedor de audio
  const provider = computed(() => {
    // Use backend provider if available
    if (props.mediaMetadata?.provider) {
      // Format provider name for display
      const providerMap = {
        spotify: 'Spotify',
        soundcloud: 'SoundCloud',
        apple_podcasts: 'Apple Podcasts',
        ivoox: 'iVoox',
        anchor: 'Anchor',
        spreaker: 'Spreaker',
        transistor: 'Transistor',
        buzzsprout: 'Buzzsprout',
        podbean: 'Podbean',
        captivate: 'Captivate',
        castos: 'Castos',
        acast: 'Acast',
        megaphone: 'Megaphone',
        simplecast: 'Simplecast',
        podigee: 'Podigee',
        google_podcasts: 'Google Podcasts',
        bandcamp: 'Bandcamp',
        mixcloud: 'Mixcloud',
        audioboom: 'Audioboom',
        deezer: 'Deezer',
        audible: 'Audible',
        suno: 'Suno',
      }
      return providerMap[props.mediaMetadata.provider] || props.mediaMetadata.provider
    }

    // Fallback to URL detection
    if (props.url.includes('spotify.com')) {
      return 'Spotify'
    } else if (props.url.includes('soundcloud.com')) {
      return 'SoundCloud'
    } else if (props.url.includes('podcasts.apple.com')) {
      return 'Apple Podcasts'
    } else if (props.url.includes('simplecast.com')) {
      return 'Simplecast'
    } else if (props.url.includes('suno.com')) {
      return 'Suno'
    }
    return 'Audio'
  })

  // Generar URL para embeber
  const embedUrl = computed(() => {
    // Priority 1: Use backend embed URL if available
    if (props.mediaMetadata?.embed_url) {
      return props.mediaMetadata.embed_url
    }

    // Priority 2: Fallback to manual generation for backwards compatibility
    if (!props.url) return ''

    // Spotify
    if (props.url.includes('spotify.com')) {
      const spotifyRegex =
        /spotify\.com\/(?:embed\/)?(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/
      const spotifyMatch = props.url.match(spotifyRegex)
      if (spotifyMatch && spotifyMatch[1] && spotifyMatch[2]) {
        return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`
      }
    }

    // SoundCloud
    if (props.url.includes('soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(props.url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`
    }

    // Apple Podcasts (doesn't support direct embed, return empty to show link)
    if (props.url.includes('podcasts.apple.com')) {
      return ''
    }

    // Simplecast
    if (props.url.includes('simplecast.com')) {
      const simplecastRegex = /player\.simplecast\.com\/([a-zA-Z0-9-]+)/
      const simplecastMatch = props.url.match(simplecastRegex)
      if (simplecastMatch && simplecastMatch[1]) {
        return `https://player.simplecast.com/${simplecastMatch[1]}?dark=false`
      }
    }

    // Suno
    if (props.url.includes('suno.com')) {
      const sunoRegex = /suno\.com\/(?:song|embed)\/([a-f0-9-]{36})/i
      const sunoMatch = props.url.match(sunoRegex)
      if (sunoMatch && sunoMatch[1]) {
        return `https://suno.com/embed/${sunoMatch[1]}`
      }
    }

    return ''
  })

  // Frame style based on provider
  const frameStyle = computed(() => {
    switch (provider.value) {
      case 'SoundCloud':
        return 'height: 166px;'
      case 'Spotify':
        return 'height: 152px;'
      case 'Mixcloud':
        return 'height: 180px;'
      case 'Audioboom':
        return 'height: 150px;'
      case 'Podbean':
        return 'height: 160px;'
      case 'Anchor':
        return 'height: 300px;'
      case 'Apple Podcasts':
        return 'height: 450px;'
      case 'iVoox':
        return 'height: 250px;'
      case 'Podigee':
        return 'height: 400px;'
      case 'Megaphone':
        return 'height: 220px;'
      case 'Simplecast':
        return 'height: 200px;'
      case 'Transistor':
        return 'height: 180px;'
      case 'Buzzsprout':
        return 'height: 200px;'
      case 'Captivate':
        return 'height: 200px;'
      case 'Castos':
        return 'height: 200px;'
      case 'Acast':
        return 'height: 200px;'
      case 'Spreaker':
        return 'height: 400px;'
      case 'Suno':
        return 'height: 180px;'
      default:
        return 'height: 160px;'
    }
  })
</script>

<style scoped>
  .preview-container {
    transition: all 0.2s ease-in-out;
  }

  .preview-container:hover {
    border-color: rgba(var(--color-primary-rgb), 0.3);
    transform: translateY(-1px);
  }

  .dark .preview-container:hover {
    border-color: rgba(var(--color-primary-rgb), 0.4);
  }

  .audio-preview {
    background-color: var(--color-bg-hover);
    border: 1px solid var(--color-border-default);
  }

  .audio-fallback {
    background-color: var(--color-bg-hover);
  }
</style>
