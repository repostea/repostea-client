<template>
  <form class="comment-editor" @submit.prevent="submitComment">
    <!-- Toolbar simplificada -->
    <div
      class="editor-toolbar mb-2 rounded-md flex flex-wrap items-center justify-between"
      :class="isMobile ? 'p-3' : 'p-2'"
    >
      <!-- Herramientas de formato Markdown -->
      <div class="flex items-center space-x-1">
        <button
          v-for="tool in markdownTools"
          :key="tool.label"
          class="editor-tool-btn rounded-md transition-colors touch-manipulation"
          :class="[
            { 'opacity-50 cursor-not-allowed': !canUseEditor },
            isMobile ? 'p-2.5 min-h-[44px] min-w-[44px]' : 'p-1.5',
          ]"
          :title="tool.label"
          :aria-label="tool.label"
          :disabled="!canUseEditor"
          type="button"
          @click="applyFormat(tool.action)"
        >
          <Icon :name="tool.iconify" aria-hidden="true" />
        </button>

        <!-- Markdown help -->
        <button
          type="button"
          class="editor-tool-btn rounded-md transition-colors touch-manipulation"
          :class="isMobile ? 'p-2.5 min-h-[44px] min-w-[44px]' : 'p-1.5'"
          :title="t('comments.editor.markdown_help')"
          :aria-label="t('comments.editor.markdown_help')"
          @click="showMarkdownHelp = !showMarkdownHelp"
        >
          <Icon name="fa6-solid:circle-question" aria-hidden="true" />
        </button>
      </div>

      <!-- Right side tools: image, gif, emoji, preview, help -->
      <div class="flex items-center space-x-1">
        <!-- Image upload button -->
        <button
          type="button"
          class="editor-insert-btn flex items-center gap-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors touch-manipulation"
          :class="[
            { 'opacity-50 cursor-not-allowed': !canUseEditor },
            isMobile ? 'p-2 min-h-[44px]' : 'py-1 px-2',
          ]"
          :title="t('comments.image_upload.title')"
          :aria-label="t('comments.image_upload.title')"
          :disabled="!canUseEditor"
          @click="showImageUpload = !showImageUpload"
        >
          <Icon name="fa6-solid:image" class="text-base text-primary" aria-hidden="true" />
          <span class="flex flex-col items-start leading-none">
            <span class="text-[10px]">{{ t('comments.editor.insert') }}</span>
            <span class="text-[10px]">{{ t('comments.editor.image') }}</span>
          </span>
        </button>

        <!-- GIF picker -->
        <GifPicker
          :button-class="[
            'editor-insert-btn flex items-center gap-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors touch-manipulation',
            { 'opacity-50 cursor-not-allowed': !canUseEditor },
            isMobile ? 'p-2 min-h-[44px]' : 'py-1 px-2',
          ].join(' ')"
          :disabled="!canUseEditor"
          :show-label="true"
          @select="insertGif"
        />

        <!-- Emoji picker -->
        <EmojiPicker
          :button-class="[
            'editor-insert-btn flex items-center gap-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors touch-manipulation',
            { 'opacity-50 cursor-not-allowed': !canUseEditor },
            isMobile ? 'p-2 min-h-[44px]' : 'py-1 px-2',
          ].join(' ')"
          :disabled="!canUseEditor"
          :show-label="true"
          @select="insertEmoji"
        />

        <!-- Preview toggle -->
        <button
          type="button"
          class="editor-insert-btn flex items-center gap-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors touch-manipulation"
          :class="isMobile ? 'p-2 min-h-[44px]' : 'py-1 px-2'"
          :title="showPreview ? t('comments.editor.edit') : t('comments.editor.preview')"
          :aria-label="showPreview ? t('comments.editor.edit') : t('comments.editor.preview')"
          @click="showPreview = !showPreview"
        >
          <Icon :name="showPreview ? 'fa6-solid:pen-to-square' : 'fa6-solid:eye'" class="text-base text-primary" aria-hidden="true" />
          <span class="flex flex-col items-start leading-none">
            <span class="text-[10px]">{{ showPreview ? t('comments.editor.edit') : t('comments.editor.preview_action') }}</span>
            <span class="text-[10px]">{{ showPreview ? t('comments.editor.edit_sub') : t('comments.editor.preview_sub') }}</span>
          </span>
        </button>

        <!-- Image upload modal with backdrop -->
        <div
          v-if="showImageUpload"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/50"
            @click="closeImageModal"
          />
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
              @click="closeImageModal"
            >
              <Icon name="fa6-solid:xmark" class="text-text-muted dark:text-text-dark-muted" aria-hidden="true" />
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
                isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
              <label class="block text-sm font-medium mb-1">{{ t('comments.image_upload.alt_text') }}</label>
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
                <span class="text-red-600 font-medium">{{ t('comments.image_upload.nsfw_label') }}</span>
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
              <span v-if="isUploadingImage" class="inline-block animate-spin h-3 w-3 mr-1 border-2 border-white border-t-transparent rounded-full"/>
              <Icon v-else name="fa6-solid:upload" class="mr-1" aria-hidden="true" />
              {{ isUploadingImage ? t('comments.image_upload.uploading') : t('comments.image_upload.upload_insert') }}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de ayuda de Markdown -->
    <div
      v-if="showMarkdownHelp"
      class="editor-help-panel mb-3 p-3 rounded-md text-xs"
    >
      <div class="font-medium mb-2">
        {{ t('comments.markdown_help_title') }}
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <div>
            <code>**{{ t('comments.format_examples.bold_text') }}**</code> →
            <strong>{{ t('comments.format_examples.bold_text') }}</strong>
          </div>
          <div>
            <code>*{{ t('comments.format_examples.italic_text') }}*</code> →
            <em>{{ t('comments.format_examples.italic_text') }}</em>
          </div>
          <div>
            <code>[{{ t('comments.format_examples.link_text') }}](url)</code> →
            <a href="#" class="text-primary">{{ t('comments.format_examples.link_text') }}</a>
          </div>
          <div>
            <code>`{{ t('comments.format_examples.code_text') }}`</code> →
            <code>{{ t('comments.format_examples.code_text') }}</code>
          </div>
        </div>
        <div>
          <div>
            <code>- {{ t('comments.format_examples.list') }}</code> →
            {{ t('comments.format_examples.list') }}
          </div>
          <div>
            <code>1. {{ t('comments.format_examples.numbered') }}</code> →
            {{ t('comments.format_examples.numbered') }}
          </div>
          <div>
            <code>> {{ t('comments.format_examples.quote_text').toLowerCase() }}</code> →
            {{ t('comments.format_examples.quote_text').toLowerCase() }}
          </div>
          <div>
            <code>@{{ t('comments.format_examples.user') }}</code> →
            {{ t('comments.format_examples.mention') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Editor / Vista previa -->
    <div class="relative">
      <textarea
        v-show="!showPreview"
        ref="commentTextarea"
        v-model="content"
        class="editor-textarea w-full rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none overflow-hidden"
        :class="[
          { 'border-red-500': error, 'opacity-50 cursor-not-allowed': !canUseEditor },
          isMobile ? 'p-4 text-base' : 'p-3 text-sm',
        ]"
        :style="{ minHeight: isMobile ? '100px' : '80px' }"
        rows="4"
        :placeholder="placeholder"
        :aria-label="placeholder"
        :disabled="!canUseEditor"
        required
        @input="handleTextareaInput"
        @keydown="handleKeydown"
        @paste="handlePaste"
      />

      <!-- Dropdown inline de menciones -->
      <div
        v-if="showInlineMentions && searchedUsers.length > 0"
        class="editor-mentions-dropdown absolute z-10 rounded-md shadow-lg max-h-48 overflow-y-auto min-w-[200px] max-w-[300px]"
        :style="{ left: mentionDropdownLeft + 'px', top: mentionDropdownTop + 'px' }"
      >
        <div
          v-for="(user, index) in searchedUsers"
          :key="user.id"
          class="editor-mention-item px-3 py-2 cursor-pointer flex items-center"
          :class="{ 'editor-mention-item-active': index === selectedUserIndex }"
          @click="selectUserFromDropdown(user)"
        >
          <NuxtImg
            v-if="user.avatar"
            :src="user.avatar"
            :alt="user.username"
            width="24"
            height="24"
            loading="lazy"
            class="w-6 h-6 rounded-full mr-2"
          />
          <div v-else class="editor-avatar-placeholder w-6 h-6 rounded-full mr-2 flex items-center justify-center">
            <Icon name="fa6-solid:user" class="text-xs text-text-muted dark:text-text-dark-muted" aria-hidden="true" />
          </div>
          <span class="text-sm">@{{ user.username }}</span>
        </div>
      </div>

      <!-- Vista previa -->
      <div
        v-show="showPreview"
        class="editor-preview w-full min-h-[120px] rounded-md p-3 overflow-auto"
      >
        <div
          v-if="content.trim()"
          class="prose dark:prose-invert prose-sm max-w-none"
          v-html="previewContent"
        />
        <div v-else class="text-text-muted dark:text-text-dark-muted italic">
          {{ t('comments.comment') }} {{ t('common.loading') }}
        </div>
      </div>
    </div>

    <!-- Embed detection preview -->
    <EmbedPreview
      v-if="showEmbedPreview"
      :embed="firstEmbed"
      class="mt-2"
      @insert-embed="handleInsertEmbed"
      @insert-link="handleInsertLink"
      @dismiss="handleDismissEmbed"
    />

    <div class="flex justify-between items-center mt-2 text-xs">
      <div :class="characterCountClass">
        {{ characterCount }}/5000 {{ t('common.characters') }}
        <span v-if="characterCount > 4500" class="text-orange-500 dark:text-orange-400 ml-1">
          ({{ 5000 - characterCount }} {{ t('comments.validation.remaining_characters') }})
        </span>
      </div>
      <a
        href="https://www.markdownguide.org/basic-syntax/"
        target="_blank"
        class="hover:underline hidden sm:inline-block text-gray-500 dark:text-gray-400"
      >
        {{ t('comments.markdown_guide') }}
      </a>
    </div>

    <p v-if="error" class="text-red-500 text-sm mt-1 mb-2">{{ error }}</p>
    <p v-if="characterCount >= 5000" class="text-red-500 text-sm mt-1 mb-2">
      {{ t('comments.validation.content_max') }}
    </p>

    <!-- Botones de acción -->
    <div v-if="!hideSubmitButton" class="flex items-center justify-between mt-4">
      <slot name="cancel-button">
        <button
          v-if="showCancel"
          type="button"
          :disabled="isSubmitting"
          class="comment-cancel-btn rounded-md transition-colors touch-manipulation"
          :class="isMobile ? 'px-6 py-3 text-base min-h-[44px]' : 'px-4 py-2'"
          @click="emit('cancel')"
        >
          {{ t('common.cancel') }}
        </button>
        <span v-else/>
      </slot>
      <button
        type="submit"
        :disabled="isSubmitting || !content.trim() || characterCount >= 5000"
        class="bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        :class="isMobile ? 'px-6 py-3 text-base min-h-[44px]' : 'px-4 py-2'"
      >
        <span
          v-if="isSubmitting"
          class="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
        />
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
  import { ref, computed, nextTick, watch } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { marked } from 'marked'
  import { configureMarked, processLargeEmojis } from '~/utils/markdown'
  import DOMPurify from 'dompurify'
  import { useAuthStore } from '~/stores/auth'
  import { useMobileDetection } from '~/composables/useMobileDetection'
  import { useEmbedDetection } from '~/composables/useEmbedDetection'
  import EmojiPicker from '~/components/common/EmojiPicker.vue'
  import GifPicker from '~/components/common/GifPicker.vue'
  import EmbedPreview from '~/components/media/EmbedPreview.vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const authStore = useAuthStore()
  const { isMobile } = useMobileDetection()
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isGuestUser = computed(
    () => authStore.user?.is_guest || localStorage.getItem('guest_user') === 'true'
  )

  const props = defineProps({
    placeholder: {
      type: String,
      default: 'Escribe tu comentario...',
    },
    submitLabel: {
      type: String,
      default: 'Comentar',
    },
    rows: {
      type: Number,
      default: 8,
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
    parentId: {
      type: [Number, String, null],
      default: null,
    },
    postId: {
      type: [Number, String],
      default: null,
    },
    postAuthor: {
      type: Object,
      default: null,
    },
    availableComments: {
      type: Array,
      default: () => [],
    },
    hideSubmitButton: {
      type: Boolean,
      default: false,
    },
    showCancel: {
      type: Boolean,
      default: false,
    },
    showAnonymousToggle: {
      type: Boolean,
      default: true,
    },
    initialContent: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['submit', 'input', 'cancel'])

  // Editor state
  const content = ref(props.initialContent || '')

  // Embed detection
  const { firstEmbed, hasEmbeds } = useEmbedDetection(content)
  const dismissedEmbed = ref(null)
  const showEmbedPreview = computed(() => {
    if (!hasEmbeds.value || !firstEmbed.value) return false
    // Don't show if user dismissed this exact URL
    if (dismissedEmbed.value === firstEmbed.value.url) return false
    return true
  })

  // Emit input event when content changes
  watch(content, (newValue) => {
    emit('input', newValue)
  })

  // Watch for initialContent changes
  watch(() => props.initialContent, (newValue) => {
    if (newValue !== undefined) {
      content.value = newValue
    }
  })
  const commentTextarea = ref(null)
  const showPreview = ref(false)
  const showMarkdownHelp = ref(false)

  // Computed property to check if user can interact with the editor
  const canUseEditor = computed(() => isAuthenticated.value || isGuestUser.value)

  // Modal states
  const searchedUsers = ref([])
  const isSearchingUsers = ref(false)

  // States for inline mentions dropdown
  const showInlineMentions = ref(false)
  const mentionStartPos = ref(0)
  const mentionDropdownLeft = ref(0)
  const mentionDropdownTop = ref(0)
  const selectedUserIndex = ref(0)

  // Simplified formatting tools
  const markdownTools = [
    { label: 'Bold', iconify: 'fa6-solid:bold', action: 'bold' },
    { label: 'Italic', iconify: 'fa6-solid:italic', action: 'italic' },
    { label: 'Link', iconify: 'fa6-solid:link', action: 'link' },
    { label: 'List', iconify: 'fa6-solid:list-ul', action: 'list' },
    { label: 'Quote', iconify: 'fa6-solid:quote-right', action: 'quote' },
    { label: 'Code', iconify: 'fa6-solid:code', action: 'code' },
  ]

  // Image upload state
  const fileInput = ref(null)
  const showImageUpload = ref(false)
  const imageAlt = ref('')
  const imageIsNsfw = ref(false)
  const selectedFile = ref(null)
  const imagePreviewUrl = ref(null)
  const isUploadingImage = ref(false)
  const uploadError = ref('')
  const isDragging = ref(false)

  // Computed properties
  const characterCount = computed(() => {
    return content.value ? content.value.length : 0
  })

  const characterCountClass = computed(() => {
    const count = characterCount.value
    if (count >= 5000) {
      return 'text-red-600 dark:text-red-400 font-medium'
    } else if (count > 4500) {
      return 'text-orange-600 dark:text-orange-400 font-medium'
    } else if (count > 4000) {
      return 'text-yellow-600 dark:text-yellow-400'
    } else {
      return 'text-gray-500 dark:text-gray-400'
    }
  })

  const previewContent = computed(() => {
    if (!content.value.trim()) return ''

    try {
      // Process mentions and citations as in CommentItem
      const mentions = []
      const citations = []

      let processedContent = content.value.replace(/@([a-zA-Z0-9_-]+)/g, (match, username) => {
        const placeholder = `__MENTION_${mentions.length}__`
        mentions.push({ username })
        return placeholder
      })

      processedContent = processedContent.replace(
        /#comment-(\d+)\s+\(([^:]+):\s+"([^"]+)"\)/g,
        (match, commentId, username, preview) => {
          const placeholder = `__CITATION_${citations.length}__`
          citations.push({ commentId, username, preview })
          return placeholder
        }
      )

      // Process large emoji syntax (::emoji:: and :::emoji:::)
      processedContent = processLargeEmojis(processedContent)

      // Configure marked with optimized image renderer
      configureMarked()
      let formattedContent = marked.parse(processedContent)
      // Note: span is needed for NSFW image blur containers
      formattedContent = DOMPurify.sanitize(formattedContent, {
        ALLOWED_TAGS: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'p',
          'br',
          'strong',
          'em',
          'u',
          'del',
          'a',
          'ul',
          'ol',
          'li',
          'blockquote',
          'pre',
          'code',
          'hr',
          'img',
          'span',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'loading', 'data-original-src'],
        FORBID_ATTR: [
          'onerror',
          'onload',
          'onclick',
          'onmouseover',
          'onfocus',
          'onblur',
          'onchange',
          'onsubmit',
        ],
        FORBID_TAGS: [
          'script',
          'object',
          'embed',
          'iframe',
          'form',
          'input',
          'textarea',
          'button',
        ],
      })

      // Restore mentions and citations (account for markdown processing)
      mentions.forEach((mention, index) => {
        const placeholder = `__MENTION_${index}__`
        const strongPlaceholder = `<strong>MENTION_${index}</strong>`
        const userPath = localePath(`/u/${mention.username}`)
        const html = `<a href="${userPath}" class="text-primary hover:underline">@${mention.username}</a>`
        formattedContent = formattedContent.replace(placeholder, html)
        formattedContent = formattedContent.replace(strongPlaceholder, html)
      })

      citations.forEach((citation, index) => {
        const placeholder = `__CITATION_${index}__`
        const strongPlaceholder = `<strong>CITATION_${index}</strong>`
        const html = `<a href="#comment-${citation.commentId}" class="text-primary hover:underline">#comment-${citation.commentId}</a> <span class="text-gray-500">(${citation.username}: "${citation.preview}")</span>`
        formattedContent = formattedContent.replace(placeholder, html)
        formattedContent = formattedContent.replace(strongPlaceholder, html)
      })

      return formattedContent
    } catch (error) {
      console.error('Error rendering preview:', error)
      return content.value
    }
  })

  // Editor functions
  function applyFormat(action) {
    if (!commentTextarea.value) return

    const textarea = commentTextarea.value
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const selectedText = content.value.substring(selectionStart, selectionEnd)
    const beforeSelection = content.value.substring(0, selectionStart)
    const afterSelection = content.value.substring(selectionEnd)

    let replacement = ''
    let placeholderStart = 0
    let placeholderEnd = 0

    switch (action) {
      case 'bold':
        if (selectedText) {
          replacement = `**${selectedText}**`
        } else {
          const placeholder = t('comments.format_examples.bold_text')
          replacement = `**${placeholder}**`
          placeholderStart = 2
          placeholderEnd = 2 + placeholder.length
        }
        break
      case 'italic':
        if (selectedText) {
          replacement = `*${selectedText}*`
        } else {
          const placeholder = t('comments.format_examples.italic_text')
          replacement = `*${placeholder}*`
          placeholderStart = 1
          placeholderEnd = 1 + placeholder.length
        }
        break
      case 'link':
        if (selectedText) {
          replacement = `[${selectedText}](url)`
        } else {
          const placeholder = t('comments.format_examples.link_text')
          replacement = `[${placeholder}](url)`
          placeholderStart = 1
          placeholderEnd = 1 + placeholder.length
        }
        break
      case 'list':
        if (selectedText) {
          replacement = selectedText
            .split('\n')
            .map((line) => `- ${line}`)
            .join('\n')
        } else {
          const placeholder = t('comments.format_examples.list_item')
          replacement = `- ${placeholder}`
          placeholderStart = 2
          placeholderEnd = 2 + placeholder.length
        }
        break
      case 'quote':
        if (selectedText) {
          replacement = selectedText
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')
        } else {
          const placeholder = t('comments.format_examples.quote_text')
          replacement = `> ${placeholder}`
          placeholderStart = 2
          placeholderEnd = 2 + placeholder.length
        }
        break
      case 'code':
        if (selectedText) {
          replacement = `\`${selectedText}\``
        } else {
          const placeholder = t('comments.format_examples.code_text')
          replacement = `\`${placeholder}\``
          placeholderStart = 1
          placeholderEnd = 1 + placeholder.length
        }
        break
      default:
        replacement = selectedText
    }

    content.value = beforeSelection + replacement + afterSelection

    // Restore focus and select placeholder if no text was selected
    nextTick(() => {
      textarea.focus()
      if (selectedText) {
        // If there was selected text, cursor at the end
        const newCursorPosition = beforeSelection.length + replacement.length
        textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      } else {
        // If there was no text, select the placeholder for easy replacement
        const start = beforeSelection.length + placeholderStart
        const end = beforeSelection.length + placeholderEnd
        textarea.setSelectionRange(start, end)
      }
    })
  }

  function insertEmoji(emoji) {
    if (!commentTextarea.value) return

    const textarea = commentTextarea.value
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const beforeSelection = content.value.substring(0, selectionStart)
    const afterSelection = content.value.substring(selectionEnd)

    content.value = beforeSelection + emoji + afterSelection

    // Restore focus and cursor position
    nextTick(() => {
      textarea.focus()
      const newCursorPosition = beforeSelection.length + emoji.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    })
  }

  function insertGif(url, title) {
    if (!commentTextarea.value) return

    const textarea = commentTextarea.value
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const beforeSelection = content.value.substring(0, selectionStart)
    const afterSelection = content.value.substring(selectionEnd)

    // Insert as markdown image
    const altText = title || 'GIF'
    const gifMarkdown = `![${altText}](${url})`

    content.value = beforeSelection + gifMarkdown + afterSelection

    // Restore focus and cursor position
    nextTick(() => {
      textarea.focus()
      const newCursorPosition = beforeSelection.length + gifMarkdown.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      autoResizeTextarea(textarea)
    })
  }

  // Generate preview URL for selected file
  function generatePreview(file) {
    // Clean up previous preview URL
    if (imagePreviewUrl.value) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = URL.createObjectURL(file)
  }

  // Image upload functions
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

      // Use medium size URL for inline images
      const uploadedImageUrl = response.data.image.urls.medium
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
    const textarea = commentTextarea.value
    if (!textarea) return

    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const beforeSelection = content.value.substring(0, selectionStart)
    const afterSelection = content.value.substring(selectionEnd)

    // Add {nsfw} marker after alt text for NSFW images
    const altWithMarker = isNsfw ? `${alt}{nsfw}` : alt
    const imageMarkdown = `![${altWithMarker}](${url})`

    content.value = beforeSelection + imageMarkdown + afterSelection

    nextTick(() => {
      textarea.focus()
      const newCursorPosition = beforeSelection.length + imageMarkdown.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      autoResizeTextarea(textarea)
    })
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

  function closeImageModal() {
    showImageUpload.value = false
    imageAlt.value = ''
    imageIsNsfw.value = false
    clearSelectedFile()
    uploadError.value = ''
  }

  // Calculate cursor position in textarea
  function getCursorCoordinates(textarea, position) {
    const div = document.createElement('div')
    const style = window.getComputedStyle(textarea)

    // Copy textarea styles to div
    const properties = [
      'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
      'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
      'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing',
      'tabSize', 'whiteSpace', 'wordBreak', 'wordWrap'
    ]

    properties.forEach(prop => {
      div.style[prop] = style[prop]
    })

    div.style.position = 'absolute'
    div.style.visibility = 'hidden'
    div.style.whiteSpace = 'pre-wrap'
    div.style.wordWrap = 'break-word'

    document.body.appendChild(div)

    // Text up to cursor
    const textBeforeCursor = textarea.value.substring(0, position)
    div.textContent = textBeforeCursor

    // Create span to measure exact position
    const span = document.createElement('span')
    span.textContent = textarea.value.substring(position) || '.'
    div.appendChild(span)

    const coordinates = {
      top: span.offsetTop,
      left: span.offsetLeft,
      height: parseInt(style.lineHeight)
    }

    document.body.removeChild(div)

    return coordinates
  }

  // Auto-resize textarea
  function autoResizeTextarea(textarea) {
    if (!textarea) return
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set the height to scrollHeight (content height)
    const maxHeight = isMobile.value ? 400 : 300
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = newHeight + 'px'
    // If content exceeds max, allow scrolling
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  // Detectar @ para autocompletar menciones inline
  async function handleTextareaInput(event) {
    const textarea = event.target

    // Auto-resize
    autoResizeTextarea(textarea)

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.value.substring(0, cursorPos)

    // Check if there's an @ before cursor without spaces after
    const match = textBeforeCursor.match(/@(\w*)$/)

    if (match) {
      // Found @ + text (or just @)
      const searchQuery = match[1] // Text after @
      const atPosition = cursorPos - match[0].length // Position of @
      mentionStartPos.value = atPosition + 1 // Position right after @

      // Calculate exact cursor position
      const coords = getCursorCoordinates(textarea, atPosition)
      mentionDropdownLeft.value = coords.left
      mentionDropdownTop.value = coords.top + coords.height + 5 // 5px margin

      if (searchQuery.length >= 1) {
        // Search users with the query
        try {
          isSearchingUsers.value = true
          const { $api } = useNuxtApp()
          const response = await $api.users.searchUsers(searchQuery)
          searchedUsers.value = response.data?.data || response.data || []
          showInlineMentions.value = searchedUsers.value.length > 0
          selectedUserIndex.value = 0
        } catch (error) {
          console.error('Error searching for users:', error)
          searchedUsers.value = []
          showInlineMentions.value = false
        } finally {
          isSearchingUsers.value = false
        }
      } else {
        // Only @ without text, show relevant users from post (users who have commented)
        const relevantUsers = getRelevantUsersFromComments()
        if (relevantUsers.length > 0) {
          searchedUsers.value = relevantUsers
          showInlineMentions.value = true
          selectedUserIndex.value = 0
        } else {
          showInlineMentions.value = false
        }
      }
    } else {
      // No active @, close dropdown
      showInlineMentions.value = false
    }
  }

  // Get unique users who have commented on the post + post author
  function getRelevantUsersFromComments() {
    const uniqueUsers = new Map()

    // Add post author first (if exists and is not guest)
    if (props.postAuthor && !props.postAuthor.is_guest) {
      uniqueUsers.set(props.postAuthor.id, {
        id: props.postAuthor.id,
        username: props.postAuthor.username,
        avatar: props.postAuthor.avatar,
      })
    }

    // Extract users from comments
    if (props.availableComments && props.availableComments.length > 0) {
      function extractUsers(comments) {
        for (const comment of comments) {
          if (comment.user && !comment.user.is_guest) {
            uniqueUsers.set(comment.user.id, {
              id: comment.user.id,
              username: comment.user.username,
              avatar: comment.user.avatar,
            })
          }
          // Recursively process replies
          if (comment.replies && comment.replies.length > 0) {
            extractUsers(comment.replies)
          }
        }
      }

      extractUsers(props.availableComments)
    }

    // Convert Map to array and limit to 10 users
    return Array.from(uniqueUsers.values()).slice(0, 10)
  }

  // Handle keys in textarea
  function handleKeydown(event) {
    if (!showInlineMentions.value) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedUserIndex.value = Math.min(selectedUserIndex.value + 1, searchedUsers.value.length - 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedUserIndex.value = Math.max(selectedUserIndex.value - 1, 0)
    } else if (event.key === 'Enter' && searchedUsers.value.length > 0) {
      event.preventDefault()
      selectUserFromDropdown(searchedUsers.value[selectedUserIndex.value])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      showInlineMentions.value = false
    }
  }

  // Select user from dropdown
  function selectUserFromDropdown(user) {
    const textarea = commentTextarea.value
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.value.substring(0, mentionStartPos.value)
    const textAfterCursor = content.value.substring(cursorPos)

    // Replace from where @ started to current cursor
    content.value = textBeforeCursor + user.username + ' ' + textAfterCursor

    // Position cursor after username + space
    nextTick(() => {
      const newCursorPos = textBeforeCursor.length + user.username.length + 1
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    })

    // Close dropdown
    showInlineMentions.value = false
    searchedUsers.value = []
  }



  // Enviar comentario
  function submitComment() {
    const trimmed = content.value.trim()
    if (!trimmed) return

    const commentData = {
      content: trimmed,
      parentId: props.parentId,
    }

    // Always mark as anonymous if not authenticated (no custom name)
    if (!isAuthenticated.value) {
      commentData.isAnonymous = true
    }

    emit('submit', commentData)
  }

  // Embed handling functions
  function handleInsertEmbed() {
    if (!firstEmbed.value) return

    const embed = firstEmbed.value
    // For now, embeds are inserted as-is (the URL) and will be rendered by the comment display
    // The embed metadata is stored in the content as a special syntax
    // Format: [embed:provider:url]
    const embedSyntax = `[embed:${embed.provider.toLowerCase().replace(/[^a-z0-9]/g, '')}](${embed.url})`

    // Replace the raw URL with embed syntax
    content.value = content.value.replace(embed.url, embedSyntax)
    dismissedEmbed.value = embed.url
  }

  function handleInsertLink() {
    // Keep as regular link (markdown format)
    if (!firstEmbed.value) return

    const embed = firstEmbed.value
    const linkSyntax = `[${embed.provider}](${embed.url})`

    // Replace the raw URL with markdown link
    content.value = content.value.replace(embed.url, linkSyntax)
    dismissedEmbed.value = embed.url
  }

  function handleDismissEmbed() {
    if (firstEmbed.value) {
      dismissedEmbed.value = firstEmbed.value.url
    }
  }

  // Resetear formulario
  function reset() {
    content.value = ''
    showPreview.value = false
    showMarkdownHelp.value = false
    dismissedEmbed.value = null

    nextTick(() => {
      // Reset textarea height
      if (commentTextarea.value) {
        commentTextarea.value.style.height = 'auto'
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    })
  }

  // Focus the textarea
  function focus() {
    if (commentTextarea.value) {
      commentTextarea.value.focus()
    }
  }

  // Exponer funciones
  defineExpose({
    reset,
    submit: submitComment,
    submitComment,
    focus,
  })
</script>

<style scoped>
  .prose {
    max-width: 100%;
  }

  .prose img {
    max-width: 100%;
    height: auto;
    margin: 0.5rem 0;
    border-radius: 0.25rem;
  }

  .prose h1,
  .prose h2,
  .prose h3 {
    font-weight: 600;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .prose p {
    margin-bottom: 0.5rem;
  }

  .prose ul,
  .prose ol {
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
    padding-left: 1.25rem;
  }

  .prose blockquote {
    border-left: 3px solid var(--color-border-default);
    padding-left: 0.75rem;
    font-style: italic;
    margin: 0.5rem 0;
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

  .prose blockquote {
    border-left-color: var(--color-border-strong);
  }

  /* Editor toolbar */
  .editor-toolbar {
    background-color: var(--color-bg-hover);
  }

  .editor-tool-btn:hover {
    background-color: var(--color-bg-active);
  }

  /* Help panel */
  .editor-help-panel {
    background-color: var(--color-bg-hover);
    border: 1px solid var(--color-border-default);
  }

  /* Textarea */
  .editor-textarea {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  /* Mentions dropdown */
  .editor-mentions-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .editor-mention-item:hover {
    background-color: var(--color-bg-hover);
  }

  .editor-mention-item-active {
    background-color: var(--color-bg-hover);
  }

  .editor-avatar-placeholder {
    background-color: var(--color-bg-hover);
  }

  /* Preview */
  .editor-preview {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  /* Image upload modal */
  .editor-image-modal {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .editor-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .editor-upload-btn {
    border-color: var(--color-border-default);
  }

  .editor-upload-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .editor-cancel-btn {
    background-color: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .editor-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  /* Dropzone */
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
