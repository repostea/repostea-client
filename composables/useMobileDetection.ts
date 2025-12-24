import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'

// Define ScrollIntoViewOptions interface locally since it's not available in all environments
interface ScrollIntoViewOptions {
  behavior?: 'auto' | 'smooth'
  block?: 'start' | 'center' | 'end' | 'nearest'
  inline?: 'start' | 'center' | 'end' | 'nearest'
}

export interface MobileDetectionOptions {
  breakpoint?: number
  enableTouchDetection?: boolean
  enableUserAgentDetection?: boolean
}

export const useMobileDetection = (options: MobileDetectionOptions = {}) => {
  const { breakpoint = 768, enableTouchDetection = true, enableUserAgentDetection = true } = options

  // Reactive state
  const screenWidth = ref(0)
  const isTouchDevice = ref(false)
  const isMobileUserAgent = ref(false)

  // Computed properties
  const isMobileScreen = computed(() => screenWidth.value < breakpoint)

  const isMobile = computed(() => {
    // Mobile if any of these conditions are true
    return (
      isMobileScreen.value ||
      (enableTouchDetection && isTouchDevice.value) ||
      (enableUserAgentDetection && isMobileUserAgent.value)
    )
  })

  const isTablet = computed(() => {
    return screenWidth.value >= 768 && screenWidth.value < 1024
  })

  const isDesktop = computed(() => {
    return screenWidth.value >= 1024
  })

  const deviceType = computed(() => {
    if (isMobileScreen.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  // Touch target sizes
  const touchTargetSize = computed(() => {
    if (isMobile.value) return '44px'
    if (isTablet.value) return '40px'
    return '32px'
  })

  const touchTargetSizeNumber = computed(() => {
    if (isMobile.value) return 44
    if (isTablet.value) return 40
    return 32
  })

  // Spacing and layout helpers
  const commentNestingMargin = computed(() => {
    if (isMobile.value) return 'ml-4'
    if (isTablet.value) return 'ml-6'
    return 'ml-12'
  })

  const buttonSpacing = computed(() => {
    if (isMobile.value) return 'space-x-2'
    return 'space-x-3'
  })

  const paddingSize = computed(() => {
    if (isMobile.value) return 'p-3'
    if (isTablet.value) return 'p-4'
    return 'p-4'
  })

  // Methods
  const updateScreenWidth = () => {
    if (import.meta.client) {
      screenWidth.value = window.innerWidth
    }
  }

  const detectTouchDevice = () => {
    if (!import.meta.client) return false

    return (
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints! > 0
    )
  }

  const detectMobileUserAgent = () => {
    if (!import.meta.client) return false

    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = [
      'android',
      'iphone',
      'ipad',
      'ipod',
      'blackberry',
      'windows phone',
      'opera mini',
      'mobile',
      'tablet',
    ]

    return mobileKeywords.some((keyword) => userAgent.includes(keyword))
  }

  // Viewport utilities
  const getViewportHeight = () => {
    if (!import.meta.client) return 0
    return window.innerHeight
  }

  const getViewportWidth = () => {
    if (!import.meta.client) return 0
    return window.innerWidth
  }

  // Check if element is in viewport
  const isElementInViewport = (element: HTMLElement) => {
    if (!import.meta.client || !element) return false

    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  // Scroll utilities for mobile
  const scrollToElement = (element: HTMLElement, options: ScrollIntoViewOptions = {}) => {
    if (!import.meta.client || !element) return

    const defaultOptions: ScrollIntoViewOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    }

    // For mobile, use different scroll behavior
    if (isMobile.value) {
      defaultOptions.block = 'start'
      defaultOptions.behavior = 'smooth'
    }

    element.scrollIntoView({ ...defaultOptions, ...options })
  }

  // Handle resize events
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null
  const handleResize = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }

    resizeTimeout = setTimeout(() => {
      updateScreenWidth()
    }, 100) // Debounce resize events
  }

  // Lifecycle
  onMounted(() => {
    if (import.meta.client) {
      // Initial detection
      updateScreenWidth()
      isTouchDevice.value = detectTouchDevice()
      isMobileUserAgent.value = detectMobileUserAgent()

      // Add resize listener
      window.addEventListener('resize', handleResize)

      // Add orientation change listener for mobile devices
      if ('orientation' in window) {
        window.addEventListener('orientationchange', () => {
          setTimeout(updateScreenWidth, 500) // Delay to ensure orientation change is complete
        })
      }
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('resize', handleResize)

      if ('orientation' in window) {
        window.removeEventListener('orientationchange', updateScreenWidth)
      }

      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
    }
  })

  return {
    // State
    screenWidth: readonly(screenWidth),
    isTouchDevice: readonly(isTouchDevice),
    isMobileUserAgent: readonly(isMobileUserAgent),

    // Computed flags
    isMobile,
    isMobileScreen,
    isTablet,
    isDesktop,
    deviceType,

    // Styling helpers
    touchTargetSize,
    touchTargetSizeNumber,
    commentNestingMargin,
    buttonSpacing,
    paddingSize,

    // Utilities
    getViewportHeight,
    getViewportWidth,
    isElementInViewport,
    scrollToElement,
    updateScreenWidth,
  }
}
