<template>
  <div>
    <!-- Vista previa (con o sin imagen) -->
    <template v-if="!showFullText">
      <div class="card-text text-sm text-text dark:text-text-dark mb-3">
        <!-- Small floating thumbnail if image exists -->
        <div
          v-if="firstImageUrl"
          class="thumbnail-container float-right ml-4 mb-3"
          role="button"
          tabindex="0"
          @click="openThumbnailLightbox"
          @keydown.enter="openThumbnailLightbox"
          @keydown.space.prevent="openThumbnailLightbox"
        >
          <div class="fixed-size-image">
            <NuxtImg
              v-if="!imageError"
              :src="firstImageUrl"
              :alt="firstImageAlt"
              preset="thumbnail"
              loading="lazy"
              class="object-cover w-full h-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full"
              @error="handleImageError"
            />
            <div v-else class="image-error-fallback">
              <Icon name="fa6-solid:image" class="text-gray-400" aria-hidden="true" />
            </div>
          </div>
        </div>
        <p dir="auto">{{ displayText }}</p>
      </div>
    </template>

    <!-- Contenido completo -->
    <template v-else>
      <div class="card-text text-sm text-text dark:text-text-dark mb-3">
        <div
          ref="contentRef"
          class="prose dark:prose-invert max-w-none"
          dir="auto"
          @click="handleContentClick"
          v-html="renderedContent"
        />
      </div>
    </template>

    <!-- Image Lightbox -->
    <ImageLightbox
      :is-open="showLightbox"
      :image-src="lightboxImageSrc"
      :image-alt="lightboxImageAlt"
      @close="showLightbox = false"
    />
  </div>
</template>

