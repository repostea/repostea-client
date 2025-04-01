import axios from 'axios'
import { useToast } from 'vue-toastification'
import { defineNuxtPlugin, useRuntimeConfig, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

let toastShown = false

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const toast = useToast()

  const api = axios.create({
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Repostea-Id': config.public.reposteaId,
      'X-Repostea-Api-Key': config.public.reposteaApiKey,
    },
  })

  api.interceptors.request.use((config) => {
    const authStore = useAuthStore()

    if (authStore.isAuthenticated && authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }

    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const statusCode = error.response?.status
      const hint = error.response?.data?.hint
      const message = error.response?.data?.message

      if (statusCode === 401) {
        if (hint?.includes('REPOSTEA_ID') || hint?.includes('REPOSTEA_API_KEY')) {
          if (!toastShown) {
            toastShown = true
            toast.error(hint, {
              onClose: () => {
                toastShown = false
              },
            })
          }
          return Promise.reject(error)
        }

        toast.error(message)
        navigateTo('/auth/login')
      }
      return Promise.reject(error)
    }
  )

  return {
    provide: {
      api: {
        auth: {
          login: (credentials) => api.post('/auth/login', credentials),
          register: (userData) => api.post('/auth/register', userData),
          logout: () => api.post('/auth/logout'),
          getUser: () => api.get('/auth/user'),
        },
        links: {
          getLinks: (params = {}) => api.get('/links', { params }),
          getPendingLinks: (params = {}) => api.get('/links/pending', { params }),
          getLink: (id) => api.get(`/links/${id}`),
          createLink: (linkData) => api.post('/links', linkData),
          voteLink: (id, value) => api.post(`/links/${id}/vote`, { value }),
          getUserVotedLinks: (params = {}) => api.get('/links/user/voted', { params }),
        },
        comments: {
          getLinkComments: (linkId, params = {}) =>
            api.get(`/links/${linkId}/comments`, { params }),
          getComment: (id) => api.get(`/comments/${id}`),
          createComment: (linkId, commentData) =>
            api.post(`/links/${linkId}/comments`, commentData),
          voteComment: (id, value) => api.post(`/comments/${id}/vote`, { value }),
          getUserComments: (params = {}) => api.get('/comments/user', { params }),
        },
        tags: {
          getTags: (params = {}) => api.get('/tags', { params }),
          searchTags: (query) => api.get('/tags/search', { params: { q: query } }),
          getTag: (name, params = {}) => api.get(`/tags/${name}`, { params }),
        },
        users: {
          getUser: (username) => api.get(`/users/${username}`),
          getUserLinks: (username, params = {}) => api.get(`/users/${username}/links`, { params }),
          getUserComments: (username, params = {}) =>
            api.get(`/users/${username}/comments`, { params }),
        },
      },
    },
  }
})
