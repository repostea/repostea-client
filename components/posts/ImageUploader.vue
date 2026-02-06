<template>
  <div class="image-uploader">
    <!-- Imagen actual / Preview -->
    <div v-if="currentImageUrl || previewUrl" class="mb-4">
      <div class="relative group">
        <img
          :src="previewUrl || currentImageUrl"
          :alt="t('comments.image_upload.preview')"
          class="image-preview w-full h-auto rounded-lg"
          style="max-height: 400px; object-fit: contain"
        />
        <div
          class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
        >
          <button
            type="button"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            @click="removeImage"
          >
            <Icon name="fa6-solid:trash" class="mr-2" aria-hidden="true" />
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Upload area with drag & drop -->
    <div
      v-else
      tabindex="0"
      class="upload-area border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
      :class="[
        isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary',
        isUploading ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @paste="handlePaste"
      @click="!isUploading && triggerFileInput()"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        class="hidden"
        @change="handleFileSelect"
      />

      <div class="mb-4">
        <Icon
          :name="isDragging ? 'fa6-solid:cloud-arrow-down' : 'fa6-solid:cloud-arrow-up'"
          class="text-4xl"
          :class="isDragging ? 'text-primary' : 'text-gray-400 dark:text-gray-500'"
          aria-hidden="true"
        />
      </div>

      <p v-if="isDragging" class="text-lg font-medium text-primary mb-2">
        {{ t('comments.image_upload.drop_here') }}
      </p>
      <p v-else class="text-lg font-medium mb-2">
        {{ t('comments.image_upload.drag_or_click') }}
      </p>

      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ t('comments.image_upload.file_types') }}
      </p>
      <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
        {{ t('comments.image_upload.paste_hint') }}
      </p>

      <!-- NSFW checkbox -->
      <div class="mt-3 flex items-center justify-center gap-2" @click.stop>
        <input
          id="uploader-nsfw-checkbox"
          v-model="isNsfw"
          type="checkbox"
          class="w-5 h-5 min-w-[20px] min-h-[20px] flex-shrink-0 text-red-600 border-2 border-gray-300 dark:border-neutral-500 rounded focus:ring-red-500"
        />
        <label for="uploader-nsfw-checkbox" class="text-sm cursor-pointer">
          <span class="text-red-600 font-medium">{{ t('comments.image_upload.nsfw_label') }}</span>
        </label>
      </div>
    </div>

    <!-- Error message -->
    <div
      v-if="uploadError"
      class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800"
    >
      <p class="text-sm text-red-800 dark:text-red-200">
        <Icon name="fa6-solid:circle-exclamation" class="mr-1" aria-hidden="true" />
        {{ uploadError }}
      </p>
    </div>

    <!-- Uploading progress -->
    <div v-if="isUploading" class="mt-3">
      <div class="w-full image-progress-bg rounded-full h-2">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse"
          style="width: 100%"
        />
      </div>
      <p class="mt-1 text-xs text-center text-gray-500 dark:text-gray-400">
        {{ t('comments.image_upload.uploading') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { useNuxtApp } from '#app'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  const props = defineProps({
    currentImage: {
      type: String,
      default: null,
    },
  })

  const emit = defineEmits(['image-uploaded', 'image-deleted'])

  const { $api } = useNuxtApp()
  const fileInput = ref(null)
  const selectedFile = ref(null)
  const previewUrl = ref(null)
  const currentImageUrl = ref(props.currentImage)
  const isUploading = ref(false)
  const uploadError = ref('')
  const isDragging = ref(false)
  const isNsfw = ref(false)

  watch(
    () => props.currentImage,
    (newVal) => {
      currentImageUrl.value = newVal
    }
  )

  function triggerFileInput() {
    if (fileInput.value) {
      fileInput.value.click()
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return
    processFile(file)
  }

  function processFile(file) {
    uploadError.value = ''

    // Validate file type
    if (!file.type.startsWith('image/')) {
      uploadError.value = t('comments.image_upload.invalid_type')
      return
    }

    // Validate file size (16MB)
    if (file.size > 16 * 1024 * 1024) {
      uploadError.value = t('comments.image_upload.too_large')
      return
    }

    selectedFile.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target.result
    }
    reader.readAsDataURL(file)

    // Auto-upload
    uploadImage()
  }

  // Drag & drop handlers
  function handleDragOver(event) {
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = true
  }

  function handleDragLeave(event) {
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = false
  }

  function handleDrop(event) {
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = false

    const files = event.dataTransfer?.files
    if (!files || files.length === 0) return

    processFile(files[0])
  }

  // Handle paste event to detect images from clipboard
  function handlePaste(event) {
    const clipboardData = event.clipboardData
    if (!clipboardData) return

    const items = clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          // Generate a filename for pasted images
          const filename = `pasted-image-${Date.now()}.${file.type.split('/')[1] || 'png'}`
          const renamedFile = new File([file], filename, { type: file.type })
          processFile(renamedFile)
        }
        return
      }
    }
  }

  async function uploadImage() {
    if (!selectedFile.value) return

    isUploading.value = true
    uploadError.value = ''

    try {
      const formData = new FormData()
      formData.append('image', selectedFile.value, selectedFile.value.name)
      formData.append('is_nsfw', isNsfw.value ? '1' : '0')

      const response = await $api.images.uploadInlineImage(formData)

      // Get image URLs from response
      const imageData = response.data.image

      // Emit the uploaded image data (including is_nsfw flag)
      emit('image-uploaded', {
        urls: imageData.urls,
        url: imageData.urls.url,
        is_nsfw: imageData.urls.is_nsfw,
      })

      // Update current image URL
      currentImageUrl.value = imageData.urls.url
      previewUrl.value = null
    } catch (error) {
      console.error('Error uploading image:', error)
      uploadError.value = error.response?.data?.message || t('comments.image_upload.upload_error')
      previewUrl.value = null
      selectedFile.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    } finally {
      isUploading.value = false
    }
  }

  function removeImage() {
    currentImageUrl.value = null
    previewUrl.value = null
    selectedFile.value = null
    uploadError.value = ''
    isDragging.value = false
    isNsfw.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    emit('image-deleted')
  }
</script>

<style scoped>
  .image-uploader {
    width: 100%;
  }

  .image-preview {
    border: 1px solid var(--color-border-default);
  }

  .upload-area {
    border-color: var(--color-border-default);
  }

  .image-progress-bg {
    background-color: var(--color-border-default);
  }
</style>
