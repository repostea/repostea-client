<template>
  <div>
    <div class="text-center mb-8">
      <div
        class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
      >
        <Icon name="fa6-solid:trophy" class="text-3xl text-primary" aria-hidden="true" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t('onboarding.steps.karma-system.content.heading') }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('onboarding.steps.karma-system.content.subtitle') }}
      </p>
    </div>

    <!-- Resumen breve -->
    <div class="mb-6 text-left">
      <p class="text-gray-800 dark:text-gray-200 mb-3">
        {{ t('onboarding.steps.karma-system.content.brief_text_1') }} <strong>{{ t('onboarding.steps.karma-system.content.brief_text_2') }}</strong> {{ t('onboarding.steps.karma-system.content.brief_text_3') }} <strong>{{ t('onboarding.steps.karma-system.content.brief_text_4') }}</strong>{{ t('onboarding.steps.karma-system.content.brief_text_5') }}
      </p>
      <p class="text-gray-700 dark:text-gray-300 mb-3">
        {{ t('onboarding.steps.karma-system.content.progression_text') }}
      </p>
      <p class="text-gray-700 dark:text-gray-300 text-sm">
        {{ t('onboarding.steps.karma-system.content.tip') }}
      </p>
    </div>

    <!-- Niveles de Karma -->
    <div class="onboarding-levels-container rounded-lg p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center flex items-center justify-center">
        <Icon name="fa6-solid:layer-group" class="mr-2" aria-hidden="true" />
        {{ t('onboarding.steps.karma-system.content.levels_title') }}
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="(level, index) in karmaLevels"
          :key="index"
          class="onboarding-level-card rounded-lg p-4"
        >
          <div class="mb-3 text-center">
            <div
              :class="level.colorClass"
              class="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2"
            >
              <Icon :name="level.icon" class="text-white text-xl" aria-hidden="true" />
            </div>
            <h4 class="font-semibold text-gray-900 dark:text-white">
              {{ level.name }}
            </h4>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">
            {{ level.range }}
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {{ level.description }}
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  const karmaLevels = computed(() => [
    {
      name: t('onboarding.steps.karma-system.content.levels.0.name'),
      range: '0 - 199',
      description: t('onboarding.steps.karma-system.content.levels.0.description'),
      icon: 'fa6-solid:seedling',
      colorClass: 'bg-gray-500',
    },
    {
      name: t('onboarding.steps.karma-system.content.levels.1.name'),
      range: '200 - 999',
      description: t('onboarding.steps.karma-system.content.levels.1.description'),
      icon: 'fa6-solid:magnifying-glass',
      colorClass: 'bg-blue-500',
    },
    {
      name: t('onboarding.steps.karma-system.content.levels.2.name'),
      range: '1,000 - 3,999',
      description: t('onboarding.steps.karma-system.content.levels.2.description'),
      icon: 'fa6-solid:star',
      colorClass: 'bg-green-500',
    },
    {
      name: t('onboarding.steps.karma-system.content.levels.3.name'),
      range: '4,000 - 15,999',
      description: t('onboarding.steps.karma-system.content.levels.3.description'),
      icon: 'fa6-solid:trophy',
      colorClass: 'bg-orange-500',
    },
    {
      name: t('onboarding.steps.karma-system.content.levels.4.name'),
      range: '16,000 - 39,999',
      description: t('onboarding.steps.karma-system.content.levels.4.description'),
      icon: 'fa6-solid:crown',
      colorClass: 'bg-yellow-500',
    },
    {
      name: t('onboarding.steps.karma-system.content.levels.5.name'),
      range: '40,000 - 99,999',
      description: t('onboarding.steps.karma-system.content.levels.5.description'),
      icon: 'fa6-solid:gem',
      colorClass: 'bg-purple-500',
    },
    {
      name: t('onboarding.steps.karma-system.content.levels.6.name'),
      range: '100,000+',
      description: t('onboarding.steps.karma-system.content.levels.6.description'),
      icon: 'fa6-solid:star',
      colorClass: 'bg-pink-500',
    },
  ])
</script>

<style scoped>
  .onboarding-levels-container {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }

  .onboarding-level-card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }
</style>
