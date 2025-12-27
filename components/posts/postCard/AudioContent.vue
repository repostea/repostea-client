<template>
  <div>
    <!-- Compact/List view: audio player more compact, doesn't take full width -->
    <div v-if="layout === 'compact' || layout === 'list'" class="flex flex-col gap-3">
      <div class="card-text text-sm text-text dark:text-text-dark">
        <div
          v-if="showFullText"
          class="prose dark:prose-invert max-w-none"
          v-html="renderedContent"
        />
        <p v-else v-html="displayText" />
      </div>
      <div class="max-w-md">
        <AudioPlayer
          :url="url"
          :title="title"
          :expanded="showFullText"
          :no-embed-message="noEmbedMessage"
          :media-metadata="post?.media_metadata"
          @expand="$emit('expand')"
        />
      </div>
    </div>

    <!-- Card view: audio player full width -->
    <div v-else>
      <div class="card-text text-sm text-text dark:text-text-dark mb-3">
        <div
          v-if="showFullText"
          class="prose dark:prose-invert max-w-none"
          v-html="renderedContent"
        />
        <p v-else v-html="displayText" />
      </div>

      <div class="mb-4 w-full">
        <AudioPlayer
          :url="url"
          :title="title"
          :expanded="showFullText"
          :no-embed-message="noEmbedMessage"
          :media-metadata="post?.media_metadata"
          @expand="$emit('expand')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { marked } from 'marked'
  import { configureMarked, RESTRICTED_SANITIZE_CONFIG } from '~/utils/markdown'
  import DOMPurify from 'dompurify'
  import AudioPlayer from '~/components/media/AudioPlayer.vue'
  import { renderBasicMarkdown } from '~/utils/text.js'

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
    showFullText: {
      type: Boolean,
      default: false,
    },
    noEmbedMessage: {
      type: String,
      default: 'Escuchar audio',
    },
    layout: {
      type: String,
      default: 'card',
    },
    post: {
      type: Object,
      default: () => ({}),
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
    // Audio: medium-short text (250 characters) with basic formatting
    return renderBasicMarkdown(props.content, 250)
  })
</script>
