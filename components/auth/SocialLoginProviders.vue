<template>
  <div v-if="enabledProvidersCount > 0" class="social-login-section">
    <!-- Divider with "or continue with" text -->
    <div class="relative my-6 flex items-center">
      <div class="flex-grow border-t social-divider" />
      <span class="flex-shrink mx-4 text-sm text-gray-500 dark:text-gray-400">
        {{ t('auth.or_continue_with') }}
      </span>
      <div class="flex-grow border-t social-divider" />
    </div>

    <!-- Social login buttons grid -->
    <div class="space-y-3">
      <!-- Compact view: Show all providers as buttons -->
      <div v-if="!expandedProvider" class="grid gap-3" :class="gridClass">
        <!-- Telegram button -->
        <button
          v-if="telegramEnabled"
          type="button"
          class="social-btn telegram-btn"
          @click="expandedProvider = 'telegram'"
        >
          <Icon name="fa6-brands:telegram" class="text-lg" aria-hidden="true" />
          <span class="ml-2">Telegram</span>
          <span class="beta-badge">Beta</span>
        </button>

        <!-- Mastodon button -->
        <button
          v-if="mastodonEnabled"
          type="button"
          class="social-btn mastodon-btn"
          @click="expandedProvider = 'mastodon'"
        >
          <Icon name="simple-icons:mastodon" class="text-lg" aria-hidden="true" />
          <span class="ml-2">Mastodon</span>
        </button>

        <!-- Mbin/Kbin button -->
        <button
          v-if="mbinEnabled"
          type="button"
          class="social-btn mbin-btn"
          @click="expandedProvider = 'mbin'"
        >
          <Icon name="simple-icons:lemmy" class="text-lg" aria-hidden="true" />
          <span class="ml-2">{{ t('auth.mbin_label') }}</span>
          <span class="beta-badge">Beta</span>
        </button>

        <!-- Bluesky button (direct redirect, no handle needed) -->
        <button
          v-if="blueskyEnabled"
          type="button"
          class="social-btn bluesky-btn"
          :disabled="blueskyLoading"
          @click="handleBlueskyLogin"
        >
          <LoadingSpinner v-if="blueskyLoading" size="sm" color="white" display="inline" />
          <Icon v-else name="simple-icons:bluesky" class="text-lg" aria-hidden="true" />
          <span class="ml-2">Bluesky</span>
        </button>
      </div>

      <!-- Expanded view: Show selected provider form -->
      <div v-else class="provider-form">
        <!-- Telegram expanded form -->
        <div v-if="expandedProvider === 'telegram'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium flex items-center">
              <Icon name="fa6-brands:telegram" class="mr-2 text-[#26A5E4]" aria-hidden="true" />
              {{ t('auth.login_with_telegram') }}
            </h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="collapseProvider"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <p class="text-sm text-text-muted dark:text-text-dark-muted">
            {{ t('auth.telegram_help') }}
          </p>

          <!-- Telegram Widget Container -->
          <div class="flex justify-center py-2">
            <div ref="telegramWidgetContainer" class="telegram-widget-container">
              <div v-if="telegramLoading" class="flex items-center justify-center py-4">
                <LoadingSpinner size="md" color="primary" display="centered" />
              </div>
            </div>
          </div>

          <div
            v-if="telegramError"
            class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-2 rounded-md text-sm"
          >
            {{ telegramError }}
          </div>

          <button
            type="button"
            class="w-full border social-cancel-btn py-2 rounded-md transition-colors text-sm"
            @click="collapseProvider"
          >
            {{ t('common.back') }}
          </button>
        </div>

        <!-- Mastodon expanded form -->
        <div v-else-if="expandedProvider === 'mastodon'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium flex items-center">
              <Icon name="simple-icons:mastodon" class="mr-2 text-[#6364FF]" aria-hidden="true" />
              {{ t('auth.login_with_mastodon') }}
            </h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="collapseProvider"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <div class="relative">
            <label for="mastodon-instance" class="block text-sm font-medium mb-2">
              {{ t('auth.mastodon_instance') }}
            </label>
            <input
              id="mastodon-instance"
              v-model="mastodonInstance"
              type="text"
              :placeholder="t('auth.mastodon_instance_help')"
              autocomplete="off"
              class="w-full rounded-md border social-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6364FF] focus:border-transparent"
              @keyup.enter="handleMastodonLogin"
              @focus="showInstanceDropdown = true"
              @blur="handleInstanceBlur"
            >
            <!-- Instance dropdown -->
            <div
              v-if="showInstanceDropdown && filteredInstances.length > 0"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto"
            >
              <button
                v-for="instance in filteredInstances"
                :key="instance"
                type="button"
                class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                @mousedown.prevent="selectInstance(instance)"
              >
                <Icon
                  name="simple-icons:mastodon"
                  class="text-[#6364FF] text-xs"
                  aria-hidden="true"
                />
                <span>{{ instance }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="mastodonError"
            class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-2 rounded-md text-sm"
          >
            {{ mastodonError }}
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 border social-cancel-btn py-2 rounded-md transition-colors"
              @click="collapseProvider"
            >
              {{ t('common.back') }}
            </button>
            <button
              type="button"
              :disabled="mastodonLoading || !mastodonInstance.trim()"
              class="flex-1 bg-[#6364FF] hover:bg-[#5354E0] text-white py-2 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleMastodonLogin"
            >
              <LoadingSpinner v-if="mastodonLoading" size="sm" color="white" display="inline" />
              <Icon v-else name="simple-icons:mastodon" aria-hidden="true" />
              {{ mastodonLoading ? t('auth.mastodon_connecting') : t('auth.continue') }}
            </button>
          </div>
        </div>

        <!-- Mbin/Kbin expanded form -->
        <div v-else-if="expandedProvider === 'mbin'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium flex items-center">
              <Icon name="simple-icons:lemmy" class="mr-2 text-[#00BC8C]" aria-hidden="true" />
              {{ t('auth.login_with_mbin') }}
            </h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="collapseProvider"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <div class="relative">
            <label for="mbin-instance" class="block text-sm font-medium mb-2">
              {{ t('auth.mbin_instance') }}
            </label>
            <input
              id="mbin-instance"
              v-model="mbinInstance"
              type="text"
              :placeholder="t('auth.mbin_instance_help')"
              autocomplete="off"
              class="w-full rounded-md border social-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00BC8C] focus:border-transparent"
              @keyup.enter="handleMbinLogin"
              @focus="showMbinInstanceDropdown = true"
              @blur="handleMbinInstanceBlur"
            >
            <!-- Instance dropdown -->
            <div
              v-if="showMbinInstanceDropdown && filteredMbinInstances.length > 0"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto"
            >
              <button
                v-for="instance in filteredMbinInstances"
                :key="instance"
                type="button"
                class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                @mousedown.prevent="selectMbinInstance(instance)"
              >
                <Icon name="simple-icons:lemmy" class="text-[#00BC8C] text-xs" aria-hidden="true" />
                <span>{{ instance }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="mbinError"
            class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-2 rounded-md text-sm"
          >
            {{ mbinErrorMessage }}
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 border social-cancel-btn py-2 rounded-md transition-colors"
              @click="collapseProvider"
            >
              {{ t('common.back') }}
            </button>
            <button
              type="button"
              :disabled="mbinLoading || !mbinInstance.trim()"
              class="flex-1 bg-[#00BC8C] hover:bg-[#00A67C] text-white py-2 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleMbinLogin"
            >
              <LoadingSpinner v-if="mbinLoading" size="sm" color="white" display="inline" />
              <Icon v-else name="simple-icons:lemmy" aria-hidden="true" />
              {{ mbinLoading ? t('auth.mbin_connecting') : t('auth.continue') }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Provider info footer -->
    <p
      v-if="!expandedProvider && enabledProvidersCount > 0"
      class="mt-4 text-xs text-center text-text-muted dark:text-text-dark-muted"
    >
      {{ t('auth.social_login_info') }}
    </p>
  </div>
</template>

<script setup>
  import { ref, computed, watch, nextTick } from 'vue'
  import { useI18n } from '#i18n'
  import { useBlueskyAuth } from '@/composables/useBlueskyAuth'
  import { useMastodonAuth } from '@/composables/useMastodonAuth'
  import { useMbinAuth } from '@/composables/useMbinAuth'
  import { useTelegramAuth } from '@/composables/useTelegramAuth'
  import { useSystemSettings } from '@/composables/useSystemSettings'
  import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

  defineEmits(['login-success', 'login-error'])

  const { t } = useI18n()

  // Read social provider status from system settings (loaded during SSR)
  const { settings } = useSystemSettings()

  // Mastodon auth
  const {
    loading: mastodonLoading,
    error: mastodonError,
    redirectToMastodon,
  } = useMastodonAuth()

  // Mbin auth
  const {
    loading: mbinLoading,
    error: mbinError,
    redirectToMbin,
  } = useMbinAuth()

  // Telegram auth
  const {
    loading: telegramLoading,
    error: telegramError,
    initializeTelegramWidget,
  } = useTelegramAuth()

  // Bluesky auth
  const {
    loading: blueskyLoading,
    redirectToBluesky,
  } = useBlueskyAuth()

  // Provider enabled flags from system settings (SSR-safe)
  const mastodonEnabled = computed(() => settings.value.social_providers?.mastodon?.enabled ?? false)
  const mbinEnabled = computed(() => settings.value.social_providers?.mbin?.enabled ?? false)
  const telegramEnabled = computed(() => settings.value.social_providers?.telegram?.enabled ?? false)
  const blueskyEnabled = computed(() => settings.value.social_providers?.bluesky?.enabled ?? false)

  // Local state
  const expandedProvider = ref(null)
  const mastodonInstance = ref('')
  const mbinInstance = ref('')
  const telegramWidgetContainer = ref(null)
  const showInstanceDropdown = ref(false)
  const showMbinInstanceDropdown = ref(false)

  // Popular Mastodon instances (sorted by activity/popularity)
  const popularMastodonInstances = [
    'mastodon.social',
    'mas.to',
    'mastodon.online',
    'mstdn.social',
    'fosstodon.org',
    'mastodon.world',
    'techhub.social',
    'infosec.exchange',
  ]

  // Popular Mbin/Kbin instances
  const popularMbinInstances = ['fedia.io', 'kbin.run', 'kbin.melroy.org', 'nadajnik.org']

  // Computed - filtered instances based on input
  const filteredInstances = computed(() => {
    const query = mastodonInstance.value.toLowerCase().trim()
    if (!query) return popularMastodonInstances
    return popularMastodonInstances.filter((instance) => instance.toLowerCase().includes(query))
  })

  const filteredMbinInstances = computed(() => {
    const query = mbinInstance.value.toLowerCase().trim()
    if (!query) return popularMbinInstances
    return popularMbinInstances.filter((instance) => instance.toLowerCase().includes(query))
  })

  // Computed
  const enabledProvidersCount = computed(() => {
    let count = 0
    if (telegramEnabled.value) count++
    if (mastodonEnabled.value) count++
    if (mbinEnabled.value) count++
    if (blueskyEnabled.value) count++
    return count
  })

  const gridClass = computed(() => {
    const count = enabledProvidersCount.value
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    // With 3+ providers, stack vertically for better readability
    return 'grid-cols-1'
  })

  // Computed error message for Mbin (translates error codes)
  const mbinErrorMessage = computed(() => {
    if (!mbinError.value) return ''
    if (mbinError.value === 'instance_forbidden') {
      return t('auth.mbin_error_403')
    }
    if (mbinError.value === 'connection_failed') {
      return t('auth.mbin_error_instance')
    }
    return mbinError.value
  })

  // Methods
  function collapseProvider() {
    expandedProvider.value = null
    mastodonInstance.value = ''
    mbinInstance.value = ''
    showInstanceDropdown.value = false
    showMbinInstanceDropdown.value = false
  }

  function selectInstance(instance) {
    mastodonInstance.value = instance
    showInstanceDropdown.value = false
  }

  function selectMbinInstance(instance) {
    mbinInstance.value = instance
    showMbinInstanceDropdown.value = false
  }

  function handleInstanceBlur() {
    // Small delay to allow click on dropdown item
    setTimeout(() => {
      showInstanceDropdown.value = false
    }, 150)
  }

  function handleMbinInstanceBlur() {
    setTimeout(() => {
      showMbinInstanceDropdown.value = false
    }, 150)
  }

  async function handleMastodonLogin() {
    if (mastodonLoading.value || !mastodonInstance.value.trim()) return
    showInstanceDropdown.value = false
    await redirectToMastodon(mastodonInstance.value.trim())
  }

  async function handleMbinLogin() {
    if (mbinLoading.value || !mbinInstance.value.trim()) return
    showMbinInstanceDropdown.value = false
    await redirectToMbin(mbinInstance.value.trim())
  }

  function handleBlueskyLogin() {
    if (blueskyLoading.value) return
    redirectToBluesky()
  }

  // Watch for provider expansion to initialize widgets
  watch(expandedProvider, async (provider) => {
    if (provider === 'telegram') {
      // Wait for next tick to ensure the container is rendered
      await nextTick()
      if (telegramWidgetContainer.value) {
        const tgBotUsername = settings.value.social_providers?.telegram?.bot_username
        await initializeTelegramWidget(telegramWidgetContainer.value, tgBotUsername)
      }
    }
  })

</script>

<style scoped>
  .social-divider {
    border-color: var(--color-border-default);
  }

  .social-btn {
    @apply w-full flex items-center justify-center py-2.5 px-4 rounded-md border transition-all duration-200;
    background-color: var(--color-bg-subtle);
    border-color: var(--color-border-default);
  }

  .social-btn:hover {
    @apply transform scale-[1.02];
  }

  .beta-badge {
    @apply ml-2 px-1.5 py-0.5 text-xs font-medium rounded;
    background-color: rgba(251, 191, 36, 0.2);
    color: #d97706;
  }

  .dark .beta-badge {
    background-color: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
  }

  .social-btn:hover .beta-badge {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .telegram-btn:hover {
    background-color: #26a5e4;
    border-color: #26a5e4;
    color: white;
  }

  .mastodon-btn:hover {
    background-color: #6364ff;
    border-color: #6364ff;
    color: white;
  }

  .mbin-btn:hover {
    background-color: #00bc8c;
    border-color: #00bc8c;
    color: white;
  }

  .bluesky-btn:hover {
    background-color: #0085ff;
    border-color: #0085ff;
    color: white;
  }

  .social-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .social-cancel-btn {
    background-color: var(--color-bg-subtle);
    border-color: var(--color-border-default);
  }

  .social-cancel-btn:hover {
    background-color: var(--color-bg-active);
  }

  .social-instance-btn {
    background-color: var(--color-bg-subtle);
    border-color: var(--color-border-default);
  }

  .social-instance-btn:hover {
    background-color: var(--color-bg-active);
  }

  .provider-form {
    @apply p-4 rounded-lg border;
    background-color: var(--color-bg-subtle);
    border-color: var(--color-border-default);
  }

  .telegram-widget-container {
    min-height: 40px;
  }
</style>
