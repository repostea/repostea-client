<template>
  <form @submit.prevent="submitComment" class="w-full">
    <textarea
      v-model="content"
      class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      :class="{ 'border-red-500': error }"
      :rows="rows"
      :placeholder="placeholder"
      required
    ></textarea>
    <p v-if="error" class="text-red-500 text-sm mt-1 mb-2">{{ error }}</p>
    <div class="flex justify-end mt-3">
      <slot name="cancel-button"></slot>
      <button
        type="submit"
        class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
        :disabled="isSubmitting"
      >
        <span
          v-if="isSubmitting"
          class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
        ></span>
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
  import { ref } from 'vue'

  const props = defineProps({
    placeholder: {
      type: String,
      default: '',
    },
    rows: {
      type: Number,
      default: 3,
    },
    submitLabel: {
      type: String,
      default: 'Submit',
    },
    parentId: {
      type: [Number, String],
      default: null,
    },
    error: {
      type: String,
      default: '',
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['submit'])
  const content = ref('')

  function submitComment() {
    const trimmed = content.value.trim()
    if (!trimmed) return
    emit('submit', {
      content: trimmed,
      parentId: props.parentId,
    })
  }

  function reset() {
    content.value = ''
  }

  defineExpose({
    reset,
  })
</script>
