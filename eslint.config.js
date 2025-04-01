import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.ts'],
    ignores: ['**/*.vue', '.nuxt/**', 'node_modules/**', 'dist/**', '.output/**', '*.config.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  {
    ignores: ['.nuxt/**', 'node_modules/**', 'dist/**', '.output/**'],
  },
]
