<template>
  <Teleport to="body">
    <Transition name="lightbox-fade">
      <div
        v-if="isOpen"
        ref="overlayRef"
        class="lightbox-overlay fixed inset-0 z-[9999] flex items-center justify-center"
        tabindex="0"
        @click="close"
        @keydown.esc="close"
      >
        <!-- Top buttons container -->
        <div class="absolute top-4 right-4 z-10 flex items-center gap-2">
          <!-- Open in new tab (full size) -->
          <a
            :href="imageSrc"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors text-sm"
            :title="$t('common.open_full_size')"
            :aria-label="$t('common.open_full_size')"
            @click.stop
          >
            <Icon name="fa6-solid:up-right-from-square" class="text-base" aria-hidden="true" />
            <span class="hidden sm:inline">{{ $t('common.open_full_size') }}</span>
          </a>
          <!-- Close button -->
          <button
            class="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            :aria-label="$t('common.close')"
            @click.stop="close"
          >
            <Icon name="fa6-solid:xmark" class="text-xl" aria-hidden="true" />
          </button>
        </div>

        <!-- Image container -->
        <div class="lightbox-content relative max-w-[95vw] max-h-[95vh]" @click.stop>
          <!-- Loading spinner -->
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
            <div
              class="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"
            />
          </div>

          <!-- Image -->
          <img
            :src="imageSrc"
            :alt="imageAlt"
            class="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
            :class="{ 'opacity-0': isLoading }"
            @load="onImageLoad"
            @error="onImageError"
          />

          <!-- Alt text caption -->
          <div
            v-if="imageAlt && !isLoading"
            class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg"
          >
            <p class="text-white text-sm text-center">{{ imageAlt }}</p>
          </div>
        </div>

        <!-- Navigation hint -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
          {{ $t('common.click_to_close') }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { ref, watch, onMounted, onUnmounted } from 'vue'

  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false,
    },
    imageSrc: {
      type: String,
      required: true,
    },
    imageAlt: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['close'])

  const overlayRef = ref(null)
  const isLoading = ref(true)

  function close() {
    emit('close')
  }

  function onImageLoad() {
    isLoading.value = false
  }

  function onImageError() {
    isLoading.value = false
  }

  function handleKeydown(e) {
    if (props.isOpen && e.key === 'Escape') {
      close()
    }
  }

  // Focus trap and keyboard handling
  watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        isLoading.value = true
        // Prevent body scroll
        document.body.style.overflow = 'hidden'
        // Focus the overlay for keyboard events
        setTimeout(() => {
          overlayRef.value?.focus()
        }, 0)
      } else {
        // Restore body scroll
        document.body.style.overflow = ''
      }
    }
  )

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  })
</script>

<style scoped>
  .lightbox-overlay {
    background-color: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(4px);
  }

  .lightbox-content img {
    transition: opacity 0.2s ease;
  }

  /* Fade transition */
  .lightbox-fade-enter-active,
  .lightbox-fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .lightbox-fade-enter-from,
  .lightbox-fade-leave-to {
    opacity: 0;
  }

  .lightbox-fade-enter-active .lightbox-content,
  .lightbox-fade-leave-active .lightbox-content {
    transition: transform 0.2s ease;
  }

  .lightbox-fade-enter-from .lightbox-content,
  .lightbox-fade-leave-to .lightbox-content {
    transform: scale(0.95);
  }
</style>
