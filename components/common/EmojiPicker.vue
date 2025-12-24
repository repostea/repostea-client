<template>
  <div class="relative">
    <button
      v-if="!hideButton"
      type="button"
      class="emoji-toggle-btn rounded-md transition-colors"
      :class="buttonClass"
      :title="t('emojis.insert')"
      :aria-label="t('emojis.insert')"
      :disabled="disabled"
      @click="togglePicker"
    >
      <Icon name="fa6-regular:face-smile" class="text-base text-primary" aria-hidden="true" />
      <span v-if="showLabel" class="flex flex-col items-start leading-none">
        <span class="text-[10px]">{{ t('emojis.insert_action') }}</span>
        <span class="text-[10px]">Emoji</span>
      </span>
    </button>
    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 z-40"
      @click="isOpen = false"
    />
    <!-- Picker -->
    <div
      v-if="isOpen"
      class="emoji-picker fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-xl p-4 z-50 max-h-[min(450px,80vh)] overflow-y-auto w-[min(320px,calc(100vw-2rem))] md:w-[380px]"
      @click.stop
    >
      <div class="flex items-center gap-2 mb-2">
        <input
          v-model="emojiSearch"
          type="text"
          class="emoji-search-input flex-1 text-sm rounded-md px-2 py-1"
          :placeholder="t('emojis.search_placeholder')"
          :aria-label="t('emojis.search_placeholder')"
        >
        <button
          type="button"
          class="emoji-close-btn p-1.5 rounded-md transition-colors flex items-center justify-center"
          :title="t('common.close')"
          :aria-label="t('common.close')"
          @click="isOpen = false"
        >
          <Icon name="fa6-solid:xmark" class="text-text-muted dark:text-text-dark-muted" aria-hidden="true" />
        </button>
      </div>

      <!-- Size selector -->
      <div class="flex items-center gap-1 mb-3 pb-2 border-b border-default">
        <span class="text-xs text-text-muted dark:text-text-dark-muted mr-1">{{ t('emojis.size') }}:</span>
        <button
          v-for="size in sizes"
          :key="size.value"
          type="button"
          class="emoji-size-btn px-2 py-1 rounded text-sm transition-colors"
          :class="selectedSize === size.value ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'"
          :title="size.label"
          @click="selectedSize = size.value"
        >
          <span :class="size.previewClass">😀</span>
        </button>
      </div>

      <div class="grid grid-cols-8 gap-1">
        <button
          v-for="(emoji, index) in filteredEmojis"
          :key="`${emoji}-${index}`"
          type="button"
          class="emoji-item text-2xl rounded p-1 transition-colors"
          :title="emoji"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
      <div v-if="filteredEmojis.length === 0" class="text-center text-sm text-text-muted dark:text-text-dark-muted py-4">
        {{ t('emojis.no_results') }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    buttonClass: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showLabel: {
      type: Boolean,
      default: false,
    },
    hideButton: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['select'])

  const isOpen = ref(false)
  const emojiSearch = ref('')
  const selectedSize = ref('normal')

  // Size options
  const sizes = [
    { value: 'normal', label: 'Normal', previewClass: 'text-base' },
    { value: 'large', label: 'Grande', previewClass: 'text-2xl' },
    { value: 'xlarge', label: 'Muy grande', previewClass: 'text-4xl' },
  ]

  // Common emojis
  const emojis = [
    // Smileys & Emotion
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮',
    '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢',
    '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤',
    '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹',
    '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼',
    '😽', '🙀', '😿', '😾',
    // People & Body
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
    '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
    '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
    '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '🦻', '👃', '🧠',
    '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸',
    // Animals & Nature
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
    '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
    '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎',
    '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟',
    '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧',
    '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄',
    '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮',
    '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝',
    '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔',
    // Food & Drink
    '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
    '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐',
    '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇',
    '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪',
    '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲',
    '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥',
    '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰',
    '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜',
    '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻',
    '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊',
    // Activities & Sports
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁',
    '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️',
    '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️',
    '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵',
    '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷',
    '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰',
    '🧩',
    // Symbols
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✅', '❌', '⭕', '🔥', '💯',
    '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟',
    '💫', '✨', '💥', '💢', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️',
    '🗯️', '💭', '💤',
  ]

  const filteredEmojis = computed(() => {
    if (!emojiSearch.value) return emojis

    const searchTerm = emojiSearch.value.toLowerCase().trim()

    return emojis.filter((emoji) => {
      // Search by emoji itself
      if (emoji.includes(searchTerm)) return true

      // Search by keywords
      const keywords = t(`emojis.keywords.${emoji}`, emoji)
      if (keywords && keywords !== emoji) {
        return keywords.toLowerCase().includes(searchTerm)
      }

      return false
    })
  })

  function togglePicker() {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      emojiSearch.value = ''
    }
  }

  function selectEmoji(emoji) {
    let formattedEmoji = emoji
    if (selectedSize.value === 'large') {
      formattedEmoji = `::${emoji}::`
    } else if (selectedSize.value === 'xlarge') {
      formattedEmoji = `:::${emoji}:::`
    }
    emit('select', formattedEmoji)
    isOpen.value = false
    emojiSearch.value = ''
  }

  function handleClickOutside(event) {
    // Don't close if clicking inside the picker or on the toggle button
    if (isOpen.value && !event.target.closest('.emoji-picker') && !event.target.closest('.emoji-toggle-btn')) {
      isOpen.value = false
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      document.addEventListener('click', handleClickOutside)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      document.removeEventListener('click', handleClickOutside)
    }
  })

  defineExpose({
    open: () => {
      // setTimeout avoids the triggering click from immediately closing the picker
      setTimeout(() => {
        isOpen.value = true
        emojiSearch.value = ''
      }, 0)
    },
    close: () => {
      isOpen.value = false
    },
    toggle: () => {
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        emojiSearch.value = ''
      }
    },
  })
</script>

<style scoped>
  .emoji-toggle-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .emoji-picker {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .emoji-search-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .emoji-close-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .emoji-item:hover {
    background-color: var(--color-bg-hover);
  }

  .border-default {
    border-color: var(--color-border-default);
  }
</style>
