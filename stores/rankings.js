import { defineStore } from 'pinia'

export const useRankingsStore = defineStore('rankings', {
  state: () => ({
    rankings: {
      karma: null,
      posts: null,
      comments: null,
      streaks: null,
      achievements: null,
    },
    loading: false,
    error: null,
    currentCategory: 'karma',
    currentTimeframe: 'all',
    currentPage: 1,
    limit: 100,
    cache: {},
    cacheExpiry: 10 * 60 * 1000, // 10 minutes
  }),

  getters: {
    currentRanking: (state) => state.rankings[state.currentCategory],
    hasData: (state) => !!state.rankings[state.currentCategory],
    getCachedData: (state) => (category, timeframe, page) => {
      const key = `${category}:${timeframe}:${page}`
      const cached = state.cache[key]
      if (cached && Date.now() - cached.timestamp < state.cacheExpiry) {
        return cached.data
      }
      return null
    },
  },

  actions: {
    async fetchRanking(category, timeframe = 'all', page = 1, force = false) {
      const cacheKey = `${category}:${timeframe}:${page}`

      // Check cache first
      if (!force) {
        const cached = this.getCachedData(category, timeframe, page)
        if (cached) {
          this.rankings[category] = cached
          this.currentCategory = category
          this.currentTimeframe = timeframe
          this.currentPage = page
          return cached
        }
      }

      this.loading = true
      this.error = null
      this.currentCategory = category
      this.currentTimeframe = timeframe
      this.currentPage = page

      try {
        const { $api } = useNuxtApp()
        const params = {
          limit: this.limit,
          page,
        }

        // Only add timeframe for categories that support it
        if (['karma', 'posts', 'comments'].includes(category)) {
          params.timeframe = timeframe
        }


        let response
        switch (category) {
          case 'karma':
            response = await $api.rankings.getKarmaRanking(params)
            break
          case 'posts':
            response = await $api.rankings.getPostsRanking(params)
            break
          case 'comments':
            response = await $api.rankings.getCommentsRanking(params)
            break
          case 'streaks':
            response = await $api.rankings.getStreaksRanking(params)
            break
          case 'achievements':
            response = await $api.rankings.getAchievementsRanking(params)
            break
          default:
            throw new Error(`Unknown ranking category: ${category}`)
        }

        // Extract the actual data from the response
        // API returns: { data: { users: [...], pagination: {...} }, timeframe: 'all' }
        // We only need the inner 'data' object
        const data = response.data.data


        // Store in cache
        this.cache[cacheKey] = {
          data,
          timestamp: Date.now(),
        }

        this.rankings[category] = data
        return data
      } catch (error) {
        console.error(`Error fetching ${category} ranking:`, error)
        this.error = error.response?.data?.message || `Error loading ${category} ranking`
        return null
      } finally {
        this.loading = false
      }
    },

    async changeCategory(category, timeframe = 'all') {
      return await this.fetchRanking(category, timeframe, 1)
    },

    async changeTimeframe(timeframe) {
      return await this.fetchRanking(this.currentCategory, timeframe, 1)
    },

    async changePage(page) {
      return await this.fetchRanking(this.currentCategory, this.currentTimeframe, page)
    },

    clearCache() {
      this.cache = {}
    },

    resetState() {
      this.rankings = {
        karma: null,
        posts: null,
        comments: null,
        streaks: null,
        achievements: null,
      }
      this.currentCategory = 'karma'
      this.currentTimeframe = 'all'
      this.currentPage = 1
      this.error = null
      this.clearCache()
    },
  },
})
