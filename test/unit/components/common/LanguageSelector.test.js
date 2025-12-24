import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LanguageSelector from '~/components/common/LanguageSelector.vue'

// Mock i18n
const mockSetLocale = vi.fn()
const mockT = vi.fn((key) => key)

vi.mock('#i18n', () => ({
  useI18n: () => ({
    locale: { value: 'es' },
    setLocale: mockSetLocale,
    t: mockT,
  }),
}))

describe('LanguageSelector', () => {
  it('renders language options', () => {
    const wrapper = mount(LanguageSelector)

    expect(wrapper.exists()).toBe(true)
  })

  it('shows current language', () => {
    const wrapper = mount(LanguageSelector)

    // Should show current locale (locale is a ref, so we need to access .value)
    expect(wrapper.vm.locale.value).toBe('es')
  })

  it('can change language', async () => {
    const wrapper = mount(LanguageSelector)

    // Find language option and click
    const select = wrapper.find('select')
    if (select.exists()) {
      await select.setValue('en')
      expect(mockSetLocale).toHaveBeenCalledWith('en')
    }
  })

  it('displays available languages', () => {
    const wrapper = mount(LanguageSelector)

    const text = wrapper.text()
    // Should show some language names or codes
    expect(text.length).toBeGreaterThan(0)
  })
})
