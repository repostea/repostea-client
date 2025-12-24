import { vi } from 'vitest'
import { computed as vueComputed, ref as vueRef } from 'vue'

// Mock for Nuxt auto-imports (#imports)
// This file mocks all the composables that Nuxt auto-imports in production

// Re-export Vue composables that are auto-imported
export const computed = vueComputed
export const ref = vueRef

export const useSeoMeta = vi.fn(() => {})
export const useHead = vi.fn(() => {})
export const useState = vi.fn((key, init) => {
  const state = init ? init() : null
  return {
    value: state,
  }
})
export const useAsyncData = vi.fn((_key, _handler) => ({
  data: { value: null },
  pending: { value: false },
  error: { value: null },
  refresh: vi.fn(),
}))
export const useFetch = vi.fn((_url) => ({
  data: { value: null },
  pending: { value: false },
  error: { value: null },
  refresh: vi.fn(),
}))
export const useRequestHeaders = vi.fn(() => ({}))
export const useRequestEvent = vi.fn(() => ({}))
export const useRuntimeConfig = vi.fn(() => ({
  public: {},
}))
export const useError = vi.fn()
export const createError = vi.fn((error) => error)
export const showError = vi.fn()
export const clearError = vi.fn()
export const definePageMeta = vi.fn()
export const defineNuxtComponent = vi.fn()
export const defineNuxtPlugin = vi.fn()
export const useHydration = vi.fn()
export const callOnce = vi.fn((fn) => fn())
export const useRequestURL = vi.fn(() => new URL('http://localhost:3000'))
export const useAppConfig = vi.fn(() => ({}))
export const updateAppConfig = vi.fn()
export const defineAppConfig = vi.fn()
export const preloadComponents = vi.fn()
export const preloadRouteComponents = vi.fn()
export const prefetchComponents = vi.fn()
export const reloadNuxtApp = vi.fn()
export const useLoadingIndicator = vi.fn(() => ({
  start: vi.fn(),
  finish: vi.fn(),
  clear: vi.fn(),
  progress: { value: 0 },
  isLoading: { value: false },
}))

// i18n composables (auto-imported by Nuxt)
export const useI18n = vi.fn(() => ({
  t: (key, params) => {
    // Specific translations for tests
    const translations = {
      'seals.recommended_tooltip': `Recommended by ${params?.count || 0} users`,
      'seals.advised_against_tooltip': `Advised against by ${params?.count || 0} users`,
      'seals.recommended': 'Recommended',
      'seals.advised_against': 'Advised against',
    }
    return translations[key] || key
  },
  locale: { value: 'es' },
}))

export const useLocalePath = vi.fn(() => (path) => path)

// Nuxt app composable (needed for stores that use $api)
// Create persistent mock functions that can be configured in tests
const mockNuxtApp = {
  $api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getUser: vi.fn(),
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
    savedLists: {
      getLists: vi.fn(),
      getList: vi.fn(),
      getListPosts: vi.fn(),
      createList: vi.fn(),
      updateList: vi.fn(),
      deleteList: vi.fn(),
      addPostToList: vi.fn(),
      removePostFromList: vi.fn(),
      toggleFavorite: vi.fn(),
      toggleReadLater: vi.fn(),
      updatePostNotes: vi.fn(),
      clearList: vi.fn(),
      getListByUsernameAndSlug: vi.fn(),
    },
    seals: {
      getUserSeals: vi.fn().mockResolvedValue({
        data: { available_seals: 5, total_earned: 10, total_used: 5, last_awarded_at: null },
      }),
      markPost: vi.fn().mockResolvedValue({
        data: { success: true, available_seals: 4, post: { recommended_seals_count: 1, advise_against_seals_count: 0 } },
      }),
      unmarkPost: vi.fn().mockResolvedValue({
        data: { success: true, available_seals: 5, post: { recommended_seals_count: 0, advise_against_seals_count: 0 } },
      }),
      markComment: vi.fn().mockResolvedValue({
        data: { success: true, available_seals: 4, comment: { recommended_seals_count: 1, advise_against_seals_count: 0 } },
      }),
      unmarkComment: vi.fn().mockResolvedValue({
        data: { success: true, available_seals: 5, comment: { recommended_seals_count: 0, advise_against_seals_count: 0 } },
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

// Router composables
export const useRoute = vi.fn(() => ({
  path: '/',
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  name: undefined,
  redirectedFrom: undefined,
}))

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  beforeEach: vi.fn(),
  afterEach: vi.fn(),
  currentRoute: { value: { path: '/' } },
}))

// Session composable
export const useSession = vi.fn(() => ({
  getSessionId: () => 'test-session-123',
  getScreenResolution: () => '1920x1080',
  getReferer: () => '',
}))

// Cookie composable
export const useCookie = vi.fn((_name) => ({
  value: null,
}))
