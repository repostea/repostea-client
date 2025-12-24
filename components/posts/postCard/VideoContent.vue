<template>
  <div>
    <!-- Compact view: video on left, text on right -->
    <div v-if="layout === 'compact'" class="flex gap-4">
      <div class="flex-shrink-0" style="width: 200px;">
        <VideoPlayer
          :url="url"
          :title="title"
          :thumbnail="videoThumbnail"
          :expanded="showFullText"
          :no-embed-message="noEmbedMessage"
          @expand="$emit('expand')"
        />
      </div>
      <div class="flex-grow card-text text-sm text-text dark:text-text-dark">
        <div
          v-if="showFullText"
          class="prose dark:prose-invert max-w-none"
          v-html="renderedContent"
        />
        <p v-else v-html="displayText"/>
      </div>
    </div>

    <!-- Card/List view: text on top, video below -->
    <div v-else>
      <div class="card-text text-sm text-text dark:text-text-dark mb-4">
        <div
          v-if="showFullText"
          class="prose dark:prose-invert max-w-none"
          v-html="renderedContent"
        />
        <p v-else v-html="displayText"/>
      </div>

      <div class="w-full">
        <VideoPlayer
          :url="url"
          :title="title"
          :thumbnail="videoThumbnail"
          :expanded="showFullText"
          :no-embed-message="noEmbedMessage"
          @expand="$emit('expand')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import VideoPlayer from '~/components/media/VideoPlayer.vue'
  import { renderBasicMarkdown } from '~/utils/text.js'
  import { configureMarked, RESTRICTED_SANITIZE_CONFIG } from '~/utils/markdown'

  const props = defineProps({
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    excerpt: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    showFullText: {
      type: Boolean,
      default: false,
    },
    noEmbedMessage: {
      type: String,
      default: 'Ver video',
    },
    layout: {
      type: String,
      default: 'card',
    },
  })

  defineEmits(['expand'])

  const renderedContent = computed(() => {
    if (!props.content) return ''
    configureMarked()
    const rawHtml = marked.parse(props.content)
    // Only sanitize on client side (DOMPurify requires DOM)
    // Use restricted config: no images/GIFs allowed in descriptions
    if (import.meta.client) {
      return DOMPurify.sanitize(rawHtml, RESTRICTED_SANITIZE_CONFIG)
    }
    // During SSR, return unsanitized (safe because it's only rendered server-side)
    return rawHtml
  })

  const displayText = computed(() => {
    if (props.excerpt) return props.excerpt
    // Videos: shorter text (150 characters) with basic formatting
    return renderBasicMarkdown(props.content, 150)
  })

  const videoThumbnail = computed(() => {
    if (props.thumbnailUrl) return props.thumbnailUrl

    if (!props.url) return null

    if (props.url.includes('youtube.com') || props.url.includes('youtu.be')) {
      const ytRegex =
        /(?:youtube\.com\/(?:shorts\/|[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      const ytMatch = props.url.match(ytRegex)
      if (ytMatch && ytMatch[1]) {
        return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`
      }
    }

    if (props.url.includes('twitter.com') || props.url.includes('x.com')) {
      return null
    }

    return null
  })
</script>
