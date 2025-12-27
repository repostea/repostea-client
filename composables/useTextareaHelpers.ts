import type { Ref } from 'vue'

export function useTextareaHelpers(isMobile: Ref<boolean>) {
  function autoResizeTextarea(textarea: HTMLTextAreaElement | null) {
    if (!textarea) return

    textarea.style.height = 'auto'
    const maxHeight = isMobile.value ? 400 : 300
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = newHeight + 'px'
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  return {
    autoResizeTextarea,
  }
}