<script setup>
  import { computed, ref, onMounted, watch } from 'vue'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import { configureMarked, FULL_SANITIZE_CONFIG } from '~/utils/markdown'
  import { useI18n } from '#i18n'
  import { createExcerpt } from '~/utils/text.js'
  import ImageLightbox from '~/components/common/ImageLightbox.vue'

  const { t } = useI18n()

  const props = defineProps({
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
    layout: {
      type: String,
      default: 'card',
      validator: (value) => ['list', 'compact', 'card'].includes(value),
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
  })

  // emit removed - thumbnail now opens lightbox directly

  const contentRef = ref(null)
  const imageError = ref(false)

  // Lightbox state
  const showLightbox = ref(false)
  const lightboxImageSrc = ref('')
  const lightboxImageAlt = ref('')

  // Handle clicks on images in content to open lightbox
  function handleContentClick(event) {
    const target = event.target
    if (target.tagName === 'IMG') {
      event.preventDefault()
      // Use original high-res URL if available, fallback to src
      lightboxImageSrc.value = target.dataset.originalSrc || target.src
      lightboxImageAlt.value = target.alt || ''
      showLightbox.value = true
    }
  }

  // Open lightbox for thumbnail preview image
  function openThumbnailLightbox() {
    if (firstImageUrl.value) {
      lightboxImageSrc.value = firstImageUrl.value
      lightboxImageAlt.value = firstImageAlt.value || ''
      showLightbox.value = true
    }
  }

  const renderedContent = computed(() => {
    if (!props.content) return ''

    try {
      // Configure marked with optimized image renderer
      configureMarked()

      const rawHtml = marked.parse(props.content)

      // Only sanitize on client side (DOMPurify requires DOM)
      // Use full config: allows images for text posts
      if (process.client) {
        return DOMPurify.sanitize(rawHtml, FULL_SANITIZE_CONFIG)
      }
      // During SSR, return unsanitized (safe because it's only rendered server-side)
      return rawHtml
    } catch (error) {
      console.error('Error rendering markdown content:', error)
      return props.content || ''
    }
  })

  // Extract first image URL and alt text: prioritize thumbnail, then extract from markdown
  const firstImageData = computed(() => {
    // Priority 1: Use thumbnail_url if available
    if (props.thumbnailUrl) {
      return { url: props.thumbnailUrl, alt: null }
    }

    // Priority 2: Extract from markdown content
    if (!props.content) return { url: null, alt: null }

    // Regex to find images in markdown: ![alt](url)
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/
    const match = props.content.match(markdownImageRegex)

    if (match && match[2]) {
      return { url: match[2], alt: match[1] || null }
    }

    // Also search in HTML if there's <img src="..." alt="...">
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?/
    const htmlMatch = props.content.match(htmlImageRegex)

    if (htmlMatch && htmlMatch[1]) {
      return { url: htmlMatch[1], alt: htmlMatch[2] || null }
    }

    return { url: null, alt: null }
  })

  const firstImageUrl = computed(() => firstImageData.value.url)
  const firstImageAlt = computed(() => firstImageData.value.alt || t('posts.image_preview'))

  const displayText = computed(() => {
    if (props.excerpt) return props.excerpt

    let contentToDisplay = props.content

    // If there's an image and we're not in full view, remove markdown image syntax
    if (firstImageUrl.value && !props.showFullText) {
      // Remove markdown image syntax: ![alt](url)
      contentToDisplay = contentToDisplay.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')
      // Remove HTML image tags: <img ...>
      contentToDisplay = contentToDisplay.replace(/<img[^>]*>/gi, '')
      // Clean up multiple empty lines that may remain
      contentToDisplay = contentToDisplay.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
    }

    // Articles: longer text (500 characters)
    return createExcerpt(contentToDisplay, 500)
  })

  function handleImageError() {
    imageError.value = true
  }

  const processImages = () => {
    if (!contentRef.value || !props.showFullText) return

    setTimeout(() => {
      const images = contentRef.value.querySelectorAll('img')

      images.forEach((img) => {
        // Add lazy loading if not already present
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy')
        }

        img.addEventListener('load', () => {
          if (img.naturalWidth > 0) {
            if (img.naturalWidth / img.naturalHeight > 2) {
              img.classList.add('wide-image')
            }
            if (img.naturalHeight / img.naturalWidth > 2) {
              img.classList.add('tall-image')
            }
            if (img.naturalWidth > 1200 || img.naturalHeight > 1200) {
              img.classList.add('large-image')
            }
          }
        })

        img.addEventListener('error', () => {
          img.classList.add('error')
        })

        if (img.complete) {
          if (img.naturalWidth > 0) {
            if (img.naturalWidth / img.naturalHeight > 2) {
              img.classList.add('wide-image')
            }
            if (img.naturalHeight / img.naturalWidth > 2) {
              img.classList.add('tall-image')
            }
            if (img.naturalWidth > 1200 || img.naturalHeight > 1200) {
              img.classList.add('large-image')
            }
          }
        } else {
          const placeholder = document.createElement('div')
          placeholder.className = 'image-loading-placeholder'
          placeholder.textContent = t('posts.loading_image')
          placeholder.setAttribute('role', 'status')
          placeholder.setAttribute('aria-live', 'polite')
          img.parentNode.insertBefore(placeholder, img)

          img.addEventListener('load', () => {
            if (placeholder.parentNode) {
              placeholder.parentNode.removeChild(placeholder)
            }
          })

          img.addEventListener('error', () => {
            if (placeholder.parentNode) {
              placeholder.textContent = t('posts.image_error')
              placeholder.className = 'image-error-placeholder'
              setTimeout(() => {
                if (placeholder.parentNode) {
                  placeholder.parentNode.removeChild(placeholder)
                }
              }, 3000)
            }
          })
        }
      })
    }, 0)
  }

  onMounted(() => {
    processImages()
  })

  watch(
    () => props.content,
    () => {
      if (props.showFullText) {
        processImages()
      }
    }
  )

  watch(
    () => props.showFullText,
    (newVal) => {
      if (newVal) {
        processImages()
      }
    }
  )
</script>

<style scoped>
  /* Styles for images in full view (rendered content) */
  :deep(.prose img) {
    max-height: 500px;
    max-width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 0.5rem;
    margin: 1rem auto;
    display: block;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  :deep(.prose img:hover) {
    opacity: 0.9;
  }

  /* Imágenes wide mantienen su aspecto ancho */
  :deep(.prose img.wide-image) {
    max-height: 400px;
    width: 100%;
    object-fit: cover;
  }

  /* Imágenes tall tienen altura controlada */
  :deep(.prose img.tall-image) {
    max-height: 600px;
    max-width: 400px;
  }

  /* Imágenes grandes tienen límite estricto */
  :deep(.prose img.large-image) {
    max-height: 500px;
  }

  /* Thumbnail container - same as LinkContent */
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
    background-color: var(--color-bg-hover);
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
  }

  .image-error-fallback i {
    font-size: 1.5rem;
    color: var(--color-text-muted);
  }
</style>
