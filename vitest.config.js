import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.js'],
    include: ['test/unit/**/*.{test,spec}.js'],
    exclude: ['node_modules/**', 'test/e2e/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'test/'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './'),
      '#app': resolve(__dirname, './test/mocks/nuxt'),
      '#i18n': resolve(__dirname, './test/mocks/i18n'),
      '#imports': resolve(__dirname, './test/mocks/imports'),
      'vue-router': resolve(__dirname, './test/mocks/vue-router'),
      '@nuxtjs/i18n/dist/runtime/composables': resolve(__dirname, './test/mocks/i18n'),
      // Mock image assets
      'assets/images/logo-wolf.png': resolve(__dirname, './test/mocks/image-stub.js'),
    },
  },
})
