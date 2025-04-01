
import { defineStore } from 'pinia'
import { initSupabase } from '~/services/supabase'
import { useNuxtApp } from '#app'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: false,
    error: null,
    token: null,
    userProfile: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.session && !!state.user,
    isAdmin: (state) => state.user?.user_metadata?.is_admin || false,
    isModerator: (state) => state.user?.user_metadata?.is_moderator || false,
    userKarma: (state) => state.user?.user_metadata?.karma || 0,
    username: (state) => state.user?.user_metadata?.username || '',
  },

  actions: {
    async initialize() {
      if (process.client) {
        try {
          const supabase = initSupabase()
          if (!supabase) {
            console.error('Supabase could not be initialized')
            return
          }

          const { data } = await supabase.auth.getSession()
          this.session = data.session
          this.token = data.session?.access_token || null

          if (this.session) {
            const { data: userData } = await supabase.auth.getUser()
            this.user = userData.user

            this.userProfile = userData.user?.user_metadata || null
          }

          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
            this.session = session
            this.token = session?.access_token || null

            if (session) {
              this.fetchUser()
            } else {
              this.user = null
              this.userProfile = null
            }
          })

          if (typeof window !== 'undefined') {
            const nuxtApp = useNuxtApp()
            nuxtApp.hook('app:beforeMount', () => {
              subscription?.unsubscribe()
            })
          }
        } catch (error) {
          console.error('Error initializing authentication:', error)
          this.user = null
          this.session = null
          this.token = null
          this.userProfile = null
        }
      }
    },

    async login({ email, password }) {
      this.loading = true
      this.error = null

      try {
        const supabase = initSupabase()
        if (!supabase) {
          throw new Error('Supabase could not be initialized')
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        this.session = data.session
        this.user = data.user
        this.token = data.session?.access_token || null

        this.userProfile = data.user?.user_metadata || null

        return data
      } catch (error) {
        this.error = error.message || 'Authentication error'
        throw error
      } finally {
        this.loading = false
      }
    },

    async register({ email, password, username }) {
      this.loading = true
      this.error = null

      try {
        const supabase = initSupabase()
        if (!supabase) {
          throw new Error('Supabase could not be initialized')
        }

        const userData = {
          username,
          karma: 0,
          display_name: username,
          created_at: new Date().toISOString(),
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData,
          },
        })

        if (error) throw error

        this.session = data.session
        this.user = data.user
        this.token = data.session?.access_token || null

        this.userProfile = userData

        return data
      } catch (error) {
        this.error = error.message || 'Registration error'
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true

      try {
        const supabase = initSupabase()
        if (!supabase) {
          throw new Error('Supabase could not be initialized')
        }

        const { error } = await supabase.auth.signOut()
        if (error) throw error

        this.user = null
        this.session = null
        this.token = null
        this.error = null
        this.userProfile = null
      } catch (error) {
        console.error('Error logging out:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchUser() {
      if (!this.session) return null

      this.loading = true

      try {
        const supabase = initSupabase()
        if (!supabase) {
          throw new Error('Supabase could not be initialized')
        }

        const { data, error } = await supabase.auth.getUser()
        if (error) throw error

        this.user = data.user

        this.userProfile = data.user?.user_metadata || null

        return data.user
      } catch (error) {
        console.error('Error fetching user info:', error)
        if (error.status === 401) {
          this.logout()
        }
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchUserProfile() {
      if (!this.user) return null

      this.userProfile = this.user.user_metadata || null
      return this.userProfile
    },

    async socialLogin(provider) {
      this.loading = true
      this.error = null

      try {
        const supabase = initSupabase()
        if (!supabase) {
          throw new Error('Supabase could not be initialized')
        }

        let { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        return data
      } catch (error) {
        this.error = error.message || `Error logging in with ${provider}`
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePassword(newPassword) {
      this.loading = true
      this.error = null

      try {
        const supabase = initSupabase()
        if (!supabase) {
          throw new Error('Supabase could not be initialized')
        }

        const { data, error } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (error) throw error

        return data
      } catch (error) {
        this.error = error.message || 'Error updating password'
        throw error
      } finally {
        this.loading = false
      }
    },

    async resetPasswordForEmail(email, options = {}) {
      this.loading = true
      this.error = null

      try {
        const supabase = initSupabase()
        if (!supabase) {
          throw new Error('Supabase could not be initialized')
        }

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
          ...options,
        })

        if (error) throw error
        return data
      } catch (error) {
        this.error = error.message || 'Error resetting password'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
