<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <!-- Encabezado -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2 text-text dark:text-text-dark">
          {{ $t('report.status.title') }}
        </h1>
        <p class="text-text-muted dark:text-text-dark-muted">
          {{ $t('report.status.description') }}
        </p>
      </div>

      <!-- Formulario de búsqueda -->
      <div v-if="!reportData" class="card-bg rounded-lg shadow-sm border report-status-border p-6">
        <form class="space-y-4" @submit.prevent="checkStatus">
          <div>
            <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
              {{ $t('report.status.reference_number') }}
            </label>
            <input
              v-model="form.reference_number"
              type="text"
              required
              placeholder="REP-20251101-XXXX"
              class="w-full px-3 py-2 border report-status-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
              {{ $t('report.status.email') }}
            </label>
            <input
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="w-full px-3 py-2 border report-status-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p class="text-sm text-text-muted dark:text-text-dark-muted mt-1">
              {{ $t('report.status.email_help') }}
            </p>
          </div>

          <div v-if="error" class="text-sm text-red-600 dark:text-red-400">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full px-6 py-2 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            <Icon name="fa6-solid:spinner" class="mr-2" aria-hidden="true" />
            {{ loading ? $t('report.status.checking') : $t('report.status.check_button') }}
          </button>
        </form>
      </div>

      <!-- Resultados -->
      <div v-if="reportData" class="card-bg rounded-lg shadow-sm border report-status-border p-6">
        <h2 class="text-xl font-semibold mb-4 text-text dark:text-text-dark">
          {{ $t('report.status.report_details') }}
        </h2>

        <div class="space-y-4">
          <div>
            <span class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('report.status.reference_number') }}
            </span>
            <p class="font-mono text-text dark:text-text-dark">
              {{ reportData.reference_number }}
            </p>
          </div>

          <div>
            <span class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('report.status.type') }}
            </span>
            <p class="text-text dark:text-text-dark">
              {{ $t(`report.type.${reportData.type}`) }}
            </p>
          </div>

          <div>
            <span class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('report.status.current_status') }}
            </span>
            <p class="text-text dark:text-text-dark">
              <span
                :class="{
                  'text-yellow-600 dark:text-yellow-400': reportData.status === 'pending',
                  'text-blue-600 dark:text-blue-400': reportData.status === 'under_review',
                  'text-green-600 dark:text-green-400': reportData.status === 'resolved',
                  'text-red-600 dark:text-red-400': reportData.status === 'rejected',
                }"
                class="font-semibold"
              >
                {{ $t(`report.status.statuses.${reportData.status}`) }}
              </span>
            </p>
          </div>

          <div>
            <span class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('report.status.submitted_at') }}
            </span>
            <p class="text-text dark:text-text-dark">
              {{ formatDate(reportData.submitted_at) }}
            </p>
          </div>

          <div v-if="reportData.reviewed_at">
            <span class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('report.status.reviewed_at') }}
            </span>
            <p class="text-text dark:text-text-dark">
              {{ formatDate(reportData.reviewed_at) }}
            </p>
          </div>
        </div>

        <!-- Respuesta del equipo (si existe) -->
        <div v-if="reportData.user_response" class="mt-6 pt-6 border-t report-status-border">
          <h3 class="text-lg font-semibold mb-3 text-text dark:text-text-dark">
            {{ $t('report.status.team_response') }}
          </h3>
          <div
            class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
          >
            <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {{ reportData.user_response }}
            </p>
            <p
              v-if="reportData.response_sent_at"
              class="text-xs text-gray-500 dark:text-gray-400 mt-3"
            >
              {{ formatDate(reportData.response_sent_at) }}
            </p>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t report-status-border">
          <button
            class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
            @click="resetForm"
          >
            {{ $t('report.status.check_another') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute } from 'vue-router'

  const { t } = useI18n()
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const appName = runtimeConfig.public.appName || 'Repostea'

  const form = reactive({
    reference_number: '',
    email: '',
  })

  // Auto-fill reference number if provided in URL
  if (route.query.ref) {
    form.reference_number = route.query.ref
  }

  const loading = ref(false)
  const error = ref('')
  const reportData = ref(null)

  const checkStatus = async () => {
    error.value = ''
    loading.value = true

    try {
      const { $api } = useNuxtApp()
      const response = await $api.legalReports.getStatus(
        form.reference_number.trim().toUpperCase(),
        form.email.trim()
      )

      reportData.value = response.data.data
    } catch (err) {
      console.error('Error checking report status:', err)
      error.value = err.response?.data?.message || t('report.status.error')
    } finally {
      loading.value = false
    }
  }

  const resetForm = () => {
    reportData.value = null
    form.reference_number = ''
    form.email = ''
    error.value = ''
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    // Use current i18n locale
    const locale = useNuxtApp().$i18n?.locale?.value || 'es'
    const localeMap = { es: 'es-ES', en: 'en-US' }
    return date.toLocaleString(localeMap[locale] || 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // SEO
  useHead({
    title: t('report.status.title') + ' | ' + appName,
    meta: [
      { name: 'description', content: t('report.status.description') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  })
</script>

<style scoped>
  .report-status-border {
    border-color: var(--color-border-default);
  }

  .report-status-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
    color: var(--color-text-primary);
  }
</style>
