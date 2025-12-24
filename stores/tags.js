import { defineStore } from 'pinia'
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

        this.tags = response.data.data.map((magazine) => ({
          id: magazine.id,
          name: magazine.name,
          description: magazine.description,
          links_count: magazine.entries_count || 0,
          icon: magazine.icon || null,
          created_at: magazine.created_at,
        }))

        this.meta = response.data.meta || {
          currentPage: page,
          lastPage: Math.ceil(this.tags.length / perPage),
          total: this.tags.length,
          perPage: perPage,
        }

        this.sort = sort
        this.direction = direction

        return this.tags
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading magazines'
        console.error('Error fetching magazines:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTag(name) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.tags.getTag(name)

        this.currentTag = {
          id: response.data.data.id,
          name: response.data.data.name,
          description: response.data.data.description,
          links_count: response.data.data.entries_count || 0,
          icon: response.data.data.icon || null,
          created_at: response.data.data.created_at,
        }

        return this.currentTag
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading magazine'
        console.error('Error fetching magazine:', error)
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
        return response.data.data.map((magazine) => ({
          id: magazine.id,
          name: magazine.name,
          description: magazine.description,
          links_count: magazine.entries_count || 0,
          icon: magazine.icon || null,
          created_at: magazine.created_at,
        }))
      } catch (error) {
        this.error = error.response?.data?.message || 'Error searching magazines'
        console.error('Error searching magazines:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
