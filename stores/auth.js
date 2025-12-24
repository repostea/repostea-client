import { defineStore } from 'pinia'
import { useNuxtApp, useCookie } from '#app'
import { localStorageService } from '~/services/localStorageService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    error: null,
    initialized: false,
    lastFetchTime: 0,
    fetchInterval: 5 * 60 * 1000,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isGuest: (state) => {
      if (!process.client) return false
      return state.user?.is_guest === true || localStorage.getItem('guest_user') === 'true'
    },
    isAdmin: (state) => state.user?.is_admin || false,
    isModerator: (state) => state.user?.is_moderator || false,
    userKarma: (state) => state.user?.karma_points || 0,
    username: (state) => state.user?.username || '',
    shouldRefreshUser: (state) => {
      return !state.lastFetchTime || Date.now() - state.lastFetchTime > state.fetchInterval
    },
  },

  actions: {
    // Helper to set token in both localStorage and cookie
    setToken(token) {
      this.token = token
      if (process.client) {
        localStorage.setItem('token', token)
      }
      // Set cookie with 30 days expiration
      const config = useRuntimeConfig()
      const cookieDomain = process.env.NODE_ENV === 'production' ? config.public.cookieDomain : undefined
      const tokenCookie = useCookie('token', {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        domain: cookieDomain,
      })
      tokenCookie.value = token
    },

    // Helper to save user data in both localStorage and cookie
    setUser(user) {
      this.user = user
      if (process.client) {
        localStorage.setItem('user', JSON.stringify(user))
      }
      // Save user data to cookie for SSR
      const config = useRuntimeConfig()
      const cookieDomain = process.env.NODE_ENV === 'production' ? config.public.cookieDomain : undefined
      const userCookie = useCookie('user_data', {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        domain: cookieDomain,
      })
      userCookie.value = user
    },

    // Helper to clear token from both localStorage and cookie
    clearToken() {
      this.token = null
      this.user = null
      if (process.client) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      // Clear cookies with domain (new format)
      const config = useRuntimeConfig()
      const cookieDomain = process.env.NODE_ENV === 'production' ? config.public.cookieDomain : undefined
      const cookieOptionsWithDomain = {
        domain: cookieDomain,
      }
      const tokenCookieWithDomain = useCookie('token', cookieOptionsWithDomain)
      tokenCookieWithDomain.value = null
      const userCookieWithDomain = useCookie('user_data', cookieOptionsWithDomain)
      userCookieWithDomain.value = null

      // Also clear cookies without domain (old format) to handle migration
      const tokenCookieNoDomain = useCookie('token')
      tokenCookieNoDomain.value = null
      const userCookieNoDomain = useCookie('user_data')
      userCookieNoDomain.value = null
    },

    async initialize() {
      if (this.initialized || !process.client) return

      try {
        // Try to get token from cookie first (SSR compatible), then localStorage
        const tokenCookie = useCookie('token')
        const token = tokenCookie.value || localStorage.getItem('token')
        const isGuest = localStorage.getItem('guest_user') === 'true'
        const savedUser = localStorage.getItem('user')

        // Quick initialization with cached data first
        if (token && savedUser) {
          this.token = token
          try {
            this.user = JSON.parse(savedUser)
            this.initialized = true
          } catch {
            // Invalid cached user, will fetch from server
          }
        }

        // Then fetch fresh data from server in background
        this.loading = true

        if (token) {
          this.token = token
          // Mark as background request to avoid unwanted redirects on invalid tokens
          // Use retry logic to handle temporary server unavailability (e.g., during deploys)
          await this.fetchUserWithRetry(3, 1000).catch((error) => {
            // Clear token on auth errors (401, 403) or user not found (404)
            // Not on network errors which may happen during deploys
            const status = error?.response?.status
            const isAuthError = (status === 401 || status === 403 || status === 404) && error?.response?.data
            if (isAuthError) {
              console.warn('[Auth] Session invalid, logging out:', status)
              this.clearToken()
              this.user = null
              localStorage.removeItem('guest_user')
              localStorage.removeItem('user')
            } else {
              // Keep the cached user data and token for network errors
              console.warn('[Auth] Failed to refresh user data, keeping cached session')
            }
          })

          // If user was previously guest, ensure that status is maintained
          if (isGuest && this.user) {
            this.user.is_guest = true
          }
        } else if (isGuest) {
          // If guest flag exists but no token, try to create a new guest session
          try {
            await this.guestLogin()
          } catch (error) {
            console.error('Error restoring guest session:', error)
            localStorage.removeItem('guest_user')
          }
        }

        this.initialized = true
      } catch (error) {
        console.error('Error initializing auth store:', error)
      } finally {
        this.loading = false
      }
    },

    async login(credentials) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.login(credentials)

        this.setToken(response.data.token)
        this.setUser(response.data.user)
        this.lastFetchTime = Date.now()

        // Return both user and email verification status
        return {
          user: this.user,
          email_verification_required: response.data.email_verification_required || false
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Login error'
        throw error
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        if (userData.password && !userData.password_confirmation) {
          userData.password_confirmation = userData.password
        }
        const response = await $api.auth.register(userData)

        this.setToken(response.data.token)
        this.setUser(response.data.user)
        this.lastFetchTime = Date.now()

        // Return both user and email verification status
        return {
          user: this.user,
          email_verification_required: response.data.email_verification_required || false,
          status: response.data.status
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration error'
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true

      try {
        const { $api } = useNuxtApp()
        if (this.token) {
          await $api.auth.logout()
        }
      } catch (error) {
        console.error('Error logging out:', error)
      } finally {
        this.clearToken()
        this.error = null
        this.lastFetchTime = 0

        if (process.client) {
          localStorage.removeItem('guest_user')
        }

        this.loading = false
      }
    },

    // Retry wrapper for fetchUser to handle temporary server unavailability
    async fetchUserWithRetry(maxRetries = 3, delayMs = 1000) {
      let lastError = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await this.fetchUser(true, true)
        } catch (error) {
          lastError = error

          // If it's an auth error (401, 403) or user not found (404), don't retry
          const status = error?.response?.status
          if ((status === 401 || status === 403 || status === 404) && error?.response?.data) {
            throw error
          }

          // For network errors or server unavailable, retry after delay
          if (attempt < maxRetries) {
            console.warn(`[Auth] Fetch user attempt ${attempt} failed, retrying in ${delayMs}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
            // Exponential backoff
            delayMs = Math.min(delayMs * 2, 5000)
          }
        }
      }

      // All retries exhausted
      throw lastError
    },

    async fetchUser(force = false, isBackgroundRequest = false) {
      if (!this.token || !process.client) return null

      if (this.user && !force && !this.shouldRefreshUser) {
        return this.user
      }

      this.loading = true

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.getUser(isBackgroundRequest)

        let userData
        if (response.data && response.data.data) {
          userData = response.data.data
        } else {
          userData = response.data
        }

        if (response.data.posts_count) {
          userData.posts_count = response.data.posts_count
        }

        if (response.data.comments_count) {
          userData.comments_count = response.data.comments_count
        }

        if (response.data.achievements) {
          userData.achievements = response.data.achievements
        }

        this.setUser(userData)
        this.lastFetchTime = Date.now()

        return this.user
      } catch (error) {
        // Only clear token on real auth errors (401, 403, 404 with valid response)
        // Not on network errors, timeouts, or server unavailable
        const status = error?.response?.status
        const hasValidResponse = error?.response?.data

        if ((status === 401 || status === 403 || status === 404) && hasValidResponse) {
          console.warn('[Auth] fetchUser: Session invalid, clearing token:', status)
          this.clearToken()
        } else {
          console.warn('[Auth] fetchUser: Error (keeping session):', error?.message || error)
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async forgotPassword(data) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.forgotPassword(data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error sending password reset link'
        throw error
      } finally {
        this.loading = false
      }
    },

    async resetPassword(resetData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.resetPassword(resetData)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error resetting password'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePassword(passwordData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.updatePassword(passwordData)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error updating password'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateProfile(profileData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.users.updateProfile(profileData)

        if (response.data.user) {
          this.setUser(response.data.user)
          this.lastFetchTime = Date.now()
        } else {
          await this.fetchUser(true)
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error updating profile'
        throw error
      } finally {
        this.loading = false
      }
    },

    async requestMagicLink(data) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.requestMagicLink(data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error sending magic link'
        throw error
      } finally {
        this.loading = false
      }
    },

    async verifyMagicLink(token) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.verifyMagicLink(token)

        this.setToken(response.data.token)
        this.setUser(response.data.user)
        this.lastFetchTime = Date.now()

        return this.user
      } catch (error) {
        this.error = error.response?.data?.message || 'The magic link is invalid or has expired'
        throw error
      } finally {
        this.loading = false
      }
    },
    async guestLogin() {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.auth.guestLogin()

        this.setToken(response.data.token)
        this.setUser(response.data.user)
        this.lastFetchTime = Date.now()

        if (process.client) {
          localStorage.setItem('guest_user', 'true')
          localStorageService.clearVotedPosts()
        }

        return this.user
      } catch (error) {
        this.error = error.response?.data?.message || 'Error creating guest session'
        throw error
      } finally {
        this.loading = false
      }
    },

    async setGuestUser() {
      try {
        await this.guestLogin()
        return true
      } catch (error) {
        console.error('Error setting guest user:', error)
        throw error
      }
    },
  },
})
