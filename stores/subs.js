import { defineStore } from 'pinia'
import { usePostsStore } from './posts'

export const useSubsStore = defineStore('subs', {
  state: () => ({
    subs: [],
    currentSub: null,
    subPosts: [],
    subRules: [],
    meta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 15,
    },
    postsMeta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 10,
    },
    loading: false,
    error: null,
    activeTab: 'trending',
    searchQuery: '',
  }),

  getters: {
    getMySubs: (state) => state.subs.filter((sub) => sub.is_member),
    getTrendingSubs: (state) => state.subs.filter((sub) => sub.is_trending),
    getPopularSubs: (state) => state.subs.filter((sub) => sub.is_popular),
  },

  actions: {
    async fetchSubs(params = {}) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()

        const response = await $api.subs.getSubs(params)
        this.subs = response.data.data || []

        this.meta = {
          currentPage: response.data.meta?.current_page || 1,
          lastPage: response.data.meta?.last_page || 1,
          total: response.data.meta?.total || 0,
          perPage: response.data.meta?.per_page || 15,
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error fetching subs'
        console.error('Error fetching subs:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSub(nameOrId) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()

        const response = await $api.subs.getSub(nameOrId)
        this.currentSub = response.data.data

        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error fetching sub'
        console.error('Error fetching sub:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSubPosts(subId, params = {}) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const postsStore = usePostsStore()

        const response = await $api.subs.getSubPosts(subId, params)
        // Transform posts using the posts store transformation function
        this.subPosts = (response.data.data || []).map((post) =>
          postsStore._transformPostData(post)
        )

        this.postsMeta = {
          currentPage: response.data.meta?.current_page || 1,
          lastPage: response.data.meta?.last_page || 1,
          total: response.data.meta?.total || 0,
          perPage: response.data.meta?.per_page || 10,
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error fetching sub posts'
        console.error('Error fetching sub posts:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSubRules(subId) {
      try {
        const { $api } = useNuxtApp()

        const response = await $api.subs.getSubRules(subId)
        this.subRules = response.data || []

        return response.data
      } catch (error) {
        console.error('Error fetching sub rules:', error)
        // Don't throw error for rules as they're not critical
        this.subRules = []
      }
    },

    async createSub(subData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()

        const response = await $api.subs.createSub(subData)

        // Add the new sub to the list if we have subs loaded
        if (this.subs.length > 0) {
          this.subs.unshift(response.data)
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error creating sub'
        console.error('Error creating sub:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSub(subId, subData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()

        const response = await $api.subs.updateSub(subId, subData)

        // Update the current sub if it matches
        if (this.currentSub && this.currentSub.id === subId) {
          this.currentSub = response.data
        }

        // Update in the subs list
        const index = this.subs.findIndex((sub) => sub.id === subId)
        if (index !== -1) {
          this.subs[index] = response.data
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error updating sub'
        console.error('Error updating sub:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteSub(subId) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()

        await $api.subs.deleteSub(subId)

        // Remove from subs list
        this.subs = this.subs.filter((sub) => sub.id !== subId)

        // Clear current sub if it was deleted
        if (this.currentSub && this.currentSub.id === subId) {
          this.currentSub = null
        }

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error deleting sub'
        console.error('Error deleting sub:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async joinSub(subId, message = '') {
      try {
        const { $api } = useNuxtApp()

        const response = await $api.subs.joinSub(subId, message)

        // If it's a pending request (private sub), don't update member status
        if (response.request_pending) {
          return response
        }

        // Update the current sub if it matches
        if (this.currentSub && this.currentSub.id === subId) {
          this.currentSub.is_member = true
          this.currentSub.members_count = (this.currentSub.members_count || 0) + 1
        }

        // Update in the subs list
        const index = this.subs.findIndex((sub) => sub.id === subId)
        if (index !== -1) {
          this.subs[index].is_member = true
          this.subs[index].members_count = (this.subs[index].members_count || 0) + 1
        }

        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Error joining sub'
        console.error('Error joining sub:', error)
        throw error
      }
    },

    async leaveSub(subId) {
      try {
        const { $api } = useNuxtApp()

        await $api.subs.leaveSub(subId)

        // Update the current sub if it matches
        if (this.currentSub && this.currentSub.id === subId) {
          this.currentSub.is_member = false
          this.currentSub.members_count = Math.max((this.currentSub.members_count || 1) - 1, 0)
        }

        // Update in the subs list
        const index = this.subs.findIndex((sub) => sub.id === subId)
        if (index !== -1) {
          this.subs[index].is_member = false
          this.subs[index].members_count = Math.max((this.subs[index].members_count || 1) - 1, 0)
        }

        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Error leaving sub'
        console.error('Error leaving sub:', error)
        throw error
      }
    },

    async createMembershipRequest(subId, requestData) {
      try {
        const { $api } = useNuxtApp()

        const response = await $api.subs.createMembershipRequest(subId, requestData)

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error creating membership request'
        console.error('Error creating membership request:', error)
        throw error
      }
    },

    // Utility actions
    setActiveTab(tab) {
      this.activeTab = tab
    },

    setSearchQuery(query) {
      this.searchQuery = query
    },

    clearError() {
      this.error = null
    },

    clearCurrentSub() {
      this.currentSub = null
      this.subPosts = []
      this.subRules = []
    },
  },
})
