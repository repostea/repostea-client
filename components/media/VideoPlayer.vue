<template>
  <div class="video-player" :class="{ 'max-w-sm mx-auto': !expanded }">
    <!-- Clickable preview in listing -->
    <div
      v-if="!expanded"
      class="preview-container cursor-pointer relative pb-9/16 overflow-hidden mb-3"
      style="padding-bottom: 56.25%; max-height: 220px"
      @click="$emit('expand')"
    >
      <!-- Twitter Preview -->
      <div
        v-if="isTwitter"
        class="social-preview absolute top-0 left-0 w-full h-full"
      >
        <NuxtImg
          v-if="twitterThumbnail"
          :src="twitterThumbnail"
          class="absolute top-0 left-0 w-full h-full object-cover"
          :alt="title"
          loading="lazy"
          width="480"
          height="270"
          format="webp"
        />
        <div v-else class="flex flex-col items-start justify-center p-4 h-full">
          <div class="flex items-center mb-3 w-full">
            <div class="social-avatar w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <Icon name="fa6-brands:x-twitter" class="text-text-muted dark:text-text-dark-muted" aria-hidden="true" />
            </div>
            <div class="flex-1 min-w-0">
              <div v-if="twitterAuthor" class="font-semibold text-text dark:text-text-dark text-sm truncate">
                {{ twitterAuthor }}
              </div>
              <div v-else class="social-skeleton h-3 rounded w-24 mb-1"/>
              <div class="text-xs text-text-muted dark:text-text-dark-muted">@twitter</div>
            </div>
          </div>
          <div v-if="twitterText" class="w-full text-sm text-text dark:text-text-dark line-clamp-3">
            {{ twitterText }}
          </div>
          <div v-else class="w-full space-y-2">
            <div class="social-skeleton h-2 rounded w-full"/>
            <div class="social-skeleton h-2 rounded w-5/6"/>
            <div class="social-skeleton h-2 rounded w-4/6"/>
          </div>
        </div>
      </div>
      <!-- Instagram Preview -->
      <div
        v-else-if="isInstagram"
        class="social-preview absolute top-0 left-0 w-full h-full"
      >
        <NuxtImg
          v-if="thumbnail"
          :src="thumbnail"
          class="absolute top-0 left-0 w-full h-full object-cover"
          :alt="title"
          loading="lazy"
          width="480"
          height="270"
          format="webp"
        />
        <div v-else class="flex flex-col items-center justify-center h-full">
          <div class="social-avatar w-16 h-16 rounded-full flex items-center justify-center mb-3">
            <Icon name="fa6-brands:instagram" class="text-3xl text-text-muted dark:text-text-dark-muted" aria-hidden="true" />
          </div>
          <p class="text-sm text-text-muted dark:text-text-dark-muted">Instagram</p>
        </div>
      </div>
      <!-- TikTok Preview -->
      <div
        v-else-if="isTikTok"
        class="social-preview absolute top-0 left-0 w-full h-full"
      >
        <NuxtImg
          v-if="thumbnail"
          :src="thumbnail"
          class="absolute top-0 left-0 w-full h-full object-cover"
          :alt="title"
          loading="lazy"
          width="480"
          height="270"
          format="webp"
        />
        <div v-else class="flex flex-col items-center justify-center h-full">
          <div class="social-avatar w-16 h-16 rounded-full flex items-center justify-center mb-3">
            <Icon name="fa6-brands:tiktok" class="text-3xl text-text-muted dark:text-text-dark-muted" aria-hidden="true" />
          </div>
          <p class="text-sm text-text-muted dark:text-text-dark-muted">TikTok</p>
        </div>
      </div>
      <!-- Other video platforms -->
      <template v-else>
        <NuxtImg
          v-if="thumbnail"
          :src="thumbnail"
          class="absolute top-0 left-0 w-full h-full object-cover"
          :alt="title"
          loading="lazy"
          width="480"
          height="270"
          format="webp"
        />
        <div
          v-else
          class="video-placeholder absolute top-0 left-0 w-full h-full flex items-center justify-center"
        />
      </template>
      <div
        class="absolute inset-0 flex items-center justify-center"
        :class="isSocialEmbed ? 'bg-black bg-opacity-40' : 'backdrop-filter backdrop-brightness-75'"
      >
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center"
          :class="playButtonClass"
        >
          <Icon name="fa6-solid:play" class="text-white text-2xl" aria-hidden="true" />
        </div>
      </div>
      <div
        v-if="!isSocialEmbed"
        class="absolute bottom-0 left-0 right-0 p-2 text-white bg-gradient-to-t from-black to-transparent"
      >
        <p class="font-medium">{{ title }}</p>
        <p class="text-xs opacity-80">{{ provider }}</p>
      </div>
    </div>

    <div v-else class="mb-4">
      <div v-if="isTwitter" ref="twitterContainer" class="flex justify-center" style="min-height: 500px;"/>
      <div v-else-if="embedUrl" class="relative pb-9/16 overflow-hidden" style="padding-bottom: 56.25%">
        <iframe
          :src="embedUrl"
          class="absolute top-0 left-0 w-full h-full"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        />
      </div>
      <div
        v-else
        class="video-placeholder relative pb-9/16 overflow-hidden flex items-center justify-center"
        style="padding-bottom: 56.25%"
      >
        <a
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col items-center text-text-muted dark:text-text-dark-muted"
        >
          <Icon name="fa6-solid:circle-play" class="text-4xl mb-2" aria-hidden="true" />
          <span>{{ noEmbedMessage }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useI18n } from '#i18n'

  const { locale } = useI18n()

  const props = defineProps({
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Video',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    expanded: {
      type: Boolean,
      default: false,
    },
    noEmbedMessage: {
      type: String,
      default: 'Ver video en la fuente original',
    },
  })

  defineEmits(['expand'])
  const twitterContainer = ref(null)
  const twitterThumbnail = ref(null)
  const twitterAuthor = ref(null)
  const twitterText = ref(null)

  const provider = computed(() => {
    if (props.url.includes('youtube.com') || props.url.includes('youtu.be')) {
      return 'YouTube'
    } else if (props.url.includes('vimeo.com')) {
      return 'Vimeo'
    } else if (props.url.includes('facebook.com')) {
      return 'Facebook'
    } else if (props.url.includes('dailymotion.com')) {
      return 'Dailymotion'
    } else if (props.url.includes('twitter.com') || props.url.includes('x.com')) {
      return 'X (Twitter)'
    } else if (props.url.includes('instagram.com')) {
      return 'Instagram'
    } else if (props.url.includes('tiktok.com')) {
      return 'TikTok'
    }
    return 'Video'
  })

  // Generar URL para embeber
  const embedUrl = computed(() => {
    if (!props.url) return ''

    // YouTube (including shorts)
    if (props.url.includes('youtube.com') || props.url.includes('youtu.be')) {
      const ytRegex =
        /(?:youtube\.com\/(?:shorts\/|[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      const ytMatch = props.url.match(ytRegex)
      if (ytMatch && ytMatch[1]) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
      }
    }

    // Vimeo
    if (props.url.includes('vimeo.com')) {
      const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/
      const vimeoMatch = props.url.match(vimeoRegex)
      if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`
      }
    }

    // Dailymotion
    if (props.url.includes('dailymotion.com')) {
      const dmRegex = /dailymotion.com\/(?:video\/|embed\/video\/)([a-zA-Z0-9]+)/
      const dmMatch = props.url.match(dmRegex)
      if (dmMatch && dmMatch[1]) {
        return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`
      }
    }

    // Facebook (nota: Facebook tiene restricciones para embeber)
    if (props.url.includes('facebook.com/watch')) {
      const fbRegex = /facebook\.com\/watch\?v=(\d+)/
      const fbMatch = props.url.match(fbRegex)
      if (fbMatch && fbMatch[1]) {
        return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch?v=${fbMatch[1]}&show_text=false`
      }
    }

    // Instagram
    if (props.url.includes('instagram.com')) {
      const igRegex = /instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/
      const igMatch = props.url.match(igRegex)
      if (igMatch && igMatch[1]) {
        return `https://www.instagram.com/p/${igMatch[1]}/embed/`
      }
    }

    // TikTok
    if (props.url.includes('tiktok.com') && !props.url.includes('vm.tiktok.com')) {
      const tkRegex = /tiktok\.com\/@[a-zA-Z0-9_.]+\/video\/(\d+)/
      const tkMatch = props.url.match(tkRegex)
      if (tkMatch && tkMatch[1]) {
        return `https://www.tiktok.com/embed/v2/${tkMatch[1]}`
      }
    }

    return ''
  })

  const isTwitter = computed(() => {
    return props.url.includes('twitter.com') || props.url.includes('x.com')
  })

  const isInstagram = computed(() => {
    return props.url.includes('instagram.com')
  })

  const isTikTok = computed(() => {
    return props.url.includes('tiktok.com')
  })

  const isSocialEmbed = computed(() => {
    return isTwitter.value || isInstagram.value || isTikTok.value
  })

  const playButtonClass = computed(() => {
    if (isTwitter.value) {
      return 'bg-black bg-opacity-90 hover:bg-opacity-100'
    } else if (isInstagram.value) {
      return 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90'
    } else if (isTikTok.value) {
      return 'bg-black bg-opacity-90 hover:bg-opacity-100'
    }
    return 'bg-red-600 bg-opacity-80'
  })

  const loadTwitterMetadata = async () => {
    if (!isTwitter.value || !import.meta.client) return

    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBaseUrl}/v1/media/twitter-metadata`, {
        params: { url: props.url }
      })

      if (response.success && response.data) {
        twitterThumbnail.value = response.data.thumbnail_url
        twitterAuthor.value = response.data.author_name
        twitterText.value = response.data.tweet_text
      }
    } catch (error) {
      console.error('[VideoPlayer] Error loading Twitter metadata:', error)
    }
  }

  const loadTwitterWidget = () => {
    if (typeof window === 'undefined') return
    if (!isTwitter.value || !props.expanded) return

    if (!twitterContainer.value) {
      setTimeout(loadTwitterWidget, 50)
      return
    }

    if (!window.twttr) {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.onload = () => {
        embedTwitter()
      }
      document.body.appendChild(script)
    } else {
      embedTwitter()
    }
  }

  const embedTwitter = () => {
    if (!twitterContainer.value || !window.twttr) return

    const tweetIdMatch = props.url.match(/status\/(\d+)/)
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null


    if (!tweetId) {
      console.error('[VideoPlayer] Could not extract tweet ID from URL')
      return
    }

    twitterContainer.value.innerHTML = ''

    const isDark = document.documentElement.classList.contains('dark')

    window.twttr.widgets.createTweet(
      tweetId,
      twitterContainer.value,
      {
        theme: isDark ? 'dark' : 'light',
        lang: locale.value,
        dnt: true
      }
    ).then(() => {
    }).catch((error) => {
      console.error('[VideoPlayer] Error creating Twitter widget:', error)
    })
  }

  watch(() => props.expanded, (newVal) => {
    if (newVal && isTwitter.value) {
      setTimeout(loadTwitterWidget, 100)
    }
  })

  onMounted(() => {
    if (isTwitter.value) {
      loadTwitterMetadata()
      if (props.expanded) {
        loadTwitterWidget()
      }
    }
  })
</script>

<style scoped>
  .preview-container {
    transition: transform 0.2s ease-in-out;
  }

  .preview-container:hover {
    transform: scale(1.02);
  }

  .social-preview {
    background-color: var(--color-bg-card);
  }

  .social-avatar {
    background-color: var(--color-bg-hover);
  }

  .social-skeleton {
    background-color: var(--color-bg-hover);
  }

  .video-placeholder {
    background-color: var(--color-bg-hover);
  }
</style>
