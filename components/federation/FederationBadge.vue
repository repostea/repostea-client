<template>
  <div
    v-if="federation?.has_engagement"
    class="federation-badge w-20 cursor-pointer"
    :title="$t('federation.stats_tooltip')"
    @click.stop="showModal = true"
  >
    <div class="flex items-center justify-center gap-1.5 px-1 py-1">
      <!-- Likes -->
      <div v-if="federation.likes_count" class="flex items-center gap-0.5">
        <Icon name="fa6-solid:heart" class="text-[9px]" aria-hidden="true" />
        <span class="text-[10px] tabular-nums font-medium">{{
          formatNumber(federation.likes_count)
        }}</span>
      </div>
      <!-- Shares -->
      <div v-if="federation.shares_count" class="flex items-center gap-0.5">
        <Icon name="fa6-solid:retweet" class="text-[9px]" aria-hidden="true" />
        <span class="text-[10px] tabular-nums font-medium">{{
          formatNumber(federation.shares_count)
        }}</span>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="showModal = false"
        >
          <div class="federation-modal rounded-lg shadow-xl max-w-sm w-full p-5" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <Icon name="fa6-solid:globe" class="w-5 h-5 text-primary" />
                <h3 class="font-semibold">{{ $t('federation.title') }}</h3>
              </div>
              <button
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="showModal = false"
              >
                <Icon name="fa6-solid:xmark" />
              </button>
            </div>

            <!-- Description -->
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {{ $t('federation.explanation') }}
            </p>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3 mb-4">
              <div class="stat-box text-center p-3 rounded-lg">
                <div
                  class="flex items-center justify-center gap-1 text-xl font-bold tabular-nums stat-value"
                >
                  <Icon name="fa6-solid:heart" class="text-base" aria-hidden="true" />
                  {{ federation.likes_count || 0 }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ $t('federation.likes') }}
                </div>
              </div>
              <div class="stat-box text-center p-3 rounded-lg">
                <div
                  class="flex items-center justify-center gap-1 text-xl font-bold tabular-nums stat-value"
                >
                  <Icon name="fa6-solid:retweet" class="text-base" aria-hidden="true" />
                  {{ federation.shares_count || 0 }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ $t('federation.shares') }}
                </div>
              </div>
            </div>

            <!-- Learn more -->
            <NuxtLink
              :to="localePath('/federation')"
              class="block text-center text-sm hover:underline learn-more-link"
              @click="showModal = false"
            >
              {{ $t('federation.learn_more') }} →
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useLocalePath } from '#i18n'

  const localePath = useLocalePath()

  defineProps({
    federation: {
      type: Object,
      default: null,
    },
  })

  const showModal = ref(false)

  const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K'
    if (num >= 100) return Math.round(num / 10) * 10 // Round to nearest 10 for 3-digit numbers
    return String(num)
  }
</script>

<style scoped>
  .federation-badge {
    background-color: rgba(var(--color-primary-rgb), 0.08);
    color: var(--color-primary);
    border: 1px solid rgba(var(--color-primary-rgb), 0.4);
    border-top: 1px dashed rgba(var(--color-primary-rgb), 0.3);
    border-radius: 0 0 0.5rem 0.5rem;
    transition: all 0.2s ease;
    margin-top: -1px;
    opacity: 0.85;
  }

  .federation-badge:hover {
    background-color: rgba(var(--color-primary-rgb), 0.15);
    opacity: 1;
  }

  .federation-modal {
    background-color: var(--color-bg-card);
    color: var(--color-text-primary);
  }

  .stat-box {
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }

  .stat-value {
    color: var(--color-primary);
  }

  .learn-more-link {
    color: var(--color-primary);
  }

  /* Modal transition */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
</style>
