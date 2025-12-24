<template>
  <div>
    <div
      v-if="thumbnailUrl"
      :class="[
        'thumbnail-container mb-3',
        $i18n.locale.startsWith('ar') || $i18n.locale.startsWith('he')
          ? 'float-left mr-4'
          : 'float-right ml-4',
      ]"
      role="button"
      tabindex="0"
      @click="openLightbox"
      @keydown.enter="openLightbox"
      @keydown.space.prevent="openLightbox"
    >
      <div class="fixed-size-image">
        <NuxtImg
          v-if="!imageError"
          :src="thumbnailUrl"
          :alt="title || $t('posts.thumbnail')"
          preset="thumbnail"
          loading="lazy"
          width="90"
          height="90"
          sizes="80px sm:90px"
          placeholder
          class="object-cover w-full h-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full"
          @error="handleImageError"
        />
        <div v-else class="image-error-fallback">
          <Icon name="fa6-solid:image" class="text-gray-400" aria-hidden="true" />
        </div>
      </div>
    </div>

    <div class="card-text text-sm text-text dark:text-text-dark mb-3">
      <div
        v-if="showFullText"
        class="prose dark:prose-invert max-w-none"
        dir="auto"
        v-html="renderedContent"
      />
      <p v-else dir="auto" v-html="displayText"/>
    </div>

    <!-- Image Lightbox -->
    <ImageLightbox
      :is-open="showLightbox"
      :image-src="thumbnailUrl || ''"
      :image-alt="title || $t('posts.thumbnail')"
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

  const imageError = ref(false)

  // Lightbox state
  const showLightbox = ref(false)

  // Open lightbox for thumbnail
  function openLightbox() {
    showLightbox.value = true
  }

  const props = defineProps({
    content: {
      type: String,
      default: '',
    },
    excerpt: {
      type: String,
      default: '',
    },
    title: {
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
  })

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
    // Posts/Links: medium text (350 characters) with basic formatting
    return renderBasicMarkdown(props.content, 350)
  })

  function handleImageError() {
    imageError.value = true
  }
</script>

<style scoped>
  .thumbnail-container {
    display: block;
    cursor: pointer;
  }

  .fixed-size-image {
    width: 80px;
    height: 80px;
    overflow: hidden;
    border-radius: 0.5rem;
    position: relative;
  }

  @media (min-width: 640px) {
    .fixed-size-image {
      width: 90px;
      height: 90px;
    }
  }

  .float-right {
    float: right;
  }

  .fixed-size-image img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 100%;
    min-height: 100%;
  }

  .image-error-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg-hover);
    border-radius: 0.5rem;
  }

  .image-error-fallback i {
    font-size: 1.5rem;
  }
</style>
