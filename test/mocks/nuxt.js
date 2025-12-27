import { vi } from 'vitest'

// Create persistent mock functions that can be configured in tests
const mockNuxtApp = {
  $api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getUser: vi.fn(),
      getToken: vi.fn().mockResolvedValue('test-token'),
    },
    posts: {
      getPosts: vi.fn(),
      getFrontpage: vi.fn(),
      getPending: vi.fn(),
      getPost: vi.fn(),
      getPostBySlug: vi.fn(),
      getPostByUuid: vi.fn(),
      votePost: vi.fn(),
      unvotePost: vi.fn(),
      createPost: vi.fn(),
      importPost: vi.fn(),
    },
    media: {
      validateMediaUrl: vi.fn(),
      getMediaInfo: vi.fn(),
    },
    comments: {
      getPostComments: vi.fn(),
      createComment: vi.fn(),
      voteComment: vi.fn(),
      unvoteComment: vi.fn(),
      getCommentVoteStats: vi.fn(),
    },
    subs: {
      getSubs: vi.fn(),
      getSub: vi.fn(),
      getSubPosts: vi.fn(),
      getSubRules: vi.fn(),
      createSub: vi.fn(),
      updateSub: vi.fn(),
      deleteSub: vi.fn(),
      joinSub: vi.fn(),
      leaveSub: vi.fn(),
      createMembershipRequest: vi.fn(),
    },
    notifications: {
      getVapidPublicKey: vi.fn().mockResolvedValue({ data: { public_key: 'test-key' } }),
      savePushSubscription: vi.fn().mockResolvedValue({}),
      removePushSubscription: vi.fn().mockResolvedValue({}),
      updatePushPreferences: vi.fn().mockResolvedValue({}),
      getPushPreferences: vi.fn().mockResolvedValue({
        data: { enabled: true, comments: true, votes: true, mentions: true, system: true },
      }),
      sendTestPushNotification: vi.fn().mockResolvedValue({}),
    },
    seals: {
      getUserSeals: vi.fn().mockResolvedValue({
        data: { available_seals: 5, total_earned: 10, total_used: 5, last_awarded_at: null },
      }),
      markPost: vi.fn().mockResolvedValue({
        data: {
          success: true,
          available_seals: 4,
          post: { recommended_seals_count: 1, advise_against_seals_count: 0 },
        },
      }),
      unmarkPost: vi.fn().mockResolvedValue({
        data: {
          success: true,
          available_seals: 5,
          post: { recommended_seals_count: 0, advise_against_seals_count: 0 },
        },
      }),
      markComment: vi.fn().mockResolvedValue({
        data: {
          success: true,
          available_seals: 4,
          comment: { recommended_seals_count: 1, advise_against_seals_count: 0 },
        },
      }),
      unmarkComment: vi.fn().mockResolvedValue({
        data: {
          success: true,
          available_seals: 5,
          comment: { recommended_seals_count: 0, advise_against_seals_count: 0 },
        },
      }),
      checkUserMarks: vi.fn().mockResolvedValue({
        data: { has_recommended: false, has_advise_against: false },
      }),
      getPostMarks: vi.fn().mockResolvedValue({
        data: { recommended: [], advise_against: [] },
      }),
      getCommentMarks: vi.fn().mockResolvedValue({
        data: { recommended: [], advise_against: [] },
      }),
    },
  },
  $redirectAfterAuth: vi.fn(),
}

export const useNuxtApp = vi.fn(() => mockNuxtApp)

export const useRoute = vi.fn(() => ({}))
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))
export const navigateTo = vi.fn()
export const useCookie = vi.fn()
export const useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBase: 'http://localhost:8000/api',
  },
}))
