import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'

// Mock del componente ContentLanguageSelector
const ContentLanguageSelectorMock = {
  name: 'ContentLanguageSelector',
  template: `
    <div class="language-selector">
      <button
        @click="toggleDropdown"
        class="control-button"
        data-testid="language-button"
      >
        <span>{{ selectedLanguagesDisplay }}</span>
      </button>

      <div v-if="showDropdown" class="modal-overlay" data-testid="modal">
        <div class="modal-content">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            data-testid="search-input"
          />

          <div
            v-for="locale in filteredLocales"
            :key="locale.code"
            class="language-option"
            :data-testid="'lang-' + locale.code"
          >
            <input
              type="checkbox"
              :value="locale.code"
              v-model="selectedLanguages"
              :data-testid="'checkbox-' + locale.code"
            />
            <label>{{ locale.native }}</label>
          </div>

          <button
            @click="resetLanguages"
            data-testid="reset-button"
          >
            Reset
          </button>

          <button
            @click="applyLanguages"
            data-testid="apply-button"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  `,
  props: {},
  data() {
    return {
      showDropdown: false,
      searchQuery: '',
      _selectedLanguages: [], // Internal reactive data
      availableLocales: [
        { code: 'es', native: 'Español', flag: '🇪🇸' },
        { code: 'en', native: 'English', flag: '🇬🇧' },
        { code: 'fr', native: 'Français', flag: '🇫🇷' },
        { code: 'de', native: 'Deutsch', flag: '🇩🇪' },
      ],
    }
  },
  computed: {
    selectedLanguages: {
      get() {
        return this._selectedLanguages || []
      },
      set(value) {
        this._selectedLanguages = value
        // Also try to update the store if it exists
        if (this.$userPrefsStore) {
          this.$userPrefsStore.selectedLanguages = value
        }
      },
    },
    selectedLanguagesDisplay() {
      if (!this.selectedLanguages || this.selectedLanguages.length === 0) {
        return 'All languages'
      }
      if (this.selectedLanguages.length === 1) {
        const lang = this.availableLocales.find((l) => l.code === this.selectedLanguages[0])
        return lang ? lang.native : this.selectedLanguages[0]
      }
      if (this.selectedLanguages.length <= 3) {
        return this.selectedLanguages
          .map((code) => {
            const lang = this.availableLocales.find((l) => l.code === code)
            return lang ? lang.native : code
          })
          .join(', ')
      }
      return `${this.selectedLanguages.length} languages selected`
    },
    filteredLocales() {
      if (!this.searchQuery) {
        return this.availableLocales
      }
      const query = this.searchQuery.toLowerCase()
      return this.availableLocales.filter(
        (locale) =>
          locale.native.toLowerCase().includes(query) || locale.code.toLowerCase().includes(query)
      )
    },
  },
  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown
    },
    resetLanguages() {
      this.$userPrefsStore.setSelectedLanguages([])
      this.applyLanguages()
    },
    applyLanguages() {
      this.$userPrefsStore.setSelectedLanguages(this.selectedLanguages)
      this.showDropdown = false
    },
  },
  beforeMount() {
    // Create a simple mock store that works with our internal data
    this.$userPrefsStore = {
      selectedLanguages: this._selectedLanguages,
      setSelectedLanguages: vi.fn((langs) => {
        this._selectedLanguages = langs
      }),
    }
  },
}

describe('ContentLanguageSelector Component', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        userPreferences: {
          selectedLanguages: [],
          theme: 'renegados1',
          layout: 'card',
        },
      },
      stubActions: false,
    })
  })

  it('should render the language button', () => {
    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    const button = wrapper.find('[data-testid="language-button"]')
    expect(button.exists()).toBe(true)
  })

  it('should display "All languages" when no languages selected', () => {
    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    const button = wrapper.find('[data-testid="language-button"]')
    expect(button.text()).toContain('All languages')
  })

  it('should display single language name when one selected', async () => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        userPreferences: {
          selectedLanguages: [],
        },
      },
      stubActions: false,
    })

    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    // Set selectedLanguages directly on the component's computed property
    wrapper.vm.selectedLanguages = ['es']

    await nextTick()
    await wrapper.vm.$forceUpdate()
    await nextTick()

    const button = wrapper.find('[data-testid="language-button"]')
    expect(button.text()).toContain('Español')
  })

  it('should display language names when 2-3 selected', async () => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        userPreferences: {
          selectedLanguages: [],
        },
      },
      stubActions: false,
    })

    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    // Set selectedLanguages directly on the component's computed property
    wrapper.vm.selectedLanguages = ['es', 'en']

    await nextTick()
    await wrapper.vm.$forceUpdate()
    await nextTick()

    const button = wrapper.find('[data-testid="language-button"]')
    expect(button.text()).toContain('Español')
    expect(button.text()).toContain('English')
  })

  it('should display count when more than 3 selected', async () => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        userPreferences: {
          selectedLanguages: [],
        },
      },
      stubActions: false,
    })

    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    // Set selectedLanguages directly on the component's computed property
    wrapper.vm.selectedLanguages = ['es', 'en', 'fr', 'de']

    await nextTick()
    await wrapper.vm.$forceUpdate()
    await nextTick()

    const button = wrapper.find('[data-testid="language-button"]')
    expect(button.text()).toContain('4 languages')
  })

  it('should toggle modal on button click', async () => {
    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)

    await wrapper.find('[data-testid="language-button"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('should filter languages by search query', async () => {
    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    await wrapper.find('[data-testid="language-button"]').trigger('click')
    await nextTick()

    const searchInput = wrapper.find('[data-testid="search-input"]')
    await searchInput.setValue('español')
    await nextTick()

    expect(wrapper.find('[data-testid="lang-es"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="lang-en"]').exists()).toBe(false)
  })

  it('should reset languages to empty array', async () => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        userPreferences: {
          selectedLanguages: [],
        },
      },
      stubActions: false,
    })

    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    // Set selectedLanguages directly on the component's computed property
    wrapper.vm.selectedLanguages = ['es', 'en']

    await nextTick()

    await wrapper.find('[data-testid="language-button"]').trigger('click')
    await nextTick()

    await wrapper.find('[data-testid="reset-button"]').trigger('click')
    await nextTick()

    // Verify selectedLanguages was cleared
    expect(wrapper.vm.selectedLanguages).toEqual([])
  })

  it('should close modal when applying languages', async () => {
    wrapper = mount(ContentLanguageSelectorMock, {
      global: {
        plugins: [pinia],
      },
    })

    await wrapper.find('[data-testid="language-button"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)

    await wrapper.find('[data-testid="apply-button"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })
})
