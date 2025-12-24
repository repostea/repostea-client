<template>
  <div class="text-center">
    <div class="mb-8">
      <div
        class="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6"
      >
        <Icon name="fa6-solid:heart" class="text-3xl text-primary" aria-hidden="true" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {{ t('onboarding.steps.welcome.content.heading') }}
      </h2>
      <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
        {{ t('onboarding.steps.welcome.content.subtitle') }}
      </p>
    </div>

    <!-- Toggle details link -->
    <div class="text-center mb-8">
      <button
        class="inline-flex items-center text-primary hover:text-primary-dark transition-colors font-medium"
        @click="showDetails = !showDetails"
      >
        <Icon :name="showDetails ? 'fa6-solid:chevron-up' : 'fa6-solid:chevron-down'" class="mr-2 text-sm" aria-hidden="true" />
        <span v-if="!showDetails">{{ t('onboarding.steps.welcome.content.show_details') }}</span>
        <span v-else>{{ t('onboarding.steps.welcome.content.hide_details') }}</span>
      </button>
    </div>

    <!-- Expanded details section -->
    <div v-if="showDetails" class="space-y-6 text-left">
      <!-- Platform purpose -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
          <Icon name="fa6-solid:circle-question" class="mr-2" aria-hidden="true" />
          {{ t('onboarding.steps.welcome.content.purpose.title') }}
        </h3>
        <p class="text-blue-800 dark:text-blue-200 text-sm">
          {{ t('onboarding.steps.welcome.content.purpose.description') }}
        </p>
      </div>

      <!-- Main features -->
      <div class="grid md:grid-cols-2 gap-6">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="onboarding-feature-card rounded-lg p-6"
        >
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                <Icon :name="feature.iconify" class="text-primary" aria-hidden="true" />
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                {{ feature.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()
  const showDetails = ref(false)

  onMounted(() => {
  })

  const features = computed(() => [
    {
      iconify: 'fa6-solid:pen-to-square',
      title: t('onboarding.steps.welcome.content.features.0'),
      description: t('onboarding.steps.creating-posts.content.types.0.description'),
    },
    {
      iconify: 'fa6-solid:comments',
      title: t('onboarding.steps.welcome.content.features.1'),
      description: t('onboarding.steps.karma-system.content.earning_tips.1'),
    },
    {
      iconify: 'fa6-solid:star',
      title: t('onboarding.steps.welcome.content.features.2'),
      description: t('onboarding.steps.karma-system.content.subtitle'),
    },
    {
      iconify: 'fa6-solid:users',
      title: t('onboarding.steps.welcome.content.features.3'),
      description: t('onboarding.steps.platform-features.content.features.0.description'),
    },
  ])
</script>

<style scoped>
  .onboarding-feature-card {
    background-color: var(--color-bg-subtle);
  }
</style>
