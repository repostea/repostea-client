import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'
export const useTagsStore = defineStore('tags', {
  state: () => ({
    tags: [],
    currentTag: null,
    meta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 15,
    },
    loading: false,
    error: null,
    sort: 'name',
    direction: 'asc',
  }),

  actions: {
    async fetchTags(page = 1, sort = this.sort, direction = this.direction, perPage = 15) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.tags.getTags({
          page,
          sort,
          direction,
          per_page: perPage,
        })

        this.tags = response.data.data
        this.meta = response.data.meta
        this.sort = sort
        this.direction = direction

        return this.tags
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading tags'
        console.error('Error fetching tags:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTag(id) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.tags.getTag(id)
        this.currentTag = response.data.data
        return this.currentTag
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading tag'
        console.error('Error fetching tag:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async searchTags(query) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.tags.searchTags(query)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error searching tags'
        console.error('Error searching tags:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
