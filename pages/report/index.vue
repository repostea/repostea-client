<template>
  <div class="container mx-auto px-4 py-8">
    <PageHeader
      :title="$t('report.title')"
      :description="$t('report.page_description')"
      icon="flag"
    />

    <div class="max-w-2xl mx-auto mt-8">
      <form
        class="card-bg rounded-lg shadow-sm border report-border p-6 space-y-6"
        @submit.prevent="submitReport"
      >
        <!-- Tipo de reporte -->
        <div>
          <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
            {{ $t('report.type.label') }} <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.type"
            required
            class="w-full px-3 py-2 border report-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">{{ $t('report.type.select') }}</option>
            <option value="copyright">{{ $t('report.type.copyright') }}</option>
            <option value="illegal">{{ $t('report.type.illegal') }}</option>
            <option value="harassment">{{ $t('report.type.harassment') }}</option>
            <option value="privacy">{{ $t('report.type.privacy') }}</option>
            <option value="spam">{{ $t('report.type.spam') }}</option>
            <option value="other">{{ $t('report.type.other') }}</option>
          </select>
        </div>

        <!-- URL del contenido -->
        <div>
          <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
            {{ $t('report.url.label') }} <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.content_url"
            type="url"
            required
            placeholder="https://example.com/post/12345"
            class="w-full px-3 py-2 border report-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
          <p class="text-sm text-text-muted dark:text-text-dark-muted mt-1">
            {{ $t('report.url.help') }}
          </p>
        </div>

        <!-- Información del reportante -->
        <div class="border-t report-border pt-6">
          <h3 class="text-lg font-semibold mb-4 text-text dark:text-text-dark">
            {{ $t('report.reporter.title') }}
          </h3>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
                {{ $t('report.reporter.name') }} <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.reporter_name"
                type="text"
                required
                autocomplete="name"
                class="w-full px-3 py-2 border report-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
                {{ $t('report.reporter.email') }} <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.reporter_email"
                type="email"
                required
                autocomplete="email"
                class="w-full px-3 py-2 border report-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
              {{ $t('report.reporter.organization') }}
            </label>
            <input
              v-model="form.reporter_organization"
              type="text"
              placeholder="Empresa, organización o dejar en blanco si es individual"
              class="w-full px-3 py-2 border report-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
          </div>
        </div>

        <!-- Descripción del problema -->
        <div>
          <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
            {{ $t('report.description.label') }} <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="form.description"
            required
            rows="6"
            :placeholder="$t('report.description.placeholder')"
            class="w-full px-3 py-2 border report-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p class="text-sm text-text-muted dark:text-text-dark-muted mt-1">
            {{ $t('report.description.help') }}
          </p>
        </div>

        <!-- Campos específicos para copyright -->
        <div v-if="form.type === 'copyright'" class="border-t report-border pt-6">
          <h3 class="text-lg font-semibold mb-4 text-text dark:text-text-dark">
            {{ $t('report.copyright.title') }}
          </h3>

          <div>
            <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
              {{ $t('report.copyright.original_url') }}
            </label>
            <input
              v-model="form.original_url"
              type="url"
              placeholder="https://ejemplo.com/mi-contenido-original"
              class="w-full px-3 py-2 border report-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium mb-2 text-text dark:text-text-dark">
              {{ $t('report.copyright.ownership') }}
            </label>
            <textarea
              v-model="form.ownership_proof"
              rows="3"
              :placeholder="$t('report.copyright.ownership_placeholder')"
              class="w-full px-3 py-2 border report-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <!-- Declaraciones legales -->
        <div class="border-t report-border pt-6">
          <h3 class="text-lg font-semibold mb-4 text-text dark:text-text-dark">
            {{ $t('report.legal.title') }}
          </h3>

          <div class="space-y-4">
            <label class="flex items-start space-x-3 cursor-pointer">
              <input
                v-model="form.good_faith"
                type="checkbox"
                required
                class="mt-1 w-5 h-5 text-primary report-checkbox rounded focus:ring-2 focus:ring-primary cursor-pointer"
              >
              <span class="text-sm text-text dark:text-text-dark">
                {{ $t('report.legal.good_faith') }}
              </span>
            </label>

            <label
              v-if="form.type === 'copyright'"
              class="flex items-start space-x-3 cursor-pointer"
            >
              <input
                v-model="form.authorized"
                type="checkbox"
                required
                class="mt-1 w-5 h-5 text-primary report-checkbox rounded focus:ring-2 focus:ring-primary cursor-pointer"
              >
              <span class="text-sm text-text dark:text-text-dark">
                {{ $t('report.legal.authorized') }}
              </span>
            </label>
          </div>
        </div>

        <!-- Aviso de protección de datos -->
        <div
          class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6"
        >
          <div class="flex items-start">
            <Icon
              name="fa6-solid:shield-halved"
              class="text-blue-600 dark:text-blue-400 mt-0.5 mr-3"
              aria-hidden="true"
            />
            <div class="text-sm text-blue-900 dark:text-blue-200">
              <p class="font-medium mb-1">{{ $t('report.privacy.title') }}</p>
              <p class="text-xs text-blue-700 dark:text-blue-300">
                {{ $t('report.privacy.description') }}
              </p>
            </div>
          </div>
        </div>

        <!-- CAPTCHA -->
        <div class="mt-6">
          <TurnstileCaptcha
            ref="captchaRef"
            v-model="turnstileResponse"
            @success="captchaVerified = true"
            @expired="captchaVerified = false"
            @error="captchaVerified = false"
          />
          <p v-if="captchaError" class="mt-1 text-sm text-red-500">
            {{ captchaError }}
          </p>
        </div>

        <!-- Botones -->
        <div class="flex justify-between pt-6 border-t report-border">
          <NuxtLink
            :to="localePath('/')"
            class="px-4 py-2 text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark transition-colors"
          >
            {{ $t('common.cancel') }}
          </NuxtLink>

          <button
            type="submit"
            :disabled="submitting || !captchaVerified"
            class="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center"
          >
            <Icon name="fa6-solid:spinner" class="mr-2" aria-hidden="true" />
            <Icon name="fa6-solid:flag" class="mr-2" aria-hidden="true" />
            {{ submitting ? $t('report.submitting') : $t('report.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'
  import { useNotification } from '~/composables/useNotification'
  import PageHeader from '~/components/ui/PageHeader.vue'
  import TurnstileCaptcha from '~/components/TurnstileCaptcha.vue'

  const { t } = useI18n()
  const { error: showError } = useNotification()
  const localePath = useLocalePath()
  const runtimeConfig = useRuntimeConfig()
  const appName = runtimeConfig.public.appName || 'Repostea'

  // CAPTCHA refs
  const turnstileResponse = ref('')
  const captchaVerified = ref(false)
  const captchaRef = ref(null)
  const captchaError = ref('')

  const form = reactive({
    type: '',
    content_url: '',
    reporter_name: '',
    reporter_email: '',
    reporter_organization: '',
    description: '',
    original_url: '',
    ownership_proof: '',
    good_faith: false,
    authorized: false,
  })

  const submitting = ref(false)

  const submitReport = async () => {
    // Validar CAPTCHA
    captchaError.value = ''
    if (!turnstileResponse.value) {
      captchaError.value = t('auth.captcha_required')
      return
    }

    submitting.value = true

    try {
      const { $api } = useNuxtApp()

      const response = await $api.legalReports.create({
        type: form.type,
        content_url: form.content_url,
        reporter_name: form.reporter_name,
        reporter_email: form.reporter_email,
        reporter_organization: form.reporter_organization || null,
        description: form.description,
        original_url: form.original_url || null,
        ownership_proof: form.ownership_proof || null,
        good_faith: form.good_faith,
        authorized: form.authorized,
        'cf-turnstile-response': turnstileResponse.value,
      })

      // Show success message with reference number
      await navigateTo(
        localePath({
          path: '/report/success',
          query: { ref: response.data.data.reference_number },
        })
      )
    } catch (err) {
      // Reset CAPTCHA on error
      if (captchaRef.value) {
        captchaRef.value.reset()
        captchaVerified.value = false
      }

      // Show error message to user
      if (!err._interceptorWillNotify) {
        showError(err.response?.data?.message || t('report.error'))
      }
    } finally {
      submitting.value = false
    }
  }

  // Detect post URL if it comes as a parameter
  const route = useRoute()
  if (route.query.url) {
    form.content_url = route.query.url
  }

  // Auto-select report type if it comes as a parameter
  if (route.query.type) {
    const validTypes = ['copyright', 'illegal', 'harassment', 'privacy', 'spam', 'other']
    if (validTypes.includes(route.query.type)) {
      form.type = route.query.type
    }
  }

  // SEO
  useHead({
    title: t('report.title') + ' | ' + appName,
    meta: [
      { name: 'description', content: t('report.description') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  })
</script>

<style scoped>
  .report-border {
    border-color: var(--color-border-default);
  }

  .report-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
    color: var(--color-text-primary);
  }

  .report-checkbox {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }
</style>
