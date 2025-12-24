<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="close"
      >
        <div
          class="card-bg rounded-lg shadow-xl max-w-lg w-full p-6 transform transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seal-info-modal-title"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30">
                <Icon name="fa6-solid:certificate" class="text-2xl text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              </div>
              <h3 id="seal-info-modal-title" class="text-lg font-bold text-text dark:text-text-dark">
                {{ $t('seals.info_title') }}
              </h3>
            </div>
            <button
              class="text-text-muted hover:text-text dark:text-text-dark-muted dark:hover:text-text-dark transition-colors"
              :aria-label="$t('common.close')"
              @click="close"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <!-- Content -->
          <div class="space-y-4 text-sm text-text dark:text-text-dark">
            <p>{{ $t('seals.info_description') }}</p>

            <!-- Seal Types -->
            <div class="space-y-3">
              <!-- Recommended -->
              <div class="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <Icon name="fa6-solid:award" class="text-xl text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 class="font-semibold text-green-700 dark:text-green-300">{{ $t('seals.recommend') }}</h4>
                  <p class="text-green-600 dark:text-green-400 text-xs mt-1">{{ $t('seals.info_recommend_desc') }}</p>
                </div>
              </div>

              <!-- Advise Against -->
              <div class="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <Icon name="fa6-solid:triangle-exclamation" class="text-xl text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 class="font-semibold text-orange-700 dark:text-orange-300">{{ $t('seals.advise_against') }}</h4>
                  <p class="text-orange-600 dark:text-orange-400 text-xs mt-1">{{ $t('seals.info_advise_against_desc') }}</p>
                </div>
              </div>
            </div>

            <!-- How it works -->
            <div class="seal-info-divider pt-2">
              <h4 class="font-semibold mb-2">{{ $t('seals.info_how_it_works') }}</h4>
              <ul class="list-disc list-inside space-y-1 text-text-muted dark:text-text-dark-muted text-xs">
                <li>{{ $t('seals.info_weekly_limit') }}</li>
                <li>{{ $t('seals.info_visible_indicator') }}</li>
                <li>{{ $t('seals.info_community_trust') }}</li>
              </ul>
            </div>
          </div>

          <!-- Close Button -->
          <button
            class="w-full mt-6 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            @click="close"
          >
            {{ $t('common.understood') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const close = () => {
  isOpen.value = false
}

// Close on Escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    close()
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
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

.seal-info-divider {
  border-top: 1px solid var(--color-border-default);
}
</style>
