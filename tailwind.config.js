/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './composables/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  safelist: [
    // Only safelist dynamic classes that are truly dynamic
    {
      pattern: /^(bg|text|border)-(primary|secondary|danger|success|warning|info)/,
      variants: ['hover', 'dark', 'dark:hover'],
    },
  ],
  theme: {
    extend: {
      colors: {
        'card-dark': '#1e1e2d',
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        'primary-light': 'var(--color-primary-light)',
        'primary-dark': 'var(--color-primary-dark)',
        secondary: 'var(--color-text-secondary)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        // Use CSS variables for theme-aware colors
        'card-bg': 'var(--color-bg-card)',
        'card-bg-dark': 'var(--color-bg-card)',
        'navbar-bg': 'var(--color-navbar-bg)',
        'navbar-bg-dark': 'var(--color-navbar-bg-dark)',
        'border-color': 'var(--color-border-default)',
        tag: 'var(--color-tag-bg)',
        'tag-text': 'var(--color-tag-text)',
        'tag-dark': 'var(--color-tag-bg)',
        'tag-text-dark': 'var(--color-tag-text)',
        'stats-bg-dark': 'var(--color-bg-card)',
        'input-bg-dark': 'var(--color-bg-input)',
      },
      backgroundColor: (theme) => ({
        ...theme('colors'),
        // Use CSS variables for theme-aware backgrounds
        page: 'var(--color-bg-page)',
        'page-dark': 'var(--color-bg-page)',
        'card-hover-dark': 'var(--color-bg-hover)',
      }),
      textColor: (theme) => ({
        ...theme('colors'),
        // Use CSS variables for theme-aware text colors
        text: 'var(--color-text-primary)',
        'text-dark': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-secondary)',
        'text-dark-muted': 'var(--color-text-secondary)',
        'text-muted-dark': 'var(--color-text-secondary)',
        'text-dark-active': 'var(--color-text-primary)',
      }),
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
