import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReportButton from '~/components/posts/ReportButton.vue'

const mockAuthStore = {
  isAuthenticated: true,
  user: { id: 1, username: 'testuser' },
}

const mockT = (key, params) => {
  const translations = {
    'report.button_title': 'Report',
    'report.reasons.spam': 'Spam',
    'report.reasons.inappropriate': 'Inappropriate',
    'report.reasons.harassment': 'Harassment',
    'report.reasons.misinformation': 'Misinformation',
    'report.reasons.hate_speech': 'Hate Speech',
    'report.reasons.violence': 'Violence',
    'report.quick.description': 'Select a reason to report',
    'report.quick.additional_details': 'Additional details',
    'report.quick.details_placeholder': 'Provide more context...',
    'report.submit': 'Submit Report',
    'report.submitting': 'Submitting...',
    'report.success_quick': 'Report submitted successfully',
    'report.error_quick': 'Error submitting report',
    'report.legal_first.title': 'Legal Report',
    'report.legal_first.description': 'For legal matters, use this form',
    'report.legal_first.button': 'Legal Form',
    'report.withdraw_confirm_title': 'Withdraw Report?',
    'report.withdraw_confirm_message': 'Are you sure?',
    'report.withdraw_confirm': 'Yes, withdraw',
    'report.withdraw_success': 'Report withdrawn',
    'report.withdraw_error': 'Error withdrawing report',
    'report.report_singular': 'report',
    'report.report_plural': 'reports',
    'common.or': 'or',
    'common.optional': 'optional',
    'common.cancel': 'Cancel',
    'common.processing': 'Processing...',
  }

  if (params) {
    let result = translations[key] || key
    Object.keys(params).forEach((param) => {
      result = result.replace(`{${param}}`, params[param])
    })
    return result
  }
  return translations[key] || key
}

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
    locale: { value: 'en' },
  }),
}))

vi.mock('#i18n', () => ({
  useLocalePath: () => (path) => path,
}))

