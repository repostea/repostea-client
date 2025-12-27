<template>
  <div>
    <!-- Compact view: image on left, text on right -->
    <div v-if="layout === 'compact'" class="flex gap-4">
      <div class="flex-shrink-0" style="width: 200px">
        <div class="image-container cursor-pointer" @click="openLightbox">
          <NuxtImg
            v-if="imageUrl"
            :src="imageUrl"
            :alt="title"
            class="w-full h-auto object-cover rounded-lg"
            style="max-height: 200px"
            loading="lazy"
            width="200"
            height="200"
            sizes="200px"
            format="webp"
            placeholder
          />
        </div>
      </div>
      <div class="flex-grow card-text text-sm text-text dark:text-text-dark">
        <div
          v-if="showFullText"
          class="prose dark:prose-invert max-w-none"
          v-html="renderedContent"
        />
        <p v-else v-html="displayText" />
      </div>
    </div>

    <!-- Card/List view: text on top, image below -->
    <div v-else>
      <div v-if="content" class="card-text text-sm text-text dark:text-text-dark mb-4">
        <div
          v-if="showFullText"
          class="prose dark:prose-invert max-w-none"
          v-html="renderedContent"
        />
        <p v-else v-html="displayText" />
      </div>

      <div class="w-full">
        <div class="image-container cursor-pointer" @click="openLightbox">
          <NuxtImg
            v-if="imageUrl"
            :src="imageUrl"
            :alt="title"
            class="w-full h-auto object-contain rounded-lg"
            style="max-height: 600px"
            loading="lazy"
            width="800"
            height="600"
            format="webp"
            sizes="100vw sm:640px md:768px lg:1024px"
            placeholder
          />
        </div>
      </div>
    </div>

    <!-- Image Lightbox -->
    <ImageLightbox
      :is-open="showLightbox"
      :image-src="lightboxImageSrc"
      :image-alt="title"
      @close="showLightbox = false"
    />
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { marked } from 'marked'
  import { configureMarked, RESTRICTED_SANITIZE_CONFIG } from '~/utils/markdown'
  import DOMPurify from 'dompurify'
  import { renderBasicMarkdown } from '~/utils/text.js'
  import ImageLightbox from '~/components/common/ImageLightbox.vue'

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
    layout: {
      type: String,
      default: 'card',
    },
  })

  // emit removed - image now opens lightbox directly

  // Lightbox state
  const showLightbox = ref(false)
  const lightboxImageSrc = ref('')

  // Open lightbox with full resolution image
  function openLightbox() {
    // Use the original URL (not thumbnail) for full resolution
    lightboxImageSrc.value = props.url
    showLightbox.value = true
  }

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
    // Images: shorter text (150 characters) with basic formatting
    return renderBasicMarkdown(props.content, 150)
  })

  const imageUrl = computed(() => {
    // Priority: thumbnailUrl > url
    return props.thumbnailUrl || props.url
  })
</script>

<style scoped>
  .image-container {
    overflow: hidden;
    border-radius: 0.5rem;
  }

  .image-container img {
    transition: transform 0.2s ease-in-out;
  }

  .image-container:hover img {
    transform: scale(1.02);
  }
</style>
