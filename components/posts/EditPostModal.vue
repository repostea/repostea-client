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
            :show-delete-button="true"
            @update="onPostUpdated"
            @cancel="closeModal"
            @delete="showDeleteConfirm = true"
          />
        </div>
      </div>

      <!-- Delete confirmation modal -->
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
        @click="showDeleteConfirm = false"
      >
        <div
          class="card-bg rounded-lg shadow-xl w-full max-w-md"
          role="dialog"
          aria-modal="true"
          @click.stop
        >
          <div class="edit-modal-header px-6 py-4">
            <h2 class="text-xl font-medium text-red-600 dark:text-red-400 inline-flex items-center">
              <Icon
                name="fa6-solid:triangle-exclamation"
                class="mr-2 flex-shrink-0"
                aria-hidden="true"
              />
              <span>{{ t('posts.confirm_delete_title') }}</span>
            </h2>
          </div>
          <div class="p-6">
            <p class="mb-2">{{ t('posts.confirm_delete_message') }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              <strong>{{ post.title }}</strong>
            </p>
            <div
              v-if="post.comment_count > 0"
              class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-md border border-yellow-200 dark:border-yellow-700 text-sm"
            >
              <Icon name="fa6-solid:circle-info" class="mr-2" aria-hidden="true" />
              {{ t('posts.delete_has_comments', { count: post.comment_count }) }}
            </div>
            <div class="flex justify-end space-x-3">
              <button
                class="edit-modal-cancel px-4 py-2 rounded-md transition-colors"
                @click="showDeleteConfirm = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors inline-flex items-center"
                :disabled="isDeleting"
                @click="deletePost"
              >
                <Icon
                  v-if="isDeleting"
                  name="fa6-solid:spinner"
                  class="animate-spin mr-2"
                  aria-hidden="true"
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
  import { ref, computed } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { useRouter } from 'vue-router'
  import { useNuxtApp } from '#app'
  import { useNotification } from '~/composables/useNotification'
  import { usePostsStore } from '~/stores/posts'
  import PostForm from '~/components/posts/PostForm.vue'
  import FooterButton from '~/components/posts/postCard/FooterButton.vue'

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['post-updated', 'post-deleted'])
  const { t } = useI18n()
  const router = useRouter()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()
  const postsStore = usePostsStore()
  const { success, error: showError } = useNotification()

  const isOpen = ref(false)
  const showDeleteConfirm = ref(false)
  const isDeleting = ref(false)

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
    showDeleteConfirm.value = false
    document.body.classList.remove('overflow-hidden')
  }

  function onPostUpdated(updatedPost) {
    emit('post-updated', updatedPost)
    closeModal()
  }

  async function deletePost() {
    isDeleting.value = true
    try {
      await $api.posts.deletePost(props.post.id)
      postsStore._clearCache()
      success(t('posts.delete_success'))
      emit('post-deleted', props.post.id)
      closeModal()
      // Redirect to home page after deletion
      router.push(localePath('/'))
    } catch (err) {
      console.error('Error deleting post:', err)
      showError(t('posts.delete_error'))
    } finally {
      isDeleting.value = false
    }
  }
</script>

<style scoped>
  .edit-modal-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .edit-modal-cancel {
    border: 1px solid var(--color-border-default);
  }

  .edit-modal-cancel:hover {
    background-color: var(--color-bg-hover);
  }
</style>
