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

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, key) {
  return key.split('.').reduce((obj, k) => obj?.[k], obj)
}

describe('Advanced Translation Validation', () => {
  let baseLocale = 'en'
  let baseTranslations
  let baseKeys

  beforeAll(() => {
    if (!availableLocales.includes(baseLocale)) {
      baseLocale = availableLocales[0]
    }

    baseTranslations = loadTranslations(baseLocale)
    baseKeys = getAllKeys(baseTranslations).sort()
  })

  describe('Translation Length Validation', () => {
    availableLocales.forEach((locale) => {
      if (locale === baseLocale) return

      it(`should have reasonable translation lengths in ${locale}`, () => {
        const translations = loadTranslations(locale)
        const problematicKeys = []

        baseKeys.forEach((key) => {
          const baseValue = getNestedValue(baseTranslations, key)
          const localeValue = getNestedValue(translations, key)

          if (typeof baseValue === 'string' && typeof localeValue === 'string') {
            const baseLength = baseValue.length
            const localeLength = localeValue.length

            // Flag if translation is suspiciously short or long (>500% or <5% of original)
            if (
              localeLength > 0 &&
              (localeLength > baseLength * 5 || localeLength < baseLength * 0.05)
            ) {
              problematicKeys.push({
                key,
                baseLength,
                localeLength,
                ratio: (localeLength / baseLength).toFixed(2),
              })
            }
          }
        })

        if (problematicKeys.length > 0) {
          console.warn(`Suspiciously long/short translations in ${locale}:`, problematicKeys)
        }

        // This is a warning, not a hard failure
        expect(problematicKeys.length).toBeLessThan(baseKeys.length * 0.1) // Allow up to 10% problematic
      })
    })
  })

  describe('Special Characters Validation', () => {
    availableLocales.forEach((locale) => {
      it(`should not have obvious copy-paste errors in ${locale}`, () => {
        const translations = loadTranslations(locale)
        const suspiciousKeys = []

        baseKeys.forEach((key) => {
          const localeValue = getNestedValue(translations, key)

          if (typeof localeValue === 'string') {
            // Check for obvious copy-paste errors (English words in non-English locales)
            if (locale !== 'en' && locale !== baseLocale) {
              const commonEnglishWords = [
                'hello',
                'world',
                'success',
                'warning',
                'login',
                'logout',
                'password',
                'username',
                'submit',
                'delete',
                'save',
                'loading',
                'please',
              ]

              const foundEnglishWords = commonEnglishWords.filter((word) =>
                localeValue.toLowerCase().includes(word.toLowerCase())
              )

              if (foundEnglishWords.length > 0) {
                suspiciousKeys.push({
                  key,
                  value: localeValue,
                  suspiciousWords: foundEnglishWords,
                })
              }
            }
          }
        })

        if (suspiciousKeys.length > 0) {
          console.warn(`Possible copy-paste errors in ${locale}:`, suspiciousKeys)
        }

        expect(suspiciousKeys.length).toBeLessThan(baseKeys.length * 0.1)
      })
    })
  })

  describe('HTML/Markdown Consistency', () => {
    availableLocales.forEach((locale) => {
      if (locale === baseLocale) return

      it(`should maintain HTML/Markdown structure in ${locale}`, () => {
        const translations = loadTranslations(locale)
        const structuralIssues = []

        baseKeys.forEach((key) => {
          const baseValue = getNestedValue(baseTranslations, key)
          const localeValue = getNestedValue(translations, key)

          if (typeof baseValue === 'string' && typeof localeValue === 'string') {
            // Check for HTML tags
            const baseHtmlTags = (baseValue.match(/<[^>]+>/g) || []).sort()
            const localeHtmlTags = (localeValue.match(/<[^>]+>/g) || []).sort()

            // Check for Markdown syntax
            const baseMarkdown = (
              baseValue.match(/\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\)/g) || []
            ).sort()
            const localeMarkdown = (
              localeValue.match(/\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\)/g) || []
            ).sort()

            if (
              JSON.stringify(baseHtmlTags) !== JSON.stringify(localeHtmlTags) ||
              JSON.stringify(baseMarkdown) !== JSON.stringify(localeMarkdown)
            ) {
              structuralIssues.push({
                key,
                baseHtml: baseHtmlTags,
                localeHtml: localeHtmlTags,
                baseMarkdown: baseMarkdown,
                localeMarkdown: localeMarkdown,
              })
            }
          }
        })

        if (structuralIssues.length > 0) {
          console.warn(`HTML/Markdown structure issues in ${locale}:`, structuralIssues)
        }

        expect(structuralIssues.length).toBe(0)
      })
    })
  })

  describe('Punctuation Validation', () => {
    availableLocales.forEach((locale) => {
      it(`should have appropriate punctuation in ${locale}`, () => {
        const translations = loadTranslations(locale)
        const punctuationIssues = []

        baseKeys.forEach((key) => {
          const baseValue = getNestedValue(baseTranslations, key)
          const localeValue = getNestedValue(translations, key)

          if (typeof baseValue === 'string' && typeof localeValue === 'string') {
            // Check if base ends with punctuation and locale doesn't (or vice versa)
            const baseEndsPunctuation = /[.!?:]$/.test(baseValue.trim())
            const localeEndsPunctuation = /[.!?:]$/.test(localeValue.trim())

            if (baseEndsPunctuation !== localeEndsPunctuation) {
              punctuationIssues.push({
                key,
                baseValue: baseValue.trim(),
                localeValue: localeValue.trim(),
                baseEndsPunctuation,
                localeEndsPunctuation,
              })
            }
          }
        })

        if (punctuationIssues.length > 0) {
          console.warn(`Punctuation inconsistencies in ${locale}:`, punctuationIssues)
        }

        // Allow some punctuation differences (cultural variations)
        expect(punctuationIssues.length).toBeLessThan(baseKeys.length * 0.05) // Less than 5%
      })
    })
  })

  describe('Translation Statistics', () => {
    it('should generate detailed translation statistics', () => {
      const stats = {
        totalKeys: baseKeys.length,
        locales: {},
      }

      availableLocales.forEach((locale) => {
        const translations = loadTranslations(locale)
        const localeKeys = getAllKeys(translations)

        let totalCharacters = 0
        let totalWords = 0
        let emptyTranslations = 0

        localeKeys.forEach((key) => {
          const value = getNestedValue(translations, key)
          if (typeof value === 'string') {
            totalCharacters += value.length
            totalWords += value.split(/\s+/).filter((word) => word.length > 0).length
            if (value.trim() === '') emptyTranslations++
          }
        })

        stats.locales[locale] = {
          totalKeys: localeKeys.length,
          totalCharacters,
          totalWords,
          averageWordsPerKey: (totalWords / localeKeys.length).toFixed(2),
          averageCharactersPerKey: (totalCharacters / localeKeys.length).toFixed(2),
          emptyTranslations,
          completeness: ((localeKeys.length / baseKeys.length) * 100).toFixed(2) + '%',
        }
      })

      console.log('Detailed Translation Statistics:', JSON.stringify(stats, null, 2))

      expect(stats).toBeDefined()
      expect(stats.totalKeys).toBeGreaterThan(0)
    })
  })
})
