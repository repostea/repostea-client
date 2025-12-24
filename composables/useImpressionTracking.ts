/**
 * Lightweight impression tracking using Intersection Observer + Beacon API
 * Batches impressions and sends them periodically to minimize requests
 */

// Shared state across all component instances
const pendingImpressions = new Set<number | string>()
let flushTimeout: ReturnType<typeof setTimeout> | null = null
let observer: IntersectionObserver | null = null

const FLUSH_INTERVAL = 3000 // Send batch every 3 seconds max

export const useImpressionTracking = () => {
  const config = useRuntimeConfig()

  /**
   * Flush pending impressions to server
   */
  const flushImpressions = () => {
    if (!process.client || pendingImpressions.size === 0) return

    const ids = [...pendingImpressions]
    pendingImpressions.clear()

    const url = `${config.public.apiBaseUrl}/v1/posts/impressions`
    const formData = new FormData()
    formData.append('post_ids', JSON.stringify(ids))

    navigator.sendBeacon(url, formData)
  }

  /**
   * Schedule a flush (debounced)
   */
  const scheduleFlush = () => {
    if (flushTimeout) return // Already scheduled
    flushTimeout = setTimeout(() => {
      flushImpressions()
      flushTimeout = null
    }, FLUSH_INTERVAL)
  }

  /**
   * Get or create the shared Intersection Observer
   */
  const getObserver = (): IntersectionObserver | null => {
    if (!process.client) return null

    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const postId = (entry.target as HTMLElement).dataset.postId
              if (postId) {
                pendingImpressions.add(postId)
                scheduleFlush()
              }
              // Stop observing after first impression
              observer?.unobserve(entry.target)
            }
          })
        },
        {
          threshold: 0.5, // 50% visible
          rootMargin: '0px',
        }
      )
    }
    return observer
  }

  /**
   * Track impression for an element
   * @param el - The element to observe
   * @param postId - The post ID to track
   */
  const trackImpression = (el: HTMLElement | null, postId: number | string) => {
    if (!el || !process.client) return

    el.dataset.postId = String(postId)

    const obs = getObserver()
    if (obs) {
      obs.observe(el)
      // Check if already visible (for elements rendered in viewport)
      const rect = el.getBoundingClientRect()
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0
      if (isVisible) {
        pendingImpressions.add(String(postId))
        scheduleFlush()
        obs.unobserve(el)
      }
    }
  }

  /**
   * Stop tracking an element
   */
  const untrackImpression = (el: HTMLElement | null) => {
    if (!el || !observer) return
    observer.unobserve(el)
  }

  // Flush on page unload
  if (process.client) {
    window.addEventListener('beforeunload', flushImpressions, { once: true })
  }

  return {
    trackImpression,
    untrackImpression,
    flushImpressions,
  }
}
