/**
 * Composable for generating dynamic URLs based on environment
 * Uses NUXT_PUBLIC_SITE_URL for frontend URLs and NUXT_PUBLIC_SERVER_URL for backend URLs
 */
export const useAppUrl = () => {
  const config = useRuntimeConfig()

  // Determine the base URL based on environment
  const getBaseUrl = () => {
    // Use configured siteUrl from environment variable
    if (config.public.siteUrl) {
      return config.public.siteUrl
    }

    // Fallback to localhost in development
    if (import.meta.client) {
      return window.location.origin
    }
    return 'http://localhost:3000'
  }

  // Get backend URL
  const getBackendUrl = () => {
    // First priority: use dedicated backend URL from environment
    if (config.public.serverUrl) {
      return config.public.serverUrl
    }

    // Second priority: extract base URL from API configuration
    if (config.public.apiBaseUrl) {
      const apiUrl = config.public.apiBaseUrl
      // Remove /api from the end if present
      return apiUrl.replace(/\/api\/?$/, '')
    }

    // Fallback to localhost in development
    return 'http://localhost:8000'
  }

  // Generate URL for footer links with locale (pointing to backend)
  const getFooterUrl = (path = '', locale = 'en') => {
    const baseUrl = getBackendUrl()
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    if (cleanPath) {
      return `${baseUrl}/${locale}/${cleanPath}`
    }
    return `${baseUrl}/${locale}/`
  }

  // Generate URL without locale (for API endpoints, assets, etc.)
  const getUrl = (path = '') => {
    const baseUrl = getBaseUrl()
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${baseUrl}${cleanPath}`
  }

  return {
    getBaseUrl,
    getBackendUrl,
    getFooterUrl,
    getUrl,
  }
}
