import { vi } from 'vitest'

export const useI18n = vi.fn(() => ({
  t: (key, params) => {
    // Add specific translations for tests here if needed
    const translations = {
      'seals.recommended_tooltip': `Recommended by ${params?.count || 0} users`,
      'seals.advised_against_tooltip': `Advised against by ${params?.count || 0} users`,
      'seals.recommended': 'Recommended',
      'seals.advised_against': 'Advised against',
    }
    return translations[key] || key
  },
  locale: { value: 'es' },
}))

export const useLocalePath = vi.fn(() => (path) => path)
