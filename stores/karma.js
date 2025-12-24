import { defineStore } from 'pinia'

export const useKarmaStore = defineStore('karma', {
  state: () => ({
    karmaData: null,
    loading: false,
    error: null,
    lastFetchTime: 0,
    fetchInterval: 5 * 60 * 1000,
  }),

  getters: {
    currentLevel: (state) => state.karmaData?.level?.name || 'newcomer',
    shouldRefreshKarma: (state) => {
      return !state.lastFetchTime || Date.now() - state.lastFetchTime > state.fetchInterval
    },
  },

  actions: {
    async fetchUserKarma(userId, force = false) {
      if (this.karmaData && !force && !this.shouldRefreshKarma) {
        return this.karmaData
      }

      if (!userId) return null

      this.loading = true

      try {
        const { $api } = useNuxtApp()
        const response = await $api.users.getKarma(userId)

        this.karmaData = response.data
        this.lastFetchTime = Date.now()

        return this.karmaData
      } catch (error) {
        console.error('Error fetching karma data:', error)
        this.error = error.response?.data?.message || 'Error loading karma data'
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchKarmaLevels() {
      this.loading = true

      try {
        const { $api } = useNuxtApp()
        const response = await $api.karma.getLevels()
        return response.data
      } catch (error) {
        console.error('Error fetching karma levels:', error)
        this.error = error.response?.data?.message || 'Error loading karma levels'
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchLeaderboard(params = {}) {
      this.loading = true

      try {
        const { $api } = useNuxtApp()
        const response = await $api.karma.getLeaderboard(params)
        return response.data
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        this.error = error.response?.data?.message || 'Error loading leaderboard'
        return null
      } finally {
        this.loading = false
      }
    },
  },
})
