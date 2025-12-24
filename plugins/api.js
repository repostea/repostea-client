import axios from 'axios'
import { defineNuxtPlugin, useRuntimeConfig, useNuxtApp, useCookie } from '#app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Get token from cookie (works in both SSR and client)
  const tokenCookie = useCookie('token')

  const api = axios.create({
    baseURL: config.public.apiBaseUrl + '/v1',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true, // Enable sending cookies with requests
  })
  api.interceptors.request.use((reqConfig) => {
    // Get token: from localStorage/sessionStorage on client, from cookie on SSR
    let token = null
    let isGuest = false

    if (import.meta.client) {
      token = sessionStorage.getItem('token') || localStorage.getItem('token')
      isGuest = token?.startsWith('guest_') ||
                sessionStorage.getItem('guest_user') === 'true' ||
                localStorage.getItem('guest_user') === 'true'
    } else {
      // SSR: read token from cookie
      token = tokenCookie.value
    }

    if (token) {
      reqConfig.headers['Authorization'] = `Bearer ${token}`

      // If this is a guest token, add the special headers
      if (isGuest) {
        reqConfig.headers['X-Guest-User'] = 'true'
      }
    } else {
      // No token means the user is not authenticated
      // For comment and post endpoints, we need to indicate anonymous user
      if (
        reqConfig.url &&
        ((reqConfig.url.includes('/comments') && reqConfig.method === 'post') ||
          (reqConfig.url.includes('/posts') && reqConfig.method === 'post'))
      ) {
        reqConfig.headers['X-Guest-User'] = 'true'
      }
    }

    if (import.meta.client) {
      // Add maintenance mode secret if available
      const maintenanceSecret = sessionStorage.getItem('maintenance_secret')
      if (maintenanceSecret) {
        reqConfig.headers['X-Maintenance-Secret'] = maintenanceSecret
      }
    }

    const currentLocale = useNuxtApp().$i18n?.locale?.value || 'en'
    reqConfig.params = reqConfig.params || {}
    reqConfig.params.locale = currentLocale
    reqConfig.headers['Accept-Language'] = currentLocale

    return reqConfig
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const statusCode = error.response?.status
      // Handle normalized ApiResponse format: { success, message, errors }
      // Fallback to old format: { error: { message } }
      const message = error.response?.data?.error ||
                      error.response?.data?.message ||
                      error.response?.data?.error?.message ||
                      getDefaultErrorMessage(statusCode)

      // Handle 503 Service Unavailable (Maintenance Mode)
      if (statusCode === 503 && import.meta.client) {
        // Check if user has maintenance mode bypass secret
        const maintenanceSecret = sessionStorage.getItem('maintenance_secret')

        // Only redirect if user doesn't have bypass access
        if (!maintenanceSecret) {
          const router = useNuxtApp().$router
          if (router && !window.location.pathname.includes('/maintenance')) {
            router.push('/maintenance')
          }
        }
        return Promise.reject(error)
      }

      // Handle email verification required (403 with specific error code)
      if (statusCode === 403 && error.response?.data?.error === 'email_not_verified' && import.meta.client) {
        const router = useNuxtApp().$router
        if (router && !window.location.pathname.includes('/auth/verify-email')) {
          router.push('/auth/verify-email')
        }
        return Promise.reject(error)
      }

      // Handle specific error codes
      if (statusCode === 401 && import.meta.client) {
        // IMPORTANT: Only clear tokens if we got a REAL 401 response from the server
        // Not on network errors, timeouts, or server unavailable (which may happen during deploys)
        const hasValidResponse = error.response && error.response.data

        // Check if this is a background/automatic request (like auth initialization)
        const isBackgroundRequest = error.config?.headers?.['X-Background-Request'] === 'true'

        // Check if user is guest before redirecting
        const token = sessionStorage.getItem('token') || localStorage.getItem('token')
        const isGuest =
          token &&
          (token.startsWith('guest_') ||
            sessionStorage.getItem('guest_user') === 'true' ||
            localStorage.getItem('guest_user') === 'true')

        // Only clean up tokens if we have a valid 401 response (not a network error)
        if (hasValidResponse) {
          // Clean up invalid tokens
          sessionStorage.removeItem('token')
          localStorage.removeItem('token')

          // Only redirect if:
          // 1. It's NOT a background request (user initiated action)
          // 2. AND user is NOT a guest
          if (!isBackgroundRequest && !isGuest) {
            // Clean up other auth-related data
            sessionStorage.removeItem('user')
            localStorage.removeItem('user')
            localStorage.removeItem('guest_user')

            window.location.href = '/auth/login'
          }
        } else {
          // Network error or server unavailable - don't clear tokens
          // This prevents losing session during deploys/restarts
          console.warn('[API] 401 without valid response - keeping tokens (possible network issue)')
        }
      }

      // Show error notification by default (prevents silent errors)
      // Components can opt-out by:
      // 1. Catching the error and handling it themselves
      // 2. Passing { silent: true } in request config to suppress notifications
      const isSilent = error.config?.silent === true
      if (import.meta.client && statusCode !== 401 && statusCode !== 503 && !isSilent) {
        // Mark that interceptor will show notification
        error._interceptorWillNotify = true

        // Import useNotification dynamically to avoid circular dependency
        import('~/composables/useNotification').then(({ useNotification }) => {
          const { error: showError } = useNotification()
          // Show error with longer timeout (10 seconds) so user has time to read it
          showError(message, { timeout: 10000 })
        }).catch(() => {
          // Fallback to console if notification system fails
          console.error('[API Error]', message)
        })
      }

      return Promise.reject(error)
    }
  )

  // Helper function to get default error messages
  function getDefaultErrorMessage(statusCode) {
    const { $i18n } = useNuxtApp()
    const t = $i18n?.t || ((key) => key)

    switch (statusCode) {
      case 400:
        return t('errors.bad_request')
      case 401:
        return t('errors.unauthorized')
      case 403:
        return t('errors.forbidden')
      case 404:
        return t('errors.not_found')
      case 422:
        return t('errors.validation_error')
      case 429:
        return t('errors.too_many_requests')
      case 500:
        return t('errors.server_error')
      case 503:
        return t('errors.service_unavailable')
      default:
        return t('errors.network.message')
    }
  }

  const getUserByUsername = (username) => api.get(`/users/by-username/${username}`)
  const apiWrapper = {
    auth: {
      login: (credentials) => api.post('/login', credentials),
      register: (userData) => api.post('/register', userData),
      logout: () => api.post('/logout'),
      getUser: (isBackgroundRequest = false) => api.get('/user', {
        headers: isBackgroundRequest ? { 'X-Background-Request': 'true' } : {}
      }),
      getUserByUsername,
      forgotPassword: (data) => api.post('/forgot-password', data),
      guestLogin: () => api.post('/guest-login'),
      resetPassword: (resetData) => api.post('/reset-password', resetData),
      updatePassword: (passwordData) => api.put('/user/password', passwordData),
      resendVerificationEmail: () => api.post('/email/verification-notification'),
      enableTwoFactorAuth: () => api.post('/user/two-factor-authentication'),
      disableTwoFactorAuth: () => api.delete('/user/two-factor-authentication'),
      getTwoFactorQrCode: () => api.get('/user/two-factor-qr-code'),
      getTwoFactorRecoveryCodes: () => api.get('/user/two-factor-recovery-codes'),
      regenerateTwoFactorRecoveryCodes: () => api.post('/user/two-factor-recovery-codes'),
      requestMagicLink: (data) => api.post('/magic-link/email', data),
      verifyMagicLink: (token) => api.post('/magic-link/verify', { token }),
      getUserId: () => {
        if (import.meta.client) {
          try {
            // Try sessionStorage first, fall back to localStorage for backward compatibility
            const userData = JSON.parse(
              sessionStorage.getItem('user') || localStorage.getItem('user') || '{}'
            )
            return userData?.id
          } catch {
            return null
          }
        }
        return null
      },
    },

    onboarding: {
      completeStep: (step) => api.post(`/onboarding/step/${step}/complete`),
      updateNotificationPreferences: (preferences) =>
        api.post('/onboarding/notifications', preferences),
      skip: () => api.post('/onboarding/skip'),
      getStatus: () => api.get('/onboarding/status'),
    },

    posts: {
      getPosts: (params = {}) => api.get('/posts', { params }),
      getFrontpage: (params = {}) => api.get('/posts/frontpage', { params }),
      getPending: (params = {}) => api.get('/posts/pending', { params }),
      getPostsByType: (type, params = {}) => api.get(`/posts/type/${type}`, { params }),
      getPost: (id) => api.get(`/posts/${id}`),
      getPostBySlug: (slug) => api.get(`/posts/slug/${slug}`),
      getPostByUuid: (uuid) => api.get(`/posts/permalink/${uuid}`),
      createPost: (postData) => api.post('/posts', postData),
      importPost: (postData) => api.post('/posts/import', postData),
      updatePost: (id, postData) => api.put(`/posts/${id}`, postData),
      updatePostStatus: (id, status) => api.patch(`/posts/${id}/status`, { status }),
      deletePost: (id) => api.delete(`/posts/${id}`),
      votePost: (id, value, fingerprint = null) =>
        api.post(`/posts/${id}/vote`, {
          value,
          fingerprint,
        }),
      unvotePost: (id, fingerprint = null) =>
        api.delete(`/posts/${id}/vote`, {
          data: { fingerprint },
        }),
      getPostVoteStats: (id) => api.get(`/posts/${id}/vote-stats`),
      getContentByType: (contentType, params = {}) =>
        api.get(`/posts/content-type/${contentType}`, { params }),
      getVideoFeed: (params = {}) => api.get('/posts/videos', { params }),
      getAudioFeed: (params = {}) => api.get('/posts/audio', { params }),
      validateMediaUrl: (url) => api.post('/media/validate', { url }),
      getMediaInfo: (url) => api.post('/media/info', { url }),
      registerView: (postId, trackingData = {}) => api.post(`/posts/${postId}/view`, trackingData),
      // Post Relationships
      getRelationships: (postId) => api.get(`/posts/${postId}/relationships`),
      createRelationship: (postId, relationshipData) => api.post(`/posts/${postId}/relationships`, relationshipData),
      deleteRelationship: (postId, relationshipId) => api.delete(`/posts/${postId}/relationships/${relationshipId}`),
      getContinuationChain: (postId) => api.get(`/posts/${postId}/relationships/continuation-chain`),
      getRelationshipTypes: () => api.get('/relationship-types'),
      search: (params = {}) => api.get('/posts/search', { params }),
    },

    relationships: {
      vote: (relationshipId, voteValue) =>
        api.post(`/relationships/${relationshipId}/vote`, { vote: voteValue }),
      getStats: (relationshipId) =>
        api.get(`/relationships/${relationshipId}/votes`),
    },

    comments: {
      getAll: (params = {}) => api.get('/comments', { params }),
      getPostComments: (postId, params = {}) => api.get(`/posts/${postId}/comments`, { params }),
      createComment: (postId, commentData) => api.post(`/posts/${postId}/comments`, commentData),
      updateComment: (id, commentData) => api.put(`/comments/${id}`, commentData),
      deleteComment: (id) => api.delete(`/comments/${id}`),
      voteComment: (id, value, voteType = null, fingerprint = null) =>
        api.post(`/comments/${id}/vote`, { value, type: voteType, fingerprint }),
      unvoteComment: (id, fingerprint = null) =>
        api.delete(`/comments/${id}/vote`, {
          data: { fingerprint },
        }),
      getCommentVoteStats: (id) => api.get(`/comments/${id}/vote-stats`),
      recent: (params = {}) => api.get('/comments/recent', { params }),
      tops: (params = {}) => api.get('/comments/tops', { params }),
    },

    polls: {
      getResults: (postId) => api.get(`/polls/${postId}/results`),
      vote: (postId, optionNumber) => api.post(`/polls/${postId}/vote/${optionNumber}`),
      removeVote: (postId) => api.delete(`/polls/${postId}/vote`),
    },

    users: {
      getProfile: () => api.get('/profile'),
      getUserByUsername,
      getUser: (userId) => api.get(`/users/${userId}`),
      updateProfile: (profileData) => api.put('/profile', profileData),
      getKarma: (userId) => api.get(`/users/${userId}/karma`),
      getUserAchievements: (userId) => api.get(`/users/${userId}/achievements`),
      getUserPosts: (userId, params = {}) => api.get(`/users/${userId}/posts`, { params }),
      getUserComments: (userId, params = {}) => api.get(`/users/${userId}/comments`, { params }),
      updateUserSettings: (settingsData) => api.put('/user/settings', settingsData),
      searchUsers: (query) => api.get('/users/search', { params: { q: query } }),
      getModerationHistory: () => api.get('/profile/moderation-history'),
      deleteAccount: (data) => api.delete('/profile', { data }),
      // Email change endpoints
      requestEmailChange: (data) => api.post('/user/email/change', data),
      cancelEmailChange: () => api.delete('/user/email/change'),
      getEmailChangeStatus: () => api.get('/user/email/change/status'),
      confirmEmailChange: (token) => api.post('/email/change/confirm', { token }),
      // Session management endpoints
      getSessions: () => api.get('/user/sessions'),
      revokeSession: (tokenId) => api.delete(`/user/sessions/${tokenId}`),
      revokeAllSessions: () => api.delete('/user/sessions'),
    },

    images: {
      uploadAvatar: (formData) => api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
      deleteAvatar: () => api.delete('/user/avatar'),
      uploadPostThumbnail: (postId, formData) => api.post(`/posts/${postId}/thumbnail`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
      uploadPostThumbnailFromUrl: (postId, url, options = {}) => api.post(`/posts/${postId}/thumbnail-from-url`, { url }, options),
      deletePostThumbnail: (postId) => api.delete(`/posts/${postId}/thumbnail`),
      uploadInlineImage: (formData) => api.post('/images/inline', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    },

    karma: {
      getLevels: () => api.get('/karma/levels'),
      getLeaderboard: (params = {}) => api.get('/karma/leaderboard', { params }),
      getActiveEvents: () => api.get('/karma/events/active'),
      getUpcomingEvents: () => api.get('/karma/events/upcoming'),
    },

    rankings: {
      getKarmaRanking: (params = {}) => api.get('/rankings/karma', { params }),
      getPostsRanking: (params = {}) => api.get('/rankings/posts', { params }),
      getCommentsRanking: (params = {}) => api.get('/rankings/comments', { params }),
      getStreaksRanking: (params = {}) => api.get('/rankings/streaks', { params }),
      getAchievementsRanking: (params = {}) => api.get('/rankings/achievements', { params }),
    },

    tags: {
      getTags: (params = {}) => api.get('/tags', { params }),
      getTag: (name) => api.get(`/tags/${name}`),
      getTagById: (id) => api.get(`/tags/id/${id}`),
      searchTags: (query) => api.get('/tags/search', { params: { q: query } }),
      getTagPosts: (id, params = {}) => api.get(`/tags/${id}/posts`, { params }),
      getPopularTags: (contentType = null, limit = 10) => {
        const params = { limit }
        if (contentType) params.content_type = contentType
        return api.get('/tags/popular', { params })
      },
      getTagsByCategory: (categoryId) => api.get(`/tags/category/${categoryId}`),
      getTagCategories: () => api.get('/tag-categories'),
    },

    savedLists: {
      getLists: () => api.get('/lists'),
      getList: (identifier) => api.get(`/lists/${identifier}`),
      getListByUsernameAndSlug: (username, slug) => api.get(`/lists/${username}/${slug}`),
      createList: (listData) => api.post('/lists', listData),
      updateList: (identifier, listData) => api.put(`/lists/${identifier}`, listData),
      deleteList: (identifier) => api.delete(`/lists/${identifier}`),
      getListPosts: (identifier, params = {}) => api.get(`/lists/${identifier}/posts`, { params }),
      addPostToList: (identifier, postId, notes = null) =>
        api.post(`/lists/${identifier}/posts`, { post_id: postId, notes }),
      removePostFromList: (identifier, postId) =>
        api.delete(`/lists/${identifier}/posts`, { data: { post_id: postId } }),
      toggleFavorite: (postId) => api.post('/posts/toggle-favorite', { post_id: postId }),
      toggleReadLater: (postId) => api.post('/posts/toggle-read-later', { post_id: postId }),
      updatePostNotes: (identifier, postId, notes) =>
        api.put(`/lists/${identifier}/posts/notes`, { post_id: postId, notes }),
      clearList: (identifier) => api.delete(`/lists/${identifier}/posts/all`),
    },

    media: {
      getMediaInfo: (url) => api.post('/media/info', { url }),
      validateMediaUrl: (url) => api.post('/media/validate', { url }),
      getUrlMetadata: (url) => api.get('/media/url-metadata', { params: { url } }),
    },

    user: {
      getPreferences: () => api.get('/preferences'),
      savePreferences: (preferencesData) => api.post('/preferences', preferencesData),
    },

    notifications: {
      // VAPID and Push Subscription
      getVapidPublicKey: () => api.get('/notifications/vapid-public-key'),
      savePushSubscription: (subscriptionData) =>
        api.post('/notifications/push-subscription', subscriptionData),
      removePushSubscription: (endpoint) =>
        api.delete('/notifications/push-subscription', { data: { endpoint } }),
      getPushSubscriptions: () => api.get('/notifications/push-subscriptions'),
      // Preferences
      getPreferences: () => api.get('/notifications/preferences'),
      updatePreferences: (preferences) =>
        api.put('/notifications/preferences', preferences),
      // Legacy aliases for backwards compatibility
      getPushPreferences: () => api.get('/notifications/preferences'),
      updatePushPreferences: (preferences) =>
        api.put('/notifications/preferences', preferences),
      // Test notification
      sendTestPushNotification: () => api.post('/notifications/test-push'),
      // Snooze
      snooze: (data) => api.post('/notifications/snooze', data),
      unsnooze: () => api.delete('/notifications/snooze'),
      // Database notifications
      markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
      markAllAsRead: () => api.post('/notifications/read-all'),
      getNotifications: (params = {}) => api.get('/notifications', { params }),
      deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
    },
    subs: {
      getSubs: (params = {}) => api.get('/subs', { params }),
      getSub: (nameOrId) => api.get(`/subs/${nameOrId}`),
      getSubPosts: (subId, params = {}) => api.get(`/subs/${subId}/posts`, { params }),
      createSub: (data) => api.post('/subs', data),
      updateSub: (subId, data) => api.put(`/subs/${subId}`, data),
      deleteSub: (subId) => api.delete(`/subs/${subId}`),
      joinSub: (subId) => api.post(`/subs/${subId}/join`),
      leaveSub: (subId) => api.post(`/subs/${subId}/leave`),
      getSubRules: (subId) => api.get(`/subs/${subId}/rules`),
      createMembershipRequest: (subId, data) =>
        api.post(`/subs/${subId}/membership-requests`, data),
      uploadIcon: (subId, formData) =>
        api.post(`/subs/${subId}/icon`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      // Moderation
      getPendingPosts: (subId) => api.get(`/subs/${subId}/pending-posts`),
      approvePost: (subId, postId) => api.post(`/subs/${subId}/posts/${postId}/approve`),
      rejectPost: (subId, postId) => api.post(`/subs/${subId}/posts/${postId}/reject`),
      // Members
      getMembers: (subId) => api.get(`/subs/${subId}/members`),
      removeMember: (subId, memberId) => api.delete(`/subs/${subId}/members/${memberId}`),
      // Membership requests
      getMembershipRequests: (subId) => api.get(`/subs/${subId}/membership-requests`),
      approveMembershipRequest: (subId, requestId) =>
        api.post(`/subs/${subId}/membership-requests/${requestId}/approve`),
      rejectMembershipRequest: (subId, requestId) =>
        api.post(`/subs/${subId}/membership-requests/${requestId}/reject`),
      // Moderators management
      getModerators: (subId) => api.get(`/subs/${subId}/moderators`),
      addModerator: (subId, userId) => api.post(`/subs/${subId}/moderators`, { user_id: userId }),
      removeModerator: (subId, userId) => api.delete(`/subs/${subId}/moderators/${userId}`),
      // Content moderation (hide/unhide posts)
      getHiddenPosts: (subId) => api.get(`/subs/${subId}/hidden-posts`),
      hidePost: (subId, postId, reason = null) =>
        api.post(`/subs/${subId}/posts/${postId}/hide`, { reason }),
      unhidePost: (subId, postId) => api.post(`/subs/${subId}/posts/${postId}/unhide`),
      // Ownership claim (for orphaned subs)
      getClaimStatus: (subId) => api.get(`/subs/${subId}/claim-status`),
      claimOwnership: (subId) => api.post(`/subs/${subId}/claim`),
    },

    invitations: {
      getInvitations: () => api.get('/invitations'),
      createInvitation: (data) => api.post('/invitations', data),
      deleteInvitation: (id) => api.delete(`/invitations/${id}`),
    },

    stats: {
      getGeneral: () => api.get('/stats/general'),
      getContent: () => api.get('/stats/content'),
      getUsers: () => api.get('/stats/users'),
      getEngagement: () => api.get('/stats/engagement'),
      getTrending: () => api.get('/stats/trending'),
      getTimeRange: () => api.get('/stats/time-range'),
      getStats: async () => {
        try {
          const [generalResponse, contentResponse] = await Promise.all([
            api.get('/stats/general'),
            api.get('/stats/content'),
          ])

          // Log responses for debugging only in development
          if (process.env.NODE_ENV === 'development') {
          }

          // Extract data from responses, ensuring we handle the correct structure
          // The backend returns data directly in the response.data object, not nested under a data property
          const generalData = generalResponse.data || {}
          const contentData = contentResponse.data || {}

          return {
            data: {
              total_users: parseInt(generalData.total_users || 0),
              active_users: parseInt(generalData.active_users_today || 0),
              total_posts: parseInt(generalData.total_posts || 0),
              total_comments: parseInt(generalData.total_comments || 0),
              published_posts: parseInt(contentData.published_posts || 0),
              pending_posts: parseInt(contentData.pending_posts || 0),
              posts_today: parseInt(generalData.posts_today || 0),
              comments_today: parseInt(generalData.comments_today || 0),
              published_today: parseInt(contentData.posts_last_24h || 0),
              posts_by_language: contentData.posts_by_language || [],
              popular_tags: contentData.popular_tags?.slice(0, 5) || [],
            },
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching stats:', error)
          }
          return { data: {} }
        }
      },
    },

    agora: {
      getMessages: (params = {}) => api.get('/agora', { params }),
      getMessage: (id) => api.get(`/agora/${id}`),
      createMessage: (messageData) => api.post('/agora', messageData),
      updateMessage: (id, messageData) => api.put(`/agora/${id}`, messageData),
      deleteMessage: (id) => api.delete(`/agora/${id}`),
      voteMessage: (id, value, voteType = null, fingerprint = null) =>
        api.post(`/agora/${id}/vote`, { value, vote_type: voteType, fingerprint }),
      unvoteMessage: (id) => api.delete(`/agora/${id}/vote`),
      recent: (params = {}) => api.get('/agora/recent', { params }),
      tops: (params = {}) => api.get('/agora/tops', { params }),
    },

    legalReports: {
      create: (reportData) => api.post('/legal-reports', reportData),
      getStatus: (referenceNumber, email) =>
        api.post('/legal-reports/status', { reference_number: referenceNumber, email }),
    },

    faq: {
      getAll: () => api.get('/faq'),
    },

    seals: {
      getUserSeals: () => api.get('/seals'),
      markPost: (postId, type) => api.post(`/posts/${postId}/seals`, { type }),
      unmarkPost: (postId, type) => api.delete(`/posts/${postId}/seals`, { data: { type } }),
      getPostMarks: (postId) => api.get(`/posts/${postId}/seals`),
      markComment: (commentId, type) => api.post(`/comments/${commentId}/seals`, { type }),
      unmarkComment: (commentId, type) => api.delete(`/comments/${commentId}/seals`, { data: { type } }),
      getCommentMarks: (commentId) => api.get(`/comments/${commentId}/seals`),
      checkUserMarks: (contentType, contentId) => api.post('/seals/check', { content_type: contentType, content_id: contentId }),
    },

    reports: {
      create: (reportData) => api.post('/reports', reportData),
      getReports: (params = {}) => api.get('/reports', { params }),
      getReport: (id) => api.get(`/reports/${id}`),
      delete: (id) => api.delete(`/reports/${id}`),
    },

    mastodon: {
      getStatus: () => api.get('/auth/mastodon/status'),
      getRedirectUrl: (instance) => api.post('/auth/mastodon/redirect', { instance }),
      callback: (code, state) => api.post('/auth/mastodon/callback', { code, state }),
    },

    mbin: {
      getStatus: () => api.get('/auth/mbin/status'),
      getRedirectUrl: (instance) => api.post('/auth/mbin/redirect', { instance }),
      callback: (code, state) => api.post('/auth/mbin/callback', { code, state }),
    },

    telegram: {
      getStatus: () => api.get('/auth/telegram/status'),
      callback: (telegramUser) => api.post('/auth/telegram/callback', telegramUser),
    },

    activitypub: {
      // Server-wide ActivityPub status
      getStatus: () => api.get('/activitypub/status'),
      // User federation settings
      getSettings: () => api.get('/activitypub/settings'),
      updateSettings: (data) => api.patch('/activitypub/settings', data),
      // Post federation settings
      getPostSettings: (postId) => api.get(`/activitypub/posts/${postId}/settings`),
      updatePostSettings: (postId, data) => api.patch(`/activitypub/posts/${postId}/settings`, data),
      // Sub federation settings (for moderators)
      getSubSettings: (subId) => api.get(`/activitypub/subs/${subId}/settings`),
      updateSubSettings: (subId, data) => api.patch(`/activitypub/subs/${subId}/settings`, data),
    },
  }

  return {
    provide: {
      api: apiWrapper,
    },
  }
})
