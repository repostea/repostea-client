import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,

  devtools: {
    enabled: false, // Disable DevTools to improve startup performance
  },
  devServer: {
    https: false,
  },

  nitro: {
    preset: 'node-server',
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
    minify: true,
    routeRules: {
      // Cache static assets aggressively (1 year)
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
      '/favicon.ico': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
      '/favicon-96x96.png': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
      '/apple-touch-icon.png': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
      '/site.webmanifest': {
        headers: {
          'Cache-Control': 'public, max-age=86400, must-revalidate',
        },
      },
      '/**': {
        headers: {
          Connection: 'keep-alive',
          'Keep-Alive': 'timeout=60',
        },
      },
    },
    serverAssets: [
      {
        baseName: 'server-assets',
        dir: 'server-assets',
      },
    ],
  },

  app: {
    buildAssetsDir: '/_nuxt/',
    head: {
      title: process.env.NUXT_PUBLIC_SITE_NAME || 'Repostea',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Community content aggregation platform',
        },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'application-name', content: process.env.NUXT_PUBLIC_SITE_NAME || 'Repostea' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-title', content: process.env.NUXT_PUBLIC_SITE_NAME || 'Repostea' },
        { name: 'apple-mobile-web-app-title', content: process.env.NUXT_PUBLIC_SITE_NAME || 'Repostea' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        // Preconnect to API server (dynamic based on environment)
        ...((() => {
          const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api'
          try {
            const apiUrl = new URL(apiBase)
            const apiOrigin = apiUrl.origin
            // Only add if it's a remote API (not localhost)
            if (!apiOrigin.includes('localhost') && !apiOrigin.includes('127.0.0.1')) {
              return [
                { rel: 'preconnect' as const, href: apiOrigin, crossorigin: 'use-credentials' as const },
                { rel: 'dns-prefetch' as const, href: apiOrigin }
              ]
            }
          } catch {
            // Invalid URL, skip
          }
          return []
        })()),

        // Favicons and app icons
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      script: [
        // Theme is now handled by plugins/theme-cookie.server.js
      ],
    },
  },

  css: [
    '~/assets/css/theme-variables.css',
    '~/assets/css/themes.css',
    '~/assets/css/main.css',
    '~/assets/css/markdown-image-styles.css',
  ],

  postcss: {
    plugins: {
      'tailwindcss/nesting': {},
      tailwindcss: {},
      autoprefixer: {},
      ...(process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'staging'
        ? {
            cssnano: {
              preset: [
                'default',
                {
                  discardComments: {
                    removeAll: true,
                  },
                  normalizeWhitespace: true,
                  colormin: true,
                  minifyFontValues: true,
                  minifySelectors: true,
                },
              ],
            },
          }
        : {}),
    },
  },

  tailwindcss: {
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    // @ts-expect-error - injectPosition is a valid option but not in types
    injectPosition: 0,
    viewer: false,
  },

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/turnstile',
    '@nuxtjs/robots', // Robots.txt module (required by sitemap)
    '@nuxtjs/sitemap', // Added sitemap module
    '@nuxt/image', // Image optimization
    '@nuxt/icon', // Icon module with offline support
    '@nuxtjs/critters', // Critical CSS inline
  ],

  // Critters config: inline critical CSS, defer non-critical
  critters: {
    config: {
      preload: 'swap', // Use font-display: swap for preloaded fonts
      inlineFonts: false, // Don't inline fonts
      pruneSource: false, // Keep original CSS files
    },
  },

  icon: {
    // Use local icon bundles, fallback to remote API for non-installed collections
    // Installed collections: @iconify-json/fa6-solid, fa6-regular, fa6-brands
    serverBundle: 'local',
    clientBundle: {
      scan: true,
    },
    fallbackToApi: true,
  },

  image: {
    provider: 'ipx',
    quality: 80,
    format: ['webp'],
    sizes: [320, 640, 768, 1024, 1280],
    domains: (() => {
      const domains = ['img.youtube.com']
      const apiBase = process.env.NUXT_PUBLIC_API_BASE || ''
      try {
        const apiUrl = new URL(apiBase)
        if (apiUrl.hostname) {
          domains.unshift(apiUrl.hostname)
        }
      } catch {
        // Invalid URL, skip
      }
      return domains
    })(),
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
    presets: {
      thumbnail: {
        modifiers: {
          format: 'webp',
          width: 90,
          height: 90,
          quality: 70,
          fit: 'cover',
        },
      },
      avatar: {
        modifiers: {
          format: 'webp',
          width: 64,
          height: 64,
          quality: 75,
          fit: 'cover',
        },
      },
      post: {
        modifiers: {
          format: 'webp',
          quality: 80,
          fit: 'cover',
        },
      },
    },
    ipx: {
      maxAge: 60 * 60 * 24 * 365,
      // @ts-expect-error - sharp is a valid IPX option but not in types
      sharp: {
        // Optimize Sharp for better performance
        limitInputPixels: false,
      },
      // Filesystem cache for processed images (persists between restarts)
      dir: '.cache/ipx',
    },
    densities: [1, 2],
    preload: {
      // Don't preload images by default, let lazy loading handle it
      default: false,
    },
  },

  sitemap: {
    // @ts-expect-error - hostname is a valid sitemap option
    hostname: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    gzip: true,
    i18n: true,
    routes: async () => {
      const { $fetch } = await import('ofetch')
      const apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api'

      const staticPages = [
        { url: '/', priority: 1.0, changefreq: 'daily' },
        { url: '/stats', priority: 0.7, changefreq: 'weekly' },
        { url: '/transparency', priority: 0.7, changefreq: 'monthly' },
        { url: '/karma', priority: 0.7, changefreq: 'monthly' },
      ]

      let postUrls = []
      try {
        // Fetch all published posts (increase limit or implement pagination)
        const postsData = await $fetch(`${apiBaseUrl}/posts?limit=1000&orderBy=created_at&order=desc&status=published`)
        if (postsData && postsData.data) {
          postUrls = postsData.data.map((post: any) => ({
            url: `/posts/${post.slug}`,
            lastmod: post.updated_at || post.created_at || new Date().toISOString(),
            priority: 0.8,
            changefreq: 'weekly'
          }))
        }
      } catch (e) {
        console.error('Error fetching posts for sitemap:', e)
      }

      let userUrls = []
      try {
        // Fetch active users for sitemap
        const usersData = await $fetch(`${apiBaseUrl}/users?limit=500&orderBy=karma&order=desc`)
        if (usersData && usersData.data) {
          userUrls = usersData.data.map((user: any) => ({
            url: `/u/${user.username}`,
            priority: 0.6,
            changefreq: 'weekly'
          }))
        }
      } catch (e) {
        console.error('Error fetching users for sitemap:', e)
      }

      let tagUrls = []
      try {
        // Fetch all tags
        const tagsData = await $fetch(`${apiBaseUrl}/tags?limit=200`)
        if (tagsData && tagsData.data) {
          tagUrls = tagsData.data.map((tag: any) => ({
            url: `/tags/${tag.name}`,
            priority: 0.5,
            changefreq: 'weekly'
          }))
        }
      } catch (e) {
        console.error('Error fetching tags for sitemap:', e)
      }

      let subUrls = []
      try {
        // Fetch all subs/communities
        const subsData = await $fetch(`${apiBaseUrl}/subs?limit=200`)
        if (subsData && subsData.data) {
          subUrls = subsData.data.map((sub: any) => ({
            url: `/s/${sub.name}`,
            priority: 0.7,
            changefreq: 'daily'
          }))
        }
      } catch (e) {
        console.error('Error fetching subs for sitemap:', e)
      }

      return [...staticPages, ...postUrls, ...userUrls, ...tagUrls, ...subUrls]
    },
    // Exclude auth and private routes
    filter: ({ routes }: { routes: Array<{ url: string }> }) => routes.filter((route: { url: string }) =>
      !route.url.includes('/admin') &&
      !route.url.includes('/profile') &&
      !route.url.includes('/auth')
    ),
  },

  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY,
    // @ts-expect-error - injectionMode is a valid turnstile option
    injectionMode: 'none',
  },

  robots: {
    // In staging, block all indexing
    ...(process.env.APP_ENV === 'staging'
      ? {
          disallow: ['/'],
          allow: [],
        }
      : {
          // Production: allow indexing with specific disallows
          disallow: [
            '/auth/',
            '/*/auth/',
            '/profile/',
            '/*/profile/',
            '/admin/',
            '/*/admin/',
            '/submit/',
            '/*/submit/',
            '/lists/',
            '/*/lists/',
            '/notifications',
            '/*/notifications',
            '/onboarding/',
            '/*/onboarding/',
            '/subs/create/',
            '/*/subs/create/',
            '/s/create',
            '/*/s/create',
            '/api/**',
          ],
          allow: ['/'],
        }),
  },

  // Site config - control automatic noindex behavior
  // In production: indexable=true (allow indexing), noindex for dialects handled in app.vue
  // In staging: indexable=false (block all indexing)
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    // Only block indexing in staging, allow in development and production
    indexable: process.env.APP_ENV !== 'staging',
  },

  // Auto-generate i18n locales and file list based on i18n/locales directory
  // @ts-expect-error - dynamic locale configuration
  i18n: (() => {
    const localesDir = fileURLToPath(new URL('./i18n/locales', import.meta.url))

    // Read supported locales from environment variable
    // Format: "es,en,ca,gl,eu" (comma-separated list)
    const supportedLocalesEnv = process.env.NUXT_PUBLIC_SUPPORTED_LOCALES || 'es,en'
    const supportedLocales = supportedLocalesEnv.split(',').map(l => l.trim()).filter(Boolean)

    // Get all available locale directories
    const availableCodes = fs
      .readdirSync(localesDir)
      .filter((d) => fs.statSync(path.join(localesDir, d)).isDirectory())

    // Filter to only include supported locales
    const codes = availableCodes.filter(code => supportedLocales.includes(code))

    if (codes.length === 0) {
      throw new Error(`No valid locales found! Supported: ${supportedLocales.join(', ')} | Available: ${availableCodes.join(', ')}`)
    }

    const locales = codes.map((code) => {
      const files = fs
        .readdirSync(path.join(localesDir, code))
        .filter((f) => f.endsWith('.json'))
        .map((f) => `${code}/${f}`)
      return {
        code,
        language: code === 'en' ? 'en-US' : `${code}-${code.toUpperCase()}`,
        iso: code === 'en' ? 'en-US' : `${code}-${code.toUpperCase()}`,
        name: code,
        files,
      }
    })

    // Read default locale from environment variable (defaults to 'es' if not set)
    const defaultLocale = process.env.NUXT_PUBLIC_DEFAULT_LOCALE || 'es'

    // Validate that defaultLocale is in supportedLocales
    if (!supportedLocales.includes(defaultLocale)) {
      throw new Error(`Default locale "${defaultLocale}" is not in supported locales: ${supportedLocales.join(', ')}`)
    }

    // Only set baseUrl in production to avoid nuxt-site-config localhost warning
    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL
    const isProduction = siteUrl && !siteUrl.includes('localhost')

    return {
      ...(isProduction && { baseUrl: siteUrl }),
      lazy: true,
      // langDir is relative to this config file (i18n/i18n.config.ts), so 'locales' maps to ./i18n/locales
      langDir: 'locales',
      defaultLocale,
      strategy: 'prefix',
      vueI18n: '~/i18n/i18n.config.ts',
      bundle: {
        optimizeTranslationDirective: false,
      },
      // Disable automatic browser language detection/redirect
      // We handle this manually with a language selector on root URL
      detectBrowserLanguage: false,
      locales,
    }
  })(),

  // @ts-expect-error - dynamic routeRules with middleware
  routeRules: (() => {
    // Get supported locales from environment
    const supportedLocalesEnv = process.env.NUXT_PUBLIC_SUPPORTED_LOCALES || 'es,en'
    const supportedLocales = supportedLocalesEnv.split(',').map(l => l.trim()).filter(Boolean)
    const defaultLocale = process.env.NUXT_PUBLIC_DEFAULT_LOCALE || 'es'

    // List of all locale folders that exist in the project
    const allExistingLocales = ['en', 'es', 'ca', 'gl', 'eu']

    // Create redirect rules for unsupported locales
    const unsupportedLocaleRedirects: Record<string, { redirect: string; statusCode: number }> = {}
    for (const locale of allExistingLocales) {
      if (!supportedLocales.includes(locale)) {
        // Redirect unsupported locale to default locale
        unsupportedLocaleRedirects[`/${locale}/**`] = {
          redirect: `/${defaultLocale}/**`,
          statusCode: 301
        }
      }
    }

    return {
      // Unsupported locale redirects (dynamic based on .env)
      ...unsupportedLocaleRedirects,

      '/api/**': {
        cors: true,
      prerender: false,
      index: false,
      headers: {
        'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
        'Access-Control-Allow-Origin':
          process.env.NUXT_PUBLIC_SITE_URL || process.env.NUXT_PUBLIC_CLIENT_URL || 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true',
      },
    },

    // Auth routes
    '/auth/login': { middleware: ['guest'] },
    '/auth/register': { middleware: ['guest'] },
    '/auth/forgot-password': { middleware: ['guest'] },
    '/auth/reset-password/**': { middleware: ['guest'] },

    // Static pages with cache
    '/': { isr: true },
    '/stats': { isr: 60 }, // Regenerate every minute

    // Profile routes - require auth
    '/profile/**': {
      middleware: ['auth'],
      isr: true,
    },

    // Onboarding routes - lazy load, guest only
    '/onboarding/**': {
      middleware: ['guest'],
      prerender: false,
    },

    // Dynamic post routes with ISR
    '/posts/**': { isr: 60 }, // 1 minute cache - synced with backend for faster updates
    '/p/**': { isr: 60 }, // Post permalinks with cache

    // User profiles with cache
    '/u/**': { isr: 300 }, // 5 minutes cache - reduced for more responsive updates

    // Subs with cache
    '/s/**': { isr: 60 }, // 1 minute cache - synced with posts

    // Tags with cache
    '/tags/**': { isr: 600 }, // 10 minutes cache

    // Notifications require auth
    '/notifications': { middleware: ['auth'] },

    // Submit page requires auth
    '/submit': { middleware: ['auth'] },

    // Lists require auth
    '/lists/**': { middleware: ['auth'] },

    '/.well-known/appspecific/com.chrome.devtools.json': {
      statusCode: 404,
    },
    }
  })(),

  devProxy: {
    '/api': {
      target: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
    },
    '/rss': {
      target: process.env.NUXT_PUBLIC_SERVER_URL || 'http://localhost:8000',
      changeOrigin: true,
    },
  },

  runtimeConfig: {
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || process.env.NUXT_PUBLIC_SITE_NAME || 'Repostea',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
      serverUrl: process.env.NUXT_PUBLIC_SERVER_URL || 'http://localhost:8000',
      clientUrl: process.env.NUXT_PUBLIC_CLIENT_URL || 'http://localhost:3000',
      appEnvironment: process.env.APP_ENV || 'development',
      appEnv: process.env.APP_ENV || 'development', // Alias for convenience
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
      // Reverb WebSocket config
      reverbAppKey: process.env.NUXT_PUBLIC_REVERB_APP_KEY || 'local',
      reverbHost: process.env.NUXT_PUBLIC_REVERB_HOST || 'localhost',
      reverbPort: process.env.NUXT_PUBLIC_REVERB_PORT || '8080',
      reverbScheme: process.env.NUXT_PUBLIC_REVERB_SCHEME || 'http',
      // Tenor GIF API
      tenorApiKey: process.env.NUXT_PUBLIC_TENOR_API_KEY || '',
      // Site branding (for footer, etc.)
      contactEmail: process.env.NUXT_PUBLIC_CONTACT_EMAIL || '',
      fediverseHandle: process.env.NUXT_PUBLIC_FEDIVERSE_HANDLE || '',
      twitterHandle: process.env.NUXT_PUBLIC_TWITTER_HANDLE || '',
      // Cookie domain for cross-subdomain auth
      cookieDomain: process.env.NUXT_PUBLIC_COOKIE_DOMAIN || '',
    },
  },

  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: false,
    appManifest: false, // Disable app manifest to fix #app-manifest error
    // @ts-expect-error - treeshakeClientOnly is a valid experimental option
    treeshakeClientOnly: true,
    inlineSSRStyles: true, // Inline all critical CSS to reduce render-blocking
    componentIslands: true,
    headNext: true,
    clientNodeCompat: false,
    writeEarlyHints: false,
    viewTransition: true, // Enable view transitions for smoother navigation
    asyncContext: true,
    defaults: {
      nuxtLink: {
        prefetch: false, // Don't prefetch linked routes by default (reduces initial CSS load)
      },
    },
  },

  vite: {
    resolve: {
      alias: {
        // Ensure #entry is resolved during build to avoid import map issues in incognito mode
        '#entry': fileURLToPath(new URL('./.nuxt/entry', import.meta.url)),
      },
    },
    server: {
      hmr:
        process.env.NODE_ENV === 'production'
          ? {
              protocol: 'wss',
              port: 443,
              timeout: 30000,
              clientPort: 443,
            }
          : {
              protocol: 'ws',
              host: 'localhost',
              timeout: 30000,
            },
      watch: {
        usePolling: false,
        interval: 1000,
      },
    },
    build: {
      cssCodeSplit: true,
      cssMinify: 'esbuild',
      rollupOptions: {
        output: {
          // Conservative manual chunking to avoid circular dependencies
          // Only split large, independent libraries that don't have auto-imports issues
          manualChunks: (id) => {
            // Only chunk specific heavy libraries from node_modules
            if (id.includes('node_modules')) {
              // Chart.js is heavy and independent (only used in /stats page)
              if (id.includes('chart.js')) {
                return 'charts'
              }
              // Markdown parser is heavy and independent
              if (id.includes('marked')) {
                return 'markdown'
              }
              // Leave Vue, Router, i18n, Pinia in default vendor chunk
              // to avoid circular dependency issues with auto-imports
            }

            // Only chunk heavy, lazy-loaded page sections
            // Profile pages (lazy loaded, auth-gated)
            if (id.includes('/pages/profile/')) {
              return 'profile'
            }

            // Onboarding (lazy loaded, guest-only)
            if (id.includes('/pages/onboarding/')) {
              return 'onboarding'
            }

            // Note: Stats components are used in home, so NOT separated
            // to avoid extra HTTP requests on initial load
          },
        },
      },
      minify: process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'staging' ? 'esbuild' : false,
      target: 'esnext',
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: [
        'axios',
        'vue',
        'vue-router',
        'vue-i18n',
        // 'pinia', // Don't optimize pinia with auto-imports
        '@vueuse/core',
        'marked',
        'dompurify',
      ],
      exclude: ['@nuxt/devtools', '@nuxt/kit'],
    },
    css: {
      devSourcemap: process.env.NODE_ENV === 'development',
    },
    esbuild: {
      legalComments: 'none',
    },
  },

  alias: {
    '@': fileURLToPath(new URL('./', import.meta.url)),
    '~': fileURLToPath(new URL('./', import.meta.url)),
    // Fix for #entry module specifier error in incognito/private browsing
    '#entry': fileURLToPath(new URL('./.nuxt/entry', import.meta.url)),
  },

  plugins: [
    '~/plugins/site-branding.ts',
    '~/plugins/api.js',
    '~/plugins/offline-sync.js',
    '~/plugins/theme-cookie.server.js',
    '~/plugins/theme-sync.client.js',
    '~/plugins/navigation-helper.js',
    '~/plugins/register-sw.client.js',
    '~/plugins/error-handler.client.js',
    '~/plugins/hmr-error-handler.client.js',
    '~/plugins/lazy-components.client.ts',
    '~/plugins/ext-plugins.client.ts',
  ],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
      ignore: ['Footer.vue'],
    },
    {
      path: '~/components/layout',
      prefix: 'Layout',
    },
    {
      path: '~/components/ui',
      prefix: 'Ui',
    },
  ],

  router: {
    options: {
      linkActiveClass: 'active',
      linkExactActiveClass: 'exact-active',
    },
  },

  vue: {
    compilerOptions: {
      comments: false,
    },
  },

  compatibilityDate: '2025-04-21',
})
