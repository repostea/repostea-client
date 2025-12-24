<template>
  <div class="notification-tabs flex gap-1 p-1 rounded-lg mb-6">
    <NuxtLink
      :to="localePath('/profile/notifications')"
      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
      :class="activeTab === 'list'
        ? 'notification-tab-active'
        : 'notification-tab-inactive'"
    >
      <Icon name="fa6-solid:bell" class="text-base" aria-hidden="true" />
      <span>{{ t('notifications.tabs.list') }}</span>
    </NuxtLink>
    <NuxtLink
      :to="localePath('/profile/notifications/preferences')"
      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
      :class="activeTab === 'preferences'
        ? 'notification-tab-active'
        : 'notification-tab-inactive'"
    >
      <Icon name="fa6-solid:sliders" class="text-base" aria-hidden="true" />
      <span>{{ t('notifications.tabs.preferences') }}</span>
    </NuxtLink>
  </div>
</template>

<script setup>
import { useI18n, useLocalePath } from '#i18n'

const { t } = useI18n()
const localePath = useLocalePath()

defineProps({
  activeTab: {
    type: String,
    required: true,
    validator: (value) => ['list', 'preferences'].includes(value)
  }
})
</script>

<style scoped>
.notification-tabs {
  background-color: var(--color-bg-subtle);
  border: 1px solid var(--color-border-default);
}

.notification-tab-active {
  background-color: var(--color-bg-card);
  color: var(--color-text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.notification-tab-inactive {
  color: var(--color-text-muted);
}

.notification-tab-inactive:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}
</style>
