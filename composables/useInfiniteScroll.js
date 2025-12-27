import { ref, watch, onUnmounted } from 'vue'

export const useInfiniteScroll = (callback, options = {}) => {
  const target = ref(null)
  let observer = null

  const { rootMargin = '100px', threshold = 0.1, enabled = true } = options

  const observe = () => {
    if (!import.meta.client || !target.value || !enabled) return

    // Disconnect previous observer if exists
    disconnect()

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          callback()
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(target.value)
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  // Watch for target changes and re-observe when it becomes available
  watch(
    target,
    (newTarget) => {
      if (newTarget) {
        observe()
      } else {
        disconnect()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    disconnect()
  })

  return {
    target,
    observe,
    disconnect,
  }
}
