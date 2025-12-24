export interface ThemeConfig {
  name: string
  label: string
  iconify: string
  colorClass: string
  category: 'light' | 'dark' | 'high-contrast'
  description?: string
  experimental?: boolean // Hidden in production until fully polished
}

export const availableThemes: ThemeConfig[] = [
  // ═══════════════════════════════════════════
  // TEMAS CLAROS
  // ═══════════════════════════════════════════
  {
    name: 'renegados1',
    label: 'Renegados',
    iconify: 'fa6-solid:paw',
    colorClass: 'text-purple-500',
    category: 'light',
  },
  {
    name: 'yups',
    label: 'Yups',
    iconify: 'fa6-solid:thumbs-up',
    colorClass: 'text-pink-500',
    category: 'light',
  },
  {
    name: 'repostea',
    label: 'Repostea',
    iconify: 'fa6-solid:share-nodes',
    colorClass: 'text-blue-500',
    category: 'light',
  },
  {
    name: 'barrapunto',
    label: 'Barrapunto',
    iconify: 'fa6-solid:fire',
    colorClass: 'text-orange-500',
    category: 'light',
  },
  {
    name: 'solarized-light',
    label: 'Solarized Light',
    iconify: 'fa6-solid:sun',
    colorClass: 'text-yellow-600',
    category: 'light',
    description: 'Clásico para lectura',
    experimental: true,
  },
  {
    name: 'sepia',
    label: 'Sepia',
    iconify: 'fa6-solid:book',
    colorClass: 'text-amber-700',
    category: 'light',
    description: 'Como papel antiguo',
    experimental: true,
  },

  // ═══════════════════════════════════════════
  // TEMAS OSCUROS
  // ═══════════════════════════════════════════
  {
    name: 'dark',
    label: 'Oscuro (Slate)',
    iconify: 'fa6-solid:moon',
    colorClass: 'text-slate-500',
    category: 'dark',
  },
  {
    name: 'dark-neutral',
    label: 'Oscuro (Neutral)',
    iconify: 'fa6-solid:moon',
    colorClass: 'text-neutral-400',
    category: 'dark',
  },
  {
    name: 'hacker',
    label: 'Hacker',
    iconify: 'fa6-solid:terminal',
    colorClass: 'text-green-500',
    category: 'dark',
    description: 'Estética Matrix',
    experimental: true,
  },
  {
    name: 'solarized-dark',
    label: 'Solarized Dark',
    iconify: 'fa6-solid:sun',
    colorClass: 'text-cyan-500',
    category: 'dark',
    description: 'Reduce fatiga visual',
    experimental: true,
  },
  {
    name: 'nord',
    label: 'Nord',
    iconify: 'fa6-solid:snowflake',
    colorClass: 'text-sky-400',
    category: 'dark',
    description: 'Paleta ártica',
    experimental: true,
  },
  {
    name: 'dracula',
    label: 'Dracula',
    iconify: 'fa6-solid:ghost',
    colorClass: 'text-purple-400',
    category: 'dark',
    description: 'Acentos púrpura/rosa',
    experimental: true,
  },

  // ═══════════════════════════════════════════
  // TEMAS DE ALTO CONTRASTE (Accesibilidad)
  // ═══════════════════════════════════════════
  {
    name: 'high-contrast-dark',
    label: 'Alto Contraste Oscuro',
    iconify: 'fa6-solid:circle-half-stroke',
    colorClass: 'text-yellow-400',
    category: 'high-contrast',
    description: 'Máxima accesibilidad',
    experimental: true,
  },
  {
    name: 'high-contrast-light',
    label: 'Alto Contraste Claro',
    iconify: 'fa6-solid:circle-half-stroke',
    colorClass: 'text-blue-700',
    category: 'high-contrast',
    description: 'Máxima legibilidad',
    experimental: true,
  },
]

export const themeClasses = availableThemes.map((t) => `theme-${t.name}`)

// Category labels for UI
export const themeCategories = {
  light: {
    key: 'light',
    label: 'Claros',
    icon: 'fa6-solid:sun',
  },
  dark: {
    key: 'dark',
    label: 'Oscuros',
    icon: 'fa6-solid:moon',
  },
  'high-contrast': {
    key: 'high-contrast',
    label: 'Alto Contraste',
    icon: 'fa6-solid:circle-half-stroke',
  },
} as const

export type ThemeCategory = keyof typeof themeCategories

// Group themes by category
export function getThemesByCategory(themes: ThemeConfig[]): Record<ThemeCategory, ThemeConfig[]> {
  return {
    light: themes.filter((t) => t.category === 'light'),
    dark: themes.filter((t) => t.category === 'dark'),
    'high-contrast': themes.filter((t) => t.category === 'high-contrast'),
  }
}

export function isDarkTheme(themeName: string): boolean {
  const darkThemes = [
    'dark',
    'dark-neutral',
    'hacker',
    'solarized-dark',
    'nord',
    'dracula',
    'high-contrast-dark',
  ]
  return darkThemes.includes(themeName)
}

// Production-ready themes only (excludes experimental)
export const productionThemes = availableThemes.filter((t) => !t.experimental)

export function useThemes() {
  // import.meta.dev is replaced at build time by Vite/Nuxt
  const isDev = import.meta.dev

  // Show all themes (experimental ones are now production-ready)
  const visibleThemes = availableThemes

  // Group visible themes by category
  const themesByCategory = getThemesByCategory(visibleThemes)

  return {
    availableThemes: visibleThemes,
    allThemes: availableThemes, // For CSS classes generation (need all themes)
    themeClasses,
    isDarkTheme,
    isDev,
    themeCategories,
    themesByCategory,
  }
}
