import { ref, readonly, onMounted, onUnmounted, type Ref } from 'vue'

interface LazyImageOptions {
  rootMargin?: string
  threshold?: number
  placeholder?: string
  errorPlaceholder?: string
  fadeIn?: boolean
  preloadCritical?: boolean
}

const defaultOptions: LazyImageOptions = {
  rootMargin: '50px',
  threshold: 0.1,
  placeholder:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjMgZjQgZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IiM5Y2EzYWYiPkxvYWRpbmc8L3RleHQ+PC9zdmc+',
  errorPlaceholder:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjZWY0NDQ0Ij5FcnJvcjwvdGV4dD48L3N2Zz4=',
  fadeIn: true,
  preloadCritical: false,
}

/**
 * Enhanced lazy loading composable for images with intersection observer
 */
export const useLazyImages = (options: LazyImageOptions = {}) => {
  const config = { ...defaultOptions, ...options }
  const observer: Ref<IntersectionObserver | null> = ref(null)
  const loadedImages: Ref<Set<string>> = ref(new Set())
  const errorImages: Ref<Set<string>> = ref(new Set())
  const preloadedImages: Ref<Set<string>> = ref(new Set())

  /**
   * Create intersection observer
   */
  const createObserver = () => {
    if (!import.meta.client || observer.value) return

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            loadImage(img)
            observer.value?.unobserve(img)
          }
        })
      },
      {
        rootMargin: config.rootMargin,
        threshold: config.threshold,
      }
    )
  }

  /**
   * Load an image with error handling and fade-in effect
   */
  const loadImage = (img: HTMLImageElement) => {
    const src = img.dataset.src
    if (!src || loadedImages.value.has(src)) return

    // Create a new image to preload
    const imageLoader = new Image()

    imageLoader.onload = () => {
      // Image loaded successfully
      img.src = src
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-loaded')

      if (config.fadeIn) {
        img.style.opacity = '0'
        img.style.transition = 'opacity 0.3s ease-in-out'
        requestAnimationFrame(() => {
          img.style.opacity = '1'
        })
      }

      loadedImages.value.add(src)
    }

    imageLoader.onerror = () => {
      // Image failed to load
      if (config.errorPlaceholder) {
        img.src = config.errorPlaceholder
      }
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-error')
      errorImages.value.add(src)
    }

    // Start loading
    img.classList.add('lazy-loading')
    imageLoader.src = src
  }

  /**
   * Setup lazy loading for an image element
   */
  const setupLazyImage = (img: HTMLImageElement, src: string, critical = false) => {
    if (!import.meta.client) return

    // Store original src in data attribute
    img.dataset.src = src

    // Set placeholder
    if (config.placeholder && !critical) {
      img.src = config.placeholder
    }

    // Add lazy class for styling
    img.classList.add('lazy-image')

    // If critical, load immediately
    if (critical || config.preloadCritical) {
      loadImage(img)
      return
    }

    // Otherwise, observe for lazy loading
    createObserver()
    if (observer.value) {
      observer.value.observe(img)
    }
  }

  /**
   * Preload critical images
   */
  const preloadImage = (src: string) => {
    if (preloadedImages.value.has(src)) return Promise.resolve()

    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        preloadedImages.value.add(src)
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * Preload multiple images
   */
  const preloadImages = async (srcs: string[]) => {
    const promises = srcs.map((src) => preloadImage(src).catch(() => null))
    await Promise.allSettled(promises)
  }

  /**
   * Check if image is loaded
   */
  const isImageLoaded = (src: string) => loadedImages.value.has(src)

  /**
   * Check if image failed to load
   */
  const isImageError = (src: string) => errorImages.value.has(src)

  /**
   * Get loading stats
   */
  const getStats = () => ({
    loaded: loadedImages.value.size,
    errors: errorImages.value.size,
    preloaded: preloadedImages.value.size,
  })

  /**
   * Cleanup observer
   */
  const cleanup = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  }

  onMounted(() => {
    createObserver()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    setupLazyImage,
    preloadImage,
    preloadImages,
    isImageLoaded,
    isImageError,
    getStats,
    cleanup,
    loadedImages: readonly(loadedImages),
    errorImages: readonly(errorImages),
  }
}

/**
 * Directive for easy lazy loading setup
 */
export const vLazyImage = {
  mounted(el: HTMLImageElement, binding: any) {
    const { setupLazyImage } = useLazyImages(binding.modifiers)
    const src = binding.value
    const critical = binding.modifiers?.critical || false

    setupLazyImage(el, src, critical)
  },
}

/**
 * Utility function to generate responsive image srcset
 */
export const generateSrcSet = (baseSrc: string, sizes: number[] = [320, 640, 960, 1280]) => {
  // This would integrate with your image optimization service
  // For now, it returns the base src
  return sizes.map((size) => `${baseSrc}?w=${size} ${size}w`).join(', ')
}

/**
 * Utility function to detect WebP support
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * Get optimized image URL based on browser capabilities
 */
export const getOptimizedImageUrl = async (
  src: string,
  options: { width?: number; quality?: number } = {}
) => {
  const { width, quality = 85 } = options
  const webpSupported = await supportsWebP()

  // This would integrate with your image optimization service
  // For now, it returns the original src with potential query parameters
  const params = new URLSearchParams()
  if (width) params.set('w', width.toString())
  params.set('q', quality.toString())
  if (webpSupported) params.set('format', 'webp')

  const queryString = params.toString()
  return queryString ? `${src}?${queryString}` : src
}
