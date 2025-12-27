<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="cancel"
      >
        <div
          class="card-bg rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seal-modal-title"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30"
              >
                <Icon
                  name="fa6-solid:certificate"
                  class="text-2xl text-yellow-600 dark:text-yellow-400"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 id="seal-modal-title" class="text-lg font-bold text-text dark:text-text-dark">
                  {{ $t('seals.use_seal') }}
                </h3>
                <p class="text-sm text-text-muted dark:text-text-dark-muted">
                  {{ $t('seals.seals_this_week', { count: availableSeals }) }}
                </p>
              </div>
            </div>
            <button
              class="text-text-muted hover:text-text dark:text-text-dark-muted dark:hover:text-text-dark transition-colors"
              :aria-label="$t('common.close')"
              @click="cancel"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <!-- Content -->
          <div class="mb-6">
            <!-- Message if own content -->
            <div
              v-if="isOwnContent"
              class="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            >
              <div class="flex items-start gap-3">
                <Icon
                  name="fa6-solid:circle-info"
                  class="text-amber-600 dark:text-amber-400 mt-0.5 text-lg flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p class="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    {{ $t('seals.own_content_title') }}
                  </p>
                  <p class="text-sm text-amber-700 dark:text-amber-300">
                    {{ $t('seals.own_content_message') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Warning message if no seals available and none placed -->
            <div
              v-else-if="!hasAvailableSeals && !hasRecommended && !hasReported"
              class="mb-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
            >
              <div class="flex items-start gap-3">
                <Icon
                  name="fa6-solid:circle-info"
                  class="text-yellow-600 dark:text-yellow-400 mt-0.5"
                  aria-hidden="true"
                />
                <div class="flex-1">
                  <p class="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                    {{ $t('seals.no_seals_available') }}
                  </p>
                  <p class="text-xs text-yellow-700 dark:text-yellow-300">
                    {{ $t('seals.weekly_renewal') }}
                  </p>
                </div>
              </div>
            </div>

            <p
              v-else-if="!isOwnContent"
              class="text-text-muted dark:text-text-dark-muted text-sm mb-4"
            >
              {{
                hasRecommended || hasReported ? $t('seals.remove_seal') : $t('seals.choose_action')
              }}
            </p>

            <!-- Option Buttons (hidden for own content) -->
            <div v-if="!isOwnContent" class="space-y-3">
              <!-- Recommend Option (only show if not reported) -->
              <button
                v-if="!hasRecommended && !hasReported"
                :disabled="!hasAvailableSeals"
                class="w-full p-4 rounded-lg border-2 transition-all text-left group"
                :class="[
                  'seal-option-border',
                  hasAvailableSeals
                    ? 'hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed',
                ]"
                @click="selectOption('recommended')"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                  >
                    <Icon
                      name="fa6-solid:award"
                      class="text-green-600 dark:text-green-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-text dark:text-text-dark">
                      {{ $t('seals.recommend') }}
                    </div>
                    <div class="text-sm text-text-muted dark:text-text-dark-muted">
                      {{ $t('seals.recommend_description') }}
                    </div>
                  </div>
                  <Icon
                    name="fa6-solid:chevron-right"
                    class="text-text-muted group-hover:text-green-600 transition-colors"
                    aria-hidden="true"
                  />
                </div>
              </button>

              <!-- Remove Recommendation -->
              <button
                v-if="hasRecommended"
                class="w-full p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20 transition-all hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-left group"
                @click="selectOption('recommended')"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                  >
                    <Icon
                      name="fa6-solid:xmark"
                      class="text-red-600 dark:text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-text dark:text-text-dark">
                      {{ $t('seals.remove_seal') }}
                    </div>
                    <div class="text-sm text-text-muted dark:text-text-dark-muted">
                      {{ $t('seals.recover_seal') }}
                    </div>
                  </div>
                  <Icon
                    name="fa6-solid:chevron-right"
                    class="text-text-muted group-hover:text-red-600 transition-colors"
                    aria-hidden="true"
                  />
                </div>
              </button>

              <!-- Question Option (only show if not recommended) -->
              <button
                v-if="!hasReported && !hasRecommended"
                :disabled="!hasAvailableSeals"
                class="w-full p-4 rounded-lg border-2 transition-all text-left group"
                :class="[
                  'seal-option-border',
                  hasAvailableSeals
                    ? 'hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed',
                ]"
                @click="selectOption('advise_against')"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
                  >
                    <Icon
                      name="fa6-solid:triangle-exclamation"
                      class="text-orange-600 dark:text-orange-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-text dark:text-text-dark">
                      {{ $t('seals.advise_against') }}
                    </div>
                    <div class="text-sm text-text-muted dark:text-text-dark-muted">
                      {{ $t('seals.advise_against_description') }}
                    </div>
                  </div>
                  <Icon
                    name="fa6-solid:chevron-right"
                    class="text-text-muted group-hover:text-orange-600 transition-colors"
                    aria-hidden="true"
                  />
                </div>
              </button>

              <!-- Remove Question -->
              <button
                v-if="hasReported"
                class="w-full p-4 rounded-lg border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20 transition-all hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-left group"
                @click="selectOption('advise_against')"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
                  >
                    <Icon
                      name="fa6-solid:xmark"
                      class="text-red-600 dark:text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-text dark:text-text-dark">
                      {{ $t('seals.remove_seal') }}
                    </div>
                    <div class="text-sm text-text-muted dark:text-text-dark-muted">
                      {{ $t('seals.recover_seal') }}
                    </div>
                  </div>
                  <Icon
                    name="fa6-solid:chevron-right"
                    class="text-text-muted group-hover:text-red-600 transition-colors"
                    aria-hidden="true"
                  />
                </div>
              </button>
            </div>
          </div>

          <!-- Cancel Button -->
          <button
            class="seal-cancel-btn w-full px-4 py-2 rounded-lg text-text dark:text-text-dark transition-colors"
            @click="cancel"
          >
            {{ $t('common.cancel') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  interface Props {
    isOpen: boolean
    hasRecommended: boolean
    hasReported: boolean
    availableSeals: number
    hasAvailableSeals: boolean
    isOwnContent?: boolean
  }

  withDefaults(defineProps<Props>(), {
    isOwnContent: false,
  })

  const emit = defineEmits<{
    select: [type: 'recommended' | 'advise_against']
    cancel: []
  }>()

  const selectOption = (type: 'recommended' | 'advise_against') => {
    emit('select', type)
  }

  const cancel = () => {
    emit('cancel')
  }
</script>

<style scoped>
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-active > div,
  .modal-leave-active > div {
    transition: transform 0.3s ease;
  }

  .modal-enter-from > div,
  .modal-leave-to > div {
    transform: scale(0.9);
  }

  .seal-option-border {
    border-color: var(--color-border-default);
  }

  .seal-cancel-btn {
    border: 1px solid var(--color-border-default);
  }

  .seal-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }
</style>
