import { fileURLToPath } from 'url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },

  ssr: true,
  nitro: {
    preset: 'static',
    output: {
      publicDir: '../public_nuxt',
    },
  },
  app: {
    head: {
      title: 'Repostea - Una ventana abierta a lo que se comparte en la red',
      meta: [
        {
          name: 'description',
          content: 'Plataforma social para compartir enlaces y noticias',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
        },
      ],
    },
  },

  css: ['@/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ['@pinia/nuxt', '@nuxtjs/i18n', '@nuxtjs/tailwindcss', '@vueuse/nuxt', '@nuxt/image'],

  i18n: {
    locales: [
      {
        code: 'es',
        iso: 'es-ES',
        file: 'es.json',
        name: 'Español',
      },
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
        name: 'English',
      },
    ],

    defaultLocale: 'es',
    strategy: 'prefix',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'locale',
      redirectOn: 'root',
      alwaysRedirect: true,
      cookieCrossOrigin: true,
    },
    skipSettingLocaleOnNavigate: false,
    bundle: {
      optimizeTranslationDirective: true,
    },
  },

  runtimeConfig: {
    private: {},
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
      appName: 'Repostea',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      reposteaId: process.env.REPOSTEA_ID,
      reposteaApiKey: process.env.REPOSTEA_API_KEY,
    },
  },

  pinia: {
    autoImports: ['defineStore', 'storeToRefs'],
  },

  imports: {
    dirs: ['stores', 'composables'],
  },

  alias: {
    '@': fileURLToPath(new URL('./', import.meta.url)),
    '~': fileURLToPath(new URL('./', import.meta.url)),
  },

  tailwindcss: {
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    injectPosition: 0,
    viewer: false,
  },

  compatibilityDate: '2025-03-26',
})
