<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t('help.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('help.subtitle') }}
      </p>
    </div>

    <div class="grid gap-6">
      <!-- Onboarding Tutorial -->
      <div
        class="card-bg rounded-lg shadow-sm border help-border overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start">
            <div
              class="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"
            >
              <Icon name="fa6-solid:graduation-cap" class="text-xl text-primary" aria-hidden="true" />
            </div>
            <div class="ml-4 flex-1">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {{ t('help.onboarding.title') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ t('help.onboarding.description') }}
              </p>
              <NuxtLink
                :to="localePath('/onboarding/welcome')"
                class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
              >
                <Icon name="fa6-solid:play" class="mr-2" aria-hidden="true" />
                {{ t('help.onboarding.start_button') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Karma System -->
      <div
        class="card-bg rounded-lg shadow-sm border help-border overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start">
            <div
              class="flex-shrink-0 w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center"
            >
              <Icon name="fa6-solid:star" class="text-xl text-yellow-500" aria-hidden="true" />
            </div>
            <div class="ml-4 flex-1">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {{ t('help.karma.title') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ t('help.karma.description') }}
              </p>
              <NuxtLink
                :to="localePath('/karma')"
                class="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
              >
                <Icon name="fa6-solid:arrow-right" class="mr-2" aria-hidden="true" />
                {{ t('help.karma.learn_more') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div
        class="card-bg rounded-lg shadow-sm border help-border overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start">
            <div
              class="flex-shrink-0 w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center"
            >
              <Icon name="fa6-solid:circle-question" class="text-xl text-blue-500" aria-hidden="true" />
            </div>
            <div class="ml-4 flex-1">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {{ t('help.faq.title') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ t('help.faq.description') }}
              </p>
              <NuxtLink
                :to="localePath('/faq')"
                class="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                <Icon name="fa6-solid:arrow-right" class="mr-2" aria-hidden="true" />
                {{ t('help.faq.view_button') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Guides Section (placeholder for future) -->
      <div
        class="card-bg rounded-lg shadow-sm border help-border overflow-hidden"
      >
        <div class="p-6">
          <div class="flex items-start">
            <div
              class="flex-shrink-0 w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center"
            >
              <Icon name="fa6-solid:book" class="text-xl text-green-500" aria-hidden="true" />
            </div>
            <div class="ml-4 flex-1">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {{ t('help.guides.title') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                {{ t('help.guides.coming_soon') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n, useLocalePath } from '#i18n'

  definePageMeta({
    middleware: 'auth',
  })

  const { t } = useI18n()
  const localePath = useLocalePath()
</script>

<style scoped>
  .help-border {
    border-color: var(--color-border-default);
  }
</style>
