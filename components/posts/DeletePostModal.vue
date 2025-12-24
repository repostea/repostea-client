<template>
  <div>
    <button
      class="delete-modal-btn p-1.5 text-sm rounded-md hover:text-red-500 transition-colors"
      :title="t('posts.delete')"
      :aria-label="t('posts.delete')"
      @click="openModal"
    >
      <Icon name="fa6-solid:trash-can" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click="closeModal"
      >
        <div
          class="card-bg rounded-lg shadow-xl w-full max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          @click.stop
        >
          <div class="delete-modal-header px-6 py-4">
            <h2 id="delete-modal-title" class="text-xl font-medium text-red-600 dark:text-red-400 inline-flex items-center"><Icon name="fa6-solid:triangle-exclamation" class="mr-2 flex-shrink-0" aria-hidden="true" /> <span>{{ t('posts.confirm_delete_title') }}</span></h2>
          </div>

          <div class="p-6">
            <p class="mb-4">{{ t('posts.confirm_delete_message') }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              <strong>{{ post.title }}</strong>
            </p>

            <div
              v-if="post.comment_count > 0"
              class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-md border border-yellow-200 dark:border-yellow-700 inline-flex items-center"
            >
              <Icon name="fa6-solid:circle-info" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('posts.delete_has_comments', { count: post.comment_count }) }}</span>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                class="delete-modal-cancel px-4 py-2 rounded-md text-text dark:text-text-dark transition-colors"
                @click="closeModal"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="px-4 py-2 bg-danger hover:bg-danger text-white rounded-md transition-colors"
                :disabled="isDeleting"
                @click="confirmDelete"
              >
                <span
                  v-if="isDeleting"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
                {{ t('posts.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useI18n } from '#i18n'

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['delete'])
  const { t } = useI18n()

  const isOpen = ref(false)
  const isDeleting = ref(false)

  function openModal() {
    isOpen.value = true
    document.body.classList.add('overflow-hidden')
  }

  function closeModal() {
    isOpen.value = false
    document.body.classList.remove('overflow-hidden')
  }

  async function confirmDelete() {
    try {
      isDeleting.value = true
      emit('delete', props.post.id)
      closeModal()
    } catch (error) {
      console.error('Error al eliminar:', error)
    } finally {
      isDeleting.value = false
    }
  }
</script>

<style scoped>
  .delete-modal-btn {
    border: 1px solid var(--color-border-default);
  }

  .delete-modal-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .delete-modal-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .delete-modal-cancel {
    border: 1px solid var(--color-border-default);
  }

  .delete-modal-cancel:hover {
    background-color: var(--color-bg-hover);
  }
</style>
