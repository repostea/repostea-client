import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

describe('LoadingSpinner Component', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(LoadingSpinner, {
      global: {
        stubs: {
          i18n: true,
        },
        mocks: {
          $t: (key) => key,
          t: (key) => key,
        },
      },
    })
  })

  describe('Rendering', () => {
    it('renders the spinner container', () => {
      expect(wrapper.find('[role="status"]').exists()).toBe(true)
    })

    it('has correct accessibility attributes', () => {
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.attributes('role')).toBe('status')
      expect(spinner.attributes('aria-label')).toBeDefined()
    })

    it('does not show text by default', () => {
      expect(wrapper.find('span').exists()).toBe(false)
    })

    it('shows text when showText prop is true', async () => {
      await wrapper.setProps({ showText: true })
      expect(wrapper.find('span').exists()).toBe(true)
    })
  })

  describe('Size Variants', () => {
    it('applies xs size classes correctly', async () => {
      await wrapper.setProps({ size: 'xs' })
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('w-3')
      expect(spinner.classes()).toContain('h-3')
    })

    it('applies sm size classes correctly', async () => {
      await wrapper.setProps({ size: 'sm' })
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('w-4')
      expect(spinner.classes()).toContain('h-4')
    })

    it('applies md size classes correctly (default)', () => {
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('w-6')
      expect(spinner.classes()).toContain('h-6')
    })

    it('applies lg size classes correctly', async () => {
      await wrapper.setProps({ size: 'lg' })
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('w-8')
      expect(spinner.classes()).toContain('h-8')
    })

    it('applies xl size classes correctly', async () => {
      await wrapper.setProps({ size: 'xl' })
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('w-10')
      expect(spinner.classes()).toContain('h-10')
    })
  })

  describe('Color Variants', () => {
    it('applies primary color classes correctly (default)', () => {
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('border-primary')
      expect(spinner.classes()).toContain('border-t-transparent')
    })

    it('applies white color classes correctly', async () => {
      await wrapper.setProps({ color: 'white' })
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('border-white')
    })

    it('applies neutral color classes correctly', async () => {
      await wrapper.setProps({ color: 'neutral' })
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('border-neutral-500')
    })

    it('applies current color classes correctly', async () => {
      await wrapper.setProps({ color: 'current' })
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('border-current')
    })
  })

  describe('Display Modes', () => {
    it('applies block display mode correctly (default)', () => {
      const container = wrapper.find('div')
      expect(container.classes()).toContain('flex')
      expect(container.classes()).toContain('items-center')
    })

    it('applies inline display mode correctly', async () => {
      await wrapper.setProps({ display: 'inline' })
      const container = wrapper.find('div')
      expect(container.classes()).toContain('inline-flex')
      expect(container.classes()).toContain('items-center')
    })

    it('applies centered display mode correctly', async () => {
      await wrapper.setProps({ display: 'centered' })
      const container = wrapper.find('div')
      expect(container.classes()).toContain('flex')
      expect(container.classes()).toContain('items-center')
      expect(container.classes()).toContain('justify-center')
    })
  })

  describe('Loading Text', () => {
    it('uses default i18n text when no custom text provided', async () => {
      await wrapper.setProps({ showText: true })
      const text = wrapper.find('span')
      expect(text.text()).toBe('common.loading')
    })

    it('uses custom text when provided', async () => {
      await wrapper.setProps({ showText: true, text: 'Custom Loading...' })
      const text = wrapper.find('span')
      expect(text.text()).toBe('Custom Loading...')
    })

    it('applies correct text size for small spinners', async () => {
      await wrapper.setProps({ showText: true, size: 'xs' })
      const text = wrapper.find('span')
      expect(text.classes()).toContain('text-xs')
    })

    it('applies correct text size for medium/large spinners', async () => {
      await wrapper.setProps({ showText: true, size: 'md' })
      const text = wrapper.find('span')
      expect(text.classes()).toContain('text-sm')
    })
  })

  describe('Custom Classes', () => {
    it('applies custom CSS classes to container', async () => {
      await wrapper.setProps({ customClass: 'my-custom-class another-class' })
      const container = wrapper.find('div')
      expect(container.classes()).toContain('my-custom-class')
      expect(container.classes()).toContain('another-class')
    })
  })

  describe('Animation', () => {
    it('has animate-spin class for rotation', () => {
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('animate-spin')
    })

    it('has rounded-full class for circular shape', () => {
      const spinner = wrapper.find('[role="status"]')
      expect(spinner.classes()).toContain('rounded-full')
    })
  })

  describe('Props Validation', () => {
    it('accepts valid size values', async () => {
      const validSizes = ['xs', 'sm', 'md', 'lg', 'xl']
      for (const size of validSizes) {
        await wrapper.setProps({ size })
        expect(wrapper.props('size')).toBe(size)
      }
    })

    it('accepts valid color values', async () => {
      const validColors = ['primary', 'white', 'neutral', 'current']
      for (const color of validColors) {
        await wrapper.setProps({ color })
        expect(wrapper.props('color')).toBe(color)
      }
    })

    it('accepts valid display values', async () => {
      const validDisplays = ['inline', 'block', 'centered']
      for (const display of validDisplays) {
        await wrapper.setProps({ display })
        expect(wrapper.props('display')).toBe(display)
      }
    })
  })

  describe('Combinations', () => {
    it('works correctly with multiple props combined', async () => {
      await wrapper.setProps({
        size: 'lg',
        color: 'white',
        display: 'centered',
        showText: true,
        text: 'Loading data...',
        customClass: 'mt-4',
      })

      const container = wrapper.find('div')
      const spinner = wrapper.find('[role="status"]')
      const text = wrapper.find('span')

      expect(spinner.classes()).toContain('w-8')
      expect(spinner.classes()).toContain('border-white')
      expect(container.classes()).toContain('justify-center')
      expect(container.classes()).toContain('mt-4')
      expect(text.text()).toBe('Loading data...')
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot with default props', () => {
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with text shown', async () => {
      await wrapper.setProps({ showText: true, text: 'Loading...' })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with custom styling', async () => {
      await wrapper.setProps({
        size: 'xl',
        color: 'neutral',
        display: 'centered',
        customClass: 'py-8',
      })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
