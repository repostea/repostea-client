<template>
  <NuxtLink
    v-if="!isAuthenticated"
    :to="localePath('/auth/register')"
    class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-bold text-xs"
  >
    <div class="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
      <Icon name="fa6-solid:star" class="text-white text-[10px]" aria-hidden="true" />
    </div>
    <span>{{ message }}</span>
  </NuxtLink>
</template>

<script setup>
  import { computed } from 'vue'
  import { useAuth } from '~/composables/useAuth'
  import { useLocalePath, useI18n } from '#i18n'

  const { isAuthenticated } = useAuth()
  const localePath = useLocalePath()
  const { t } = useI18n()

  const messageKeys = [
    'auth.simple_cta_message_1',
    'auth.simple_cta_message_2',
    'auth.simple_cta_message_3'
  ]

  // Rotate based on day of month (no hydration mismatch)
  const message = computed(() => {
    const index = new Date().getDate() % messageKeys.length
    return t(messageKeys[index])
  })
</script>
