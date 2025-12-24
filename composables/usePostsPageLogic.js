import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '~/stores/posts'
import { useUserPreferencesStore } from '~/stores/userPreferences'

/**
 * Composable for shared posts page logic (NOT SSR data fetching)
 *
 * Use this AFTER doing `await useAsyncData()` in the page.
 * This composable handles: state, watchers, handlers, lifecycle hooks.
 *
 * @param {Object} options
 * @param {string} options.defaultSection - Default section: 'frontpage', 'my_subs', 'pending'
 * @param {boolean} options.updateUrl - Whether to update URL with filter state
 */
export function usePostsPageLogic(options = {}) {
  const {
    defaultSection = 'frontpage',
    updateUrl = true,
  } = options

  const route = useRoute()
  const router = useRouter()
  const postsStore = usePostsStore()
  const userPreferencesStore = useUserPreferencesStore()

  // ============================================
  // State
  // ============================================
  const sort = ref(route.query.sort?.toString() || 'lastActive')
  const direction = ref(route.query.dir?.toString() || 'desc')
  const page = ref(1)
  const loading = ref(false)
  const loadMoreLoading = ref(false)
  const timeInterval = ref(route.query.time?.toString() || '43200')
  const isMobile = ref(false)
  const popularTags = ref([])
  const showStats = ref(false)
  const statsContainer = ref(null)

  // Current section tracking
  const currentSectionValue = ref(defaultSection)
  const currentSection = computed({
    get: () => {
      const path = route.path
      if (path.endsWith('/pending')) return 'pending'
      if (path.endsWith('/my-subs')) return 'my_subs'
      // Return the tracked value (allows sections to work when not using URL routing)
      return currentSectionValue.value
    },
    set: (value) => {
      currentSectionValue.value = value
      page.value = 1
      postsStore.clearPosts()
      nextTick(() => fetchCurrentSection())
    }
  })

  // ============================================
  // Computed
  // ============================================
  const layout = computed(() => userPreferencesStore.getLayout)
  const posts = computed(() => postsStore.posts)
  const meta = computed(() => postsStore.meta)
  const hasMorePosts = computed(() => {
    if (meta.value.hasMore !== undefined) return meta.value.hasMore
    if (meta.value.nextCursor) return true
    return meta.value.currentPage < meta.value.lastPage
  })

  // ============================================
  // Functions
  // ============================================
  function checkMobile() {
    if (import.meta.client) {
      isMobile.value = window.innerWidth < 768
    }
  }

  function updateUrlState() {
    if (!import.meta.client || !updateUrl) return
    const query = {}
    if (sort.value !== 'lastActive') query.sort = sort.value
    if (direction.value !== 'desc') query.dir = direction.value
    if (timeInterval.value !== '43200') query.time = timeInterval.value
    router.replace({ query })
  }

  async function fetchCurrentSection() {
    const section = currentSection.value
    if (section === 'frontpage') await fetchFrontpage()
    else if (section === 'pending') await fetchPending()
    else if (section === 'my_subs') await fetchMySubs()
    else await fetchFrontpage()
  }

  async function fetchFrontpage() {
    loading.value = true
    try {
      const contentType = userPreferencesStore.getContentTypeFilter || null
      await postsStore.fetchFrontpage(page.value, sort.value, direction.value, parseInt(timeInterval.value), 25, contentType)
    } catch (error) {
      console.error('Error fetching frontpage:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchPending() {
    loading.value = true
    try {
      const contentType = userPreferencesStore.getContentTypeFilter || null
      await postsStore.fetchPending(page.value, sort.value, direction.value, parseInt(timeInterval.value), 25, contentType)
    } catch (error) {
      console.error('Error fetching pending:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchMySubs() {
    loading.value = true
    try {
      const contentType = userPreferencesStore.getContentTypeFilter || null
      await postsStore.fetchMySubs(page.value, sort.value, direction.value, parseInt(timeInterval.value), 25, contentType)
    } catch (error) {
      console.error('Error fetching my subs:', error)
    } finally {
      loading.value = false
    }
  }

  function handleFilterChanged() {
    page.value = 1
    postsStore.clearPosts()
    fetchCurrentSection()
  }

  function handleClearFilters() {
    userPreferencesStore.setContentTypeFilter(null)
    page.value = 1
    postsStore.clearPosts()
    fetchCurrentSection()
  }

  async function loadMorePosts() {
    if (loadMoreLoading.value || !hasMorePosts.value) return
    loadMoreLoading.value = true
    page.value += 1

    try {
      const contentType = userPreferencesStore.getContentTypeFilter || null
      const section = currentSection.value

      if (section === 'frontpage') {
        await postsStore.loadMoreFrontpage(page.value, sort.value, direction.value, parseInt(timeInterval.value), 25, contentType)
      } else if (section === 'pending') {
        await postsStore.loadMorePending(page.value, sort.value, direction.value, parseInt(timeInterval.value), 25, contentType)
      } else if (section === 'my_subs') {
        await postsStore.loadMoreMySubs(page.value, sort.value, direction.value, parseInt(timeInterval.value), 25, contentType)
      }
    } catch (error) {
      console.error('Error loading more posts:', error)
      page.value -= 1
    } finally {
      loadMoreLoading.value = false
    }
  }

  async function fetchPopularTags() {
    popularTags.value = [
      { id: 1, name: 'tecnología', posts_count: 15 },
      { id: 2, name: 'ciencia', posts_count: 12 },
      { id: 3, name: 'política', posts_count: 10 },
      { id: 4, name: 'economía', posts_count: 8 },
      { id: 5, name: 'cultura', posts_count: 7 },
    ]
  }

  // Debounced fetch
  let fetchTimeout = null
  const debouncedFetch = () => {
    if (fetchTimeout) clearTimeout(fetchTimeout)
    postsStore.clearPosts()
    fetchTimeout = setTimeout(() => fetchCurrentSection(), 300)
  }

  // ============================================
  // Watchers
  // ============================================
  watch(timeInterval, () => {
    page.value = 1
    updateUrlState()
    debouncedFetch()
  })

  watch([sort, direction], () => {
    page.value = 1
    updateUrlState()
    debouncedFetch()
  })

  if (updateUrl) {
    watch(() => route.query, (newQuery) => {
      const newSort = newQuery.sort?.toString() || 'lastActive'
      const newDir = newQuery.dir?.toString() || 'desc'
      const newTime = newQuery.time?.toString() || '43200'
      if (sort.value !== newSort) sort.value = newSort
      if (direction.value !== newDir) direction.value = newDir
      if (timeInterval.value !== newTime) timeInterval.value = newTime
    }, { deep: true })
  }

  // ============================================
  // Lifecycle - Setup lazy loading & scroll
  // ============================================
  let scrollHandler = null
  let resizeHandler = null
  let statsObserver = null

  function setupLazyLoading() {
    if (!import.meta.client) return

    // Lazy load SidebarStats
    if (statsContainer.value) {
      statsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !showStats.value) {
              showStats.value = true
              statsObserver?.disconnect()
            }
          })
        },
        { rootMargin: '100px', threshold: 0.01 }
      )
      statsObserver.observe(statsContainer.value)
    }
  }

  function setupScrollHandling() {
    if (!import.meta.client) return

    const returningToList = localStorage.getItem('returningToList')
    if (returningToList === 'true') {
      localStorage.removeItem('returningToList')
      const savedScrollY = localStorage.getItem('listScrollPosition')
      if (savedScrollY) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScrollY), behavior: 'auto' })
        }, 200)
      }
    }

    scrollHandler = () => {
      clearTimeout(window.scrollTimeout)
      window.scrollTimeout = setTimeout(() => {
        localStorage.setItem('listScrollPosition', window.scrollY.toString())
      }, 100)
    }

    resizeHandler = () => checkMobile()

    window.addEventListener('scroll', scrollHandler)
    window.addEventListener('resize', resizeHandler)
  }

  function cleanup() {
    if (!import.meta.client) return
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
    if (statsObserver) statsObserver.disconnect()
  }

  // ============================================
  // Initialize on mount (call from page's onMounted)
  // ============================================
  async function initOnMount(hasSSRData = false) {
    await nextTick()

    if (!hasSSRData) {
      await fetchCurrentSection()
    }

    userPreferencesStore.fetchPreferences()
    fetchPopularTags()
    checkMobile()
    setupLazyLoading()
    setupScrollHandling()
  }

  // Auto-cleanup on unmount
  onUnmounted(cleanup)

  return {
    // State
    sort,
    direction,
    page,
    loading,
    loadMoreLoading,
    timeInterval,
    isMobile,
    popularTags,
    currentSection,
    showStats,
    statsContainer,

    // Computed
    layout,
    posts,
    meta,
    hasMorePosts,

    // Functions
    checkMobile,
    fetchCurrentSection,
    handleFilterChanged,
    handleClearFilters,
    loadMorePosts,
    initOnMount,
  }
}
