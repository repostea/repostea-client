<template>
  <div
    v-if="!isAuthenticated"
    class="bg-gradient-to-br from-primary/6 via-primary/4 to-primary/8 dark:from-primary/10 dark:via-primary/6 dark:to-primary/12 border border-primary/20 dark:border-primary/30 rounded-lg p-4 mb-6"
  >
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0">
        <div class="w-9 h-9 bg-primary/20 dark:bg-primary/30 rounded-full flex items-center justify-center">
          <Icon name="fa6-solid:star" class="text-primary text-base" aria-hidden="true" />
        </div>
      </div>
      <div class="flex-grow">
        <h3 class="text-sm font-semibold text-text dark:text-text-dark mb-1">
          {{ ctaTitle }}
        </h3>
        <p class="text-xs text-text-muted dark:text-text-dark-muted mb-2">
          <NuxtLink
            :to="localePath('/auth/register')"
            class="text-primary dark:text-primary-light font-semibold hover:underline"
          >
            {{ t('auth.register') }}
          </NuxtLink>{{ ctaMessage }}
          {{ t('auth.register_cta_learn_suffix') }}
          <NuxtLink
            :to="localePath('/onboarding')"
            class="text-primary dark:text-primary-light hover:underline"
          >
            {{ t('auth.learn_how_it_works') }}
          </NuxtLink>.
        </p>
      </div>
    </div>
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

  const ctaTitle = computed(() => {
    if (props.authorName) {
      return t('auth.register_cta_title_with_author', { author: props.authorName })
    }
    return t('auth.register_cta_title')
  })

  const ctaMessage = computed(() => {
    if (props.authorName) {
      return t('auth.register_cta_message_with_author', { author: props.authorName })
    }
    return t('auth.register_cta_message')
  })
</script>
