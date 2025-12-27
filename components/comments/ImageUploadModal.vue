<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="$emit('update:modelValue', false)" />
      <!-- Modal content -->
      <div
        class="editor-image-modal relative rounded-md shadow-lg p-4 w-[min(400px,calc(100vw-2rem))] max-h-[80vh] overflow-y-auto"
        @click.stop
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold">{{ t('comments.image_upload.title') }}</h3>
          <button
            class="editor-tool-btn p-1 rounded-md transition-colors"
            type="button"
            :title="t('common.close')"
            :aria-label="t('common.close')"
            @click="closeModal"
          >
            <Icon
              name="fa6-solid:xmark"
              class="text-text-muted dark:text-text-dark-muted"
              aria-hidden="true"
            />
          </button>
        </div>

        <!-- Upload content with drop zone -->
        <div class="space-y-3">
          <!-- Image preview when file is selected -->
          <div v-if="imagePreviewUrl" class="relative">
            <img
              :src="imagePreviewUrl"
              :alt="t('comments.image_upload.preview')"
              class="w-full max-h-48 object-contain rounded-md bg-gray-100 dark:bg-neutral-800"
            >
            <button
              type="button"
              class="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              :title="t('common.delete')"
              @click="clearSelectedFile"
            >
              <Icon name="fa6-solid:xmark" class="text-sm" aria-hidden="true" />
            </button>
          </div>

          <!-- Drop zone (hidden when preview is shown) -->
          <div
            v-else
            class="editor-dropzone rounded-md border-2 border-dashed transition-all"
            :class="[
              isDragging ? 'border-primary bg-primary/10' : 'border-default',
              isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ]"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            @click="!isUploading && triggerFileInput()"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="hidden"
              @change="handleFileSelect"
            >
            <div class="flex flex-col items-center justify-center py-6 px-4 text-center">
              <Icon
                :name="isDragging ? 'fa6-solid:cloud-arrow-down' : 'fa6-solid:cloud-arrow-up'"
                class="text-3xl mb-2 text-text-muted dark:text-text-dark-muted"
                :class="{ 'text-primary': isDragging }"
                aria-hidden="true"
              />
              <p v-if="isDragging" class="text-sm text-primary font-medium">
                {{ t('comments.image_upload.drop_here') }}
              </p>
              <p v-else class="text-sm text-text-muted dark:text-text-dark-muted">
                {{ t('comments.image_upload.drag_or_click') }}
              </p>
              <p class="mt-1 text-xs text-text-muted dark:text-text-dark-muted">
                {{ t('comments.image_upload.file_types') }}
              </p>
            </div>
          </div>

          <div v-if="uploadError" class="text-sm text-red-600 dark:text-red-400">
            <Icon name="fa6-solid:circle-exclamation" class="mr-1" aria-hidden="true" />
            {{ uploadError }}
          </div>

          <div v-if="selectedFile && !uploadError">
            <label class="block text-sm font-medium mb-1">{{
              t('comments.image_upload.alt_text')
            }}</label>
            <input
              v-model="imageAlt"
              type="text"
              class="editor-input w-full text-sm rounded-md px-2 py-1"
              :placeholder="t('comments.image_upload.alt_placeholder')"
            >
          </div>

          <!-- NSFW checkbox -->
          <div v-if="selectedFile && !uploadError" class="flex items-center gap-2">
            <input
              id="image-nsfw-checkbox"
              v-model="imageIsNsfw"
              type="checkbox"
              class="w-5 h-5 min-w-[20px] min-h-[20px] flex-shrink-0 text-red-600 border-2 border-gray-300 dark:border-neutral-500 rounded focus:ring-red-500"
            >
            <label for="image-nsfw-checkbox" class="text-sm">
              <span class="text-red-600 font-medium">{{
                t('comments.image_upload.nsfw_label')
              }}</span>
              <span class="text-text-muted dark:text-text-dark-muted ml-1 text-xs">
                {{ t('comments.image_upload.nsfw_hint') }}
              </span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-2 mt-4">
          <button
            class="editor-cancel-btn px-3 py-1.5 text-sm rounded-md"
            type="button"
            @click="closeModal"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            :disabled="!selectedFile || isUploading"
            class="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            @click="uploadImage"
          >
            <span
              v-if="isUploading"
              class="inline-block animate-spin h-3 w-3 mr-1 border-2 border-white border-t-transparent rounded-full"
            />
            <Icon v-else name="fa6-solid:upload" class="mr-1" aria-hidden="true" />
            {{
              isUploading
                ? t('comments.image_upload.uploading')
                : t('comments.image_upload.upload_insert')
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from '#i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  initialFile: {
    type: [File, null],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'upload'])

