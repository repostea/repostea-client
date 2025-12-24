import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SealCornerBadge from '~/components/seals/SealCornerBadge.vue'

describe('SealCornerBadge Component', () => {
  const createWrapper = (props = {}) => {
    return mount(SealCornerBadge, {
      props,
      global: {
        mocks: {},
      },
    })
  }

  describe('Rendering', () => {
    it('does not render when both counts are zero', () => {
      const wrapper = createWrapper({
        recommendedCount: 0,
        adviseAgainstCount: 0,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(false)
    })

    it('does not render when counts are equal (tie)', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 5,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(false)
    })

    it('renders when recommendedCount is greater than adviseAgainstCount', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 2,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(true)
    })

    it('renders when adviseAgainstCount is greater than recommendedCount', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 5,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(true)
    })

    it('renders when recommendedCount > 0 and adviseAgainstCount is 0', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 0,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(true)
    })

    it('renders when adviseAgainstCount > 0 and recommendedCount is 0', () => {
      const wrapper = createWrapper({
        recommendedCount: 0,
        adviseAgainstCount: 3,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(true)
    })
  })

  describe('showBadge Computed Property', () => {
    it('computes showBadge as false when both counts are zero', () => {
      const wrapper = createWrapper({
        recommendedCount: 0,
        adviseAgainstCount: 0,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(false)
    })

    it('computes showBadge as false when counts are equal (tie)', () => {
      const wrapper = createWrapper({
        recommendedCount: 3,
        adviseAgainstCount: 3,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(false)
    })

    it('computes showBadge as true when recommendedCount > adviseAgainstCount', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 2,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(true)
    })

    it('computes showBadge as true when adviseAgainstCount > recommendedCount', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 5,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(true)
    })

    it('computes showBadge as true when only recommendedCount is positive', () => {
      const wrapper = createWrapper({
        recommendedCount: 4,
        adviseAgainstCount: 0,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(true)
    })

    it('computes showBadge as true when only adviseAgainstCount is positive', () => {
      const wrapper = createWrapper({
        recommendedCount: 0,
        adviseAgainstCount: 4,
      })

      expect(wrapper.find('.seal-corner-badge').exists()).toBe(true)
    })
  })

  describe('Badge Class - Recommended', () => {
    it('applies badge-recommended class when recommendedCount > adviseAgainstCount', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 2,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.classes()).toContain('badge-recommended')
    })

    it('applies badge-recommended class when only recommendedCount is positive', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 0,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.classes()).toContain('badge-recommended')
    })

    it('displays award icon for recommended badge', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 2,
      })

      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:award')
    })
  })

  describe('Badge Class - Problematic', () => {
    it('applies badge-advise-against class when adviseAgainstCount > recommendedCount', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 5,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.classes()).toContain('badge-advise-against')
    })

    it('applies badge-advise-against class when only adviseAgainstCount is positive', () => {
      const wrapper = createWrapper({
        recommendedCount: 0,
        adviseAgainstCount: 5,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.classes()).toContain('badge-advise-against')
    })

    it('displays exclamation-triangle icon for problematic badge', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 5,
      })

      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:triangle-exclamation')
    })
  })

  describe('Badge Icon', () => {
    it('shows award icon when recommendedCount > adviseAgainstCount', () => {
      const wrapper = createWrapper({
        recommendedCount: 8,
        adviseAgainstCount: 3,
      })

      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:award')
    })

    it('shows exclamation-triangle icon when adviseAgainstCount > recommendedCount', () => {
      const wrapper = createWrapper({
        recommendedCount: 3,
        adviseAgainstCount: 8,
      })

      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:triangle-exclamation')
    })
  })

  describe('Badge Tooltip', () => {
    it('displays correct tooltip for recommended badge', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 2,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.attributes('title')).toContain('Recommended by 5 users')
    })

    it('displays correct tooltip for problematic badge', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 7,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.attributes('title')).toContain('Advised against by 7 users')
    })

    it('uses net difference for recommended tooltip', () => {
      const wrapper = createWrapper({
        recommendedCount: 10,
        adviseAgainstCount: 3,
      })

      const badge = wrapper.find('.seal-corner-badge')
      // Net difference is 10 - 3 = 7 more recommended
      expect(badge.attributes('title')).toContain('Recommended by 10 users')
    })

    it('uses net difference for problematic tooltip', () => {
      const wrapper = createWrapper({
        recommendedCount: 3,
        adviseAgainstCount: 10,
      })

      const badge = wrapper.find('.seal-corner-badge')
      // Net difference is 10 - 3 = 7 more problematic
      expect(badge.attributes('title')).toContain('Advised against by 10 users')
    })
  })

  describe('Edge Cases', () => {
    it('handles large positive difference correctly', () => {
      const wrapper = createWrapper({
        recommendedCount: 100,
        adviseAgainstCount: 5,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('badge-recommended')
    })

    it('handles large negative difference correctly', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 100,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('badge-advise-against')
    })

    it('handles small positive difference correctly', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 1,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('badge-recommended')
    })

    it('handles small negative difference correctly', () => {
      const wrapper = createWrapper({
        recommendedCount: 1,
        adviseAgainstCount: 2,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('badge-advise-against')
    })
  })

  describe('Props', () => {
    it('accepts recommendedCount prop', () => {
      const wrapper = createWrapper({
        recommendedCount: 10,
      })

      expect(wrapper.props('recommendedCount')).toBe(10)
    })

    it('accepts adviseAgainstCount prop', () => {
      const wrapper = createWrapper({
        adviseAgainstCount: 8,
      })

      expect(wrapper.props('adviseAgainstCount')).toBe(8)
    })

    it('defaults recommendedCount to 0', () => {
      const wrapper = createWrapper({})
      expect(wrapper.props('recommendedCount')).toBe(0)
    })

    it('defaults adviseAgainstCount to 0', () => {
      const wrapper = createWrapper({})
      expect(wrapper.props('adviseAgainstCount')).toBe(0)
    })
  })

  describe('Badge Structure', () => {
    it('has correct structure for recommended badge', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 2,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.find('i').exists()).toBe(true)
      expect(badge.classes()).toContain('seal-corner-badge')
    })

    it('has correct structure for problematic badge', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 5,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.find('i').exists()).toBe(true)
      expect(badge.classes()).toContain('seal-corner-badge')
    })
  })

  describe('Styling', () => {
    it('applies correct base classes', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 2,
      })

      const badge = wrapper.find('.seal-corner-badge')
      expect(badge.classes()).toContain('seal-corner-badge')
    })

    it('displays icon for recommended', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 2,
      })

      const icon = wrapper.find('[name="fa6-solid:award"]')
      expect(icon.exists()).toBe(true)
    })

    it('displays icon for problematic', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 5,
      })

      const icon = wrapper.find('[name="fa6-solid:triangle-exclamation"]')
      expect(icon.exists()).toBe(true)
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot with recommended badge', () => {
      const wrapper = createWrapper({
        recommendedCount: 7,
        adviseAgainstCount: 2,
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with problematic badge', () => {
      const wrapper = createWrapper({
        recommendedCount: 2,
        adviseAgainstCount: 7,
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with only recommended count', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 0,
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with only problematic count', () => {
      const wrapper = createWrapper({
        recommendedCount: 0,
        adviseAgainstCount: 5,
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with tie (no badge shown)', () => {
      const wrapper = createWrapper({
        recommendedCount: 5,
        adviseAgainstCount: 5,
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with zero counts (no badge shown)', () => {
      const wrapper = createWrapper({
        recommendedCount: 0,
        adviseAgainstCount: 0,
      })

      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
