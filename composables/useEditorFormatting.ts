import { nextTick, type Ref } from 'vue'
import { useI18n } from '#i18n'

export interface FormatAction {
  label: string
  iconify: string
  action: string
}

export const markdownTools: FormatAction[] = [
  { label: 'Bold', iconify: 'fa6-solid:bold', action: 'bold' },
  { label: 'Italic', iconify: 'fa6-solid:italic', action: 'italic' },
  { label: 'Link', iconify: 'fa6-solid:link', action: 'link' },
  { label: 'List', iconify: 'fa6-solid:list-ul', action: 'list' },
  { label: 'Quote', iconify: 'fa6-solid:quote-right', action: 'quote' },
  { label: 'Code', iconify: 'fa6-solid:code', action: 'code' },
]

export function useEditorFormatting(
  content: Ref<string>,
  textareaRef: Ref<HTMLTextAreaElement | null>
) {
  const { t } = useI18n()

  function applyFormat(action: string) {
    const textarea = textareaRef.value
    if (!textarea) return

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

    nextTick(() => {
      textarea.focus()
      if (selectedText) {
        const newCursorPosition = beforeSelection.length + replacement.length
        textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      } else {
        const start = beforeSelection.length + placeholderStart
        const end = beforeSelection.length + placeholderEnd
        textarea.setSelectionRange(start, end)
      }
    })
  }

  function insertAtCursor(text: string) {
    const textarea = textareaRef.value
    if (!textarea) return

    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const beforeSelection = content.value.substring(0, selectionStart)
    const afterSelection = content.value.substring(selectionEnd)

    content.value = beforeSelection + text + afterSelection

    nextTick(() => {
      textarea.focus()
      const newCursorPosition = beforeSelection.length + text.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    })
  }

  function insertEmoji(emoji: string) {
    insertAtCursor(emoji)
  }

  function insertGif(url: string, title?: string) {
    const altText = title || 'GIF'
    const gifMarkdown = `![${altText}](${url})`
    insertAtCursor(gifMarkdown)
  }

  function insertImageMarkdown(url: string, alt: string, isNsfw = false) {
    const altWithMarker = isNsfw ? `${alt}{nsfw}` : alt
    const imageMarkdown = `![${altWithMarker}](${url})`
    insertAtCursor(imageMarkdown)
  }

  return {
    markdownTools,
    applyFormat,
    insertAtCursor,
    insertEmoji,
    insertGif,
    insertImageMarkdown,
  }
}
