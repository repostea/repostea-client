<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="$emit('update:modelValue', false)"
    >
      <div class="comment-modal rounded-lg shadow-lg max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">{{ t('common.permalink') }}</h3>
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
            {{ t('common.permalink_description') }}
          </p>

          <div>
            <div class="modal-input-group flex items-center rounded-md overflow-hidden">
              <input
                :value="permalinkUrl"
                type="text"
                readonly
                class="modal-input flex-grow py-2 px-3 focus:outline-none"
              />
              <button
                class="modal-copy-btn px-3 py-2 transition-colors"
                :aria-label="t('common.copy')"
                @click="copyPermalink"
              >
                <Icon name="fa6-solid:copy" aria-hidden="true" />
              </button>
            </div>
            <p v-if="permalinkCopied" class="text-green-500 text-sm mt-1">
              {{ t('common.copied_to_clipboard') }}
            </p>
          </div>

          <div class="flex justify-end mt-4">
            <button
              class="modal-btn-secondary px-4 py-2 rounded transition-colors"
              @click="$emit('update:modelValue', false)"
            >
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { ref } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
    permalinkUrl: {
      type: String,
      required: true,
    },
  })

  defineEmits(['update:modelValue'])

  const permalinkCopied = ref(false)

  function copyPermalink() {
    if (import.meta.client) {
      navigator.clipboard
        .writeText(props.permalinkUrl)
        .then(() => {
          permalinkCopied.value = true
          setTimeout(() => {
            permalinkCopied.value = false
          }, 2000)
        })
        .catch((err) => {
          console.error('Error copying permalink:', err)
        })
    }
  }
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

  .modal-input-group {
    border: 1px solid var(--color-border-default);
  }

  .modal-input {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }

  .modal-copy-btn {
    background-color: var(--color-bg-active);
  }

  .modal-copy-btn:hover {
    background-color: var(--color-bg-elevated);
  }

  .modal-btn-secondary {
    background-color: var(--color-bg-active);
    color: var(--color-text-primary);
  }

  .modal-btn-secondary:hover {
    background-color: var(--color-bg-elevated);
  }
</style>
