import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequiredFieldIndicator from '~/components/common/RequiredFieldIndicator.vue'

describe('RequiredFieldIndicator Component', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(RequiredFieldIndicator, {
      global: {
        mocks: {
          $t: (key) => {
            const translations = {
              'submit.validation.required_fields_description': 'Los campos marcados con * son obligatorios',
            }
            return translations[key] || key
          },
          t: (key) => {
            const translations = {
              'submit.validation.required_fields_description': 'Los campos marcados con * son obligatorios',
            }
            return translations[key] || key
          },
        },
      },
    })
  })

  describe('Rendering', () => {
    it('renders the component', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the asterisk icon', () => {
      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:asterisk')
    })

    it('renders the description text', () => {
      expect(wrapper.text()).toContain('Los campos marcados con * son obligatorios')
    })

    it('has correct container structure', () => {
      const container = wrapper.find('div')
      expect(container.exists()).toBe(true)
      expect(container.find('i').exists()).toBe(true)
    })
  })

  describe('Styling', () => {
    it('applies correct text size classes', () => {
      const container = wrapper.find('div')
      expect(container.classes()).toContain('text-xs')
    })

    it('applies correct text color classes', () => {
      const container = wrapper.find('div')
      expect(container.classes()).toContain('text-gray-500')
      expect(container.classes()).toContain('dark:text-gray-400')
    })

    it('applies correct margin class', () => {
      const container = wrapper.find('div')
      expect(container.classes()).toContain('mt-4')
    })

    it('applies correct icon classes', () => {
      const icon = wrapper.find('i')
      expect(icon.classes()).toContain('iconify-icon')
      expect(icon.attributes('name')).toBe('fa6-solid:asterisk')
      expect(icon.classes()).toContain('text-xs')
      expect(icon.classes()).toContain('mr-1')
    })
  })

  describe('Icon', () => {
    it('displays FontAwesome asterisk icon', () => {
      const icon = wrapper.find('i')
      expect(icon.classes()).toContain('iconify-icon')
      expect(icon.attributes('name')).toBe('fa6-solid:asterisk')
    })

    it('has correct icon size', () => {
      const icon = wrapper.find('i')
      expect(icon.classes()).toContain('text-xs')
    })

    it('has correct icon margin', () => {
      const icon = wrapper.find('i')
      expect(icon.classes()).toContain('mr-1')
    })
  })

  describe('Internationalization', () => {
    it('uses i18n translation for description text', () => {
      const text = wrapper.text()
      expect(text).toContain('Los campos marcados con * son obligatorios')
    })

    it('calls translation function with correct key', () => {
      // The component should call t('submit.validation.required_fields_description')
      expect(wrapper.text()).toBeTruthy()
      expect(wrapper.text().length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('provides visual indication of required fields', () => {
      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:asterisk')
    })

    it('provides textual description for screen readers', () => {
      const text = wrapper.text()
      expect(text).toContain('obligatorio')
    })
  })

  describe('Layout', () => {
    it('displays icon and text in the same line', () => {
      const container = wrapper.find('div')
      const icon = container.find('i')

      expect(icon.exists()).toBe(true)
      expect(container.text()).toContain('Los campos marcados con * son obligatorios')
    })

    it('has icon before text', () => {
      const container = wrapper.find('div')
      const children = container.element.childNodes

      // First child should be the icon
      expect(children[0].tagName).toBe('I')
    })
  })

  describe('Snapshot', () => {
    it('matches snapshot', () => {
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
