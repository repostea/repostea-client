import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SubPage from '~/pages/s/[name]/index.vue'

// Mock vue-router
const mockRoute = {
  params: { name: 'test-sub' },
  fullPath: '/s/test-sub',
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, params) => {
      if (params) return `${key} ${JSON.stringify(params)}`
      return key
    },
  }),
}))

vi.mock('#i18n', () => ({
  useLocalePath: () => (path) => path,
}))

// Mock #app and #imports
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      siteUrl: 'http://localhost:3000',
    },
  }),
}))

vi.mock('#imports', () => ({
  useSeoMeta: vi.fn(),
  useHead: vi.fn(),
}))

// Mock useNotification composable
const mockSuccess = vi.fn()
const mockShowError = vi.fn()
const mockInfo = vi.fn()

vi.mock('~/composables/useNotification', () => ({
  useNotification: () => ({
    success: mockSuccess,
    showError: mockShowError,
    info: mockInfo,
  }),
}))

// Mock API
const mockClaimOwnership = vi.fn()
const mockApi = {
  subs: {
    claimOwnership: mockClaimOwnership,
  },
}

vi.mock('#app', async () => {
  const actual = await vi.importActual('#app')
  return {
    ...actual,
    useNuxtApp: () => ({
      $api: mockApi,
    }),
    useRuntimeConfig: () => ({
      public: {
        siteUrl: 'http://localhost:3000',
      },
    }),
  }
})

// Mock stores
const mockSubsStore = {
  currentSub: null,
  subRules: [],
  subPosts: [],
  loading: false,
  error: null,
  postsMeta: { lastPage: 1 },
  fetchSub: vi.fn(),
  fetchSubRules: vi.fn(),
  fetchSubPosts: vi.fn(),
  clearCurrentSub: vi.fn(),
  joinSub: vi.fn(),
  leaveSub: vi.fn(),
}

vi.mock('~/stores/subs', () => ({
  useSubsStore: () => mockSubsStore,
}))

const mockAuthStore = {
  isAuthenticated: false,
}

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

const mockUserPreferencesStore = {
  layout: 'default',
}

vi.mock('~/stores/userPreferences', () => ({
  useUserPreferencesStore: () => mockUserPreferencesStore,
}))

describe('Sub Page - Orphaned Sub Claiming', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset store state
    mockSubsStore.currentSub = null
    mockSubsStore.loading = false
    mockSubsStore.error = null
    mockAuthStore.isAuthenticated = false

    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
  })

  const createWrapper = (subData = null) => {
    if (subData) {
      mockSubsStore.currentSub = subData
    }

    return mount(SubPage, {
      global: {
        plugins: [pinia],
        stubs: {
          Icon: { template: '<span class="icon-stub"></span>', props: ['name'] },
          NuxtLink: { template: '<a><slot /></a>', props: ['to'] },
          SubIcon: { template: '<div class="sub-icon-stub"></div>', props: ['sub', 'size'] },
          PostList: { template: '<div class="post-list-stub"></div>' },
          FilterControls: { template: '<div class="filter-controls-stub"></div>' },
          LayoutSelector: { template: '<div class="layout-selector-stub"></div>' },
          ContentLanguageSelector: {
            template: '<div class="content-language-selector-stub"></div>',
          },
          Teleport: { template: '<div><slot /></div>' },
        },
      },
    })
  }

  describe('Orphaned Sub Banner Rendering', () => {
    it('should not show orphaned banner for non-orphaned sub', async () => {
      const normalSub = {
        id: 1,
        name: 'test-sub',
        display_name: 'Test Sub',
        is_orphaned: false,
        can_claim: false,
        is_member: true,
      }

      wrapper = createWrapper(normalSub)
      await flushPromises()

      const orphanedBanner = wrapper.find('[class*="bg-orange-50"]')
      expect(orphanedBanner.exists()).toBe(false)
    })

    it('should show orphaned banner when sub is orphaned and user can claim', async () => {
      const orphanedSub = {
        id: 1,
        name: 'test-sub',
        display_name: 'Test Sub',
        is_orphaned: true,
        can_claim: true,
        has_claim_priority: false,
        is_member: true,
      }

      wrapper = createWrapper(orphanedSub)
      await flushPromises()

      const orphanedBanner = wrapper.find('[class*="bg-orange-50"]')
      expect(orphanedBanner.exists()).toBe(true)
    })

    it('should show info banner when orphaned but user cannot claim', async () => {
      const orphanedSub = {
        id: 1,
        name: 'test-sub',
        display_name: 'Test Sub',
        is_orphaned: true,
        can_claim: false,
        is_member: true,
      }

      wrapper = createWrapper(orphanedSub)
      await flushPromises()

      // Should show the gray info banner instead of orange claim banner
      const infoBanner = wrapper.find('[class*="bg-gray-50"]')
      expect(infoBanner.exists()).toBe(true)
    })

    it('should show moderator claim text when user has priority', async () => {
      const orphanedSub = {
        id: 1,
        name: 'test-sub',
        display_name: 'Test Sub',
        is_orphaned: true,
        can_claim: true,
        has_claim_priority: true,
        is_member: true,
      }

      wrapper = createWrapper(orphanedSub)
      await flushPromises()

      const claimButton = wrapper.find('button[class*="bg-orange-600"]')
      expect(claimButton.exists()).toBe(true)
      expect(claimButton.text()).toContain('subs.claim_as_moderator')
    })

    it('should show member claim text when user does not have priority', async () => {
      const orphanedSub = {
        id: 1,
        name: 'test-sub',
        display_name: 'Test Sub',
        is_orphaned: true,
        can_claim: true,
        has_claim_priority: false,
        is_member: true,
      }

      wrapper = createWrapper(orphanedSub)
      await flushPromises()

      const claimButton = wrapper.find('button[class*="bg-orange-600"]')
      expect(claimButton.exists()).toBe(true)
      expect(claimButton.text()).toContain('subs.claim_as_member')
    })
  })

  describe('Claim Ownership Button', () => {
    it('should have claim button present and clickable', async () => {
      const orphanedSub = {
        id: 1,
        name: 'test-sub',
        display_name: 'Test Sub',
        is_orphaned: true,
        can_claim: true,
        has_claim_priority: false,
        is_member: true,
      }

      mockClaimOwnership.mockResolvedValue({})

      wrapper = createWrapper(orphanedSub)
      await flushPromises()

      const claimButton = wrapper.find('button[class*="bg-orange-600"]')
      expect(claimButton.exists()).toBe(true)

      // Button should not be disabled initially
      expect(claimButton.attributes('disabled')).toBeUndefined()
    })

    it('should not show claim button when sub is not orphaned', async () => {
      const normalSub = {
        id: 1,
        name: 'test-sub',
        display_name: 'Test Sub',
        is_orphaned: false,
        can_claim: false,
        is_member: true,
      }

      wrapper = createWrapper(normalSub)
      await flushPromises()

      const claimButton = wrapper.find('button[class*="bg-orange-600"]')
      expect(claimButton.exists()).toBe(false)
    })
  })
})
