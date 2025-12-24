<template>
  <div
    v-if="!hasConsented && showBanner"
    class="fixed bottom-0 left-0 right-0 z-50 cookie-banner shadow-lg"
  >
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Content -->
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t('cookies.banner.title') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ $t('cookies.banner.description') }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-2 lg:ml-4">
          <button
            class="px-4 py-2 text-sm bg-primary hover:bg-primary-dark rounded-md transition-colors btn-primary-text"
            @click="acceptEssential"
          >
            {{ $t('cookies.banner.accept') }}
          </button>
        </div>
      </div>

      <!-- Privacy Policy Link -->
      <div class="mt-3 pt-3 cookie-banner-divider">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('cookies.banner.learnMore') }}
          <a
            :href="getBackendUrl() + '/' + $i18n.locale + '/privacy'"
            class="text-blue-600 hover:text-blue-800 underline"
          >
            {{ $t('cookies.banner.privacyPolicy') }}
          </a>
          {{ $t('cookies.banner.and') }}
          <a
            :href="getBackendUrl() + '/' + $i18n.locale + '/cookies'"
            class="text-blue-600 hover:text-blue-800 underline"
          >
            {{ $t('cookies.banner.cookiesPolicy') }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'

  const { getBackendUrl } = useAppUrl()

  // State
  const showBanner = ref(false)
  const hasConsented = ref(false)

  // Check if user has already consented
  onMounted(() => {
    if (import.meta.client) {
      const consent = localStorage.getItem('cookie-consent')
      hasConsented.value = !!consent

      if (!consent) {
        // Show banner after a short delay to avoid layout shift
        setTimeout(() => {
          showBanner.value = true
        }, 1000)
      }
    }
  })

  // Accept essential cookies only
  const acceptEssential = () => {
    if (import.meta.client) {
      localStorage.setItem(
        'cookie-consent',
        JSON.stringify({
          essential: true,
          timestamp: Date.now(),
          version: '1.0',
        })
      )
      hideBanner()
    }
  }

  // Hide the banner
  const hideBanner = () => {
    showBanner.value = false
    hasConsented.value = true
  }
</script>

<style scoped>
  .cookie-banner {
    background-color: var(--color-bg-card);
    border-top: 1px solid var(--color-border-default);
  }

  .cookie-banner-divider {
    border-top: 1px solid var(--color-border-default);
  }
</style>
