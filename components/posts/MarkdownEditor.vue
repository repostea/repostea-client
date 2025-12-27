<template>
  <div class="markdown-editor" :class="{ 'fullscreen-editor': isFullscreen }">
    <!-- Exit fullscreen bar (visible only in fullscreen mode) -->
    <div
      v-if="isFullscreen"
      class="flex items-center justify-end px-3 py-2 bg-gray-100 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
        @click="toggleFullscreen"
      >
        <Icon name="fa6-solid:compress" class="text-sm" aria-hidden="true" />
        {{ t('posts.exit_fullscreen') }}
      </button>
    </div>

    <div class="md-editor-toolbar p-2 rounded-t-md flex flex-wrap items-center justify-between">
      <div class="flex flex-wrap items-center space-x-1">
        <button
          v-for="tool in toolbarItems"
          :key="tool.label"
          class="md-editor-btn p-1.5 rounded-md transition-colors"
          :title="tool.label"
          :aria-label="tool.label"
          type="button"
          @click="applyFormat(tool.action)"
        >
          <Icon :name="tool.icon" aria-hidden="true" />
        </button>
        <button
          class="md-editor-btn p-1.5 rounded-md transition-colors"
          :title="t('comments.image_upload.title')"
          :aria-label="t('comments.image_upload.title')"
          type="button"
          @click="showImageUpload = !showImageUpload"
        >
          <Icon name="fa6-solid:image" aria-hidden="true" />
        </button>

        <!-- Image upload modal with backdrop -->
        <Teleport to="body">
          <div v-if="showImageUpload" class="fixed inset-0 z-50 flex items-center justify-center">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/50" @click="closeImageModal" />
          <!-- Modal content -->
          <div
            class="md-editor-modal relative rounded-md shadow-lg p-4 w-[min(400px,calc(100vw-2rem))] max-h-[80vh] overflow-y-auto"
            @click.stop
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold">{{ t('comments.image_upload.title') }}</h3>
              <button
                class="md-editor-btn p-1 rounded-md transition-colors"
                type="button"
                :title="t('common.close')"
                :aria-label="t('common.close')"
                @click="closeImageModal"
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
                class="md-editor-dropzone rounded-md border-2 border-dashed transition-all"
                :class="[
                  isDragging ? 'border-primary bg-primary/10' : 'border-default',
                  isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                ]"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
                @drop="handleDrop"
                @click="!isUploadingImage && triggerFileInput()"
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
                  class="md-editor-input w-full text-sm rounded-md px-2 py-1"
                  :placeholder="t('comments.image_upload.alt_placeholder')"
                >
              </div>

              <!-- NSFW checkbox -->
              <div v-if="selectedFile && !uploadError" class="flex items-center gap-2">
                <input
                  id="md-image-nsfw-checkbox"
                  v-model="imageIsNsfw"
                  type="checkbox"
                  class="w-5 h-5 min-w-[20px] min-h-[20px] flex-shrink-0 text-red-600 border-2 border-gray-300 dark:border-neutral-500 rounded focus:ring-red-500"
                >
                <label for="md-image-nsfw-checkbox" class="text-sm">
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
                class="md-editor-cancel-btn px-3 py-1.5 text-sm rounded-md"
                type="button"
                @click="closeImageModal"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                :disabled="!selectedFile || isUploadingImage"
                class="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                @click="uploadAndInsertImage"
              >
                <span
                  v-if="isUploadingImage"
                  class="inline-block animate-spin h-3 w-3 mr-1 border-2 border-white border-t-transparent rounded-full"
                />
                <Icon v-else name="fa6-solid:upload" class="mr-1" aria-hidden="true" />
                {{
                  isUploadingImage
                    ? t('comments.image_upload.uploading')
                    : t('comments.image_upload.upload_insert')
                }}
              </button>
            </div>
          </div>
        </div>
        </Teleport>

        <div class="flex items-center space-x-1">
          <EmojiPicker @select="insertEmoji" />
          <button
            class="md-editor-btn p-1.5 rounded-md transition-colors"
            :title="isPreviewActive ? t('comments.editor.edit') : t('comments.editor.preview')"
            :aria-label="isPreviewActive ? t('comments.editor.edit') : t('comments.editor.preview')"
            type="button"
            @click="togglePreview"
          >
            <Icon
              :name="isPreviewActive ? 'fa6-solid:pen-to-square' : 'fa6-solid:eye'"
              aria-hidden="true"
            />
          </button>
          <button
            class="md-editor-btn p-1.5 rounded-md transition-colors"
            :title="isFullscreen ? t('posts.exit_fullscreen') : t('posts.fullscreen')"
            :aria-label="isFullscreen ? t('posts.exit_fullscreen') : t('posts.fullscreen')"
            type="button"
            @click="toggleFullscreen"
          >
            <Icon
              :name="isFullscreen ? 'fa6-solid:compress' : 'fa6-solid:expand'"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div class="hidden sm:block text-xs text-text-muted dark:text-text-dark-muted ml-2">
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          target="_blank"
          class="hover:underline"
        >
          {{ t('comments.markdown_guide') }}
        </a>
      </div>
    </div>

    <div class="relative">
      <textarea
        v-show="!isPreviewActive"
        ref="textarea"
        :value="modelValue"
        class="md-editor-textarea w-full min-h-[250px] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
        :placeholder="t('comments.write')"
        :aria-label="t('comments.write')"
        @input="updateContent"
        @paste="handlePaste"
      />

      <div
        v-show="isPreviewActive"
        class="md-editor-preview w-full min-h-[250px] rounded-md p-3 overflow-auto"
      >
        <div class="prose dark:prose-invert max-w-none" v-html="renderedContent" />
      </div>
    </div>

    <div class="flex justify-between mt-2 text-xs text-text-muted dark:text-text-dark-muted">
      <div>{{ characterCount }} {{ t('common.characters') }}</div>
      <div class="sm:hidden">
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          target="_blank"
          class="hover:underline"
        >
          {{ t('comments.markdown_guide') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onUnmounted } from 'vue'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import { useI18n } from '#i18n'
  import EmojiPicker from '~/components/common/EmojiPicker.vue'

  const { t } = useI18n()

  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const textarea = ref(null)
  const fileInput = ref(null)
  const isPreviewActive = ref(false)
  const showImageUpload = ref(false)
  const imageAlt = ref('')
  const imageIsNsfw = ref(false)
  const isFullscreen = ref(false)
  const selectedFile = ref(null)
  const imagePreviewUrl = ref(null)
  const isUploadingImage = ref(false)
  const uploadError = ref('')
  const isDragging = ref(false)

  const characterCount = computed(() => {
    return props.modelValue ? props.modelValue.length : 0
  })

  const renderedContent = computed(() => {
    if (!props.modelValue) return ''
    const rawHtml = marked.parse(props.modelValue)
    return DOMPurify.sanitize(rawHtml)
  })

  const toolbarItems = [
    { label: t('comments.editor.bold'), icon: 'fa6-solid:bold', action: 'bold' },
    { label: t('comments.editor.italic'), icon: 'fa6-solid:italic', action: 'italic' },
    { label: t('comments.editor.link'), icon: 'fa6-solid:link', action: 'link' },
    { label: t('comments.editor.heading'), icon: 'fa6-solid:heading', action: 'heading' },
    { label: t('comments.editor.list'), icon: 'fa6-solid:list-ul', action: 'list' },
    { label: t('comments.editor.ordered_list'), icon: 'fa6-solid:list-ol', action: 'ordered-list' },
    { label: t('comments.editor.quote'), icon: 'fa6-solid:quote-right', action: 'quote' },
    { label: t('comments.editor.code'), icon: 'fa6-solid:code', action: 'code' },
    { label: t('comments.editor.horizontal_rule'), icon: 'fa6-solid:minus', action: 'hr' },
  ]

  function updateContent(e) {
    emit('update:modelValue', e.target.value)
  }

  function togglePreview() {
    isPreviewActive.value = !isPreviewActive.value
  }

  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
    if (isFullscreen.value) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  function getSelectionInfo() {
    if (!textarea.value) return { selectionStart: 0, selectionEnd: 0, selectedText: '' }

    const selectionStart = textarea.value.selectionStart
    const selectionEnd = textarea.value.selectionEnd
    const selectedText = props.modelValue.substring(selectionStart, selectionEnd)

    return { selectionStart, selectionEnd, selectedText }
  }

  function updateTextarea(beforeSelection, replacement, afterSelection) {
    const newValue = beforeSelection + replacement + afterSelection
    emit('update:modelValue', newValue)
    setTimeout(() => {
      if (textarea.value) {
        const newCursorPosition = beforeSelection.length + replacement.length
        textarea.value.focus()
        textarea.value.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  function applyFormat(action) {
    if (!textarea.value) return

    const { selectionStart, selectionEnd, selectedText } = getSelectionInfo()
    const text = props.modelValue
    const beforeSelection = text.substring(0, selectionStart)
    const afterSelection = text.substring(selectionEnd)

    let replacement = ''

    switch (action) {
      case 'bold':
        replacement = selectedText ? `**${selectedText}**` : '**texto en negrita**'
        break
      case 'italic':
        replacement = selectedText ? `*${selectedText}*` : '*texto en cursiva*'
        break
      case 'link':
        replacement = selectedText ? `[${selectedText}](url)` : '[texto del enlace](url)'
        break
      case 'heading':
        replacement = selectedText ? `## ${selectedText}` : '## Encabezado'
        break
      case 'list':
        replacement = selectedText
          ? selectedText
              .split('\n')
              .map((line) => `- ${line}`)
              .join('\n')
          : '- Elemento 1\n- Elemento 2\n- Elemento 3'
        break
      case 'ordered-list':
        replacement = selectedText
          ? selectedText
              .split('\n')
              .map((line, i) => `${i + 1}. ${line}`)
              .join('\n')
          : '1. Elemento 1\n2. Elemento 2\n3. Elemento 3'
        break
      case 'quote':
        replacement = selectedText
          ? selectedText
              .split('\n')
              .map((line) => `> ${line}`)
              .join('\n')
          : '> Cita'
        break
      case 'code':
        replacement = selectedText ? `\`${selectedText}\`` : '`código`'
        break
      case 'hr':
        replacement = '\n\n---\n\n'
        break
      default:
        replacement = selectedText
    }

    updateTextarea(beforeSelection, replacement, afterSelection)
  }

  function triggerFileInput() {
    if (fileInput.value) {
      fileInput.value.click()
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return
    validateAndSetFile(file)
  }

  // Generate preview URL for selected file
  function generatePreview(file) {
    // Clean up previous preview URL
    if (imagePreviewUrl.value) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = URL.createObjectURL(file)
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

  function validateAndSetFile(file) {
    uploadError.value = ''

    if (!file.type.startsWith('image/')) {
      uploadError.value = t('comments.image_upload.invalid_type')
      return false
    }

    if (file.size > 16 * 1024 * 1024) {
      uploadError.value = t('comments.image_upload.too_large')
      return false
    }

    selectedFile.value = file
    generatePreview(file)
    return true
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

    validateAndSetFile(files[0])
  }

  // Handle paste event to detect images from clipboard
  // Opens modal instead of uploading directly so user can mark as NSFW
  async function handlePaste(event) {
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
          // Open modal with the pasted file so user can mark as NSFW
          selectedFile.value = renamedFile
          generatePreview(renamedFile)
          showImageUpload.value = true
        }
        return
      }
    }
  }

  async function uploadAndInsertImage() {
    if (!selectedFile.value) return

    isUploadingImage.value = true
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

      insertImageMarkdown(uploadedImageUrl, altText, isNsfw)
      closeImageModal()
    } catch (error) {
      console.error('Error uploading image:', error)
      uploadError.value = error.response?.data?.message || t('comments.image_upload.upload_error')
    } finally {
      isUploadingImage.value = false
    }
  }

  function insertImageMarkdown(url, alt, isNsfw = false) {
    const { selectionStart, selectionEnd } = getSelectionInfo()
    const text = props.modelValue
    const beforeSelection = text.substring(0, selectionStart)
    const afterSelection = text.substring(selectionEnd)

    // Add {nsfw} marker after alt text for NSFW images
    const altWithMarker = isNsfw ? `${alt}{nsfw}` : alt
    const imageMarkdown = `![${altWithMarker}](${url})`

    updateTextarea(beforeSelection, imageMarkdown, afterSelection)
  }

  function closeImageModal() {
    showImageUpload.value = false
    imageAlt.value = ''
    imageIsNsfw.value = false
    clearSelectedFile()
    uploadError.value = ''
    isDragging.value = false
  }

  function insertEmoji(emoji) {
    const { selectionStart, selectionEnd } = getSelectionInfo()
    const text = props.modelValue
    const beforeSelection = text.substring(0, selectionStart)
    const afterSelection = text.substring(selectionEnd)

    updateTextarea(beforeSelection, emoji, afterSelection)
  }

  onUnmounted(() => {
    if (import.meta.client) {
      document.body.style.overflow = ''
    }
  })

  defineExpose({
    togglePreview,
    toggleFullscreen,
  })
</script>

<style>
  .prose {
    max-width: 100%;
  }

  .prose img {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
    border-radius: 0.5rem;
  }

  .prose h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }

  .prose h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .prose h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .prose p {
    margin-bottom: 1rem;
  }

  .prose ul,
  .prose ol {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  .prose ul {
    list-style-type: disc;
  }

  .prose ol {
    list-style-type: decimal;
  }

  .prose blockquote {
    border-left: 4px solid var(--color-border-default);
    padding-left: 1rem;
    font-style: italic;
    margin: 1rem 0;
  }

  .prose code {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.1rem 0.25rem;
    border-radius: 0.25rem;
  }

  .prose a {
    color: var(--color-text-link);
    text-decoration: underline;
  }

  .prose hr {
    margin: 1.5rem 0;
    border: 0;
    border-top: 1px solid var(--color-border-default);
  }

  .prose blockquote {
    border-left-color: var(--color-border-strong);
  }

  /* Fullscreen mode */
  .fullscreen-editor {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: var(--color-bg-card);
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .fullscreen-editor textarea {
    flex: 1;
    min-height: auto !important;
    height: 100%;
  }

  .fullscreen-editor .relative {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .fullscreen-editor .w-full.min-h-\[250px\] {
    min-height: auto;
    height: 100%;
  }

  .fullscreen-editor .md-editor-preview {
    flex: 1;
    overflow-y: auto;
    max-height: calc(100vh - 150px);
  }

  /* Editor toolbar */
  .md-editor-toolbar {
    background-color: var(--color-bg-hover);
    border-bottom: 1px solid var(--color-border-default);
  }

  .md-editor-btn:hover {
    background-color: var(--color-bg-active);
  }

  /* Modal */
  .md-editor-modal {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  /* Tabs */
  .md-editor-tabs {
    border-bottom: 1px solid var(--color-border-default);
  }

  .md-editor-tab {
    border-color: transparent;
    color: var(--color-text-muted);
  }

  .md-editor-tab:hover {
    color: var(--color-text-primary);
  }

  .md-editor-tab-active {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* Inputs */
  .md-editor-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .md-editor-upload-btn {
    border-color: var(--color-border-default);
  }

  .md-editor-upload-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .md-editor-cancel-btn {
    background-color: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .md-editor-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  /* Textarea */
  .md-editor-textarea {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  /* Preview */
  .md-editor-preview {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  /* Dropzone */
  .md-editor-dropzone {
    border-color: var(--color-border-default);
  }

  .md-editor-dropzone:hover {
    border-color: var(--color-primary);
    background-color: var(--color-bg-hover);
  }

  .border-default {
    border-color: var(--color-border-default);
  }
</style>
