<template>
  <div>
    <div v-if="isEnabled" ref="turnstileRef" class="mb-4 turnstile-container"/>
    <div v-else class="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded">
      <p class="text-sm">Turnstile CAPTCHA is not configured (development mode)</p>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: 'normal', // 'normal', 'compact'
    },
    appearance: {
      type: String,
      default: 'always', // 'always', 'execute', 'interaction-only'
    },
  })

  const emit = defineEmits(['update:modelValue', 'success', 'expired', 'error'])

  const turnstileRef = ref(null)
  const turnstileId = ref(null)
  const config = useRuntimeConfig()

  // Check if Turnstile is enabled (has sitekey configured)
  const isEnabled = computed(() => {
    return config.public.turnstileSiteKey && config.public.turnstileSiteKey !== ''
  })

  // Detect theme based on document classes
  const getCurrentTheme = () => {
    if (!import.meta.client) return 'light'

    const html = document.documentElement
    if (html.classList.contains('theme-dark') || html.classList.contains('dark')) {
      return 'dark'
    }
    return 'light'
  }

  // Function to safely load the script
  const loadTurnstileScript = () => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (document.querySelector('script[data-turnstile-script="true"]')) {
        if (window.turnstile) {
          resolve()
        } else {
          // Wait for turnstile object to be available
          const checkInterval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(checkInterval)
              resolve()
            }
          }, 100)
          // Timeout in case something goes wrong
          setTimeout(() => {
            clearInterval(checkInterval)
            reject(new Error('Timeout waiting for turnstile to load'))
          }, 5000)
        }
        return
      }

      const script = document.createElement('script')
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback'
      script.async = true
      script.defer = true
      script.setAttribute('data-turnstile-script', 'true')

      // Define global callback function
      window.onloadTurnstileCallback = () => {
        resolve()
      }

      script.onerror = (error) => {
        console.error('Error loading Turnstile script:', error)
        reject(error)
      }

      document.head.appendChild(script)
    })
  }

  // Safely render the widget
  const renderWidget = () => {
    if (!window.turnstile || !turnstileRef.value) return null

    try {
      // Make sure the element is clean
      if (turnstileId.value) {
        window.turnstile.remove(turnstileId.value)
        turnstileId.value = null
      }

      const sitekey = config.public.turnstileSiteKey
      const theme = getCurrentTheme()

      turnstileId.value = window.turnstile.render(turnstileRef.value, {
        sitekey: sitekey,
        theme: theme, // Use detected theme
        size: props.size,
        appearance: props.appearance,
        callback: (token) => {
          emit('update:modelValue', token)
          emit('success', token)
        },
        'expired-callback': () => {
          emit('update:modelValue', '')
          emit('expired')
        },
        'error-callback': (error) => {
          console.error('Turnstile error:', error)
          emit('update:modelValue', '')
          emit('error', error)
        },
      })

      return turnstileId.value
    } catch (error) {
      console.error('Error rendering Turnstile widget:', error)
      return null
    }
  }

  // Watch for theme changes
  const setupThemeObserver = () => {
    if (!import.meta.client) return

    // Observe changes to document classes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          // Re-render if theme changed
          renderWidget()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return observer
  }

  let themeObserver

  onMounted(async () => {
    if (!isEnabled.value) {
      console.warn('Turnstile is disabled (no sitekey configured)')
      // Emit success immediately in development mode without captcha
      emit('update:modelValue', 'dev-mode-bypass')
      emit('success', 'dev-mode-bypass')
      return
    }

    if (import.meta.client) {
      try {
        await loadTurnstileScript()
        renderWidget()
        themeObserver = setupThemeObserver()
      } catch (error) {
        console.error('Failed to initialize Turnstile:', error)
        emit('error', 'Failed to load Turnstile')
      }
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.client) {
      // Clean up the observer
      if (themeObserver) {
        themeObserver.disconnect()
      }

      // Clean up the widget
      if (window.turnstile && turnstileId.value) {
        try {
          window.turnstile.remove(turnstileId.value)
        } catch (error) {
          console.error('Error removing Turnstile widget:', error)
        }
      }
    }
  })

  // Reset function
  const reset = async () => {
    if (import.meta.client) {
      if (window.turnstile && turnstileId.value) {
        try {
          window.turnstile.reset(turnstileId.value)
          emit('update:modelValue', '')
        } catch (error) {
          console.error('Error resetting Turnstile, trying to re-render:', error)
          // If reset fails, try to recreate the widget
          renderWidget()
        }
      } else {
        // If no widget exists, try to create it
        try {
          await loadTurnstileScript()
          renderWidget()
        } catch (error) {
          console.error('Failed to re-initialize Turnstile:', error)
        }
      }
    }
  }

  defineExpose({
    reset,
  })
</script>

<style scoped>
  .turnstile-container {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .turnstile-container iframe {
    width: 100% !important;
    margin: 0 auto;
  }

  :deep(.cf-turnstile) {
    width: 100% !important;
    margin: 0 auto;
  }
</style>
