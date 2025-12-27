<template>
  <div class="description-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar p-1.5 rounded-t-md flex flex-wrap items-center gap-0.5">
      <button
        v-for="tool in toolbarItems"
        :key="tool.action"
        class="toolbar-btn p-1.5 rounded transition-colors"
        :title="tool.label"
        :aria-label="tool.label"
        type="button"
        @click="applyFormat(tool.action)"
      >
        <Icon :name="tool.icon" class="text-sm" aria-hidden="true" />
      </button>

      <div class="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

      <EmojiPicker @select="insertEmoji" />

      <div class="flex-grow" />

      <button
        class="toolbar-btn p-1.5 rounded transition-colors"
        :class="{ 'toolbar-btn-active': isPreviewActive }"
        :title="isPreviewActive ? t('comments.editor.edit') : t('comments.editor.preview')"
        :aria-label="isPreviewActive ? t('comments.editor.edit') : t('comments.editor.preview')"
        type="button"
        @click="togglePreview"
      >
        <Icon
          :name="isPreviewActive ? 'fa6-solid:pen-to-square' : 'fa6-solid:eye'"
          class="text-sm"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Editor/Preview area -->
    <div class="relative">
      <textarea
        v-show="!isPreviewActive"
        ref="textareaRef"
        :value="modelValue"
        class="editor-textarea w-full rounded-b-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm resize-none overflow-hidden"
        :class="{ 'border-red-500': error || isOverLimit }"
        :placeholder="placeholder"
        :aria-label="placeholder"
        :style="{ minHeight: minHeight + 'px' }"
        @input="handleInput"
      />

      <div
        v-show="isPreviewActive"
        class="editor-preview w-full rounded-b-md p-3 overflow-auto prose dark:prose-invert max-w-none text-sm"
        :style="{ minHeight: minHeight + 'px' }"
        v-html="renderedContent"
      />
    </div>

    <!-- Footer info -->
    <div class="flex justify-between items-center mt-1.5 text-xs">
      <div class="flex items-center gap-3">
        <span
          :class="isOverCharLimit ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'"
        >
          {{ characterCount }}/{{ props.maxLength }}
        </span>
        <span
          :class="isOverLineLimit ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'"
        >
          {{ lineCount }}/{{ props.maxLines }} {{ t('common.lines') }}
        </span>
      </div>
      <a
        href="https://www.markdownguide.org/basic-syntax/"
        target="_blank"
        rel="noopener"
        class="hover:underline flex items-center gap-1 text-gray-500 dark:text-gray-400"
      >
        <Icon name="fa6-brands:markdown" class="text-sm" aria-hidden="true" />
        {{ t('comments.markdown_supported') }}
      </a>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import { useI18n } from '#i18n'
  import { RESTRICTED_SANITIZE_CONFIG } from '~/utils/markdown'
  import EmojiPicker from '~/components/common/EmojiPicker.vue'

  const { t } = useI18n()

  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
    minHeight: {
      type: Number,
      default: 160,
    },
    maxLength: {
      type: Number,
      default: 800,
    },
    maxLines: {
      type: Number,
      default: 10,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const textareaRef = ref(null)
  const isPreviewActive = ref(false)

  const characterCount = computed(() => props.modelValue?.length || 0)
  const lineCount = computed(() => {
    if (!props.modelValue) return 1
    return (props.modelValue.match(/\n/g) || []).length + 1
  })
  const isOverCharLimit = computed(() => characterCount.value > props.maxLength)
  const isOverLineLimit = computed(() => lineCount.value > props.maxLines)
  const isOverLimit = computed(() => isOverCharLimit.value || isOverLineLimit.value)

  const renderedContent = computed(() => {
    if (!props.modelValue)
      return `<p class="text-gray-400">${t('comments.editor.preview_empty')}</p>`
    const rawHtml = marked.parse(props.modelValue)
    if (import.meta.client) {
      return DOMPurify.sanitize(rawHtml, RESTRICTED_SANITIZE_CONFIG)
    }
    return rawHtml
  })

  const toolbarItems = [
    { label: t('comments.editor.bold'), icon: 'fa6-solid:bold', action: 'bold' },
    { label: t('comments.editor.italic'), icon: 'fa6-solid:italic', action: 'italic' },
    {
      label: t('comments.editor.strikethrough'),
      icon: 'fa6-solid:strikethrough',
      action: 'strikethrough',
    },
    { label: t('comments.editor.link'), icon: 'fa6-solid:link', action: 'link' },
    { label: t('comments.editor.list'), icon: 'fa6-solid:list-ul', action: 'list' },
    { label: t('comments.editor.quote'), icon: 'fa6-solid:quote-right', action: 'quote' },
    { label: t('comments.editor.code'), icon: 'fa6-solid:code', action: 'code' },
  ]

  function handleInput(e) {
    emit('update:modelValue', e.target.value)
    nextTick(() => autoResize())
  }

  function autoResize() {
    const textarea = textareaRef.value
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set to scrollHeight, but respect minHeight
    const newHeight = Math.max(textarea.scrollHeight, props.minHeight)
    textarea.style.height = newHeight + 'px'
  }

  function togglePreview() {
    isPreviewActive.value = !isPreviewActive.value
  }

  function getSelectionInfo() {
    if (!textareaRef.value) return { start: 0, end: 0, text: '' }
    return {
      start: textareaRef.value.selectionStart,
      end: textareaRef.value.selectionEnd,
      text: props.modelValue.substring(
        textareaRef.value.selectionStart,
        textareaRef.value.selectionEnd
      ),
    }
  }

  function insertText(before, after, defaultText = '') {
    const { start, end, text } = getSelectionInfo()
    const content = props.modelValue
    const selectedText = text || defaultText
    const newContent =
      content.substring(0, start) + before + selectedText + after + content.substring(end)

    emit('update:modelValue', newContent)

    nextTick(() => {
      if (textareaRef.value) {
        const newCursorPos = start + before.length + selectedText.length + after.length
        textareaRef.value.focus()
        textareaRef.value.setSelectionRange(newCursorPos, newCursorPos)
        autoResize()
      }
    })
  }

  function applyFormat(action) {
    const { text } = getSelectionInfo()
    const placeholderText = t('comments.editor.placeholder_text')
    const placeholderLink = t('comments.editor.placeholder_link')
    const placeholderCode = t('comments.editor.placeholder_code')

    switch (action) {
      case 'bold':
        insertText('**', '**', text || placeholderText)
        break
      case 'italic':
        insertText('*', '*', text || placeholderText)
        break
      case 'strikethrough':
        insertText('~~', '~~', text || placeholderText)
        break
      case 'link':
        if (text) {
          insertText('[', '](url)', '')
        } else {
          insertText('[', '](url)', placeholderLink)
        }
        break
      case 'list':
        if (text) {
          const lines = text
            .split('\n')
            .map((line) => `- ${line}`)
            .join('\n')
          insertText('', '', lines)
        } else {
          insertText('- ', '', '')
        }
        break
      case 'quote':
        if (text) {
          const lines = text
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')
          insertText('', '', lines)
        } else {
          insertText('> ', '', '')
        }
        break
      case 'code':
        insertText('`', '`', text || placeholderCode)
        break
    }
  }

  function insertEmoji(emoji) {
    const { start, end } = getSelectionInfo()
    const content = props.modelValue
    const newContent = content.substring(0, start) + emoji + content.substring(end)

    emit('update:modelValue', newContent)

    nextTick(() => {
      if (textareaRef.value) {
        const newCursorPos = start + emoji.length
        textareaRef.value.focus()
        textareaRef.value.setSelectionRange(newCursorPos, newCursorPos)
        autoResize()
      }
    })
  }

  // Auto-resize on mount and when value changes externally
  onMounted(() => {
    nextTick(() => autoResize())
  })

  watch(
    () => props.modelValue,
    () => {
      nextTick(() => autoResize())
    }
  )
</script>

<style scoped>
  .editor-toolbar {
    background-color: var(--color-bg-hover);
    border: 1px solid var(--color-border-default);
    border-bottom: none;
  }

  .toolbar-btn {
    color: var(--color-text-muted);
  }

  .toolbar-btn:hover {
    background-color: var(--color-bg-active);
    color: var(--color-text-primary);
  }

  .toolbar-btn-active {
    background-color: var(--color-primary);
    color: white;
  }

  .toolbar-btn-active:hover {
    background-color: var(--color-primary-dark);
    color: white;
  }

  .editor-textarea {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    border-top: none;
    color: var(--color-text-primary);
  }

  .editor-preview {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-top: none;
  }

  /* Prose styles for preview */
  .editor-preview :deep(p) {
    margin-bottom: 0.5rem;
  }

  .editor-preview :deep(ul),
  .editor-preview :deep(ol) {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .editor-preview :deep(ul) {
    list-style-type: disc;
  }

  .editor-preview :deep(ol) {
    list-style-type: decimal;
  }

  .editor-preview :deep(blockquote) {
    border-left: 3px solid var(--color-border-strong);
    padding-left: 0.75rem;
    margin: 0.5rem 0;
    font-style: italic;
    color: var(--color-text-muted);
  }

  .editor-preview :deep(code) {
    background-color: var(--color-bg-hover);
    padding: 0.1rem 0.3rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
  }

  .editor-preview :deep(a) {
    color: var(--color-primary);
    text-decoration: underline;
  }

  .editor-preview :deep(strong) {
    font-weight: 600;
  }

  .editor-preview :deep(em) {
    font-style: italic;
  }

  .editor-preview :deep(del) {
    text-decoration: line-through;
  }
</style>
