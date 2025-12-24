import { describe, it, expect } from 'vitest'
import {
  useThemes,
  availableThemes,
  themeClasses,
  themeCategories,
  isDarkTheme,
  getThemesByCategory,
  productionThemes,
} from '~/composables/useThemes'

describe('useThemes', () => {
  describe('availableThemes', () => {
    it('should have themes defined', () => {
      expect(availableThemes).toBeDefined()
      expect(availableThemes.length).toBeGreaterThan(0)
    })

    it('should have required properties for each theme', () => {
      availableThemes.forEach((theme) => {
        expect(theme.name).toBeDefined()
        expect(theme.label).toBeDefined()
        expect(theme.iconify).toBeDefined()
        expect(theme.colorClass).toBeDefined()
        expect(theme.category).toBeDefined()
        expect(['light', 'dark', 'high-contrast']).toContain(theme.category)
      })
    })

    it('should include renegados1 theme', () => {
      const renegados = availableThemes.find((t) => t.name === 'renegados1')
      expect(renegados).toBeDefined()
      expect(renegados.category).toBe('light')
    })

    it('should include dark theme', () => {
      const dark = availableThemes.find((t) => t.name === 'dark')
      expect(dark).toBeDefined()
      expect(dark.category).toBe('dark')
    })
  })

  describe('themeClasses', () => {
    it('should generate theme class names', () => {
      expect(themeClasses).toBeDefined()
      expect(themeClasses.length).toBe(availableThemes.length)
    })

    it('should prefix theme names with theme-', () => {
      themeClasses.forEach((className) => {
        expect(className.startsWith('theme-')).toBe(true)
      })
    })

    it('should include theme-dark', () => {
      expect(themeClasses).toContain('theme-dark')
    })

    it('should include theme-renegados1', () => {
      expect(themeClasses).toContain('theme-renegados1')
    })
  })

  describe('themeCategories', () => {
    it('should have light category', () => {
      expect(themeCategories.light).toBeDefined()
      expect(themeCategories.light.key).toBe('light')
      expect(themeCategories.light.label).toBe('Claros')
    })

    it('should have dark category', () => {
      expect(themeCategories.dark).toBeDefined()
      expect(themeCategories.dark.key).toBe('dark')
      expect(themeCategories.dark.label).toBe('Oscuros')
    })

    it('should have high-contrast category', () => {
      expect(themeCategories['high-contrast']).toBeDefined()
      expect(themeCategories['high-contrast'].key).toBe('high-contrast')
      expect(themeCategories['high-contrast'].label).toBe('Alto Contraste')
    })

    it('should have icons for each category', () => {
      expect(themeCategories.light.icon).toBeDefined()
      expect(themeCategories.dark.icon).toBeDefined()
      expect(themeCategories['high-contrast'].icon).toBeDefined()
    })
  })

  describe('isDarkTheme', () => {
    it('should return true for dark themes', () => {
      expect(isDarkTheme('dark')).toBe(true)
      expect(isDarkTheme('dark-neutral')).toBe(true)
      expect(isDarkTheme('hacker')).toBe(true)
      expect(isDarkTheme('solarized-dark')).toBe(true)
      expect(isDarkTheme('nord')).toBe(true)
      expect(isDarkTheme('dracula')).toBe(true)
      expect(isDarkTheme('high-contrast-dark')).toBe(true)
    })

    it('should return false for light themes', () => {
      expect(isDarkTheme('renegados1')).toBe(false)
      expect(isDarkTheme('yups')).toBe(false)
      expect(isDarkTheme('repostea')).toBe(false)
      expect(isDarkTheme('barrapunto')).toBe(false)
      expect(isDarkTheme('solarized-light')).toBe(false)
      expect(isDarkTheme('sepia')).toBe(false)
    })

    it('should return false for high-contrast-light', () => {
      expect(isDarkTheme('high-contrast-light')).toBe(false)
    })

    it('should return false for unknown themes', () => {
      expect(isDarkTheme('unknown-theme')).toBe(false)
    })
  })

  describe('getThemesByCategory', () => {
    it('should group themes by category', () => {
      const grouped = getThemesByCategory(availableThemes)

      expect(grouped.light).toBeDefined()
      expect(grouped.dark).toBeDefined()
      expect(grouped['high-contrast']).toBeDefined()
    })

    it('should have all light themes in light category', () => {
      const grouped = getThemesByCategory(availableThemes)

      grouped.light.forEach((theme) => {
        expect(theme.category).toBe('light')
      })
    })

    it('should have all dark themes in dark category', () => {
      const grouped = getThemesByCategory(availableThemes)

      grouped.dark.forEach((theme) => {
        expect(theme.category).toBe('dark')
      })
    })

    it('should have all high-contrast themes in high-contrast category', () => {
      const grouped = getThemesByCategory(availableThemes)

      grouped['high-contrast'].forEach((theme) => {
        expect(theme.category).toBe('high-contrast')
      })
    })

    it('should include all themes when grouped', () => {
      const grouped = getThemesByCategory(availableThemes)
      const totalGrouped =
        grouped.light.length + grouped.dark.length + grouped['high-contrast'].length

      expect(totalGrouped).toBe(availableThemes.length)
    })
  })

  describe('productionThemes', () => {
    it('should exclude experimental themes', () => {
      productionThemes.forEach((theme) => {
        expect(theme.experimental).not.toBe(true)
      })
    })

    it('should be a subset of availableThemes', () => {
      expect(productionThemes.length).toBeLessThanOrEqual(availableThemes.length)
    })

    it('should include non-experimental themes', () => {
      const nonExperimental = availableThemes.filter((t) => !t.experimental)
      expect(productionThemes.length).toBe(nonExperimental.length)
    })
  })

  describe('useThemes composable', () => {
    it('should return availableThemes', () => {
      const themes = useThemes()
      expect(themes.availableThemes).toBeDefined()
      expect(themes.availableThemes.length).toBeGreaterThan(0)
    })

    it('should return allThemes', () => {
      const themes = useThemes()
      expect(themes.allThemes).toBeDefined()
      expect(themes.allThemes).toBe(availableThemes)
    })

    it('should return themeClasses', () => {
      const themes = useThemes()
      expect(themes.themeClasses).toBeDefined()
      expect(themes.themeClasses).toBe(themeClasses)
    })

    it('should return isDarkTheme function', () => {
      const themes = useThemes()
      expect(typeof themes.isDarkTheme).toBe('function')
      expect(themes.isDarkTheme('dark')).toBe(true)
    })

    it('should return isDev property', () => {
      const themes = useThemes()
      // isDev uses import.meta.dev which may be undefined in test environment
      expect(themes.isDev === undefined || typeof themes.isDev === 'boolean').toBe(true)
    })

    it('should return themeCategories', () => {
      const themes = useThemes()
      expect(themes.themeCategories).toBeDefined()
      expect(themes.themeCategories).toBe(themeCategories)
    })

    it('should return themesByCategory', () => {
      const themes = useThemes()
      expect(themes.themesByCategory).toBeDefined()
      expect(themes.themesByCategory.light).toBeDefined()
      expect(themes.themesByCategory.dark).toBeDefined()
      expect(themes.themesByCategory['high-contrast']).toBeDefined()
    })
  })

  describe('theme structure validation', () => {
    it('should have unique theme names', () => {
      const names = availableThemes.map((t) => t.name)
      const uniqueNames = [...new Set(names)]
      expect(names.length).toBe(uniqueNames.length)
    })

    it('should have valid iconify icons', () => {
      availableThemes.forEach((theme) => {
        expect(theme.iconify).toMatch(/^[a-z0-9]+-[a-z0-9]+:[a-z0-9-]+$/i)
      })
    })

    it('should have valid color classes', () => {
      availableThemes.forEach((theme) => {
        expect(theme.colorClass).toMatch(/^text-[a-z]+-\d+$/)
      })
    })
  })
})
