import withNuxt from './.nuxt/eslint.config.mjs'
import globals from 'globals'

export default withNuxt(
  // General rules
  {
    rules: {
      // Allow unused vars with underscore prefix
      // Disable base rule (TypeScript version handles both)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // TypeScript - relax strict rules for practicality
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',

      // Allow empty blocks (useful for catch blocks)
      'no-empty': 'off',

      // Allow duplicate imports (Nuxt auto-imports can cause this)
      'import/no-duplicates': 'warn',

      // Vue specific
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/no-mutating-props': 'off', // False positive with defineModel()
      'vue/no-unused-vars': 'warn',
      'vue/no-v-html': 'off', // We use DOMPurify to sanitize HTML

      // General
      'no-case-declarations': 'off',

      // Allow process.client for testability (import.meta.client is compile-time)
      'nuxt/prefer-import-meta': 'off',
    },
  },

  // Cypress test files
  {
    files: ['cypress/**/*.js', 'cypress/**/*.ts', '**/*.cy.js', '**/*.cy.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        cy: 'readonly',
        Cypress: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        before: 'readonly',
        after: 'readonly',
        expect: 'readonly',
        context: 'readonly',
      },
    },
  },

  // Vitest test files
  {
    files: ['test/**/*.js', 'test/**/*.ts'],
    languageOptions: {
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
)
