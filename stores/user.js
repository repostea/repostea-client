import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    // This store is a wrapper around the auth store
  }),

  getters: {
    isLoggedIn() {
      const authStore = useAuthStore()
      return authStore.isAuthenticated
    },

    user() {
      const authStore = useAuthStore()
      return authStore.user
    },

    userKarma() {
      const authStore = useAuthStore()
      return authStore.userKarma
    },

    username() {
      const authStore = useAuthStore()
      return authStore.username
    },
  },
})
