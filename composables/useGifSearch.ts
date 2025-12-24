import { ref, computed } from 'vue'

export interface TenorGif {
  id: string
  title: string
  url: string // Full GIF URL
  preview: string // Small preview URL
  width: number
  height: number
}

export interface UseGifSearchOptions {
  limit?: number
  locale?: string
}

export function useGifSearch(options: UseGifSearchOptions = {}) {
  const { limit = 20, locale = 'es' } = options

  const searchQuery = ref('')
  const gifs = ref<TenorGif[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const nextPos = ref<string | null>(null) // For pagination

  const config = useRuntimeConfig()

  // Get Tenor API key from runtime config
  const apiKey = computed(() => config.public.tenorApiKey as string || '')

  // Check if Tenor is configured
  const isConfigured = computed(() => !!apiKey.value)

  // Transform Tenor API response to our format
  function transformTenorResponse(results: any[]): TenorGif[] {
    return results.map((item) => {
      // Get the best format for display (gif for full, tinygif for preview)
      const gifFormat = item.media_formats?.gif || item.media_formats?.mediumgif
      const previewFormat = item.media_formats?.tinygif || item.media_formats?.nanogif

      return {
        id: item.id,
        title: item.title || item.content_description || '',
        url: gifFormat?.url || '',
        preview: previewFormat?.url || gifFormat?.url || '',
        width: gifFormat?.dims?.[0] || 200,
        height: gifFormat?.dims?.[1] || 200,
      }
    }).filter(gif => gif.url) // Filter out any without URLs
  }

  // Search GIFs
  async function search(query: string, append = false) {
    if (!isConfigured.value) {
      error.value = 'Tenor API not configured'
      return
    }

    if (!query.trim()) {
      if (!append) {
        gifs.value = []
      }
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        key: apiKey.value,
        q: query,
        limit: limit.toString(),
        locale: locale,
        media_filter: 'gif,tinygif,mediumgif',
        contentfilter: 'medium', // Filter out explicit content
      })

      if (append && nextPos.value) {
        params.set('pos', nextPos.value)
      }

      const response = await fetch(`https://tenor.googleapis.com/v2/search?${params}`)

      if (!response.ok) {
        throw new Error(`Tenor API error: ${response.status}`)
      }

      const data = await response.json()

      const transformedGifs = transformTenorResponse(data.results || [])

      if (append) {
        gifs.value = [...gifs.value, ...transformedGifs]
      } else {
        gifs.value = transformedGifs
      }

      nextPos.value = data.next || null
      searchQuery.value = query
    } catch (err) {
      console.error('GIF search error:', err)
      error.value = err instanceof Error ? err.message : 'Error searching GIFs'
      if (!append) {
        gifs.value = []
      }
    } finally {
      isLoading.value = false
    }
  }

  // Load featured/trending GIFs
  async function loadFeatured() {
    if (!isConfigured.value) {
      error.value = 'Tenor API not configured'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        key: apiKey.value,
        limit: limit.toString(),
        locale: locale,
        media_filter: 'gif,tinygif,mediumgif',
        contentfilter: 'medium',
      })

      const response = await fetch(`https://tenor.googleapis.com/v2/featured?${params}`)

      if (!response.ok) {
        throw new Error(`Tenor API error: ${response.status}`)
      }

      const data = await response.json()

      gifs.value = transformTenorResponse(data.results || [])
      nextPos.value = data.next || null
      searchQuery.value = ''
    } catch (err) {
      console.error('GIF featured error:', err)
      error.value = err instanceof Error ? err.message : 'Error loading GIFs'
      gifs.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Load more GIFs (pagination)
  async function loadMore() {
    if (!nextPos.value || isLoading.value) return

    if (searchQuery.value) {
      await search(searchQuery.value, true)
    }
  }

  // Clear results
  function clear() {
    gifs.value = []
    searchQuery.value = ''
    nextPos.value = null
    error.value = null
  }

  return {
    // State
    searchQuery,
    gifs,
    isLoading,
    error,
    isConfigured,
    hasMore: computed(() => !!nextPos.value),

    // Actions
    search,
    loadFeatured,
    loadMore,
    clear,
  }
}
