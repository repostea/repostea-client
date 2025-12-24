import Toast, { type PluginOptions, POSITION, useToast as vueToast } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const options: PluginOptions = {
    position: POSITION.TOP_CENTER,
    timeout: 0,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false,
    // Fix ARIA: remove aria-label from container (not allowed on generic div)
    accessibility: {
      toastRole: 'status',
      closeButtonLabel: 'Close',
    },
  }

  nuxtApp.vueApp.use(Toast, options)

  return {
    provide: {
      toast: vueToast(),
    },
  }
})
