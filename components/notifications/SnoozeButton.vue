<template>
  <div v-click-outside="closeMenu" class="relative">
    <button
      :disabled="loading"
      class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm"
      :class="snoozeButtonClass"
      @click="toggleMenu"
    >
      <span
        v-if="loading"
        class="inline-block animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
      />
      <Icon
        v-else
        :name="isSnoozed ? 'fa6-solid:bell-slash' : 'fa6-solid:bell'"
        aria-hidden="true"
      />
      <span class="hidden sm:inline">
        {{
          isSnoozed
            ? t('notifications.preferences.snooze_active')
            : t('notifications.preferences.snooze_section')
        }}
      </span>
      <Icon name="fa6-solid:chevron-down" class="text-xs" aria-hidden="true" />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isMenuOpen"
        class="absolute right-0 mt-2 w-48 py-1 rounded-lg shadow-lg z-50 snooze-menu"
      >
        <!-- Snooze Status -->
        <div v-if="isSnoozed" class="px-4 py-2 border-b snooze-border">
          <p class="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            {{ t('notifications.preferences.snooze_until', { time: formatTime(snoozedUntil) }) }}
          </p>
        </div>

        <!-- Cancel Snooze -->
        <button
          v-if="isSnoozed"
          class="w-full text-left px-4 py-2 text-sm snooze-item-hover transition-colors text-red-600 dark:text-red-400"
          @click="handleUnsnooze"
        >
          <Icon name="fa6-solid:xmark" class="mr-2" aria-hidden="true" />
          {{ t('notifications.preferences.snooze_cancel') }}
        </button>

        <!-- Snooze Options -->
        <template v-else>
          <button
            v-for="option in snoozeOptions"
            :key="option.value"
            class="w-full text-left px-4 py-2 text-sm snooze-item-hover snooze-text transition-colors"
            @click="handleSnooze(option.value, option.type)"
          >
            {{ option.label }}
          </button>
        </template>

        <!-- Divider -->
        <div class="border-t snooze-border my-1" />

        <!-- Preferences Link -->
        <NuxtLink
          :to="localePath('/profile/notifications/preferences')"
          class="block px-4 py-2 text-sm snooze-item-hover snooze-text transition-colors"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:gear" class="mr-2" aria-hidden="true" />
          {{ t('notifications.notification_settings') }}
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { useNotification } from '~/composables/useNotification'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()
  const notification = useNotification()

  // State
  const loading = ref(false)
  const isMenuOpen = ref(false)
  const isSnoozed = ref(false)
  const snoozedUntil = ref<string | null>(null)

  // Snooze options
  const snoozeOptions = computed(() => [
    { value: 1, type: 'hours', label: t('notifications.preferences.snooze_1h') },
    { value: 2, type: 'hours', label: t('notifications.preferences.snooze_2h') },
    { value: 4, type: 'hours', label: t('notifications.preferences.snooze_4h') },
    { value: 8, type: 'hours', label: t('notifications.preferences.snooze_8h') },
    {
      value: 0,
      type: 'until_tomorrow',
      label: t('notifications.preferences.snooze_until_tomorrow'),
    },
  ])

  const snoozeButtonClass = computed(() => {
    if (isSnoozed.value) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
    }
    return 'snooze-btn-default'
  })

  // Methods
  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value
  }

  function closeMenu() {
    isMenuOpen.value = false
  }

  function formatTime(dateString: string | null): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  async function loadSnoozeStatus() {
    try {
      const response = await $api.notifications.getPreferences()
      isSnoozed.value = response.data.snooze?.is_snoozed || false
      snoozedUntil.value = response.data.snooze?.snoozed_until || null
    } catch (error) {
      console.error('Error loading snooze status:', error)
    }
  }

  async function handleSnooze(value: number, type: string) {
    loading.value = true
    try {
      const response = await $api.notifications.snooze({
        hours: type === 'hours' ? value : undefined,
        until_tomorrow: type === 'until_tomorrow',
      })
      isSnoozed.value = true
      snoozedUntil.value = response.data.snoozed_until
      notification.success(t('notifications.preferences.snooze_activated'))
    } catch (error) {
      console.error('Error snoozing:', error)
    } finally {
      loading.value = false
      closeMenu()
    }
  }

  async function handleUnsnooze() {
    loading.value = true
    try {
      await $api.notifications.unsnooze()
      isSnoozed.value = false
      snoozedUntil.value = null
      notification.success(t('notifications.preferences.snooze_cancelled'))
    } catch (error) {
      console.error('Error unsnoozing:', error)
    } finally {
      loading.value = false
      closeMenu()
    }
  }

  // Click outside directive
  const vClickOutside = {
    beforeMount(
      el: HTMLElement & { clickOutsideEvent?: (event: Event) => void },
      binding: { value: () => void }
    ) {
      el.clickOutsideEvent = (evt: Event) => {
        if (!(el === evt.target || el.contains(evt.target as Node))) {
          binding.value()
        }
      }
      document.addEventListener('click', el.clickOutsideEvent)
    },
    unmounted(el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }) {
      if (el.clickOutsideEvent) {
        document.removeEventListener('click', el.clickOutsideEvent)
      }
    },
  }

  onMounted(() => {
    loadSnoozeStatus()
  })
</script>

<style scoped>
  .snooze-menu {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .snooze-border {
    border-color: var(--color-border-default);
  }

  .snooze-item-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .snooze-btn-default {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-default);
  }

  .snooze-btn-default:hover {
    background-color: var(--color-bg-hover);
  }

  .snooze-text {
    color: var(--color-text);
  }
</style>
