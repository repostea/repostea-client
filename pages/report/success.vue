<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto text-center">
      <!-- Icono de éxito -->
      <div
        class="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Icon name="fa6-solid:circle-check" class="text-4xl text-green-500" aria-hidden="true" />
      </div>

      <!-- Título -->
      <h1 class="text-3xl font-bold mb-4 text-text dark:text-text-dark">
        {{ $t('report.success.title') }}
      </h1>

      <!-- Descripción -->
      <p class="text-lg text-text-muted dark:text-text-dark-muted mb-8">
        {{ $t('report.success.description') }}
      </p>

      <!-- Información del proceso -->
      <div
        class="card-bg rounded-lg shadow-sm border report-success-border p-6 mb-8 text-left"
      >
        <h2 class="text-xl font-semibold mb-4 text-text dark:text-text-dark">
          <Icon name="fa6-solid:circle-info" class="mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          {{ $t('report.success.next_steps.title') }}
        </h2>

        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <Icon name="fa6-solid:clock" class="text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
            <div>
              <h3 class="font-medium text-text dark:text-text-dark">
                {{ $t('report.success.next_steps.review.title') }}
              </h3>
              <p class="text-sm text-text-muted dark:text-text-dark-muted">
                {{ $t('report.success.next_steps.review.description') }}
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <Icon name="fa6-solid:envelope" class="text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
            <div>
              <h3 class="font-medium text-text dark:text-text-dark">
                {{ $t('report.success.next_steps.contact.title') }}
              </h3>
              <p class="text-sm text-text-muted dark:text-text-dark-muted">
                {{ $t('report.success.next_steps.contact.description') }}
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <Icon name="fa6-solid:gavel" class="text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
            <div>
              <h3 class="font-medium text-text dark:text-text-dark">
                {{ $t('report.success.next_steps.action.title') }}
              </h3>
              <p class="text-sm text-text-muted dark:text-text-dark-muted">
                {{ $t('report.success.next_steps.action.description') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ID de seguimiento -->
      <div
        v-if="referenceNumber"
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8"
      >
        <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          {{ $t('report.success.reference.title') }}
        </h3>
        <code
          class="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded text-lg font-mono text-blue-800 dark:text-blue-200"
        >
          {{ referenceNumber }}
        </code>
        <p class="text-sm text-blue-700 dark:text-blue-300 mt-2">
          {{ $t('report.success.reference.description') }}
        </p>
        <div class="mt-3">
          <NuxtLink
            :to="localePath({ path: '/report/status', query: { ref: referenceNumber } })"
            class="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline"
          >
            {{ $t('report.success.reference.check_status') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Enlaces de navegación -->
      <div class="text-center space-x-6">
        <NuxtLink
          :to="localePath('/')"
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
        >
          {{ $t('report.success.actions.home') }}
        </NuxtLink>
        <span class="text-gray-400">·</span>
        <NuxtLink
          :to="localePath('/policies/dmca')"
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
        >
          {{ $t('report.success.actions.policies') }}
        </NuxtLink>
      </div>

      <!-- Contacto adicional -->
      <div class="mt-8 pt-8 border-t report-success-border">
        <p class="text-text-muted dark:text-text-dark-muted mb-3">
          {{ $t('report.success.contact.description') }}
        </p>
        <p class="text-center">
          <a
            :href="`mailto:${contactEmail}`"
            class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            {{ contactEmail }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  import { useRoute } from 'vue-router'
  import { useLocalePath } from '#i18n'

  const { t } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const runtimeConfig = useRuntimeConfig()

  const contactEmail = computed(() => runtimeConfig.public.contactEmail || 'contact@example.com')

  // Get reference number from query params
  const referenceNumber = route.query.ref || null

  // SEO
  useHead({
    title: t('report.success.title') + ' | ' + (runtimeConfig.public.appName || 'Repostea'),
    meta: [
      { name: 'description', content: t('report.success.description') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  })
</script>

<style scoped>
  .report-success-border {
    border-color: var(--color-border-default);
  }
</style>
