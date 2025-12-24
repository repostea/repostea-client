<template>
  <div>
    <ResponsiveNavigation
      v-model:section="currentSection"
      v-model:sort="sort"
      v-model:direction="direction"
      v-model:time-interval="timeInterval"
      :current-section="currentSection"
      :sort="sort"
      :direction="direction"
      :time-interval="timeInterval"
      :is-mobile="isMobile"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="controls-container mb-4">
          <div class="controls-wrapper">
            <div class="left-controls">
              <FilterControls @filter-changed="handleFilterChanged" />
              <ContentLanguageSelector />
            </div>
            <LayoutSelector />
          </div>
        </div>
        <PostList
          :posts="posts"
          :meta="meta"
          :loading="loading"
          :layout="layout"
          :has-more="hasMorePosts"
          :load-more-loading="loadMoreLoading"
          @load-more="loadMorePosts"
          @clear-filters="handleClearFilters"
        >
          <template #after-third-post>
            <RecentComments />
          </template>
          <template #after-sixth-post>
            <TopComments />
          </template>
        </PostList>
      </div>
      <div class="hidden lg:block lg:col-span-1 space-y-6">
        <RecentComments />
        <TopComments />
        <ClientOnly>
          <template #fallback>
            <!-- Skeleton loader para reservar espacio y evitar CLS -->
            <div class="space-y-4">
              <div class="skeleton-loader rounded-lg h-48 animate-pulse"/>
              <div class="skeleton-loader rounded-lg h-32 animate-pulse"/>
            </div>
          </template>
          <div ref="statsContainer">
            <LazySidebarStats v-if="showStats" :tags="popularTags" />
          </div>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

definePageMeta({})

