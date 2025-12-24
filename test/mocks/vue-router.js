import { vi } from 'vitest'

export const useRoute = vi.fn(() => ({
  query: {},
  params: {},
  path: '/',
}))

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}))

export const createRouter = vi.fn()
export const createWebHistory = vi.fn()
