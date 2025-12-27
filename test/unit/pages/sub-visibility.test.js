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
    t: (key) => key,
  }),
}))

vi.mock('#i18n', () => ({
  useLocalePath: () => (path) => path,
}))

// Mock #app
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      siteUrl: 'http://localhost:3000',
    },
  }),
  useNuxtApp: () => ({
    $api: {
      subs: { claimOwnership: vi.fn() },
      post: vi.fn(),
    },
  }),
}))

vi.mock('#imports', () => ({
  useSeoMeta: vi.fn(),
  useHead: vi.fn(),
}))

// Mock useNotification
vi.mock('~/composables/useNotification', () => ({
  useNotification: () => ({
    success: vi.fn(),
    showError: vi.fn(),
    info: vi.fn(),
  }),
}))

// Mock stores
const mockSubsStore = {
  currentSub: null,
  subRules: [],
  subPosts: [],
  loading: false,
  error: null,
  postsMeta: { lastPage: 1, currentPage: 1, total: 0 },
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
  user: null,
}

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

const mockUserPreferencesStore = {
  layout: 'card',
}

vi.mock('~/stores/userPreferences', () => ({
  useUserPreferencesStore: () => mockUserPreferencesStore,
}))

describe('Sub Visibility Settings', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    vi.clearAllMocks()
    mockSubsStore.currentSub = null
    mockSubsStore.loading = false
    mockSubsStore.error = null

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
          Icon: { template: '<span class="icon-stub" :data-name="name"></span>', props: ['name'] },
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
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

  const baseSub = {
    id: 1,
    name: 'test-sub',
    display_name: 'Test Sub',
    description: 'A test community',
    icon: '💻',
    color: '#3B82F6',
    members_count: 100,
    posts_count: 50,
    created_at: '2024-01-01',
    is_member: true,
    is_moderator: false,
    is_owner: false,
    is_orphaned: false,
    can_claim: false,
    hide_owner: false,
    hide_moderators: false,
    public_moderators: [],
    creator: {
      id: 1,
      username: 'owner_user',
      avatar: null,
    },
  }

  describe('Owner visibility', () => {
    it('shows owner when hide_owner is false', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_owner: false,
        creator: { id: 1, username: 'the_owner', avatar: null },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('the_owner')
      expect(wrapper.text()).toContain('subs.owner')
    })

    it('hides owner when hide_owner is true', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_owner: true,
        creator: { id: 1, username: 'hidden_owner', avatar: null },
      })
      await flushPromises()

      expect(wrapper.text()).not.toContain('hidden_owner')
    })
  })

  describe('Moderators visibility', () => {
    it('shows moderators section when hide_moderators is false and has moderators', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_moderators: false,
        public_moderators: [
          { id: 1, username: 'mod1', avatar: null, pivot: { is_owner: true } },
          { id: 2, username: 'mod2', avatar: null, pivot: { is_owner: false } },
        ],
      })
      await flushPromises()

      const text = wrapper.text()
      expect(text).toContain('subs.moderators')
      expect(text).toContain('mod1')
      expect(text).toContain('mod2')
    })

    it('hides moderators section when hide_moderators is true', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_moderators: true,
        public_moderators: [
          { id: 1, username: 'hidden_mod', avatar: null, pivot: { is_owner: false } },
        ],
      })
      await flushPromises()

      expect(wrapper.text()).not.toContain('hidden_mod')
    })

    it('hides moderators section when public_moderators is empty', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_moderators: false,
        public_moderators: [],
      })
      await flushPromises()

      // Should not show moderators header when list is empty
      const moderatorsHeader = wrapper.findAll('h3').find((h) => h.text() === 'subs.moderators')
      expect(moderatorsHeader).toBeUndefined()
    })

    it('shows owner badge on owner in moderators list', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_moderators: false,
        public_moderators: [
          { id: 1, username: 'owner_mod', avatar: null, pivot: { is_owner: true } },
          { id: 2, username: 'regular_mod', avatar: null, pivot: { is_owner: false } },
        ],
      })
      await flushPromises()

      const html = wrapper.html()
      expect(html).toContain('owner_mod')
      expect(html).toContain('regular_mod')
      // Owner badge should appear (yellow background)
      expect(html).toContain('bg-yellow')
    })
  })

  describe('Combined visibility settings', () => {
    it('can hide both owner and moderators', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_owner: true,
        hide_moderators: true,
        creator: { id: 1, username: 'hidden_owner', avatar: null },
        public_moderators: [
          { id: 2, username: 'hidden_mod', avatar: null, pivot: { is_owner: false } },
        ],
      })
      await flushPromises()

      const text = wrapper.text()
      expect(text).not.toContain('hidden_owner')
      expect(text).not.toContain('hidden_mod')
    })

    it('can show owner while hiding moderators', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_owner: false,
        hide_moderators: true,
        creator: { id: 1, username: 'visible_owner', avatar: null },
        public_moderators: [
          { id: 2, username: 'hidden_mod', avatar: null, pivot: { is_owner: false } },
        ],
      })
      await flushPromises()

      const text = wrapper.text()
      expect(text).toContain('visible_owner')
      expect(text).not.toContain('hidden_mod')
    })

    it('can show moderators while hiding owner', async () => {
      wrapper = createWrapper({
        ...baseSub,
        hide_owner: true,
        hide_moderators: false,
        creator: { id: 1, username: 'hidden_owner', avatar: null },
        public_moderators: [
          { id: 2, username: 'visible_mod', avatar: null, pivot: { is_owner: false } },
        ],
      })
      await flushPromises()

      const text = wrapper.text()
      expect(text).not.toContain('hidden_owner')
      expect(text).toContain('visible_mod')
    })
  })
})
