<template>
  <div
    v-if="!isAuthenticated"
    class="mt-2 flex items-center gap-2 text-xs"
  >
    <Icon name="fa6-solid:star" class="text-primary flex-shrink-0" aria-hidden="true" />
    <span class="text-text-muted dark:text-text-dark-muted">{{ ctaMessage }}</span>
    <NuxtLink
      :to="localePath('/auth/register')"
      class="text-primary dark:text-primary-light font-semibold hover:underline whitespace-nowrap"
    >
      Regístrate
    </NuxtLink>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useAuth } from '~/composables/useAuth'
  import { useLocalePath, useI18n  } from '#i18n'
  

  const props = defineProps({
    authorName: {
      type: String,
      default: null,
    },
  })

  const { isAuthenticated } = useAuth()
  const localePath = useLocalePath()
  const { t } = useI18n()

  const ctaMessage = computed(() => {
    if (props.authorName) {
      return t('auth.register_cta_compact', { author: props.authorName })
    }
    return t('auth.register_cta_compact_generic')
  })
</script>
