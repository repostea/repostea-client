<template>
  <div class="avatar-uploader">
    <div class="flex items-center space-x-4">
      <div class="relative">
        <div
          class="w-24 h-24 rounded-full overflow-hidden avatar-placeholder flex items-center justify-center"
        >
          <img
            v-if="previewUrl || currentAvatar"
            :src="previewUrl || currentAvatar"
            alt="Avatar"
            class="w-full h-full object-cover"
          />
          <Icon name="fa6-solid:user" class="text-4xl text-gray-400" aria-hidden="true" />
        </div>

        <button
          v-if="currentAvatar || previewUrl"
          :disabled="isDeleting"
          class="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
          :title="t('common.delete')"
          :aria-label="t('common.delete')"
          @click="handleDelete"
        >
          <Icon v-if="!isDeleting" name="fa6-solid:xmark" class="text-xs" aria-hidden="true" />
          <span
            v-else
            class="inline-block animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"
            aria-hidden="true"
          />
        </button>
      </div>

      <div class="flex-1">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          class="hidden"
          @change="handleFileSelect"
        />

        <button
          :disabled="isUploading"
          class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          @click="$refs.fileInput.click()"
        >
          <span
            v-if="isUploading"
            class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
          />
          <Icon v-else name="fa6-solid:upload" class="mr-2" aria-hidden="true" />
          {{ previewUrl ? t('profile.change_avatar') : t('profile.upload_avatar') }}
        </button>

        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {{ t('profile.avatar_requirements') }}
        </p>
      </div>
    </div>

    <div v-if="errorMessage" class="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center">
      <Icon name="fa6-solid:circle-exclamation" class="mr-1" aria-hidden="true" />
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="mt-3 text-sm text-green-600 dark:text-green-400 flex items-center"
    >
      <Icon name="fa6-solid:circle-check" class="mr-1" aria-hidden="true" />
      {{ successMessage }}
    </div>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="t('profile.confirm_delete_avatar_title')"
      :message="t('profile.confirm_delete_avatar')"
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
  import { useNotification } from '~/composables/useNotification'
  import ConfirmDialog from '~/components/common/ConfirmDialog.vue'

  const props = defineProps({
    currentAvatar: {
      type: String,
      default: null,
    },
  })

  const emit = defineEmits(['avatar-updated', 'avatar-deleted'])

  const { t } = useI18n()
  const { $api } = useNuxtApp()
  useNotification()

  const fileInput = ref(null)
  const previewUrl = ref(null)
  const isUploading = ref(false)
  const isDeleting = ref(false)
  const showDeleteConfirm = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  watch(
    () => props.currentAvatar,
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
      errorMessage.value = t('profile.invalid_image_type')
      return
    }

    if (file.size > 16 * 1024 * 1024) {
      errorMessage.value = t('profile.image_too_large')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target.result
      uploadAvatar(file)
    }
    reader.readAsDataURL(file)
  }

  async function uploadAvatar(file) {
    isUploading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await $api.images.uploadAvatar(formData)

      successMessage.value = t('profile.avatar_uploaded')
      // Emit all sizes, let parent decide which to use (medium is stored in DB)
      emit('avatar-updated', response.data.image.urls)

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      errorMessage.value = error.response?.data?.message || t('profile.upload_error')
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
    isDeleting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      await $api.images.deleteAvatar()

      previewUrl.value = null
      successMessage.value = t('profile.avatar_deleted')
      emit('avatar-deleted')

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      console.error('Error deleting avatar:', error)
      errorMessage.value = error.response?.data?.message || t('profile.delete_error')
    } finally {
      isDeleting.value = false
    }
  }
</script>

<style scoped>
  .avatar-uploader {
    @apply p-4 rounded-lg;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .avatar-placeholder {
    background-color: var(--color-bg-subtle);
  }
</style>
