<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="cancel"
    >
      <div class="confirm-modal rounded-lg shadow-lg max-w-md w-full p-6 m-4">
        <div class="flex justify-between items-center mb-4">
          <h3 :class="titleClass" class="text-lg font-medium flex items-center">
            <Icon :name="iconName" class="mr-2" aria-hidden="true" />
            {{ title }}
          </h3>
          <button class="modal-close-btn" :aria-label="t('common.close')" @click="cancel">
            <Icon name="fa6-solid:xmark" aria-hidden="true" />
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-sm modal-description">
            {{ message }}
          </p>

          <div
            class="flex justify-end gap-3 pt-4 border-t border-border-default dark:border-border-dark-default"
          >
            <button
              :disabled="loading"
              class="modal-btn-secondary px-4 py-2 rounded transition-colors disabled:opacity-50"
              @click="cancel"
            >
              {{ cancelText || t('common.cancel') }}
            </button>
            <button
              :disabled="loading"
              :class="confirmButtonClass"
              class="px-4 py-2 rounded transition-colors disabled:opacity-50 flex items-center justify-center"
              @click="confirm"
            >
              <Icon
                v-if="loading"
                name="fa6-solid:spinner"
                class="mr-1 animate-spin"
                aria-hidden="true"
              />
              {{ confirmText || t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    confirmText: {
      type: String,
      default: null,
    },
    cancelText: {
      type: String,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    variant: {
      type: String,
      default: 'danger',
      validator: (value) => ['danger', 'warning', 'info'].includes(value),
    },
  })

  const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

  const iconName = computed(() => {
    switch (props.variant) {
      case 'danger':
        return 'fa6-solid:triangle-exclamation'
      case 'warning':
        return 'fa6-solid:circle-exclamation'
      case 'info':
        return 'fa6-solid:circle-info'
      default:
        return 'fa6-solid:triangle-exclamation'
    }
  })

  const titleClass = computed(() => {
    switch (props.variant) {
      case 'danger':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'info':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-red-600 dark:text-red-400'
    }
  })

  const confirmButtonClass = computed(() => {
    switch (props.variant) {
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700'
      case 'warning':
        return 'bg-yellow-600 text-white hover:bg-yellow-700'
      case 'info':
        return 'bg-blue-600 text-white hover:bg-blue-700'
      default:
        return 'bg-red-600 text-white hover:bg-red-700'
    }
  })

  function confirm() {
    emit('confirm')
  }

  function cancel() {
    emit('update:modelValue', false)
    emit('cancel')
  }
</script>

<style scoped>
  .confirm-modal {
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border-default);
  }

  .modal-close-btn {
    @apply p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
    color: var(--color-text-muted);
  }

  .modal-description {
    color: var(--color-text-secondary);
  }

  .modal-btn-secondary {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-default);
  }

  .modal-btn-secondary:hover:not(:disabled) {
    background-color: var(--color-bg-tertiary);
  }
</style>
