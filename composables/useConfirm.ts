import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
}

export function useConfirm() {
  const isOpen = ref(false)
  const options = ref<ConfirmOptions>({
    message: '',
  })
  let resolvePromise: ((value: boolean) => void) | null = null

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    options.value = {
      title: opts.title || 'Confirmar',
      message: opts.message,
      confirmText: opts.confirmText || 'Confirmar',
      cancelText: opts.cancelText || 'Cancelar',
      type: opts.type || 'danger',
    }

    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  const handleCancel = () => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
