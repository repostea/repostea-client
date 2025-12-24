<template>
  <div class="layout-selector">
    <div class="flex items-center">
      <div class="control-group flex bg-transparent dark:bg-transparent rounded-md p-0.5 gap-0.5">
        <button
          class="layout-button hidden sm:block"
          :class="{ active: layout === 'card' }"
          :title="$t('layout.card_view')"
          :aria-label="$t('layout.card_view')"
          @click="setLayout('card')"
        >
          <Icon name="fa6-solid:table-cells-large" class="text-xs" aria-hidden="true" />
        </button>
        <button
          class="layout-button"
          :class="{ active: layout === 'compact' }"
          :title="$t('layout.compact_view')"
          :aria-label="$t('layout.compact_view')"
          @click="setLayout('compact')"
        >
          <Icon name="fa6-solid:list" class="text-xs" aria-hidden="true" />
        </button>
        <button
          class="layout-button"
          :class="{ active: layout === 'list' }"
          :title="$t('layout.list_view')"
          :aria-label="$t('layout.list_view')"
          @click="setLayout('list')"
        >
          <Icon name="fa6-solid:align-justify" class="text-xs" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useUserPreferencesStore } from '~/stores/userPreferences'
  import { useI18n } from '#i18n'

  // We need useI18n for the $t in the template
  useI18n()
  const userPreferencesStore = useUserPreferencesStore()

  const layout = computed(() => userPreferencesStore.getLayout)

  function setLayout(newLayout) {
    userPreferencesStore.setLayout(newLayout)
  }
</script>

<style scoped>
  .layout-selector {
    @apply flex items-center pl-2 flex-shrink-0;
  }

  .control-group {
    @apply flex rounded-md p-0.5 gap-0.5;
  }

  .layout-button {
    @apply py-0.5 px-1.5 rounded-md transition-colors;
    color: var(--color-text-secondary);
    min-width: 24px;
    height: 24px;
    text-align: center;
  }

  .layout-button:hover {
    color: var(--color-text-primary);
  }

  .layout-button.active {
    background-color: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
</style>
