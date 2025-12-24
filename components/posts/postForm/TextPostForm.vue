<template>
  <div class="mb-4">
    <div class="flex justify-between items-center mb-1">
      <label for="content" class="block text-sm font-medium">
        {{ t('submit.form.content') }} *
      </label>
    </div>

    <MarkdownEditor :model-value="content" @update:model-value="updateContent" />

    <p v-if="error" class="mt-1 text-sm text-red-500">
      {{ error }}
    </p>
    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ t('submit.form.content_help') }}
    </p>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'
  import MarkdownEditor from '~/components/posts/MarkdownEditor.vue'

  defineProps({
    content: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['update:content'])

  const { t } = useI18n()

  function updateContent(value) {
    emit('update:content', value)
  }
</script>