<script setup>
  import { ref, computed, onMounted, onUnmounted, watch, nextTick, onErrorCaptured } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { usePostsStore } from '~/stores/posts'
  import { useUserPreferencesStore } from '~/stores/userPreferences'
  import { useI18n } from '#i18n'
  import { useNuxtApp, useCookie, useRequestHeaders } from '#app'
  import { useSeoMeta } from '#imports'
  import ResponsiveNavigation from '~/components/posts/ResponsiveNavigation.vue'
  import PostList from '~/components/posts/PostList.vue'
  import LayoutSelector from '~/components/posts/LayoutSelector.vue'
  import FilterControls from '~/components/posts/FilterControls.vue'
  import ContentLanguageSelector from '~/components/common/ContentLanguageSelector.vue'
  import RecentComments from '~/components/posts/RecentComments.vue'
  import TopComments from '~/components/posts/TopComments.vue'

  // We need useI18n for the $t in the template
  const { t } = useI18n()
  const postsStore = usePostsStore()
  const userPreferencesStore = useUserPreferencesStore()
  const { $api } = useNuxtApp()
  const runtimeConfig = useRuntimeConfig()

  // SEO Meta Tags for homepage
  const siteUrl = runtimeConfig.public.siteUrl
  const ogImageUrl = `${siteUrl}/logo-wolf.png`

  // Use translated SEO metadata
  const appName = runtimeConfig.public.appName
  const pageTitle = `${appName} - ${t('site.tagline')}`
  const pageDescription = t('site.description')
  // Prepend app name to keywords from translations
  const pageKeywords = `${appName.toLowerCase()}, ${t('site.keywords')}`
  const twitterHandle = runtimeConfig.public.twitterHandle

  useSeoMeta({
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    ogTitle: pageTitle,
    ogDescription: pageDescription,
    ogImage: ogImageUrl,
    ogUrl: siteUrl,
    ogType: 'website',
    ogSiteName: appName,
    ogImageWidth: '512',
    ogImageHeight: '512',
    twitterCard: 'summary_large_image',
    twitterTitle: pageTitle,
    twitterDescription: pageDescription,
    twitterImage: ogImageUrl,
    twitterSite: twitterHandle || undefined,
  })

  // Set canonical URL
  useCanonical()

  // Get route and router (needed for SSR and URL state)
  const route = useRoute()
  const router = useRouter()

  // SSR: Fetch initial posts on server side
  const { data: initialPostsData } = await useAsyncData('frontpage-posts', async () => {
    // Determine section from route
    const isPendingSection = route.path.endsWith('/pending')

    // Read preferences from cookie (available on server)
    const contentTypeFilterCookie = useCookie('content_type_filter')
    const selectedLanguagesCookie = useCookie('selected_languages')
    const layoutCookie = useCookie('layout')

    // Detect mobile via User-Agent in SSR for aggressive optimization
    const headers = useRequestHeaders(['user-agent'])
    const userAgent = headers['user-agent'] || ''
    const isMobileSSR = /android|iphone|ipad|ipod|mobile|tablet/i.test(userAgent)

    // Determine initial posts count based on layout AND device
    // Mobile: much fewer posts for faster initial load (scroll infinite loads more)
    const layoutPerPage = isMobileSSR
      ? { compact: 4, list: 3, card: 3 }  // Mobile: minimal initial load
      : { compact: 8, list: 6, card: 5 }  // Desktop: normal load
    const perPage = layoutPerPage[layoutCookie.value] || (isMobileSSR ? 3 : 6)

    // Parse languages from cookie
    let languages = null
    if (selectedLanguagesCookie.value) {
      try {
        languages = typeof selectedLanguagesCookie.value === 'string'
          ? JSON.parse(selectedLanguagesCookie.value)
          : selectedLanguagesCookie.value
      } catch (e) {
        console.error('Error parsing languages cookie:', e)
      }
    }

    // Read filters from URL query params (with defaults)
    const sortBy = route.query.sort?.toString() || 'lastActive'
    const sortDir = route.query.dir?.toString() || 'desc'
    const timeInt = parseInt(route.query.time?.toString() || '43200')

    const params = {
      pagination: 'cursor',
      sort_by: sortBy,
      sort_dir: sortDir,
      time_interval: timeInt,
      per_page: perPage, // Adjusted based on layout (compact: 15, list: 12, card: 10)
    }

    // Add content type filter if present
    if (contentTypeFilterCookie.value) {
      params.content_type = contentTypeFilterCookie.value
    }

    // Add languages filter if present
    if (languages && languages.length > 0) {
      params.languages = Array.isArray(languages) ? languages.join(',') : languages
    }

    try {
      // Use the correct method names from the API wrapper
      const response = isPendingSection
        ? await $api.posts.getPending(params)
        : await $api.posts.getFrontpage(params)

      return {
        posts: response.data.data || [],
        meta: response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: 15, has_more: false, next_cursor: null, prev_cursor: null }
      }
    } catch (error) {
      console.error('SSR: Error fetching posts:', error)
      return {
        posts: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 15, has_more: false, next_cursor: null, prev_cursor: null }
      }
    }
  })

  // Add JSON-LD structured data for Organization and WebSite
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${siteUrl}/#organization`,
              name: appName,
              url: siteUrl,
              logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logo-wolf.png`,
              },
              description: pageDescription,
            },
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              url: siteUrl,
              name: appName,
              description: pageDescription,
              publisher: {
                '@id': `${siteUrl}/#organization`
              },
              inLanguage: 'es-ES'
            }
          ]
        }),
        tagPosition: 'bodyClose'
      }
    ]
  })

  // Read user preferences from cookie (available on both server and client)
  const userPrefsCookie = useCookie('user_prefs', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  // Initialize user preferences from cookie BEFORE rendering
  if (userPrefsCookie.value) {
    try {
      const cookiePrefs = typeof userPrefsCookie.value === 'string'
        ? JSON.parse(userPrefsCookie.value)
        : userPrefsCookie.value

      // Apply layout preference from cookie
      if (cookiePrefs.layout) {
        userPreferencesStore.layout = cookiePrefs.layout
      }
    } catch (e) {
      console.error('Error parsing user_prefs cookie:', e)
    }
  }

  // Initialize store with SSR data
  if (initialPostsData.value?.posts && initialPostsData.value.posts.length > 0) {
    try {
      // Transform and set posts in store
      postsStore.posts = initialPostsData.value.posts.map(post => {
        try {
          return postsStore._transformPostData(post)
        } catch (transformError) {
          console.error('⚠️ [SSR] Error transforming post:', {
            postId: post.id,
            postSlug: post.slug,
            postTitle: post.title,
            error: transformError.message
          })
          // Return the post as-is if transformation fails
          return post
        }
      })
      const ssrMeta = initialPostsData.value.meta
      postsStore.meta = {
        currentPage: ssrMeta.current_page || 1,
        lastPage: ssrMeta.last_page || 1,
        total: ssrMeta.total_posts || ssrMeta.total || ssrMeta.post_count || 0,
        perPage: ssrMeta.per_page,
        hasMore: ssrMeta.has_more ?? (ssrMeta.current_page < ssrMeta.last_page),
        nextCursor: ssrMeta.next_cursor || null,
        prevCursor: ssrMeta.prev_cursor || null,
      }
    } catch (e) {
      console.error('🚨 [SSR] Critical error initializing posts:', e)
      // Fallback to empty state
      postsStore.posts = []
      postsStore.meta = { currentPage: 1, lastPage: 1, total: 0, perPage: 15, hasMore: false, nextCursor: null, prevCursor: null }
    }
  }

  // Error handling for SSR rendering errors
  onErrorCaptured((err, instance, info) => {
    console.error('🚨 [SSR Error Caught]:', {
      error: err,
      message: err.message,
      stack: err.stack,
      component: instance?.$options?.name || instance?.$options?.__name || 'unknown',
      info,
      // Log post data if error is in PostCard or child
      context: instance?.$props?.post ? {
        postId: instance.$props.post.id,
        postSlug: instance.$props.post.slug,
        postTitle: instance.$props.post.title,
        postType: instance.$props.post.content_type
      } : null
    })

    // Prevent error from propagating and crashing SSR
    // Return false to suppress the error
    return false
  })

  // Initialize filters from URL query params (with defaults)
  const sort = ref(route.query.sort?.toString() || 'lastActive')
  const direction = ref(route.query.dir?.toString() || 'desc')
  const page = ref(1)
  const loading = ref(false) // Start as false if we have SSR data
  const loadMoreLoading = ref(false)
  const timeInterval = ref(route.query.time?.toString() || '43200')
  const isMobile = ref(false)

  // Update URL with current filter state (without adding to history)
  function updateUrlState() {
    if (!import.meta.client) return

    const query = {}

    // Only add non-default values to URL
    if (sort.value !== 'lastActive') query.sort = sort.value
    if (direction.value !== 'desc') query.dir = direction.value
    if (timeInterval.value !== '43200') query.time = timeInterval.value

    // Use replace to avoid polluting browser history
    router.replace({ query })
  }
  const showStats = ref(false)
  const statsContainer = ref(null)


  // Track current section (not just from URL, also from navigation)
  const currentSectionValue = ref('frontpage')
  const currentSection = computed({
    get: () => {
      // Check if current route path ends with /pending or /my-subs
      const path = route.path
      if (path.endsWith('/pending')) {
        return 'pending'
      }
      if (path.endsWith('/my-subs')) {
        return 'my_subs'
      }
      // Return the tracked value (allows my_subs to work when not using URL routing)
      return currentSectionValue.value
    },
    set: (value) => {
      // Update the tracked value when ResponsiveNavigation emits
      currentSectionValue.value = value
      // Reset to page 1 when changing section
      page.value = 1
      postsStore.clearPosts()
      // Fetch the new section
      nextTick(() => {
        fetchCurrentSection()
      })
    }
  })

  // Get the user's layout preference
  const layout = computed(() => userPreferencesStore.getLayout)
  const popularTags = ref([])

  const posts = computed(() => postsStore.posts)
  const meta = computed(() => postsStore.meta)
  const hasMorePosts = computed(() => {
    // Use cursor-based pagination check first, fallback to page-based
    if (meta.value.hasMore !== undefined) {
      return meta.value.hasMore
    }
    if (meta.value.nextCursor) {
      return true
    }
    return meta.value.currentPage < meta.value.lastPage
  })

  function checkMobile() {
    if (import.meta.client) {
      isMobile.value = window.innerWidth < 768
    }
  }

  async function fetchCurrentSection() {
    if (currentSection.value === 'frontpage') {
      await fetchFrontpage()
    } else if (currentSection.value === 'pending') {
      await fetchPending()
    } else if (currentSection.value === 'my_subs') {
      await fetchMySubs()
    } else {
      // Default fallback for any section
      await fetchFrontpage()
    }
  }

  async function fetchFrontpage() {
    loading.value = true

    try {
      const contentType = userPreferencesStore.getContentTypeFilter || null

      await postsStore.fetchFrontpage(
        page.value,
        sort.value,
        direction.value,
        parseInt(timeInterval.value),
        25, // perPage
        contentType
      )
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

      await postsStore.fetchPending(
        page.value,
        sort.value,
        direction.value,
        parseInt(timeInterval.value),
        25, // perPage
        contentType
      )
    } catch (error) {
      console.error('Error fetching pending posts:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchMySubs() {
    loading.value = true

    try {
      const contentType = userPreferencesStore.getContentTypeFilter || null

      await postsStore.fetchMySubs(
        page.value,
        sort.value,
        direction.value,
        parseInt(timeInterval.value),
        25, // perPage
        contentType
      )
    } catch (error) {
      console.error('Error fetching My Subs posts:', error)
    } finally {
      loading.value = false
    }
  }

  // Handle content type filter changes
  function handleFilterChanged() {
    // Reset to page 1 when filter changes
    page.value = 1
    postsStore.clearPosts() // Clear posts immediately when changing filters
    fetchCurrentSection()
  }


  // Handle clear filters button click
  function handleClearFilters() {
    // Clear the content_type filter by setting filters to null
    userPreferencesStore.setContentTypeFilter(null)
    // Reset to page 1 and reload posts
    page.value = 1
    postsStore.clearPosts() // Clear posts immediately when clearing filters
    fetchCurrentSection()
  }

  // Load more posts for infinite scroll
  async function loadMorePosts() {
    if (loadMoreLoading.value || !hasMorePosts.value) return

    loadMoreLoading.value = true
    page.value += 1

    try {
      if (currentSection.value === 'frontpage') {
        await loadMoreFrontpage()
      } else if (currentSection.value === 'pending') {
        await loadMorePending()
      } else if (currentSection.value === 'my_subs') {
        await loadMoreMySubs()
      }
    } catch (error) {
      console.error('Error loading more posts:', error)
      // Revert page on error
      page.value -= 1
    } finally {
      loadMoreLoading.value = false
    }
  }

  async function loadMoreFrontpage() {
    const contentType = userPreferencesStore.getContentTypeFilter || null

    await postsStore.loadMoreFrontpage(
      page.value,
      sort.value,
      direction.value,
      parseInt(timeInterval.value),
      25,
      contentType
    )
  }

  async function loadMorePending() {
    const contentType = userPreferencesStore.getContentTypeFilter || null

    await postsStore.loadMorePending(
      page.value,
      sort.value,
      direction.value,
      parseInt(timeInterval.value),
      25,
      contentType
    )
  }

  async function loadMoreMySubs() {
    const contentType = userPreferencesStore.getContentTypeFilter || null

    await postsStore.loadMoreMySubs(
      page.value,
      sort.value,
      direction.value,
      parseInt(timeInterval.value),
      25,
      contentType
    )
  }

  async function fetchPopularTags() {
    try {
      popularTags.value = [
        { id: 1, name: 'tecnología', posts_count: 15 },
        { id: 2, name: 'ciencia', posts_count: 12 },
        { id: 3, name: 'política', posts_count: 10 },
        { id: 4, name: 'economía', posts_count: 8 },
        { id: 5, name: 'cultura', posts_count: 7 },
      ]
    } catch (error) {
      console.error('Error fetching popular tags:', error)
    }
  }

  // Debounced function to prevent excessive API calls
  let fetchTimeout = null
  const debouncedFetch = () => {
    if (fetchTimeout) clearTimeout(fetchTimeout)
    loading.value = true // Set loading immediately to avoid flash of "no content"
    postsStore.clearPosts() // Clear posts immediately when parameters change
    fetchTimeout = setTimeout(() => {
      fetchCurrentSection()
    }, 300)
  }

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

  // Watch for route changes (when navigating between / and /pending)
  watch(() => route.path, (newPath, oldPath) => {
    // Only react to actual path changes, not initial mount
    if (newPath === oldPath) return

    // Reset section value when URL changes
    if (route.path.endsWith('/pending')) {
      currentSectionValue.value = 'pending'
    } else if (route.path.endsWith('/my-subs')) {
      currentSectionValue.value = 'my_subs'
    } else {
      currentSectionValue.value = 'frontpage'
    }
    page.value = 1
    loading.value = true // Set loading immediately to avoid flash of "no content"
    postsStore.clearPosts() // Clear posts immediately when changing sections
    fetchCurrentSection()
  })

  // Watch for query changes (browser back/forward)
  watch(() => route.query, (newQuery) => {
    const newSort = newQuery.sort?.toString() || 'lastActive'
    const newDir = newQuery.dir?.toString() || 'desc'
    const newTime = newQuery.time?.toString() || '43200'

    // Only update if values actually changed (avoid loops)
    if (sort.value !== newSort) { sort.value = newSort }
    if (direction.value !== newDir) { direction.value = newDir }
    if (timeInterval.value !== newTime) { timeInterval.value = newTime }

    // The watchers on sort/direction/timeInterval will handle fetching
  }, { deep: true })

  watch(
    () => postsStore.currentSection,
    (_newSection) => {
      // Don't override - we control section via URL now
    }
  )

  let scrollHandler = null
  let resizeHandler = null
  let statsObserver = null

  onMounted(async () => {

    // Wait a tick to ensure user-preferences-init plugin has run
    await nextTick()

    // Only fetch posts if we don't have SSR data
    const hasSSRData = initialPostsData.value?.posts && initialPostsData.value.posts.length > 0
    if (!hasSSRData) {
      await fetchCurrentSection()
    } else {
    }

    // Fetch user preferences from API in background (for sync with database)
    userPreferencesStore.fetchPreferences()

    fetchPopularTags()
    checkMobile()


    // Lazy load SidebarStats only when visible (Intersection Observer)
    if (import.meta.client && statsContainer.value) {

      statsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !showStats.value) {
              showStats.value = true
              // Disconnect observer after loading once
              statsObserver?.disconnect()
            }
          })
        },
        {
          rootMargin: '100px', // Load 100px before it's visible
          threshold: 0.01
        }
      )

      statsObserver.observe(statsContainer.value)
    }

    if (import.meta.client) {
      const returningToList = localStorage.getItem('returningToList')
      if (returningToList === 'true') {
        localStorage.removeItem('returningToList')
        const savedScrollY = localStorage.getItem('listScrollPosition')
        if (savedScrollY) {
          setTimeout(() => {
            window.scrollTo({
              top: parseInt(savedScrollY),
              behavior: 'auto',
            })
          }, 200)
        }
      }

      scrollHandler = () => {
        clearTimeout(window.scrollTimeout)
        window.scrollTimeout = setTimeout(() => {
          localStorage.setItem('listScrollPosition', window.scrollY.toString())
        }, 100)
      }

      resizeHandler = () => {
        checkMobile()
      }

      window.addEventListener('scroll', scrollHandler)
      window.addEventListener('resize', resizeHandler)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
      if (resizeHandler) window.removeEventListener('resize', resizeHandler)
      if (statsObserver) statsObserver.disconnect()
    }
  })
</script>

<style scoped>
  /* Controls layout and styling */
  .controls-container {
    @apply rounded-md p-1;
    background-color: color-mix(in srgb, var(--color-bg-card) 70%, transparent);
    border: 1px solid var(--color-border-default);
    overflow: visible;
  }

  .skeleton-loader {
    background-color: var(--color-bg-hover);
  }

  .controls-wrapper {
    @apply flex flex-row flex-nowrap items-center justify-between gap-1;
  }

  .left-controls {
    @apply flex flex-nowrap items-center gap-1 flex-grow min-w-0;
    overflow: visible;
  }
</style>
