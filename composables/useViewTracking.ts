/**
 * Composable to track post views using Beacon API
 * Non-blocking, works even if user closes the page quickly
 */
export const useViewTracking = () => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const { getSessionId, getScreenResolution, getReferer } = useSession()

  /**
   * Get tracking data from current session and route
   */
  const getTrackingData = () => {
    return {
      referer: getReferer(),
      screen_resolution: getScreenResolution(),
      session_id: getSessionId(),
      utm_source: route.query.utm_source as string | undefined,
      utm_medium: route.query.utm_medium as string | undefined,
      utm_campaign: route.query.utm_campaign as string | undefined,
      utm_term: route.query.utm_term as string | undefined,
      utm_content: route.query.utm_content as string | undefined,
    }
  }

  /**
   * Register a view using Beacon API
   * @param postId - The post ID to register view for
   */
  const registerView = (postId: number | string) => {
    if (!process.client) return

    const trackingData = getTrackingData()
    const url = `${config.public.apiBaseUrl}/v1/posts/${postId}/view`

    // Use Beacon API with FormData - doesn't block navigation, works even if page closes
    // FormData is natively supported by sendBeacon and parsed correctly by Laravel
    const formData = new FormData()
    Object.entries(trackingData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    navigator.sendBeacon(url, formData)
  }

  /**
   * Check if a post should track views on title click
   * Only external links (not NSFW, not media content) should track
   */
  const shouldTrackOnClick = (post: {
    url?: string | null
    is_nsfw?: boolean
    content_type?: string
  }) => {
    const isMediaContent = post.content_type === 'video' || post.content_type === 'audio'
    return post.url && !post.is_nsfw && !isMediaContent
  }

  return {
    registerView,
    shouldTrackOnClick,
    getTrackingData,
  }
}
