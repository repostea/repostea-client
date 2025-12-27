<template>
  <div class="thumbnail-uploader-compact">
    <!-- Vista con miniatura -->
    <div v-if="previewUrl || currentThumbnail" class="flex items-center gap-3">
      <div class="relative flex-shrink-0">
        <img
          :src="previewUrl || currentThumbnail"
          alt="Thumbnail"
          class="w-20 h-20 rounded-md object-cover thumb-border"
        >
        <div
          v-if="isUploading || isDeleting"
          class="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center"
        >
          <span
            class="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"
          />
        </div>
      </div>

      <div class="flex-1">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          class="hidden"
          @change="handleFileSelect"
        >

        <div class="flex gap-2">
          <button
            type="button"
            :disabled="isUploading || isDeleting"
            class="px-3 py-1.5 text-sm thumb-change-btn rounded-md transition-colors disabled:opacity-50"
            @click="$refs.fileInput.click()"
          >
            <Icon name="fa6-solid:rotate" class="mr-1" aria-hidden="true" />
            {{ t('posts.change_thumbnail') }}
          </button>

          <button
            type="button"
            :disabled="isUploading || isDeleting"
            class="px-3 py-1.5 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            @click="handleDelete"
          >
            <Icon name="fa6-solid:trash-can" class="mr-1" aria-hidden="true" />
            {{ t('common.delete') }}
          </button>
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ t('posts.thumbnail_requirements') }}
        </p>
      </div>
    </div>

    <!-- Vista sin miniatura -->
    <div v-else>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        class="hidden"
        @change="handleFileSelect"
      >

      <button
        type="button"
        :disabled="isUploading"
        class="w-full px-4 py-3 border-2 border-dashed thumb-upload-area rounded-md hover:border-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        @click="$refs.fileInput.click()"
      >
        <Icon name="fa6-solid:cloud-arrow-up" class="text-gray-400" aria-hidden="true" />
        <span
          v-if="isUploading"
          class="inline-block animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
        />
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ isUploading ? t('common.uploading') + '...' : t('posts.upload_thumbnail') }}
        </span>
      </button>

      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {{ t('posts.thumbnail_requirements') }}
      </p>
    </div>

    <!-- Mensajes -->
    <div
      v-if="errorMessage"
      class="mt-2 text-sm text-red-600 dark:text-red-400 flex items-start gap-1"
    >
      <Icon name="fa6-solid:circle-exclamation" class="mt-0.5" aria-hidden="true" />
      <span>{{ errorMessage }}</span>
    </div>

    <div
      v-if="successMessage"
      class="mt-2 text-sm text-green-600 dark:text-green-400 flex items-start gap-1"
    >
      <Icon name="fa6-solid:circle-check" class="mt-0.5" aria-hidden="true" />
      <span>{{ successMessage }}</span>
    </div>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="t('posts.confirm_delete_thumbnail_title')"
      :message="t('posts.confirm_delete_thumbnail')"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      type="danger"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { useI18n } from '#i18n'
  import { useNuxtApp } from '#app'
  import ConfirmDialog from '~/components/common/ConfirmDialog.vue'

  const props = defineProps({
    currentThumbnail: {
      type: String,
      default: null,
    },
    postId: {
      type: Number,
      default: null,
    },
  })

  const emit = defineEmits(['thumbnail-updated', 'thumbnail-deleted'])

  const { t } = useI18n()
  const { $api } = useNuxtApp()

  const fileInput = ref(null)
  const previewUrl = ref(null)
  const isUploading = ref(false)
  const showDeleteConfirm = ref(false)
  const isDeleting = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  watch(
    () => props.currentThumbnail,
    (newVal) => {
      if (!newVal) {
        previewUrl.value = null
      }
    }
  )

  function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    errorMessage.value = ''
    successMessage.value = ''

    if (!file.type.startsWith('image/')) {
      errorMessage.value = t('posts.invalid_image_type')
      return
    }

    if (file.size > 16 * 1024 * 1024) {
      errorMessage.value = t('posts.image_too_large')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target.result
      uploadThumbnail(file)
    }
    reader.readAsDataURL(file)
  }

  async function uploadThumbnail(file) {
    if (!props.postId) {
      errorMessage.value = t('posts.save_post_first')
      previewUrl.value = null
      return
    }

    isUploading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const formData = new FormData()
      formData.append('thumbnail', file)

      const response = await $api.images.uploadPostThumbnail(props.postId, formData)

      successMessage.value = t('posts.thumbnail_uploaded')
      emit('thumbnail-updated', response.data.image.urls)

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      errorMessage.value = error.response?.data?.message || t('posts.upload_error')
      previewUrl.value = null
    } finally {
      isUploading.value = false
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
  }

  async function handleDelete() {
    showDeleteConfirm.value = true
  }

  async function handleDeleteConfirm() {
    if (!props.postId) {
      previewUrl.value = null
      emit('thumbnail-deleted')
      return
    }

    isDeleting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      await $api.images.deletePostThumbnail(props.postId)

      previewUrl.value = null
      successMessage.value = t('posts.thumbnail_deleted')
      emit('thumbnail-deleted')

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      console.error('Error deleting thumbnail:', error)
      errorMessage.value = error.response?.data?.message || t('posts.delete_image_error')
    } finally {
      isDeleting.value = false
    }
  }
</script>

<style scoped>
  .thumbnail-uploader-compact {
    /* Estilos compactos sin bordes ni padding extra */
  }

  .thumb-border {
    border: 1px solid var(--color-border-default);
  }

  .thumb-change-btn {
    border: 1px solid var(--color-border-default);
  }

  .thumb-change-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .thumb-upload-area {
    border-color: var(--color-border-default);
  }

  .thumb-upload-area:hover {
    background-color: var(--color-bg-hover);
  }
</style>
