import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'
export const useLinksStore = defineStore('links', {
  state: () => ({
    links: [],
    pendingLinks: [],
    currentLink: null,
    meta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 15,
    },
    pendingMeta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 15,
    },
    loading: false,
    error: null,
    sort: 'promoted_at',
    direction: 'desc',
  }),

  actions: {
    async fetchLinks(
      page = 1,
      sort = this.sort,
      direction = this.direction,
      interval = 1440,
      perPage = 15
    ) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.links.getLinks({
          page,
          sort,
          direction,
          interval,
          per_page: perPage,
        })

        this.links = response.data.data
        this.meta = response.data.meta
        this.sort = sort
        this.direction = direction

        return this.links
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading links'
        console.error('Error fetching links:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPendingLinks(page = 1, sort = 'created_at', direction = 'desc', perPage = 15) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.links.getPendingLinks({
          page,
          sort,
          direction,
          per_page: perPage,
        })

        this.pendingLinks = response.data.data
        this.pendingMeta = response.data.meta

        return this.pendingLinks
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading pending links'
        console.error('Error fetching pending links:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchLink(id) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.links.getLink(id)
        this.currentLink = response.data.data

        return this.currentLink
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading link'
        console.error('Error fetching link:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createLink(linkData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.links.createLink(linkData)

        if (this.pendingLinks.length) {
          this.pendingLinks = [response.data.data, ...this.pendingLinks]
          this.pendingMeta.total++
        }

        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error creating link'
        console.error('Error creating link:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async voteLink(id, value) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.links.voteLink(id, value)

        const updateLinkInList = (list) => {
          const index = list.findIndex((link) => link.id === id)
          if (index !== -1) {
            list[index] = {
              ...list[index],
              votes: response.data.data.votes,
              karma: response.data.data.karma,
              user_has_voted: true,
            }
          }
        }

        updateLinkInList(this.links)
        updateLinkInList(this.pendingLinks)

        if (this.currentLink && this.currentLink.id === id) {
          this.currentLink = {
            ...this.currentLink,
            votes: response.data.data.votes,
            karma: response.data.data.karma,
            user_has_voted: true,
          }
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error voting link'
        console.error('Error voting link:', error)
        throw error
      }
    },
  },
})