// State
const fileInput = ref(null)
const selectedFile = ref(null)
const imagePreviewUrl = ref(null)
const imageAlt = ref('')
const imageIsNsfw = ref(false)
const isUploading = ref(false)
const uploadError = ref('')
const isDragging = ref(false)

// Watch for initial file (from paste)
watch(
  () => props.initialFile,
  (file) => {
    if (file) {
      selectedFile.value = file
      generatePreview(file)
    }
  },
  { immediate: true }
)

// Generate preview URL for selected file
function generatePreview(file) {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imagePreviewUrl.value = URL.createObjectURL(file)
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  uploadError.value = ''

  if (!file.type.startsWith('image/')) {
    uploadError.value = t('comments.image_upload.invalid_type')
    return
  }

  if (file.size > 16 * 1024 * 1024) {
    uploadError.value = t('comments.image_upload.too_large')
    return
  }

  selectedFile.value = file
  generatePreview(file)
}

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

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

  const file = files[0]
  if (!file.type.startsWith('image/')) {
    uploadError.value = t('comments.image_upload.invalid_type')
    return
  }

  if (file.size > 16 * 1024 * 1024) {
    uploadError.value = t('comments.image_upload.too_large')
    return
  }

  uploadError.value = ''
  selectedFile.value = file
  generatePreview(file)
}

async function uploadImage() {
  if (!selectedFile.value) return

  isUploading.value = true
  uploadError.value = ''

  try {
    const { $api } = useNuxtApp()
    const formData = new FormData()
    formData.append('image', selectedFile.value, selectedFile.value.name)
    formData.append('is_nsfw', imageIsNsfw.value ? '1' : '0')

    const response = await $api.images.uploadInlineImage(formData)

    const uploadedImageUrl = response.data.image.urls.url
    const isNsfw = response.data.image.urls.is_nsfw
    const altText = imageAlt.value || t('comments.image_upload.default_alt')

    emit('upload', { url: uploadedImageUrl, alt: altText, isNsfw })
    closeModal()
  } catch (error) {
    console.error('Error uploading image:', error)
    uploadError.value = error.response?.data?.message || t('comments.image_upload.upload_error')
  } finally {
    isUploading.value = false
  }
}

function clearSelectedFile() {
  selectedFile.value = null
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = null
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function closeModal() {
  emit('update:modelValue', false)
  imageAlt.value = ''
  imageIsNsfw.value = false
  clearSelectedFile()
  uploadError.value = ''
}
</script>

<style scoped>
.editor-image-modal {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
}

.editor-tool-btn:hover {
  background-color: var(--color-bg-active);
}

.editor-input {
  background-color: var(--color-bg-input);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
}

.editor-cancel-btn {
  background-color: transparent;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
}

.editor-cancel-btn:hover {
  background-color: var(--color-bg-hover);
}

.editor-dropzone {
  border-color: var(--color-border-default);
}

.editor-dropzone:hover {
  border-color: var(--color-primary);
  background-color: var(--color-bg-hover);
}

.border-default {
  border-color: var(--color-border-default);
}
</style>
