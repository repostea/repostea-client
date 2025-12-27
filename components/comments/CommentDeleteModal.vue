<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="comment-modal rounded-lg shadow-lg max-w-md w-full p-6 m-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-red-600 dark:text-red-400 flex items-center">
            <Icon name="fa6-solid:triangle-exclamation" class="mr-2" aria-hidden="true" />
            {{ t('comments.delete_confirm_title') }}
          </h3>
          <button
            class="modal-close-btn"
            :aria-label="t('common.close')"
            @click="$emit('update:modelValue', false)"
          >
            <Icon name="fa6-solid:xmark" aria-hidden="true" />
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-sm modal-description">
            {{ t('comments.delete_confirm_message') }}
          </p>

          <div
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3"
          >
            <p class="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
              <Icon
                name="fa6-solid:circle-info"
                class="mr-1 mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />
              <span>{{ t('comments.delete_info') }}</span>
            </p>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button
              :disabled="isDeleting"
              class="modal-btn-secondary px-4 py-2 rounded transition-colors disabled:opacity-50"
              @click="$emit('update:modelValue', false)"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              :disabled="isDeleting"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              @click="$emit('confirm')"
            >
              <Icon
                v-if="isDeleting"
                name="fa6-solid:spinner"
                class="mr-1 animate-spin"
                aria-hidden="true"
              />
              {{ t('comments.delete_confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useI18n } from '#i18n'

const { t } = useI18n()

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue', 'confirm'])
</script>

<style scoped>
.comment-modal {
  background-color: var(--color-bg-card);
  color: var(--color-text-primary);
}

.modal-close-btn {
  color: var(--color-text-muted);
  transition: color 0.2s ease;
}

.modal-close-btn:hover {
  color: var(--color-text-primary);
}

.modal-description {
  color: var(--color-text-secondary);
}

.modal-btn-secondary {
  background-color: var(--color-bg-active);
  color: var(--color-text-primary);
}

.modal-btn-secondary:hover {
  background-color: var(--color-bg-elevated);
}
</style>
