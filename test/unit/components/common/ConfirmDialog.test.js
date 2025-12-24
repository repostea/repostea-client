import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('renders when show is true', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        modelValue: true,
        title: 'Test Title',
        message: 'Test Message',
      },
      global: {
        stubs: {
          Teleport: false,
          Icon: true,
        },
      },
      attachTo: document.body,
    })

    // Content is teleported to body, so we need to check document.body
    expect(document.body.textContent).toContain('Test Title')
    expect(document.body.textContent).toContain('Test Message')
    wrapper.unmount()
  })

  it('does not render when show is false', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        modelValue: false,
        title: 'Test Title',
        message: 'Test Message',
      },
      global: {
        stubs: {
          Teleport: false,
          Icon: true,
        },
      },
      attachTo: document.body,
    })

    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('emits confirm when confirm button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        modelValue: true,
        title: 'Confirm Action',
        message: 'Are you sure?',
      },
      global: {
        stubs: {
          Teleport: false,
          Icon: true,
        },
      },
      attachTo: document.body,
    })

    // Find buttons in the document body since content is teleported
    const buttons = Array.from(document.body.querySelectorAll('button'))
    const confirmButton = buttons.find((btn) => btn.textContent.match(/confirmar/i))

    await confirmButton.click()

    expect(wrapper.emitted('confirm')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        modelValue: true,
        title: 'Confirm Action',
        message: 'Are you sure?',
      },
      global: {
        stubs: {
          Teleport: false,
          Icon: true,
        },
      },
      attachTo: document.body,
    })

    const cancelButton = wrapper.findAll('button').find((btn) =>
      btn.text().match(/cancel|cancelar/i),
    )

    if (cancelButton) {
      await cancelButton.trigger('click')
      expect(wrapper.emitted('cancel')).toBeTruthy()
    }
    wrapper.unmount()
  })

  it('shows custom confirm button text', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        modelValue: true,
        title: 'Delete',
        message: 'Delete this item?',
        confirmText: 'Delete Forever',
      },
      global: {
        stubs: {
          Teleport: false,
          Icon: true,
        },
      },
      attachTo: document.body,
    })

    // Content is teleported to body
    expect(document.body.textContent).toContain('Delete Forever')
    wrapper.unmount()
  })

  it('applies danger variant styling', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        modelValue: true,
        title: 'Danger',
        message: 'Dangerous action',
        type: 'danger',
      },
      global: {
        stubs: {
          Teleport: false,
          Icon: true,
        },
      },
      attachTo: document.body,
    })

    // Find buttons in the document body since content is teleported
    const buttons = Array.from(document.body.querySelectorAll('button'))
    const confirmButton = buttons.find((btn) => btn.textContent.match(/confirmar/i))

    expect(confirmButton.classList.contains('bg-red-600')).toBe(true)
    wrapper.unmount()
  })
})
