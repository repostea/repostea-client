<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] overflow-y-auto"
        @click.self="cancel"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"/>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isOpen"
              class="confirm-dialog relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
              @click.stop
            >
              <!-- Header -->
              <div class="confirm-dialog-header px-6 py-4">
                <div class="flex items-center gap-3">
                  <!-- Icon -->
                  <div class="flex-shrink-0">
                    <div
                      class="w-12 h-12 rounded-full flex items-center justify-center"
                      :class="iconBackgroundClass"
                    >
                      <Icon :name="iconName" :class="iconColorClass + ' text-xl'" aria-hidden="true" />
                    </div>
                  </div>

                  <!-- Title -->
                  <h2 class="text-xl font-semibold text-text dark:text-text-dark">
                    {{ title }}
                  </h2>
                </div>
              </div>

              <!-- Body -->
              <div class="px-6 py-6">
                <p class="text-text dark:text-text-dark text-base leading-relaxed">
                  {{ message }}
                </p>
              </div>

              <!-- Footer -->
              <div class="confirm-dialog-footer px-6 py-4 flex items-center justify-end gap-3">
                <!-- Cancel Button -->
                <button
                  class="px-4 py-2 text-sm font-medium text-text dark:text-text-dark confirm-cancel-btn rounded-lg transition-colors"
                  @click="cancel"
                >
                  {{ cancelText }}
                </button>

                <!-- Confirm Button -->
                <button
                  class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="confirmButtonClass"
                  @click="confirm"
                >
                  {{ confirmText }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: 'Confirmar',
    },
    message: {
      type: String,
      required: true,
    },
    confirmText: {
      type: String,
      default: 'Confirmar',
    },
    cancelText: {
      type: String,
      default: 'Cancelar',
    },
    type: {
      type: String,
      default: 'danger', // 'danger', 'warning', 'info', 'success'
      validator: (value) => ['danger', 'warning', 'info', 'success'].includes(value),
    },
  })

  const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

  const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
  })

  const iconName = computed(() => {
    const icons = {
      danger: 'fa6-solid:triangle-exclamation',
      warning: 'fa6-solid:circle-exclamation',
      info: 'fa6-solid:circle-info',
      success: 'fa6-solid:circle-check',
    }
    return icons[props.type]
  })

  const iconColorClass = computed(() => {
    const colors = {
      danger: 'text-red-600',
      warning: 'text-orange-600',
      info: 'text-blue-600',
      success: 'text-green-600',
    }
    return colors[props.type]
  })

  const iconBackgroundClass = computed(() => {
    const backgrounds = {
      danger: 'bg-red-100 dark:bg-red-900/20',
      warning: 'bg-orange-100 dark:bg-orange-900/20',
      info: 'bg-blue-100 dark:bg-blue-900/20',
      success: 'bg-green-100 dark:bg-green-900/20',
    }
    return backgrounds[props.type]
  })

  const confirmButtonClass = computed(() => {
    const classes = {
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      warning: 'bg-warning hover:bg-warning/90 text-white',
      info: 'bg-blue-600 hover:bg-blue-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white',
    }
    return classes[props.type]
  })

  const confirm = () => {
    emit('confirm')
    isOpen.value = false
  }

  const cancel = () => {
    emit('cancel')
    isOpen.value = false
  }
</script>

<style scoped>
  .confirm-dialog {
    background-color: var(--color-bg-card);
  }

  .confirm-dialog-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .confirm-dialog-footer {
    background-color: var(--color-bg-hover);
    border-top: 1px solid var(--color-border-default);
  }

  .confirm-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }
</style>