describe('ReportButton Component', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: 1, username: 'testuser' }
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(ReportButton, {
      props: {
        postId: 123,
        postSlug: 'test-post',
        postUuid: 'uuid-123',
        reportsCount: 0,
        reports: [],
        ...props,
      },
      global: {
        mocks: {
          $t: mockT,
          t: mockT,
        },
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
          Icon: {
            template: '<i class="iconify-icon" :name="name"></i>',
            props: ['name'],
          },
          Teleport: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders report button', () => {
      wrapper = createWrapper()
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('shows flag icon', () => {
      wrapper = createWrapper()
      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:flag')
    })

    it('does not show modal initially', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.fixed.inset-0.bg-black').exists()).toBe(false)
    })

    it('shows report count when there are reports', () => {
      const reports = [
        { id: 1, reason: 'spam', status: 'pending' },
        { id: 2, reason: 'inappropriate', status: 'pending' },
      ]
      wrapper = createWrapper({ reportsCount: 2, reports })
      // Should show individual badges for each type (1 spam, 1 inappropriate)
      const badges = wrapper.findAll('.inline-flex.items-center.gap-1.px-1\\.5')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('Report Count Badges', () => {
    it('shows badges for each report type', () => {
      const reports = [
        { id: 1, reason: 'spam', status: 'pending' },
        { id: 2, reason: 'spam', status: 'pending' },
        { id: 3, reason: 'harassment', status: 'pending' },
      ]
      wrapper = createWrapper({ reportsCount: 3, reports })

      const badges = wrapper.findAll('.inline-flex.items-center.gap-1.px-1\\.5')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('displays correct count for each reason', () => {
      const reports = [
        { id: 1, reason: 'spam', status: 'pending' },
        { id: 2, reason: 'spam', status: 'pending' },
      ]
      wrapper = createWrapper({ reportsCount: 2, reports })

      expect(wrapper.text()).toContain('2')
    })

    it('does not show badges when no reports', () => {
      wrapper = createWrapper({ reportsCount: 0, reports: [] })
      const badges = wrapper.findAll('.inline-flex.items-center.gap-1.px-1\\.5')
      expect(badges.length).toBe(0)
    })
  })

  describe('Button Styling', () => {
    it('applies normal styling with no reports', () => {
      wrapper = createWrapper({ reportsCount: 0 })
      const button = wrapper.find('button')
      expect(button.classes()).toContain('footer-btn')
    })

    it('applies warning styling with few reports', () => {
      const reports = [{ id: 1, reason: 'spam', status: 'pending' }]
      wrapper = createWrapper({ reportsCount: 1, reports })
      const button = wrapper.find('button')
      expect(button.classes()).toContain('report-mild')
    })

    it('applies danger styling with many reports', () => {
      const reports = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        reason: 'spam',
        status: 'pending',
      }))
      wrapper = createWrapper({ reportsCount: 5, reports })
      const button = wrapper.find('button')
      expect(button.classes()).toContain('report-severe')
    })
  })

  describe('Modal Opening', () => {
    it('opens modal when clicking button', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')

      expect(wrapper.vm.showQuickModal).toBe(true)
      expect(wrapper.find('.fixed.inset-0.bg-black').exists()).toBe(true)
    })

    it('shows modal title', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Report')
    })

    it('shows close button in modal', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[name="fa6-solid:xmark"]').exists()).toBe(true)
    })
  })

  describe('Modal Closing', () => {
    it('closes modal when clicking close button', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      expect(wrapper.vm.showQuickModal).toBe(true)

      const closeButton = wrapper.find('[name="fa6-solid:xmark"]').element.parentElement
      await closeButton.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showQuickModal).toBe(false)
    })

    it('closes modal when clicking backdrop', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      expect(wrapper.vm.showQuickModal).toBe(true)

      const modal = wrapper.find('.fixed.inset-0.bg-black')
      await modal.trigger('click.self')

      expect(wrapper.vm.showQuickModal).toBe(false)
    })

    it('resets form state when closing', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')

      wrapper.vm.selectedReason = 'spam'
      wrapper.vm.additionalDescription = 'Test'

      const closeButton = wrapper.find('[name="fa6-solid:xmark"]').element.parentElement
      await closeButton.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedReason).toBe('')
      expect(wrapper.vm.additionalDescription).toBe('')
    })
  })

  describe('Unauthenticated User', () => {
    it('shows login message when not authenticated', async () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('formulario legal')
    })

    it('shows link to legal form when not authenticated', async () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const link = wrapper.find('a[href*="/report"]')
      expect(link.exists()).toBe(true)
    })

    it('does not show quick report options when not authenticated', async () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      expect(reasonButtons.length).toBe(0)
    })
  })

  describe('Quick Report Reasons', () => {
    it('shows all 6 report reason buttons', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      expect(reasonButtons.length).toBe(6)
    })

    it('displays correct icons for each reason', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map((icon) => icon.attributes('name'))
      expect(iconNames).toContain('fa6-solid:bullhorn') // spam
      expect(iconNames).toContain('fa6-solid:triangle-exclamation') // inappropriate
      expect(iconNames).toContain('fa6-solid:user-slash') // harassment
    })

    it('selects reason when clicking button', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')

      expect(wrapper.vm.selectedReason).toBe('spam')
    })

    it('highlights selected reason', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      let reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      // Re-query to get fresh DOM state
      reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      // Component uses report-reason-btn-selected class for selected state
      expect(reasonButtons[0].classes()).toContain('report-reason-btn-selected')
    })
  })

  describe('Additional Description', () => {
    it('shows description field after selecting reason', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('allows entering additional description', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Additional details here')

      expect(wrapper.vm.additionalDescription).toBe('Additional details here')
    })

    it('shows character count', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('/1000')
    })

    it('limits description to 1000 characters', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('maxlength')).toBe('1000')
    })
  })

  describe('Submit Report', () => {
    it('shows submit button after selecting reason', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      const submitButtons = wrapper.findAll('button')
      const submitButton = submitButtons.find((btn) => btn.text().includes('Submit Report'))
      expect(submitButton).toBeDefined()
    })

    it('submits report with selected reason', async () => {
      const mockCreate = vi.fn().mockResolvedValue()
      wrapper = createWrapper()
      wrapper.vm.$options.components = {}

      const mockApi = {
        reports: { create: mockCreate },
      }

      global.useNuxtApp = () => ({ $api: mockApi })

      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      const submitButtons = wrapper.findAll('button')
      const submitButton = submitButtons.find((btn) => btn.text().includes('Submit Report'))
      await submitButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockCreate).toHaveBeenCalledWith({
        reportable_type: 'post',
        reportable_id: 123,
        reason: 'spam',
      })
    })

    it('includes description if provided', async () => {
      const mockCreate = vi.fn().mockResolvedValue()
      const mockApi = {
        reports: { create: mockCreate },
      }
      global.useNuxtApp = () => ({ $api: mockApi })

      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      wrapper.vm.additionalDescription = 'Test description'

      const submitButtons = wrapper.findAll('button')
      const submitButton = submitButtons.find((btn) => btn.text().includes('Submit Report'))
      await submitButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockCreate).toHaveBeenCalledWith({
        reportable_type: 'post',
        reportable_id: 123,
        reason: 'spam',
        description: 'Test description',
      })
    })

    it('disables submit button while submitting', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      wrapper.vm.submitting = true
      await wrapper.vm.$nextTick()

      const submitButtons = wrapper.findAll('button')
      const submitButton = submitButtons.find((btn) => btn.text().includes('Submitting'))
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('shows success message after submission', async () => {
      const mockCreate = vi.fn().mockResolvedValue()
      const mockApi = {
        reports: { create: mockCreate },
      }
      global.useNuxtApp = () => ({ $api: mockApi })

      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      await reasonButtons[0].trigger('click')
      await wrapper.vm.$nextTick()

      const submitButtons = wrapper.findAll('button')
      const submitButton = submitButtons.find((btn) => btn.text().includes('Submit Report'))
      await submitButton.trigger('click')
      await wrapper.vm.$nextTick()

      await new Promise((resolve) => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.successMessage).toBeTruthy()
    })
  })

  describe('User Already Reported', () => {
    it('shows message when user has already reported', async () => {
      const reports = [{ id: 1, reason: 'spam', status: 'pending', is_own: true }]
      wrapper = createWrapper({ reports })
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Ya has reportado')
    })

    it('shows withdraw button when user has already reported', async () => {
      const reports = [{ id: 1, reason: 'spam', status: 'pending', is_own: true }]
      wrapper = createWrapper({ reports })
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Retirar mi reporte')
    })

    it('disables reason buttons when user has already reported', async () => {
      const reports = [{ id: 1, reason: 'spam', status: 'pending', is_own: true }]
      wrapper = createWrapper({ reports })
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const reasonButtons = wrapper.findAll('.grid.grid-cols-2 button')
      reasonButtons.forEach((btn) => {
        expect(btn.attributes('disabled')).toBeDefined()
      })
    })
  })

  describe('Withdraw Report', () => {
    it('opens confirmation modal when clicking withdraw', async () => {
      const reports = [{ id: 1, reason: 'spam', status: 'pending', is_own: true }]
      wrapper = createWrapper({ reports })
      await wrapper.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      const withdrawButton = buttons.find((btn) => btn.text().includes('Retirar mi reporte'))
      await withdrawButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showWithdrawConfirm).toBe(true)
    })

    it('shows confirmation dialog', async () => {
      const reports = [{ id: 1, reason: 'spam', status: 'pending', is_own: true }]
      wrapper = createWrapper({ reports })
      wrapper.vm.showWithdrawConfirm = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Withdraw Report?')
    })

    it('cancels withdrawal when clicking cancel', async () => {
      const reports = [{ id: 1, reason: 'spam', status: 'pending', is_own: true }]
      wrapper = createWrapper({ reports })
      wrapper.vm.showWithdrawConfirm = true
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      const cancelButton = buttons.find((btn) => btn.text().includes('Cancel'))
      await cancelButton.trigger('click')

      expect(wrapper.vm.showWithdrawConfirm).toBe(false)
    })
  })

  describe('Props', () => {
    it('accepts postId prop', () => {
      wrapper = createWrapper({ postId: 456 })
      expect(wrapper.props('postId')).toBe(456)
    })

    it('accepts postSlug prop', () => {
      wrapper = createWrapper({ postSlug: 'test-slug' })
      expect(wrapper.props('postSlug')).toBe('test-slug')
    })

    it('accepts postUuid prop', () => {
      wrapper = createWrapper({ postUuid: 'uuid-456' })
      expect(wrapper.props('postUuid')).toBe('uuid-456')
    })

    it('accepts reportsCount prop', () => {
      wrapper = createWrapper({ reportsCount: 5 })
      expect(wrapper.props('reportsCount')).toBe(5)
    })

    it('accepts reports array', () => {
      const reports = [{ id: 1, reason: 'spam' }]
      wrapper = createWrapper({ reports })
      expect(wrapper.props('reports')).toEqual(reports)
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot with no reports', () => {
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with reports', () => {
      const reports = [
        { id: 1, reason: 'spam', status: 'pending' },
        { id: 2, reason: 'harassment', status: 'pending' },
      ]
      wrapper = createWrapper({ reportsCount: 2, reports })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with modal open', async () => {
      wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
