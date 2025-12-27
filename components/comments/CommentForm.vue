<template>
  <CommentEditor
    ref="commentEditor"
    :placeholder="placeholder"
    :submit-label="submitLabel"
    :rows="rows"
    :is-submitting="isSubmitting"
    :error="error"
    :parent-id="parentId"
    :post-id="postId"
    :post-author="postAuthor"
    :available-comments="availableComments"
    @submit="handleSubmit"
  >
    <template #cancel-button>
      <slot name="cancel-button" />
    </template>
  </CommentEditor>
</template>

<script setup>
  import { ref } from 'vue'
  import CommentEditor from './CommentEditor.vue'

  defineProps({
    placeholder: {
      type: String,
      default: '',
    },
    rows: {
      type: Number,
      default: 6,
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
    postId: {
      type: [Number, String],
      required: true,
    },
    postAuthor: {
      type: Object,
      default: null,
    },
    availableComments: {
      type: Array,
      default: () => [],
    },
  })

  const emit = defineEmits(['submit'])

  const commentEditor = ref(null)

  function handleSubmit(formData) {
    emit('submit', formData)
  }

  function reset() {
    if (commentEditor.value) {
      commentEditor.value.reset()
    }
  }

  // Expose functions for parent components
  defineExpose({
    reset,
  })
</script>
