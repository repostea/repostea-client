import { defineStore } from 'pinia'

export const useSavedListsStore = defineStore('savedLists', {
  state: () => ({
    lists: [],
    currentList: null,
    currentListPosts: [],
    meta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 15,
    },
    loading: false,
    error: null,
    favoritePostsIds: new Set(),
    readLaterPostsIds: new Set(),
    isInitialized: false,
    lastFetch: null,
    fetchPromise: null,
  }),

  getters: {
    favoritesList: (state) => state.lists.find((list) => list.type === 'favorite'),
    readLaterList: (state) => state.lists.find((list) => list.type === 'read_later'),
    customLists: (state) => state.lists.filter((list) => list.type === 'custom'),

    isFavorite: (state) => (postId) => state.favoritePostsIds.has(postId),
    isReadLater: (state) => (postId) => state.readLaterPostsIds.has(postId),

    getListById: (state) => (listId) => state.lists.find((list) => list.id === listId),
    getListByIdentifier: (state) => (identifier) =>
      state.lists.find(
        (list) => list.id === identifier || list.uuid === identifier || list.slug === identifier
      ),
  },

  actions: {
    async initialize() {
      if (this.isInitialized || this.loading) return this.lists

      if (this.fetchPromise) return this.fetchPromise

      this.loading = true

      try {
        this.fetchPromise = this.fetchLists()
        await this.fetchPromise
        this.isInitialized = true
        return this.lists
      } catch (error) {
        console.error('Error al inicializar el store de listas guardadas:', error)
        throw error
      } finally {
        this.loading = false
        this.fetchPromise = null
      }
    },

    async fetchLists() {
      if (this.lists.length > 0) return this.lists

      this.loading = true
      this.error = null

      if (this.fetchPromise) return this.fetchPromise

      try {
        const { $api } = useNuxtApp()

        this.fetchPromise = $api.savedLists.getLists()
        const response = await this.fetchPromise

        this.lists = response.data.data
        this.lastFetch = Date.now()

        const favoritesList = this.lists.find((list) => list.type === 'favorite')
        const readLaterList = this.lists.find((list) => list.type === 'read_later')

        if (favoritesList && favoritesList.posts) {
          this.favoritePostsIds = new Set(favoritesList.posts.map((post) => post.id))
        }

        if (readLaterList && readLaterList.posts) {
          this.readLaterPostsIds = new Set(readLaterList.posts.map((post) => post.id))
        }

        return this.lists
      } catch (error) {
        this.error = error.response?.data?.message || 'Error cargando listas'
        console.error('Error fetching saved lists:', error)
        throw error
      } finally {
        this.loading = false
        this.fetchPromise = null
      }
    },

    async fetchList(identifier) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.savedLists.getList(identifier)

        this.currentList = response.data.data
        return this.currentList
      } catch (error) {
        this.error = error.response?.data?.message || 'Error cargando lista'
        console.error('Error fetching saved list:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchListPosts(identifier, page = 1, perPage = 15, sortOptions = {}) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const params = {
          page,
          per_page: perPage,
          ...sortOptions,
        }

        const response = await $api.savedLists.getListPosts(identifier, params)

        this.currentListPosts = response.data.data.map((post) => ({
          ...post,
          votes: post.vote_count || post.votes || 0,
          userVote: post.user_vote || post.userVote || null,
          numComments: post.comment_count || post.numComments || 0,
          views: post.views || 0,
        }))

        this.meta = {
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
          perPage: response.data.meta.per_page,
        }

        return this.currentListPosts
      } catch (error) {
        this.error = error.response?.data?.message || 'Error cargando posts de la lista'
        console.error('Error fetching list posts:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createList(listData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.savedLists.createList(listData)

        const newList = response.data.data
        this.lists.push(newList)

        return newList
      } catch (error) {
        this.error = error.response?.data?.message || 'Error creando lista'
        console.error('Error creating saved list:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateList(identifier, listData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.savedLists.updateList(identifier, listData)

        const updatedList = response.data.data
        const index = this.lists.findIndex(
          (list) =>
            list.id === updatedList.id ||
            list.uuid === updatedList.uuid ||
            list.slug === updatedList.slug
        )

        if (index !== -1) {
          this.lists[index] = updatedList
        }

        if (
          this.currentList &&
          (this.currentList.id === updatedList.id ||
            this.currentList.uuid === updatedList.uuid ||
            this.currentList.slug === updatedList.slug)
        ) {
          this.currentList = updatedList
        }

        return updatedList
      } catch (error) {
        this.error = error.response?.data?.message || 'Error actualizando lista'
        console.error('Error updating saved list:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteList(identifier) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.savedLists.deleteList(identifier)

        const list = this.lists.find(
          (list) => list.id === identifier || list.uuid === identifier || list.slug === identifier
        )

        if (list) {
          this.lists = this.lists.filter((l) => l.id !== list.id)

          if (this.currentList && this.currentList.id === list.id) {
            this.currentList = null
            this.currentListPosts = []
          }
        }

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error eliminando lista'
        console.error('Error deleting saved list:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async addPostToList(identifier, postId, notes = null) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.savedLists.addPostToList(identifier, postId, notes)

        const list = this.lists.find(
          (list) => list.id === identifier || list.uuid === identifier || list.slug === identifier
        )

        if (list) {
          list.posts_count = (list.posts_count || 0) + 1
        }

        if (
          this.currentList &&
          (this.currentList.id === identifier ||
            this.currentList.uuid === identifier ||
            this.currentList.slug === identifier)
        ) {
          this.currentList.posts_count = (this.currentList.posts_count || 0) + 1
        }

        if (list && list.type === 'favorite') {
          this.favoritePostsIds.add(postId)
        } else if (list && list.type === 'read_later') {
          this.readLaterPostsIds.add(postId)
        }

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error añadiendo post a la lista'
        console.error('Error adding post to list:', error)
        throw error
      }
    },

    async removePostFromList(identifier, postId) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.savedLists.removePostFromList(identifier, postId)

        const list = this.lists.find(
          (list) => list.id === identifier || list.uuid === identifier || list.slug === identifier
        )

        if (list && list.posts_count > 0) {
          list.posts_count--
        }

        if (
          this.currentList &&
          (this.currentList.id === identifier ||
            this.currentList.uuid === identifier ||
            this.currentList.slug === identifier) &&
          this.currentList.posts_count > 0
        ) {
          this.currentList.posts_count--
        }

        if (this.currentListPosts.length > 0) {
          this.currentListPosts = this.currentListPosts.filter((post) => post.id !== postId)
          this.meta.total = Math.max(0, this.meta.total - 1)
        }

        if (list && list.type === 'favorite') {
          this.favoritePostsIds.delete(postId)
        } else if (list && list.type === 'read_later') {
          this.readLaterPostsIds.delete(postId)
        }

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error eliminando post de la lista'
        console.error('Error removing post from list:', error)
        throw error
      }
    },

    async toggleFavorite(postId) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.savedLists.toggleFavorite(postId)

        if (response.data.is_favorite) {
          this.favoritePostsIds.add(postId)
        } else {
          this.favoritePostsIds.delete(postId)
        }

        const favoritesList = this.lists.find((list) => list.type === 'favorite')
        if (favoritesList) {
          favoritesList.posts_count = response.data.is_favorite
            ? (favoritesList.posts_count || 0) + 1
            : Math.max(0, (favoritesList.posts_count || 0) - 1)
        }

        return response.data.is_favorite
      } catch (error) {
        this.error = error.response?.data?.message || 'Error actualizando favoritos'
        console.error('Error toggling favorite:', error)
        throw error
      }
    },

    async toggleReadLater(postId) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.savedLists.toggleReadLater(postId)

        if (response.data.is_read_later) {
          this.readLaterPostsIds.add(postId)
        } else {
          this.readLaterPostsIds.delete(postId)
        }

        const readLaterList = this.lists.find((list) => list.type === 'read_later')
        if (readLaterList) {
          readLaterList.posts_count = response.data.is_read_later
            ? (readLaterList.posts_count || 0) + 1
            : Math.max(0, (readLaterList.posts_count || 0) - 1)
        }

        return response.data.is_read_later
      } catch (error) {
        this.error = error.response?.data?.message || 'Error actualizando leer más tarde'
        console.error('Error toggling read later:', error)
        throw error
      }
    },

    async updatePostNotes(identifier, postId, notes) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.savedLists.updatePostNotes(identifier, postId, notes)

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error actualizando notas'
        console.error('Error updating post notes:', error)
        throw error
      }
    },

    async clearList(identifier) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        await $api.savedLists.clearList(identifier)

        const list = this.lists.find(
          (list) => list.id === identifier || list.uuid === identifier || list.slug === identifier
        )

        if (list) {
          list.posts_count = 0
        }

        if (
          this.currentList &&
          (this.currentList.id === identifier ||
            this.currentList.uuid === identifier ||
            this.currentList.slug === identifier)
        ) {
          this.currentList.posts_count = 0
          this.currentListPosts = []
          this.meta.total = 0
        }

        if (list && list.type === 'favorite') {
          this.favoritePostsIds.clear()
        } else if (list && list.type === 'read_later') {
          this.readLaterPostsIds.clear()
        }

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error cleaning lista'
        console.error('Error clearing list:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Method for username/slug format (read-only, for SEO-friendly URLs)
    async fetchListByUsernameAndSlug(username, slug) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.savedLists.getListByUsernameAndSlug(username, slug)

        this.currentList = response.data.data
        return this.currentList
      } catch (error) {
        this.error = error.response?.data?.message || 'Error cargando lista'
        console.error('Error fetching saved list:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
