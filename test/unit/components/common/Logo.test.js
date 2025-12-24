import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Logo from '~/components/common/Logo.vue'

describe('Logo Component', () => {
  it('renders the logo container', () => {
    const wrapper = mount(Logo)
    expect(wrapper.find('.logo-container').exists()).toBe(true)
  })

  it('renders the logo image', () => {
    const wrapper = mount(Logo)
    const img = wrapper.find('.logo-image')

    expect(img.exists()).toBe(true)
    // Image src is stubbed in tests, just check it exists
    expect(img.attributes('src')).toBeDefined()
    expect(img.attributes('alt')).toBe('Repostea')
  })

  it('renders the logo text', () => {
    const wrapper = mount(Logo)
    const text = wrapper.find('.logo-text')

    expect(text.exists()).toBe(true)
    expect(text.text()).toBe('Repostea')
  })

  it('applies correct CSS classes to logo image', () => {
    const wrapper = mount(Logo)
    const img = wrapper.find('.logo-image')

    expect(img.classes()).toContain('logo-image')
  })

  it('applies correct CSS classes to logo text', () => {
    const wrapper = mount(Logo)
    const text = wrapper.find('.logo-text')

    expect(text.classes()).toContain('logo-text')
  })

  it('has correct container layout structure', () => {
    const wrapper = mount(Logo)
    const container = wrapper.find('.logo-container')

    // Should contain both NuxtImg (rendered as nuxtimg stub) and text
    expect(container.findAll('nuxtimg')).toHaveLength(1)
    expect(container.findAll('span')).toHaveLength(1)
  })

  it('matches snapshot', () => {
    const wrapper = mount(Logo)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
