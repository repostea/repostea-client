import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'
import { useAuthStore } from './auth'
import { useUserPreferencesStore } from './userPreferences'

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [],
    pendingPosts: [],
    mySubsPosts: [],
    currentPost: null,
    meta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 25,
      // Cursor-based pagination fields
      hasMore: false,
      nextCursor: null,
      prevCursor: null,
    },
    pendingMeta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 25,
      hasMore: false,
      nextCursor: null,
      prevCursor: null,
    },
    mySubsMeta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 25,
      hasMore: false,
      nextCursor: null,
      prevCursor: null,
    },
    loading: false,
    error: null,
    sort: 'created_at',
    direction: 'desc',
    currentSection: 'frontpage',
    // Simple cache for API responses (5 minute TTL)
    cache: new Map(),
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  }),

  actions: {
    async fetchPosts(
      page = 1,
      sort = this.sort,
      direction = this.direction,
      interval = 43200,
      perPage = 25,
      contentType = null,
      languages = null
    ) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()

        const params = {
          page,
          sort_by: sort,
          sort_dir: direction,
          time_interval: interval,
          per_page: perPage,
        }

        if (contentType) {
          params.content_type = contentType
        }

        if (languages && languages.length > 0) {
          params.languages = languages.join(',')
        }

        const response = await $api.posts.getPosts(params)
        this.posts = response.data.data.map((post) => this._transformPostData(post))

        this.meta = {
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
          perPage: response.data.meta.per_page,
        }

        this.sort = sort
        this.direction = direction

        return this.posts
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading posts'
        console.error('Error fetching posts:', error)

        this.posts = []
        this.meta = {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 25,
        }

        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchFrontpage(
      _page = 1,
      sort = this.sort,
      direction = this.direction,
      interval = 43200,
      perPage = 25,
      contentType = null,
      languages = null
    ) {
      this.loading = true
      this.error = null
      this.currentSection = 'frontpage'

      try {
        const { $api } = useNuxtApp()

        // Get selected languages from user preferences store if not provided
        if (!languages) {
          const userPrefsStore = useUserPreferencesStore()
          const savedLanguages = userPrefsStore.selectedLanguages
          if (savedLanguages && savedLanguages.length > 0) {
            languages = savedLanguages
          }
        }

        const params = {
          pagination: 'cursor', // Use cursor-based pagination
          sort_by: sort,
          sort_dir: direction,
          time_interval: interval,
          per_page: perPage,
        }

        // Add content_type to params if provided
        if (contentType) {
          params.content_type = contentType
        }

        // Add languages to params if provided
        if (languages && languages.length > 0) {
          params.languages = languages.join(',')
        }


        const response = await $api.posts.getFrontpage(params)
        this.posts = response.data.data.map((post) => this._transformPostData(post))

        // Handle cursor-based pagination meta
        const meta = response.data.meta
        this.meta = {
          currentPage: meta.current_page || 1,
          lastPage: meta.last_page || 1,
          total: meta.total_posts || meta.post_count || 0,
          perPage: meta.per_page,
          hasMore: meta.has_more ?? (meta.current_page < meta.last_page),
          nextCursor: meta.next_cursor || null,
          prevCursor: meta.prev_cursor || null,
        }

        this.sort = sort
        this.direction = direction

        return this.posts
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading frontpage'
        console.error('Error fetching frontpage:', error)

        this.posts = []
        this.meta = {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 25,
        }

        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPending(
      page = 1,
      sort = this.sort,
      direction = this.direction,
      interval = 43200,
      perPage = 25,
      contentType = null,
      languages = null
    ) {
      this.loading = true
      this.error = null
      this.currentSection = 'pending'

      try {
        const { $api } = useNuxtApp()

        // Get selected languages from user preferences store if not provided
        if (!languages) {
          const userPrefsStore = useUserPreferencesStore()
          const savedLanguages = userPrefsStore.selectedLanguages
          if (savedLanguages && savedLanguages.length > 0) {
            languages = savedLanguages
          }
        }

        const params = {
          page,
          sort_by: sort,
          sort_dir: direction,
          time_interval: interval,
          per_page: perPage,
        }

        // Add content_type to params if provided
        if (contentType) {
          params.content_type = contentType
        }

        // Add languages to params if provided
        if (languages && languages.length > 0) {
          params.languages = languages.join(',')
        }

        const response = await $api.posts.getPending(params)
        this.pendingPosts = response.data.data.map((post) => this._transformPostData(post))
        this.posts = this.pendingPosts

        this.pendingMeta = {
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
          perPage: response.data.meta.per_page,
        }
        this.meta = this.pendingMeta

        this.sort = sort
        this.direction = direction

        return this.pendingPosts
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading pending posts'
        console.error('Error fetching pending posts:', error)

        this.pendingPosts = []
        this.posts = []
        this.pendingMeta = {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 25,
        }
        this.meta = this.pendingMeta

        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMySubs(
      page = 1,
      sort = this.sort,
      direction = this.direction,
      interval = 43200,
      perPage = 25,
      contentType = null,
      languages = null
    ) {
      this.loading = true
      this.error = null
      this.currentSection = 'my_subs'

      try {
        const { $api } = useNuxtApp()
        const authStore = useAuthStore()

        // Require authentication
        if (!authStore.isAuthenticated) {
          throw new Error('Authentication required to view My Subs')
        }

        // Get selected languages from user preferences store if not provided
        if (!languages) {
          const userPrefsStore = useUserPreferencesStore()
          const savedLanguages = userPrefsStore.selectedLanguages
          if (savedLanguages && savedLanguages.length > 0) {
            languages = savedLanguages
          }
        }

        const params = {
          page,
          sort_by: sort,
          sort_dir: direction,
          time_interval: interval,
          per_page: perPage,
          source: 'my-subs', // Filter to show only posts from subscribed subs
        }

        if (contentType) {
          params.content_type = contentType
        }

        if (languages && languages.length > 0) {
          params.languages = languages.join(',')
        }

        const response = await $api.posts.getFrontpage(params)
        this.mySubsPosts = response.data.data.map((post) => this._transformPostData(post))
        this.posts = this.mySubsPosts

        this.mySubsMeta = {
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
          perPage: response.data.meta.per_page,
        }
        this.meta = this.mySubsMeta

        this.sort = sort
        this.direction = direction

        return this.mySubsPosts
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading My Subs posts'
        console.error('Error fetching My Subs posts:', error)

        this.mySubsPosts = []
        this.posts = []
        this.mySubsMeta = {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 25,
        }
        this.meta = this.mySubsMeta

        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPostsByContentType(
      contentType,
      page = 1,
      sort = this.sort,
      direction = this.direction,
      interval = 43200,
      perPage = 25,
      languages = null
    ) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()

        // Get selected languages from user preferences store if not provided
        if (!languages) {
          const userPrefsStore = useUserPreferencesStore()
          const savedLanguages = userPrefsStore.selectedLanguages
          if (savedLanguages && savedLanguages.length > 0) {
            languages = savedLanguages
          }
        }

        const params = {
          page,
          sort_by: sort,
          sort_dir: direction,
          time_interval: interval,
          per_page: perPage,
        }

        // Add languages to params if provided
        if (languages && languages.length > 0) {
          params.languages = languages.join(',')
        }

        const response = await $api.posts.getContentByType(contentType, params)
        this.posts = response.data.data.map((post) => this._transformPostData(post))

        this.meta = {
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
          perPage: response.data.meta.per_page,
        }

        this.sort = sort
        this.direction = direction

        return this.posts
      } catch (error) {
        this.error = error.response?.data?.message || `Error loading posts of type ${contentType}`
        console.error(`Error fetching ${contentType} posts:`, error)

        this.posts = []
        this.meta = {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 25,
        }

        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchVideoFeed(
      page = 1,
      sort = this.sort,
      direction = this.direction,
      perPage = 25,
      languages = null
    ) {
      return this.fetchPostsByContentType('video', page, sort, direction, 43200, perPage, languages)
    },

    async fetchAudioFeed(
      page = 1,
      sort = this.sort,
      direction = this.direction,
      perPage = 25,
      languages = null
    ) {
      return this.fetchPostsByContentType('audio', page, sort, direction, 43200, perPage, languages)
    },

    // Load more methods for infinite scroll
    async loadMoreFrontpage(
      page,
      sort = this.sort,
      direction = this.direction,
      interval = 43200,
      perPage = 25,
      contentType = null,
      languages = null
    ) {
      // Don't load more if no cursor available
      if (!this.meta.nextCursor) {
        return []
      }

      try {
        const { $api } = useNuxtApp()

        // Get selected languages from user preferences store if not provided
        if (!languages) {
          const userPrefsStore = useUserPreferencesStore()
          const savedLanguages = userPrefsStore.selectedLanguages
          if (savedLanguages && savedLanguages.length > 0) {
            languages = savedLanguages
          }
        }

        const params = {
          pagination: 'cursor',
          cursor: this.meta.nextCursor,
          sort_by: sort,
          sort_dir: direction,
          time_interval: interval,
          per_page: perPage,
        }

        // Add content_type to params if provided
        if (contentType) {
          params.content_type = contentType
        }

        // Add languages to params if provided
        if (languages && languages.length > 0) {
          params.languages = languages.join(',')
        }

        const response = await $api.posts.getFrontpage(params)
        const newPosts = response.data.data.map((post) => this._transformPostData(post))

        // Append new posts to existing posts
        this.posts = [...this.posts, ...newPosts]

        // Handle cursor-based pagination meta
        const meta = response.data.meta
        this.meta = {
          currentPage: meta.current_page || this.meta.currentPage + 1,
          lastPage: meta.last_page || 1,
          total: meta.total_posts || meta.post_count || 0,
          perPage: meta.per_page,
          hasMore: meta.has_more ?? false,
          nextCursor: meta.next_cursor || null,
          prevCursor: meta.prev_cursor || null,
        }

        this.sort = sort
        this.direction = direction

        return newPosts
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading more posts'
        console.error('Error loading more frontpage posts:', error)
        throw error
      }
    },

    async loadMorePending(
      page,
      sort = this.sort,
      direction = this.direction,
      interval = 43200,
      perPage = 25,
      contentType = null,
      languages = null
    ) {
      try {
        const { $api } = useNuxtApp()

        // Get selected languages from user preferences store if not provided
        if (!languages) {
          const userPrefsStore = useUserPreferencesStore()
          const savedLanguages = userPrefsStore.selectedLanguages
          if (savedLanguages && savedLanguages.length > 0) {
            languages = savedLanguages
          }
        }

        const params = {
          page,
          sort_by: sort,
          sort_dir: direction,
          time_interval: interval,
          per_page: perPage,
        }

        // Add content_type to params if provided
        if (contentType) {
          params.content_type = contentType
        }

        // Add languages to params if provided
        if (languages && languages.length > 0) {
          params.languages = languages.join(',')
        }

        const response = await $api.posts.getPending(params)
        const newPosts = response.data.data.map((post) => this._transformPostData(post))

        // Append new posts to existing pending posts
        this.pendingPosts = [...this.pendingPosts, ...newPosts]
        this.posts = this.pendingPosts

        this.pendingMeta = {
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
          perPage: response.data.meta.per_page,
        }
        this.meta = this.pendingMeta

        this.sort = sort
        this.direction = direction

        return newPosts
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading more pending posts'
        console.error('Error loading more pending posts:', error)
        throw error
      }
    },

    async loadMoreMySubs(
      page,
      sort = this.sort,
      direction = this.direction,
      interval = 43200,
      perPage = 25,
      contentType = null,
      languages = null
    ) {
      try {
        const { $api } = useNuxtApp()
        const authStore = useAuthStore()

        // Require authentication
        if (!authStore.isAuthenticated) {
          throw new Error('Authentication required to view My Subs')
        }

        // Get selected languages from user preferences store if not provided
        if (!languages) {
          const userPrefsStore = useUserPreferencesStore()
          const savedLanguages = userPrefsStore.selectedLanguages
          if (savedLanguages && savedLanguages.length > 0) {
            languages = savedLanguages
          }
        }

        const params = {
          page,
          sort_by: sort,
          sort_dir: direction,
          time_interval: interval,
          per_page: perPage,
          source: 'my-subs',
        }

        // Add content_type to params if provided
        if (contentType) {
          params.content_type = contentType
        }

        if (languages && languages.length > 0) {
          params.languages = languages.join(',')
        }

        const response = await $api.posts.getFrontpage(params)
        const newPosts = response.data.data.map((post) => this._transformPostData(post))

        // Append new posts to existing mySubsPosts
        this.mySubsPosts = [...this.mySubsPosts, ...newPosts]
        this.posts = this.mySubsPosts

        // Update meta
        this.mySubsMeta = {
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
          perPage: response.data.meta.per_page,
        }
        this.meta = this.mySubsMeta

        this.sort = sort
        this.direction = direction

        return newPosts
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading more My Subs posts'
        console.error('Error loading more My Subs posts:', error)
        throw error
      }
    },

    // Cache helper methods
    _getCacheKey(params) {
      return JSON.stringify(params)
    },

    _setCache(key, data) {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      })
    },

    _getCache(key) {
      const cached = this.cache.get(key)
      if (!cached) return null

      if (Date.now() - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(key)
        return null
      }

      return cached.data
    },

    _clearCache() {
      this.cache.clear()
    },

    _transformPostData(post) {
      const transformedPost = {
        id: post.id,
        entryId: post.id,
        title: post.title,
        slug: post.slug,
        uuid: post.uuid,
        body: post.content,
        content: post.content,
        url: post.url,
        votes: post.vote_count || 0,
        uv: post.vote_count > 0 ? post.vote_count : 0,
        dv: post.vote_count < 0 ? Math.abs(post.vote_count) : 0,
        userVote: post.user_vote,
        user: post.user,
        user_id: post.user_id || post.user?.id,
        created_at: post.created_at,
        published_at: post.published_at,
        frontpage_at: post.frontpage_at,
        numComments: post.comment_count || 0,
        is_visited: post.is_visited || false,
        new_comments_count: post.new_comments_count || 0,
        last_visited_at: post.last_visited_at || null,
        thumbnail_url: post.thumbnail_url,
        source: post.source,
        language_code: post.language_code,
        tags: post.tags || [],
        source_name: post.source_name,
        source_url: post.source_url,
        is_external_import: !!post.is_external_import,
        permalink: post.permalink || (post.uuid ? `/p/${post.uuid}` : null),
        content_type: post.content_type || 'link',
        media_provider: post.media_provider || '',
        media_metadata: post.media_metadata || null,
        is_media: post.is_media || false,
        formatted_media_provider: post.formatted_media_provider || post.media_provider || '',
        views: post.views || 0,
        total_views: post.total_views || 0,
        impressions: post.impressions || 0,
        is_anonymous: !!post.is_anonymous,
        is_nsfw: !!post.is_nsfw,
        author_name: post.author_name,
        reports_count: post.reports_count || 0,
        reports: post.reports || [],
        relationships_count: post.relationships_count || 0,
        recommended_seals_count: post.recommended_seals_count || 0,
        advise_against_seals_count: post.advise_against_seals_count || 0,
        status: post.status || 'published',
        sub: post.sub || null,
        can_edit: post.can_edit || false,
        // Federation stats
        federation: post.federation || null,
      }

      return transformedPost
    },

    async _fetchPostByIdentifier(apiMethod, identifier) {
      this.loading = true
      this.error = null

      try {
        // apiMethod is a function that makes an API call, passed by the caller
        const response = await apiMethod(identifier)
        const post = response.data.data
        this.currentPost = this._transformPostData(post)

        return this.currentPost
      } catch (error) {
        console.error('POST ERROR:', error.message || error)

        this.error = error.response?.data?.message || 'Error loading post'
        console.error(`Error fetching post:`, error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPost(id) {
      const { $api } = useNuxtApp()
      return this._fetchPostByIdentifier($api.posts.getPost, id)
    },

    async fetchPostBySlug(slug) {
      const { $api } = useNuxtApp()
      return this._fetchPostByIdentifier($api.posts.getPostBySlug, slug)
    },

    async fetchPostByUuid(uuid) {
      const { $api } = useNuxtApp()
      return this._fetchPostByIdentifier($api.posts.getPostByUuid, uuid)
    },

    async validateMediaUrl(url) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.media.validateMediaUrl(url)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error validating media URL'
        console.error('Error validating media URL:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async getMediaInfo(url) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.media.getMediaInfo(url)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error getting media info'
        console.error('Error getting media info:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createPost(postData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const isImport = !!postData.external_source
        const tagIds =
          postData.tags && postData.tags.length > 0
            ? postData.tags.map((tag) => (typeof tag === 'object' ? tag.id : tag))
            : []

        const data = {
          title: postData.title,
          content: postData.content || postData.description,
          url: postData.url,
          is_original: postData.isOriginal || postData.is_original || false,
          thumbnail_url: postData.image || postData.thumbnail_url,
          content_type: postData.content_type || 'link',
          media_provider: postData.media_provider || '',
          tag_ids: tagIds,
          is_anonymous: postData.is_anonymous || false,
          is_nsfw: postData.is_nsfw || false,
          language_code: postData.language_code,
          poll_options: postData.poll_options,
          expires_at: postData.expires_at,
          allow_multiple_options: postData.allow_multiple_options,
          sub_id: postData.sub_id || null,
          status: postData.status || 'published',
        }

        if (isImport) {
          data.source = postData.source || ''
          data.source_name = postData.source_name || ''
          data.source_url = postData.source_url || postData.url
          data.external_source = postData.external_source
        }

        const response = await $api.posts[isImport ? 'importPost' : 'createPost'](data)
        const newPost = this._transformPostData(response.data.data)

        if (this.posts.length) {
          this.posts = [newPost, ...this.posts]
          this.meta.total++
        }

        return newPost
      } catch (error) {
        this.error = error.response?.data?.message || 'Error creating post'
        console.error('Error creating post:', error)
        console.error('Request payload:', postData)
        console.error('Server response:', error.response?.data)
        throw error
      } finally {
        this.loading = false
      }
    },

    async votePost(id, value) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const fingerprint = await this.generateFingerprint()

        const response = await $api.posts.votePost(id, value, fingerprint)

        const updatePostInList = (list) => {
          const index = list.findIndex((post) => post.id === id || post.entryId === id)
          if (index !== -1) {
            list[index].votes = response.data.votes
            list[index].userVote = response.data.user_vote
          }
        }

        updatePostInList(this.posts)
        updatePostInList(this.pendingPosts)

        if (this.currentPost && (this.currentPost.id === id || this.currentPost.entryId === id)) {
          this.currentPost.votes = response.data.votes
          this.currentPost.userVote = response.data.user_vote
        }

        // If post just reached frontpage, invalidate cache and refetch lists
        if (response.data.frontpage_reached) {
          this._clearCache()
          // Refetch both lists to show post in frontpage and remove from pending
          await Promise.all([
            this.fetchFrontpage(),
            this.fetchPending()
          ])
        }

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error voting'
        console.error('Error voting post:', error)
        throw error
      }
    },

    async generateFingerprint() {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillStyle = '#f60'
        ctx.fillRect(125, 1, 62, 20)
        ctx.fillStyle = '#069'
        ctx.fillText('Browser fingerprint', 2, 15)
        const canvasData = canvas.toDataURL()

        return btoa(
          JSON.stringify({
            canvas: canvasData.slice(-50),
            screen: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
          })
        )
      } catch {
        // If canvas fingerprinting fails, fall back to a simpler fingerprint
        return btoa(navigator.userAgent + window.screen.width + window.screen.height)
      }
    },

    async importPost(postData) {
      if (!postData.external_source) {
        postData.external_source = postData.source_name || postData.source
      }

      return this.createPost(postData)
    },

    async unvotePost(id) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const fingerprint = await this.generateFingerprint()
        await $api.posts.unvotePost(id, fingerprint)

        const updatePostInList = (list) => {
          const index = list.findIndex((post) => post.id === id || post.entryId === id)
          if (index !== -1) {
            if (list[index].userVote > 0) {
              list[index].votes -= 1
              list[index].uv -= 1
            } else if (list[index].userVote < 0) {
              list[index].votes += 1
              list[index].dv -= 1
            }
            list[index].userVote = null
          }
        }

        updatePostInList(this.posts)
        updatePostInList(this.pendingPosts)

        if (this.currentPost && (this.currentPost.id === id || this.currentPost.entryId === id)) {
          if (this.currentPost.userVote > 0) {
            this.currentPost.votes -= 1
            this.currentPost.uv -= 1
          } else if (this.currentPost.userVote < 0) {
            this.currentPost.votes += 1
            this.currentPost.dv -= 1
          }
          this.currentPost.userVote = null
        }

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error removing vote'
        console.error('Error unvoting post:', error)
        throw error
      }
    },

    // Clear posts array (useful when changing sections)
    clearPosts() {
      this.posts = []
      this.mySubsPosts = []
      this.pendingPosts = []
    },

    // Update post stats from realtime broadcast (votes, comments, views)
    updatePostStats(postId, stats) {
      const updateInArray = (posts) => {
        const index = posts.findIndex((p) => p.id === postId)
        if (index !== -1) {
          const post = posts[index]
          if (stats.votes !== undefined) post.votes = stats.votes
          if (stats.comments_count !== undefined) post.numComments = stats.comments_count
          if (stats.views !== undefined) post.views = stats.views
          if (stats.total_views !== undefined) post.total_views = stats.total_views
        }
      }

      // Update in all post arrays
      updateInArray(this.posts)
      updateInArray(this.pendingPosts)
      updateInArray(this.mySubsPosts)

      // Update current post if it matches
      if (this.currentPost && this.currentPost.id === postId) {
        if (stats.votes !== undefined) this.currentPost.votes = stats.votes
        if (stats.comments_count !== undefined) this.currentPost.numComments = stats.comments_count
        if (stats.views !== undefined) this.currentPost.views = stats.views
        if (stats.total_views !== undefined) this.currentPost.total_views = stats.total_views
      }
    },

  },
})
