<template>
  <div
    v-if="!authStore.isAuthenticated"
    class="bg-gradient-to-br from-primary/8 to-primary/12 dark:from-primary/15 dark:to-primary/20 border border-primary/30 dark:border-primary/40 rounded-lg p-3 shadow-sm"
  >
    <div class="flex items-start gap-2">
      <Icon
        name="fa6-solid:pen-fancy"
        class="text-primary text-sm flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div class="flex-grow min-w-0">
        <p class="text-xs text-text dark:text-text-dark leading-tight mb-2 font-medium">
          {{ t('auth.share_your_story_cta') }}
        </p>
        <NuxtLink
          :to="localePath('/register')"
          class="inline-flex items-center px-3 py-1 bg-primary hover:bg-primary-dark text-white rounded text-xs font-semibold transition-colors"
        >
          <Icon name="fa6-solid:user-plus" class="mr-1 text-[10px]" aria-hidden="true" />
          {{ t('auth.register') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath, useI18n } from '#i18n'

  const authStore = useAuthStore()
  const localePath = useLocalePath()
  const { t } = useI18n()
</script>
