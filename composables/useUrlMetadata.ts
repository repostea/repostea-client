import { ref, type Ref } from 'vue'
import { useNuxtApp } from '#app'

export interface UrlMetadata {
  title: string | null
  description: string | null
  image: string | null
  site_name: string | null
  type: string | null
  author: string | null
  published_date: string | null
  canonical_url: string | null
}

export interface UseUrlMetadataReturn {
  metadata: Ref<UrlMetadata | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  fetchMetadata: (url: string) => Promise<UrlMetadata | null>
  clearMetadata: () => void
}

export function useUrlMetadata(): UseUrlMetadataReturn {
  const { $api } = useNuxtApp()

  const metadata = ref<UrlMetadata | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMetadata(url: string): Promise<UrlMetadata | null> {
    if (!url || !isValidUrl(url)) {
      error.value = 'URL inválida'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await $api.media.getUrlMetadata(url)

      if (response.data?.success && response.data?.data) {
        metadata.value = response.data.data
        return metadata.value
      } else {
        error.value = response.data?.message || 'No se pudieron obtener los metadatos'
        return null
      }
    } catch {
      // Silent fail - just set generic error, don't expose technical details
      error.value = 'error'
      return null
    } finally {
      isLoading.value = false
    }
  }

  function clearMetadata(): void {
    metadata.value = null
    error.value = null
  }

  function isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString)
      return true
    } catch {
      return false
    }
  }

  return {
    metadata,
    isLoading,
    error,
    fetchMetadata,
    clearMetadata,
  }
}
