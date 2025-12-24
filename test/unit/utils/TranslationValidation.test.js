import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

// Get all available locales by scanning the i18n/locales directory
const localesDir = path.resolve(process.cwd(), 'i18n/locales')

// Easter egg dialects with intentionally partial translations - exclude from validation
const dialectLocales = ['ast', 'ara', 'mur', 'and', 'can', 'ext', 'cnt']

const availableLocales = fs
  .readdirSync(localesDir)
  .filter((dir) => fs.statSync(path.join(localesDir, dir)).isDirectory())
  .filter((dir) => !dialectLocales.includes(dir))

/**
 * Recursively get all translation keys from a nested object
 * @param {Object} obj - The translation object
 * @param {string} prefix - The current key prefix
 * @returns {Array<string>} - Array of all nested keys
 */
function getAllKeys(obj, prefix = '') {
  let keys = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

/**
 * Load all translation files for a given locale and merge them
 * @param {string} locale - The locale code (e.g., 'en', 'es')
 * @returns {Object} - The merged translation object
 */
function loadTranslations(locale) {
  const localePath = path.resolve(localesDir, locale)

  if (!fs.existsSync(localePath)) {
    throw new Error(`Translation directory not found for locale: ${locale}`)
  }

  const translations = {}
  const files = fs.readdirSync(localePath).filter((file) => file.endsWith('.json'))

  files.forEach((file) => {
    const filePath = path.join(localePath, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileData = JSON.parse(content)
    const fileName = file.replace('.json', '')
    translations[fileName] = fileData
  })

  return translations
}

describe('Translation Validation', () => {
  let baseLocale = 'es' // Use Spanish as the base reference
  let baseTranslations
  let baseKeys

  beforeAll(() => {
    if (!availableLocales.includes(baseLocale)) {
      // If Spanish is not available, use the first available locale
      baseLocale = availableLocales[0]
    }

    baseTranslations = loadTranslations(baseLocale)
    baseKeys = getAllKeys(baseTranslations).sort()
  })

  describe('Translation File Existence', () => {
    it('should have at least one translation file', () => {
      expect(availableLocales.length).toBeGreaterThan(0)
    })

    it('should have valid JSON format for all locale files', () => {
      availableLocales.forEach((locale) => {
        expect(() => {
          loadTranslations(locale)
        }).not.toThrow()
      })
    })
  })

  describe('Translation Key Consistency', () => {
    availableLocales.forEach((locale) => {
      if (locale === baseLocale) return // Skip base locale

      it(`should have all keys present in ${locale} that exist in ${baseLocale}`, () => {
        const translations = loadTranslations(locale)
        const localeKeys = getAllKeys(translations).sort()

        const missingKeys = baseKeys.filter((key) => !localeKeys.includes(key))

        if (missingKeys.length > 0) {
          console.warn(`Missing keys in ${locale}:`, missingKeys)
        }

        expect(missingKeys.length).toBe(0)
      })

      it(`should not have extra keys in ${locale} that don't exist in ${baseLocale}`, () => {
        const translations = loadTranslations(locale)
        const localeKeys = getAllKeys(translations).sort()

        const extraKeys = localeKeys.filter((key) => !baseKeys.includes(key))

        if (extraKeys.length > 0) {
          console.warn(`Extra keys in ${locale}:`, extraKeys)
        }

        expect(extraKeys.length).toBeLessThan(baseKeys.length * 0.05)
      })
    })
  })

  describe('Translation Value Validation', () => {
    availableLocales.forEach((locale) => {
      it(`should not have empty translation values in ${locale}`, () => {
        const translations = loadTranslations(locale)
        const keys = getAllKeys(translations)

        const emptyKeys = keys.filter((key) => {
          const value = key.split('.').reduce((obj, k) => obj?.[k], translations)
          return !value || (typeof value === 'string' && value.trim() === '')
        })

        if (emptyKeys.length > 0) {
          console.warn(`Empty values in ${locale}:`, emptyKeys)
        }

        expect(emptyKeys.length).toBe(0)
      })

      it(`should have consistent placeholder patterns in ${locale}`, () => {
        const translations = loadTranslations(locale)
        const keys = getAllKeys(translations)

        const inconsistentPlaceholders = []

        keys.forEach((key) => {
          const baseValue = key.split('.').reduce((obj, k) => obj?.[k], baseTranslations)
          const localeValue = key.split('.').reduce((obj, k) => obj?.[k], translations)

          if (typeof baseValue === 'string' && typeof localeValue === 'string') {
            // Extract placeholders like {name}, :name, {{name}}, etc.
            const basePlaceholders = (
              baseValue.match(/\{[^}]+\}|:[a-zA-Z_][a-zA-Z0-9_]*|\{\{[^}]+\}\}/g) || []
            ).sort()
            const localePlaceholders = (
              localeValue.match(/\{[^}]+\}|:[a-zA-Z_][a-zA-Z0-9_]*|\{\{[^}]+\}\}/g) || []
            ).sort()

            if (JSON.stringify(basePlaceholders) !== JSON.stringify(localePlaceholders)) {
              inconsistentPlaceholders.push({
                key,
                base: basePlaceholders,
                locale: localePlaceholders,
              })
            }
          }
        })

        if (inconsistentPlaceholders.length > 0) {
          console.warn(`Inconsistent placeholders in ${locale}:`, inconsistentPlaceholders)
        }

        expect(inconsistentPlaceholders.length).toBe(0)
      })
    })
  })

  describe('Translation Coverage Report', () => {
    it('should generate a coverage report for all locales', () => {
      const report = {
        baseLocale,
        totalKeys: baseKeys.length,
        locales: {},
      }

      availableLocales.forEach((locale) => {
        const translations = loadTranslations(locale)
        const localeKeys = getAllKeys(translations)

        report.locales[locale] = {
          totalKeys: localeKeys.length,
          coverage: ((localeKeys.length / baseKeys.length) * 100).toFixed(2) + '%',
          missingKeys: baseKeys.filter((key) => !localeKeys.includes(key)).length,
          extraKeys: localeKeys.filter((key) => !baseKeys.includes(key)).length,
        }
      })

      console.log('Translation Coverage Report:', JSON.stringify(report, null, 2))

      // Test passes if we can generate the report
      expect(report).toBeDefined()
      expect(report.totalKeys).toBeGreaterThan(0)
    })
  })
})
