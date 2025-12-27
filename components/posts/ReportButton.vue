<template>
  <div class="relative flex items-center gap-2">
    <!-- Badges de reportes por tipo (fuera del modal) -->
    <div v-if="reportsCount > 0" class="flex items-center gap-1.5">
      <span
        v-for="(count, reason) in reportCountsByReason"
        :key="reason"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
        :class="[getReasonColor(reason).bg, getReasonColor(reason).text]"
        :title="$t(`report.reasons.${reason}`)"
      >
        <Icon :name="getReasonIconify(reason)" class="text-[9px]" aria-hidden="true" />
        <span>{{ count }}</span>
      </span>
    </div>

    <!-- Botón de reportar -->
    <FooterButton
      icon="fa6-solid:flag"
      :title="buttonTitle"
      :class="reportButtonClass"
      @click="openReportModal"
    />

    <!-- Modal de reportes -->
    <Teleport to="body">
      <div
        v-if="showQuickModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
        @click.self="closeQuickModal"
      >
        <div class="report-modal rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
          <div class="flex justify-between items-center p-6 pb-4 flex-shrink-0">
            <h3 class="text-lg font-semibold text-text dark:text-text-dark">
              <Icon name="fa6-solid:flag" class="text-red-500 mr-2" aria-hidden="true" />
              {{ $t('report.button_title') }}
            </h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              :aria-label="$t('common.close')"
              @click="closeQuickModal"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <!-- Contenido scrolleable -->
          <div class="overflow-y-auto px-6 pb-6 flex-1">
            <!-- Usuario NO autenticado -->
            <div v-if="!isAuthenticated">
              <p class="text-text-muted dark:text-text-dark-muted mb-4">
                Para reportar contenido necesitas completar un formulario legal con tus datos.
              </p>
              <NuxtLink
                :to="localePath(`/report?url=${encodeURIComponent(postUrl)}`)"
                class="block w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-center"
              >
                <Icon name="fa6-solid:shield-halved" class="mr-2" aria-hidden="true" />
                Ir al formulario de reporte legal
              </NuxtLink>
            </div>

            <!-- Usuario autenticado -->
            <div v-else>
              <!-- Mensaje si es contenido propio -->
              <div
                v-if="isOwnPost"
                class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-700"
              >
                <div class="flex items-start space-x-3">
                  <Icon
                    name="fa6-solid:circle-info"
                    class="text-amber-600 dark:text-amber-400 mt-0.5 text-lg flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h4 class="font-medium text-text dark:text-text-dark mb-1">
                      {{ t('report.own_content_title') }}
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ t('report.own_content_message') }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Contenido normal de reporte (solo si no es propio) -->
              <template v-else>
                <!-- Reporte legal (solo visible si no ha seleccionado razón) -->
                <div
                  v-if="!selectedReason"
                  class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700"
                >
                  <div class="flex items-start space-x-2">
                    <Icon
                      name="fa6-solid:gavel"
                      class="text-red-600 dark:text-red-400 mt-0.5 text-sm"
                      aria-hidden="true"
                    />
                    <div class="flex-1">
                      <h4 class="font-medium text-text dark:text-text-dark text-xs mb-1">
                        {{ $t('report.legal_first.title') }}
                      </h4>
                      <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {{ $t('report.legal_first.description') }}
                      </p>
                      <NuxtLink
                        :to="localePath(`/report?url=${encodeURIComponent(postUrl)}`)"
                        class="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        <Icon
                          name="fa6-solid:shield-halved"
                          class="mr-1.5 text-xs"
                          aria-hidden="true"
                        />
                        {{ $t('report.legal_first.button') }}
                      </NuxtLink>
                    </div>
                  </div>
                </div>

                <!-- Separador (solo si no ha seleccionado razón) -->
                <div v-if="!selectedReason" class="relative my-4">
                  <div class="absolute inset-0 flex items-center">
                    <div class="report-divider w-full" />
                  </div>
                  <div class="relative flex justify-center text-xs">
                    <span class="report-or-text px-2 text-gray-500 dark:text-gray-400">
                      {{ $t('common.or') }}
                    </span>
                  </div>
                </div>

                <!-- Mensaje si ya reportaste (activo) -->
                <div v-if="hasUserReported" class="mb-4">
                  <div
                    class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700 mb-3"
                  >
                    <div class="flex items-start space-x-3">
                      <Icon
                        name="fa6-solid:circle-info"
                        class="text-blue-600 dark:text-blue-400 mt-1 text-xl"
                        aria-hidden="true"
                      />
                      <div class="flex-1">
                        <h4 class="font-semibold text-text dark:text-text-dark text-base mb-2">
                          Ya has reportado este contenido
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Reportado como:
                          <strong>{{ $t(`report.reasons.${userReport.reason}`) }}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    :disabled="submitting"
                    class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    :class="{ 'opacity-50 cursor-not-allowed': submitting }"
                    @click="withdrawReport"
                  >
                    <Icon name="fa6-solid:rotate-left" class="text-base" aria-hidden="true" />
                    <span>Retirar mi reporte</span>
                  </button>
                </div>

                <!-- Mensaje si tienes un reporte resuelto/dismissed -->
                <div
                  v-else-if="hasUserResolvedReport"
                  class="mb-4 p-3 report-resolved-box rounded-lg"
                >
                  <div class="flex items-start space-x-2">
                    <Icon
                      name="fa6-solid:circle-check"
                      class="text-gray-600 dark:text-gray-400 mt-0.5 text-sm"
                      aria-hidden="true"
                    />
                    <div class="flex-1">
                      <h4 class="font-medium text-text dark:text-text-dark text-sm mb-1">
                        Ya reportaste este contenido
                      </h4>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Reportado como
                        <strong>{{ $t(`report.reasons.${userResolvedReport.reason}`) }}</strong
                        >. Tu reporte ya fue revisado por los moderadores.
                      </p>
                    </div>
                  </div>
                </div>

                <p
                  v-if="!selectedReason && !hasUserReported && !hasUserResolvedReport"
                  class="text-text-muted dark:text-text-dark-muted mb-3 text-xs"
                >
                  {{ $t('report.quick.description') }}
                </p>

                <!-- Reportes rápidos -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <button
                    v-for="reason in quickReasons"
                    :key="reason.type"
                    :disabled="submitting || hasUserReported || hasUserResolvedReport"
                    class="report-reason-btn p-3 rounded-lg transition-colors flex flex-col items-center min-h-[80px]"
                    :class="{
                      'opacity-50 cursor-not-allowed':
                        submitting || hasUserReported || hasUserResolvedReport,
                      'report-reason-btn-hover': !hasUserReported && !hasUserResolvedReport,
                      'report-reason-btn-selected':
                        selectedReason === reason.type &&
                        !hasUserReported &&
                        !hasUserResolvedReport,
                      'justify-center gap-2': !reportCountsByReason[reason.type],
                      'justify-between gap-1': reportCountsByReason[reason.type],
                    }"
                    @click="
                      hasUserReported || hasUserResolvedReport ? null : selectReason(reason.type)
                    "
                  >
                    <!-- Sin reportes: icono arriba, texto abajo (centrado) -->
                    <template v-if="!reportCountsByReason[reason.type]">
                      <Icon
                        :name="reason.iconify"
                        :class="'text-lg text-' + reason.color"
                        aria-hidden="true"
                      />
                      <div class="text-sm font-medium">{{ $t(reason.label) }}</div>
                    </template>

                    <!-- Con reportes: icono y texto en línea arriba, badge abajo -->
                    <template v-else>
                      <div class="flex items-center gap-1.5">
                        <Icon
                          :name="reason.iconify"
                          :class="'text-sm text-' + reason.color"
                          aria-hidden="true"
                        />
                        <div class="text-sm font-medium">{{ $t(reason.label) }}</div>
                      </div>

                      <!-- Badge integrado -->
                      <div
                        class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-semibold"
                      >
                        <span>{{ reportCountsByReason[reason.type] }}</span>
                        <span>{{
                          reportCountsByReason[reason.type] === 1
                            ? $t('report.report_singular')
                            : $t('report.report_plural')
                        }}</span>
                      </div>
                    </template>
                  </button>
                </div>

                <!-- Campo de descripción adicional (opcional) -->
                <div v-if="selectedReason && !hasUserReported" class="mb-3">
                  <label class="block text-xs font-medium text-text dark:text-text-dark mb-1.5">
                    {{ $t('report.quick.additional_details') }}
                    <span class="text-gray-400 font-normal">({{ $t('common.optional') }})</span>
                  </label>
                  <textarea
                    v-model="additionalDescription"
                    rows="3"
                    class="report-textarea w-full px-2.5 py-2 rounded focus:ring-2 focus:ring-primary dark:focus:ring-primary-light focus:border-transparent text-xs"
                    :placeholder="$t('report.quick.details_placeholder')"
                    :aria-label="$t('report.quick.additional_details')"
                    maxlength="1000"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ additionalDescription.length }}/1000
                  </p>
                </div>

                <!-- Botón enviar reporte -->
                <button
                  v-if="selectedReason && !hasUserReported"
                  :disabled="submitting"
                  class="w-full inline-flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-medium text-sm"
                  :class="{ 'opacity-50 cursor-not-allowed': submitting }"
                  @click="submitQuickReport"
                >
                  <Icon name="fa6-solid:paper-plane" class="mr-2" aria-hidden="true" />
                  {{ submitting ? $t('report.submitting') : $t('report.submit') }}
                </button>

                <!-- Mensaje de éxito -->
                <div
                  v-if="successMessage"
                  class="mt-3 p-2.5 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded text-xs inline-flex items-center"
                >
                  <Icon name="fa6-solid:circle-check" class="mr-1.5" aria-hidden="true" />
                  {{ successMessage }}
                </div>

                <!-- Mensaje de error -->
                <div
                  v-if="errorMessage"
                  class="mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded text-xs inline-flex items-center"
                >
                  <Icon name="fa6-solid:circle-exclamation" class="mr-1.5" aria-hidden="true" />
                  {{ errorMessage }}
                </div>

                <!-- Botón cancelar -->
                <button
                  v-if="isAuthenticated"
                  class="mt-3 w-full px-4 py-2 text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark transition-colors text-xs"
                  @click="closeQuickModal"
                >
                  {{ $t('common.cancel') }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de confirmación para retirar reporte -->
    <Teleport to="body">
      <div
        v-if="showWithdrawConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4"
        @click.self="cancelWithdraw"
      >
        <div class="report-confirm-modal rounded-lg shadow-xl max-w-sm w-full">
          <div class="p-6">
            <div class="flex items-start space-x-3 mb-4">
              <div class="flex-shrink-0">
                <Icon
                  name="fa6-solid:triangle-exclamation"
                  class="text-warning text-2xl"
                  aria-hidden="true"
                />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-text dark:text-text-dark mb-2">
                  {{ $t('report.withdraw_confirm_title') }}
                </h3>
                <p class="text-sm text-text-muted dark:text-text-dark-muted">
                  {{ $t('report.withdraw_confirm_message') }}
                </p>
              </div>
            </div>

            <div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                class="report-cancel-btn w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                @click="cancelWithdraw"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                :disabled="submitting"
                class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                :class="{ 'opacity-50 cursor-not-allowed': submitting }"
                @click="confirmWithdraw"
              >
                {{ submitting ? $t('common.processing') : $t('report.withdraw_confirm') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'
  import { useAuthStore } from '~/stores/auth'
  import FooterButton from '~/components/posts/postCard/FooterButton.vue'

  const props = defineProps({
    postId: {
      type: [Number, String],
      required: true,
    },
    postSlug: {
      type: String,
      default: '',
    },
    postUuid: {
      type: String,
      default: '',
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
    reports: {
      type: Array,
      default: () => [],
    },
    isOwnPost: {
      type: Boolean,
      default: false,
    },
  })

  const { t } = useI18n()
  const localePath = useLocalePath()
  const authStore = useAuthStore()

  const showQuickModal = ref(false)
  const showWithdrawConfirm = ref(false)
  const submitting = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const selectedReason = ref('')
  const additionalDescription = ref('')

  const isAuthenticated = computed(() => authStore.isAuthenticated)

  const postUrl = computed(() => {
    if (import.meta.client) {
      const baseUrl = window.location.origin
      if (props.postSlug) {
        return `${baseUrl}/posts/${props.postSlug}`
      } else if (props.postUuid) {
        return `${baseUrl}/p/${props.postUuid}`
      } else {
        return `${baseUrl}/posts/${props.postId}`
      }
    }
    return ''
  })

  const reportsSummary = computed(() => {
    if (props.reportsCount === 0) return ''

    const counts = {}
    props.reports.forEach((report) => {
      counts[report.reason] = (counts[report.reason] || 0) + 1
    })

    const parts = Object.entries(counts).map(([reason, count]) => {
      const label = t(`report.reasons.${reason}`)
      return `${count} ${label.toLowerCase()}`
    })

    return `${props.reportsCount} ${props.reportsCount === 1 ? 'reporte' : 'reportes'}: ${parts.join(', ')}`
  })

  const reportCountsByReason = computed(() => {
    const counts = {}
    props.reports.forEach((report) => {
      // Count ALL reports regardless of status
      counts[report.reason] = (counts[report.reason] || 0) + 1
    })
    return counts
  })

  // Check if current user already reported (active)
  const userReport = computed(() => {
    if (!isAuthenticated.value || !authStore.user) return null

    const report = props.reports.find(
      (report) => report.is_own && (report.status === 'pending' || report.status === 'reviewing')
    )

    return report
  })

  // Check if user has a resolved/dismissed report
  const userResolvedReport = computed(() => {
    if (!isAuthenticated.value || !authStore.user) return null

    const report = props.reports.find(
      (report) => report.is_own && (report.status === 'resolved' || report.status === 'dismissed')
    )

    return report
  })

  const hasUserReported = computed(() => !!userReport.value)
  const hasUserResolvedReport = computed(() => !!userResolvedReport.value)

  const buttonTitle = computed(() => {
    if (props.reportsCount > 0) {
      return reportsSummary.value
    }
    return t('report.button_title')
  })

  const reportButtonClass = computed(() => {
    if (props.reportsCount >= 5) {
      return 'report-severe'
    } else if (props.reportsCount >= 3) {
      return 'report-warning'
    } else if (props.reportsCount > 0) {
      return 'report-mild'
    }
    return ''
  })

  const quickReasons = ref([
    {
      type: 'spam',
      label: 'report.reasons.spam',
      iconify: 'fa6-solid:bullhorn',
      color: 'orange-500',
    },
    {
      type: 'inappropriate',
      label: 'report.reasons.inappropriate',
      iconify: 'fa6-solid:triangle-exclamation',
      color: 'yellow-600',
    },
    {
      type: 'harassment',
      label: 'report.reasons.harassment',
      iconify: 'fa6-solid:user-slash',
      color: 'purple-500',
    },
    {
      type: 'misinformation',
      label: 'report.reasons.misinformation',
      iconify: 'fa6-solid:circle-xmark',
      color: 'blue-500',
    },
    {
      type: 'hate_speech',
      label: 'report.reasons.hate_speech',
      iconify: 'fa6-solid:hand-fist',
      color: 'red-600',
    },
    {
      type: 'violence',
      label: 'report.reasons.violence',
      iconify: 'fa6-solid:skull-crossbones',
      color: 'red-700',
    },
  ])

  const openReportModal = () => {
    successMessage.value = ''
    errorMessage.value = ''
    selectedReason.value = ''
    additionalDescription.value = ''
    showQuickModal.value = true
  }

  const closeQuickModal = () => {
    showQuickModal.value = false
    successMessage.value = ''
    errorMessage.value = ''
    selectedReason.value = ''
    additionalDescription.value = ''
  }

  const selectReason = (reason) => {
    selectedReason.value = reason
  }

  const submitQuickReport = async () => {
    if (submitting.value || !selectedReason.value) return

    submitting.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const { $api } = useNuxtApp()
      const reportData = {
        reportable_type: 'post',
        reportable_id: props.postId,
        reason: selectedReason.value,
      }

      // Add description only if provided
      if (additionalDescription.value.trim()) {
        reportData.description = additionalDescription.value.trim()
      }

      await $api.reports.create(reportData)

      successMessage.value = t('report.success_quick')

      // Close modal after 2 seconds
      setTimeout(() => {
        closeQuickModal()
        // Reload page to refresh reports
        if (import.meta.client) {
          window.location.reload()
        }
      }, 2000)
    } catch (error) {
      console.error('Error submitting report:', error)
      errorMessage.value = error.response?.data?.error || t('report.error_quick')
    } finally {
      submitting.value = false
    }
  }

  const withdrawReport = () => {
    showWithdrawConfirm.value = true
  }

  const cancelWithdraw = () => {
    showWithdrawConfirm.value = false
  }

  const confirmWithdraw = async () => {
    if (submitting.value || !userReport.value) return

    showWithdrawConfirm.value = false
    submitting.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const { $api } = useNuxtApp()
      await $api.reports.delete(userReport.value.id)

      successMessage.value = t('report.withdraw_success')

      // Close modal after 1 second and reload
      setTimeout(() => {
        closeQuickModal()
        if (import.meta.client) {
          window.location.reload()
        }
      }, 1000)
    } catch (error) {
      console.error('Error withdrawing report:', error)
      errorMessage.value = error.response?.data?.error || t('report.withdraw_error')
    } finally {
      submitting.value = false
    }
  }

  const getReasonIconify = (reason) => {
    const icons = {
      spam: 'fa6-solid:bullhorn',
      inappropriate: 'fa6-solid:triangle-exclamation',
      harassment: 'fa6-solid:user-slash',
      misinformation: 'fa6-solid:circle-xmark',
      hate_speech: 'fa6-solid:hand-fist',
      violence: 'fa6-solid:skull-crossbones',
      illegal_content: 'fa6-solid:gavel',
      copyright: 'fa6-solid:copyright',
      other: 'fa6-solid:flag',
    }
    return icons[reason] || 'fa6-solid:flag'
  }

  const getReasonColor = (reason) => {
    const colors = {
      spam: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-400',
      },
      inappropriate: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
      },
      harassment: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-400',
      },
      misinformation: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
      },
      hate_speech: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
      violence: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-500' },
      illegal_content: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
      },
      copyright: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
      other: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400' },
    }
    return colors[reason] || colors.other
  }
</script>

<style scoped>
  /* Report button severity colors */
  .report-severe {
    color: rgb(220, 38, 38) !important; /* red-600 */
  }
  .report-severe:hover {
    color: rgb(185, 28, 28) !important; /* red-700 */
  }

  .report-warning {
    color: rgb(234, 88, 12) !important; /* orange-600 */
  }
  .report-warning:hover {
    color: rgb(194, 65, 12) !important; /* orange-700 */
  }

  .report-mild {
    color: rgb(161, 98, 7) !important; /* yellow-700 */
  }
  .report-mild:hover {
    color: rgb(133, 77, 14) !important; /* yellow-800 */
  }

  .report-modal {
    background-color: var(--color-bg-card);
  }

  .report-divider {
    border-top: 1px solid var(--color-border-default);
  }

  .report-or-text {
    background-color: var(--color-bg-card);
  }

  .report-reason-btn {
    border: 1px solid var(--color-border-default);
  }

  .report-reason-btn-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .report-reason-btn-selected {
    @apply bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700;
  }

  .report-textarea {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .report-confirm-modal {
    background-color: var(--color-bg-card);
  }

  .report-cancel-btn {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-muted);
  }

  .report-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .report-resolved-box {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }
</style>
