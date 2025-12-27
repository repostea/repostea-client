<template>
  <div v-if="canEdit">
    <FooterButton icon="fa6-solid:pen-to-square" :title="t('posts.edit')" @click="openModal" />

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click="closeModal"
      >
        <div
          class="card-bg rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          @click.stop
        >
          <div class="edit-modal-header px-6 py-4 flex justify-between items-center">
            <h2 id="edit-modal-title" class="text-xl font-medium inline-flex items-center">
              <Icon name="fa6-solid:pen-to-square" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('posts.edit_post') }}</span>
            </h2>
            <button
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              :aria-label="t('common.close')"
              @click="closeModal"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <PostForm
            :edit-mode="true"
            :post-id="post.id"
            :initial-data="post"
            @update="onPostUpdated"
            @cancel="closeModal"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useI18n } from '#i18n'
  import { useNotification } from '~/composables/useNotification'
  import PostForm from '~/components/posts/PostForm.vue'
  import FooterButton from '~/components/posts/postCard/FooterButton.vue'

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['post-updated'])
  const { t } = useI18n()
  const { error: showError } = useNotification()

  const isOpen = ref(false)

  // Only show edit button if user owns the post
  // The backend sends can_edit field when user is authenticated
  const canEdit = computed(() => {
    return props.post.can_edit === true
  })

  function openModal() {
    // Check if trying to edit a poll - temporarily disabled
    if (props.post.content_type === 'poll') {
      showError(t('posts.poll_edit_disabled'))
      return
    }

    isOpen.value = true
    document.body.classList.add('overflow-hidden')
  }

  function closeModal() {
    isOpen.value = false
    document.body.classList.remove('overflow-hidden')
  }

  function onPostUpdated(updatedPost) {
    emit('post-updated', updatedPost)
    closeModal()
  }
</script>

<style scoped>
  .edit-modal-header {
    border-bottom: 1px solid var(--color-border-default);
  }
</style>
