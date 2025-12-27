<template>
  <div>
    <div class="text-center mb-8">
      <div
        class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
      >
        <Icon name="fa6-solid:circle-plus" class="text-2xl text-primary" aria-hidden="true" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t('onboarding.steps.creating-posts.content.heading') }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('onboarding.steps.creating-posts.content.subtitle') }}
      </p>
    </div>

    <!-- Resumen breve -->
    <div class="mb-6 text-left">
      <p class="text-gray-800 dark:text-gray-200 mb-3">
        {{ t('onboarding.steps.creating-posts.content.brief_summary_1') }}
        <strong>{{ t('onboarding.steps.creating-posts.content.brief_summary_2') }}</strong
        >, <strong>{{ t('onboarding.steps.creating-posts.content.brief_summary_3') }}</strong
        >, <strong>{{ t('onboarding.steps.creating-posts.content.brief_summary_4') }}</strong
        >, <strong>{{ t('onboarding.steps.creating-posts.content.brief_summary_5') }}</strong>
        {{ t('onboarding.steps.creating-posts.content.brief_summary_6') }}
        <strong>{{ t('onboarding.steps.creating-posts.content.brief_summary_7') }}</strong
        >{{ t('onboarding.steps.creating-posts.content.brief_summary_8') }}
      </p>
      <p class="text-gray-700 dark:text-gray-300 text-sm">
        {{ t('onboarding.steps.creating-posts.content.tip') }}
      </p>
    </div>

    <!-- Link para expandir detalles -->
    <div class="text-center mb-6">
      <button
        class="inline-flex items-center text-primary hover:text-primary-dark transition-colors font-medium"
        @click="showDetails = !showDetails"
      >
        <Icon
          :name="showDetails ? 'fa6-solid:chevron-up' : 'fa6-solid:chevron-down'"
          class="mr-2 text-sm"
          aria-hidden="true"
        />
        <span v-if="!showDetails">{{
          t('onboarding.steps.creating-posts.content.show_details')
        }}</span>
        <span v-else>{{ t('onboarding.steps.creating-posts.content.hide_details') }}</span>
      </button>
    </div>

    <!-- Detalles expandidos -->
    <div v-if="showDetails" class="space-y-6">
      <!-- Tipos de posts -->
      <div class="space-y-4">
        <div
          v-for="(type, index) in postTypes"
          :key="index"
          class="onboarding-type-card rounded-lg p-5 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div
                class="flex items-center justify-center w-12 h-12 onboarding-type-icon rounded-lg"
              >
                <Icon
                  :name="type.iconify"
                  class="text-xl text-gray-600 dark:text-gray-300"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {{ type.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                {{ type.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()
  const showDetails = ref(false)

  const postTypes = computed(() => [
    {
      iconify: 'fa6-solid:align-left',
      title: t('onboarding.steps.creating-posts.content.types.0.title'),
      description: t('onboarding.steps.creating-posts.content.types.0.description'),
    },
    {
      iconify: 'fa6-solid:link',
      title: t('onboarding.steps.creating-posts.content.types.1.title'),
      description: t('onboarding.steps.creating-posts.content.types.1.description'),
    },
    {
      iconify: 'fa6-solid:video',
      title: t('onboarding.steps.creating-posts.content.types.2.title'),
      description: t('onboarding.steps.creating-posts.content.types.2.description'),
    },
    {
      iconify: 'fa6-solid:headphones',
      title: t('onboarding.steps.creating-posts.content.types.3.title'),
      description: t('onboarding.steps.creating-posts.content.types.3.description'),
    },
    {
      iconify: 'fa6-solid:square-poll-vertical',
      title: t('onboarding.steps.creating-posts.content.types.4.title'),
      description: t('onboarding.steps.creating-posts.content.types.4.description'),
    },
  ])
</script>

<style scoped>
  .onboarding-type-card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .onboarding-type-icon {
    background-color: var(--color-bg-subtle);
  }
</style>
