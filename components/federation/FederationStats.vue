<template>
  <div v-if="hasEngagement" class="federation-stats">
    <button
      class="federation-btn flex items-center gap-1.5 text-xs transition-colors"
      :title="$t('federation.stats_tooltip')"
      @click="showModal = true"
    >
      <!-- Fediverse icon -->
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
        />
      </svg>

      <span v-if="federation.likes_count" class="flex items-center gap-0.5">
        {{ formatNumber(federation.likes_count) }}
        <Icon name="fa6-solid:heart" class="text-[10px]" aria-hidden="true" />
      </span>

      <span v-if="federation.shares_count" class="flex items-center gap-0.5">
        {{ formatNumber(federation.shares_count) }}
        <Icon name="fa6-solid:retweet" class="text-[10px]" aria-hidden="true" />
      </span>
    </button>

    <!-- Info Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="showModal = false"
        >
          <div
            class="federation-modal rounded-lg shadow-xl max-w-md w-full p-6"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="'federation-modal-title'"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-start justify-between mb-5">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30"
                >
                  <svg
                    class="w-5 h-5 text-purple-600 dark:text-purple-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                    />
                  </svg>
                </div>
                <h3 id="federation-modal-title" class="text-lg font-bold">
                  {{ $t('federation.title') }}
                </h3>
              </div>
              <button
                class="text-text-muted hover:text-text dark:text-text-dark-muted dark:hover:text-text-dark transition-colors"
                :aria-label="$t('common.close')"
                @click="showModal = false"
              >
                <Icon name="fa6-solid:xmark" aria-hidden="true" />
              </button>
            </div>

            <!-- Explanation -->
            <p class="text-sm text-text-secondary dark:text-text-dark-secondary mb-5">
              {{ $t('federation.explanation') }}
            </p>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 gap-3 mb-5">
              <div class="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div
                  class="flex items-center justify-center gap-1 text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums"
                >
                  <Icon name="fa6-solid:heart" class="text-lg" aria-hidden="true" />
                  {{ federation.likes_count.toLocaleString() }}
                </div>
                <div class="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                  {{ $t('federation.likes') }}
                </div>
              </div>
              <div class="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div
                  class="flex items-center justify-center gap-1 text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums"
                >
                  <Icon name="fa6-solid:retweet" class="text-lg" aria-hidden="true" />
                  {{ federation.shares_count.toLocaleString() }}
                </div>
                <div class="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                  {{ $t('federation.shares') }}
                </div>
              </div>
            </div>

            <!-- Info box -->
            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-5">
              <p class="text-xs text-text-muted dark:text-text-dark-muted flex items-start gap-2">
                <Icon
                  name="fa6-solid:circle-info"
                  class="mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{{ $t('federation.stats_info') }}</span>
              </p>
            </div>

            <!-- Learn more link -->
            <NuxtLink
              :to="localePath('/federation')"
              class="block text-center text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium"
              @click="showModal = false"
            >
              {{ $t('federation.learn_more') }}
              <Icon name="fa6-solid:arrow-right" class="ml-1" aria-hidden="true" />
            </NuxtLink>

            <!-- Close Button -->
            <button
              class="w-full mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
              @click="showModal = false"
            >
              {{ $t('common.close') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useLocalePath } from '#i18n'

  const localePath = useLocalePath()

  const props = defineProps({
    federation: {
      type: Object,
      default: () => ({
        likes_count: 0,
        shares_count: 0,
        replies_count: 0,
        has_engagement: false,
      }),
    },
  })

  const showModal = ref(false)

  const hasEngagement = computed(() => {
    return (
      props.federation?.has_engagement ||
      props.federation?.likes_count > 0 ||
      props.federation?.shares_count > 0
    )
  })

  const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return String(num)
  }
</script>

<style scoped>
  .federation-stats {
    display: inline-flex;
  }

  .federation-btn {
    color: var(--color-text-muted);
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
  }

  .federation-btn:hover {
    color: rgb(147, 51, 234); /* purple-600 */
    background-color: rgba(147, 51, 234, 0.1);
  }

  .dark .federation-btn:hover {
    color: rgb(192, 132, 252); /* purple-400 */
    background-color: rgba(147, 51, 234, 0.2);
  }

  .federation-modal {
    background-color: var(--color-bg-card);
    color: var(--color-text-primary);
  }

  /* Modal transitions */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-active > div,
  .modal-leave-active > div {
    transition: transform 0.2s ease;
  }

  .modal-enter-from > div,
  .modal-leave-to > div {
    transform: scale(0.95);
  }
</style>
