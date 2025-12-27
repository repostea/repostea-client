<template>
  <div class="min-h-screen flex flex-col bg-page dark:bg-page-dark">
    <!-- Skip link for keyboard users -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-lg"
    >
      {{ $t('a11y.skip_to_content') }}
    </a>

    <nav class="navbar shadow-md" aria-label="Main navigation">
      <div class="container mx-auto px-1 md:px-4">
        <div class="flex justify-between h-16">
          <!-- Logo - pushed to the left on mobile -->
          <div class="flex items-center flex-shrink-0">
            <NuxtLink :to="localePath('/')" class="navbar-brand tracking-tight flex items-center">
              <Logo />
            </NuxtLink>
          </div>
          <DesktopMenu />
          <div class="flex justify-end items-center md:hidden ml-auto h-full">
            <MobileMenu v-model="mobileMenuOpen" />
          </div>
        </div>
      </div>
    </nav>

    <!-- Staging Environment Warning Banner -->
    <div v-if="isStaging" class="bg-orange-700 text-white text-center py-2 px-4 text-sm">
      <div class="container mx-auto flex items-center justify-center gap-2 flex-wrap">
        <Icon name="fa6-solid:flask" class="text-white" aria-hidden="true" />
        <span class="font-semibold">{{ $t('staging.banner_title') }}</span>
        <span class="hidden sm:inline text-white/80">—</span>
        <span class="text-white/90 text-xs sm:text-sm">
          {{ $t('staging.banner_message') }}
        </span>
      </div>
    </div>

    <div
      v-if="$slots.subnav"
      class="sub-navbar bg-white dark:bg-card-bg-dark border-b border-border-color shadow-sm"
    >
      <div class="container mx-auto">
        <div class="flex overflow-x-auto">
          <div class="w-full subnav-container">
            <slot name="subnav" />
          </div>
        </div>
      </div>
    </div>

    <main id="main-content" class="flex-grow container mx-auto px-1 md:px-4 py-4 md:py-6">
      <slot />
    </main>

    <!-- Unified Notification System -->
    <NotificationContainer />

    <ClientOnly>
      <CookieBanner />
    </ClientOnly>

    <Footer />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useCookie } from '#app'
  import { useLocalePath, useI18n } from '#i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { useNotification } from '~/composables/useNotification'
  import { useRealtimeStats } from '~/composables/useRealtimeStats'
  import DesktopMenu from '~/components/menu/DesktopMenu.vue'
  import MobileMenu from '~/components/menu/MobileMenu.vue'
  import Footer from '~/components/layout/Footer.vue'
  import NotificationContainer from '~/components/common/NotificationContainer.vue'
  import CookieBanner from '~/components/legal/CookieBanner.vue'

  const localePath = useLocalePath()
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const { success, info, error: showError } = useNotification()
  const successMessage = ref('')
  const errorMessage = ref('')
  const mobileMenuOpen = ref(false)

  // Initialize realtime stats updates (WebSocket connection for live vote/comment updates)
  useRealtimeStats()

  // Check if we're in staging environment
  const config = useRuntimeConfig()
  const isStaging = computed(() => config.public.appEnv === 'staging')

  onMounted(() => {
    if (import.meta.client) {
      // Check for email verification query params
      if (route.query.verified === '1') {
        if (route.query.already === 'true') {
          info(t('auth.email_already_verified'))
        } else {
          success(t('auth.email_verified_successfully'))
        }

        // Remove query params from URL
        const cleanQuery = { ...route.query }
        delete cleanQuery.verified
        delete cleanQuery.already
        router.replace({ query: cleanQuery })
      } else if (route.query.verified === '0') {
        // Handle verification errors
        const errorType = route.query.error
        if (errorType === 'expired') {
          showError(t('auth.email_verification_expired'))
        } else if (errorType === 'invalid') {
          showError(t('auth.email_verification_invalid'))
        } else {
          showError(t('auth.email_verification_error'))
        }

        // Remove query params from URL
        const cleanQuery = { ...route.query }
        delete cleanQuery.verified
        delete cleanQuery.error
        router.replace({ query: cleanQuery })
      }

      const flash = useCookie('flash_message')
      const flashType = useCookie('flash_type')

      if (flash.value) {
        if (flashType.value === 'success') {
          successMessage.value = flash.value
        } else if (flashType.value === 'error') {
          errorMessage.value = flash.value
        }

        flash.value = null
        flashType.value = null

        setTimeout(() => {
          successMessage.value = ''
          errorMessage.value = ''
        }, 5000)
      }
    }
  })
</script>

<style>
  @media (max-width: 768px) {
    .subnav-container :deep(a:not(.active) span) {
      display: none;
    }

    .subnav-container :deep(a.active span) {
      display: inline;
    }

    .subnav-container :deep(a) {
      padding: 0.75rem 0.5rem;
    }

    .navbar .container {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .menu-button {
      margin-left: auto;
    }
  }
</style>
