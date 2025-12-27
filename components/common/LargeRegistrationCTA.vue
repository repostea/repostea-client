<template>
  <div
    v-if="!isAuthenticated"
    class="bg-white dark:bg-card-bg-dark border-2 border-primary/30 dark:border-primary/40 rounded-xl shadow-lg"
  >
    <div class="flex items-start gap-4 p-4">
      <div class="flex-shrink-0 mt-1">
        <div
          class="w-12 h-12 bg-primary/20 dark:bg-primary/30 rounded-full flex items-center justify-center"
        >
          <Icon name="fa6-solid:star" class="text-primary text-xl" aria-hidden="true" />
        </div>
      </div>
      <div class="flex-grow">
        <h3 class="text-lg font-bold text-text dark:text-text-dark mb-2">
          {{ ctaTitle }}
        </h3>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-4 leading-relaxed">
          {{ ctaMessage }}
        </p>
        <div class="flex flex-col sm:flex-row flex-wrap gap-3">
          <div class="flex flex-col sm:flex-row gap-3">
            <NuxtLink
              :to="localePath('/auth/register')"
              class="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all hover:scale-105 shadow-md text-sm font-semibold"
            >
              <Icon name="fa6-solid:user-plus" class="mr-2" aria-hidden="true" />
              {{ t('auth.register') }}
            </NuxtLink>
          </div>
          <NuxtLink
            v-if="!hideOnboardingLink"
            :to="localePath('/onboarding')"
            class="inline-flex items-center justify-center sm:justify-start px-4 py-2 text-primary dark:text-primary-light hover:underline text-sm font-medium"
          >
            <Icon name="fa6-solid:circle-question" class="mr-2" aria-hidden="true" />
            {{ t('auth.learn_how_it_works') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useAuth } from '~/composables/useAuth'
  import { useLocalePath, useI18n } from '#i18n'

  defineProps({
    authorName: {
      type: String,
      default: null,
    },
    hideOnboardingLink: {
      type: Boolean,
      default: false,
    },
  })

  const { isAuthenticated } = useAuth()
  const localePath = useLocalePath()
  const { t } = useI18n()

  const ctaTitle = computed(() => {
    return t('auth.register_cta_title')
  })

  const ctaMessage = computed(() => {
    return t('auth.register_cta_message')
  })
</script>
