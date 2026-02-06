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
          :button-class="
            [
              'editor-insert-btn flex items-center gap-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors touch-manipulation',
              { 'opacity-50 cursor-not-allowed': !canUseEditor },
              isMobile ? 'p-2 min-h-[44px]' : 'py-1 px-2',
            ].join(' ')
          "
          :disabled="!canUseEditor"
          :show-label="true"
          @select="insertGif"
        />

        <!-- Emoji picker -->
        <EmojiPicker
          :button-class="
            [
              'editor-insert-btn flex items-center gap-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors touch-manipulation',
              { 'opacity-50 cursor-not-allowed': !canUseEditor },
              isMobile ? 'p-2 min-h-[44px]' : 'py-1 px-2',
            ].join(' ')
          "
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
          <Icon
            :name="showPreview ? 'fa6-solid:pen-to-square' : 'fa6-solid:eye'"
            class="text-base text-primary"
            aria-hidden="true"
          />
          <span class="flex flex-col items-start leading-none">
            <span class="text-[10px]">{{
              showPreview ? t('comments.editor.edit') : t('comments.editor.preview_action')
            }}</span>
            <span class="text-[10px]">{{
              showPreview ? t('comments.editor.edit_sub') : t('comments.editor.preview_sub')
            }}</span>
          </span>
        </button>

        <!-- Image upload modal -->
        <ImageUploadModal
          v-model="showImageUpload"
          :initial-file="pastedImageFile"
          @upload="handleImageUploaded"
        />
      </div>
    </div>

    <!-- Panel de ayuda de Markdown -->
    <MarkdownHelpPanel v-model="showMarkdownHelp" />

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
      <InlineMentionsDropdown
        :show="showInlineMentions"
        :users="searchedUsers"
        :selected-index="selectedUserIndex"
        :left="mentionDropdownLeft"
        :top="mentionDropdownTop"
        @select="selectUserFromDropdown"
      />

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
        <span v-else />
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
  import { ref, computed, nextTick, watch, toRef } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { marked } from 'marked'
  import { configureMarked, processLargeEmojis } from '~/utils/markdown'
  import DOMPurify from 'dompurify'
  import { useAuthStore } from '~/stores/auth'
  import { useMobileDetection } from '~/composables/useMobileDetection'
  import { useEmbedDetection } from '~/composables/useEmbedDetection'
  import { useEditorFormatting, markdownTools } from '~/composables/useEditorFormatting'
  import { useInlineMentions } from '~/composables/useInlineMentions'
  import { useTextareaHelpers } from '~/composables/useTextareaHelpers'
  import EmojiPicker from '~/components/common/EmojiPicker.vue'
  import GifPicker from '~/components/common/GifPicker.vue'
  import EmbedPreview from '~/components/media/EmbedPreview.vue'
  import ImageUploadModal from '~/components/comments/ImageUploadModal.vue'
  import MarkdownHelpPanel from '~/components/comments/MarkdownHelpPanel.vue'
  import InlineMentionsDropdown from '~/components/comments/InlineMentionsDropdown.vue'

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
  watch(
    () => props.initialContent,
    (newValue) => {
      if (newValue !== undefined) {
        content.value = newValue
      }
    }
  )
  const commentTextarea = ref(null)
  const showPreview = ref(false)
  const showMarkdownHelp = ref(false)

  // Computed property to check if user can interact with the editor
  const canUseEditor = computed(() => isAuthenticated.value || isGuestUser.value)

  // Use composables
  const { applyFormat, insertEmoji, insertGif, insertImageMarkdown } = useEditorFormatting(
    content,
    commentTextarea
  )

  const {
    searchedUsers,
    showInlineMentions,
    mentionDropdownLeft,
    mentionDropdownTop,
    selectedUserIndex,
    handleTextareaInput: handleMentionInput,
    handleKeydown: handleMentionKeydown,
    selectUser: selectUserFromDropdown,
  } = useInlineMentions(
    content,
    commentTextarea,
    toRef(props, 'postAuthor'),
    toRef(props, 'availableComments')
  )

  const { autoResizeTextarea } = useTextareaHelpers(isMobile)

  // Image upload state (modal handles upload logic)
  const showImageUpload = ref(false)
  const pastedImageFile = ref(null)

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
        ALLOWED_ATTR: [
          'href',
          'target',
          'rel',
          'class',
          'src',
          'alt',
          'loading',
          'data-original-src',
        ],
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
        FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'button'],
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
          pastedImageFile.value = renamedFile
          showImageUpload.value = true
        }
        return
      }
    }
  }

  // Handle image uploaded from modal
  function handleImageUploaded({ url, alt, isNsfw }) {
    insertImageMarkdown(url, alt, isNsfw)
    pastedImageFile.value = null
  }

  // Handle textarea input (auto-resize + mention detection)
  async function handleTextareaInput(event) {
    const textarea = event.target
    autoResizeTextarea(textarea)
    await handleMentionInput(textarea)
  }

  // Handle keyboard events (mention navigation)
  function handleKeydown(event) {
    handleMentionKeydown(event)
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

  /* Textarea */
  .editor-textarea {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  /* Preview */
  .editor-preview {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }
</style>
