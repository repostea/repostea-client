import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import * as imports from './mocks/imports'

// Set process.client for Nuxt SSR checks (don't replace process, just add property)
if (typeof process !== 'undefined') {
  process.client = true
}

// Make Nuxt auto-imports available globally for tests
Object.assign(global, imports)

// Mock DOMPurify to prevent script execution in tests
vi.mock('dompurify', () => {
  return {
    default: {
      sanitize: (html) => {
        // Remove script tags and their content
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      },
    },
  }
})

// Mock useRealtimeComments globally to prevent WebSocket initialization in tests
vi.mock('~/composables/useRealtimeComments', () => ({
  useRealtimeComments: vi.fn(() => ({
    newComments: { value: [] },
    pendingCount: { value: 0 },
    lastCommentAt: { value: 0 },
    isConnected: { value: false },
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    clearPending: vi.fn(),
    onNewComment: vi.fn(),
    markAsOwn: vi.fn(),
  })),
}))

// Mock useRealtimeStats globally to prevent WebSocket initialization in tests
vi.mock('~/composables/useRealtimeStats', () => ({
  useRealtimeStats: vi.fn(() => ({
    isConnected: { value: false },
    currentChannel: { value: null },
  })),
}))

// Mock useNotification globally to prevent failures
vi.mock('~/composables/useNotification', () => ({
  useNotification: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    apiError: vi.fn(),
    validationError: vi.fn(),
    actionSuccess: vi.fn(),
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    clearAll: vi.fn(),
    clearByType: vi.fn(),
    clearByPriority: vi.fn(),
    getNotificationMessage: vi.fn(),
    notifications: { value: [] },
    highPriorityNotifications: { value: [] },
    normalPriorityNotifications: { value: [] },
    lowPriorityNotifications: { value: [] },
    hasNotifications: { value: false },
  })),
  resetNotificationState: vi.fn(),
}))

// Global mocks (no Pinia here to avoid conflicts with createTestingPinia)
config.global.mocks = {
  $t: (key) => key,
  localePath: (path) => path,
  $api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}

// Mock NuxtLink, ClientOnly and Icon globally
config.global.stubs = {
  NuxtLink: {
    template: '<a><slot /></a>',
  },
  ClientOnly: {
    template: '<div><slot /></div>',
  },
  Icon: {
    template: '<i :class="iconClass"></i>',
    props: ['icon'],
    computed: {
      iconClass() {
        // Convert fa6-solid:arrow-up to fas fa-arrow-up for test compatibility
        // Convert fa6-regular:bookmark to far fa-bookmark for test compatibility
        if (this.icon && this.icon.includes(':')) {
          const [prefix, iconName] = this.icon.split(':')
          const faClass = prefix === 'fa6-regular' ? 'far' : 'fas'
          return `${faClass} fa-${iconName}`
        }
        return 'iconify-icon'
      },
    },
  },
}

// Silence console output during tests to reduce noise
global.console = {
  ...console,
  log: vi.fn(), // Silent
  debug: vi.fn(), // Silent
  info: vi.fn(), // Silent
  warn: vi.fn(), // Silent
  error: vi.fn(), // Silent - tests that expect errors should mock console.error
}
