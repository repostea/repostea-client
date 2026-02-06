<template>
  <div v-if="modelValue" class="editor-help-panel mb-3 p-3 rounded-md text-xs">
    <div class="font-medium mb-2">
      {{ t('comments.markdown_help_title') }}
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <div>
          <code>**{{ t('comments.format_examples.bold_text') }}**</code> →
          <strong>{{ t('comments.format_examples.bold_text') }}</strong>
        </div>
        <div>
          <code>*{{ t('comments.format_examples.italic_text') }}*</code> →
          <em>{{ t('comments.format_examples.italic_text') }}</em>
        </div>
        <div>
          <code>[{{ t('comments.format_examples.link_text') }}](url)</code> →
          <a href="#" class="text-primary">{{ t('comments.format_examples.link_text') }}</a>
        </div>
        <div>
          <code>`{{ t('comments.format_examples.code_text') }}`</code> →
          <code>{{ t('comments.format_examples.code_text') }}</code>
        </div>
      </div>
      <div>
        <div>
          <code>- {{ t('comments.format_examples.list') }}</code> →
          {{ t('comments.format_examples.list') }}
        </div>
        <div>
          <code>1. {{ t('comments.format_examples.numbered') }}</code> →
          {{ t('comments.format_examples.numbered') }}
        </div>
        <div>
          <code>> {{ t('comments.format_examples.quote_text').toLowerCase() }}</code> →
          {{ t('comments.format_examples.quote_text').toLowerCase() }}
        </div>
        <div>
          <code>@{{ t('comments.format_examples.user') }}</code> →
          {{ t('comments.format_examples.mention') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
  })
</script>

<style scoped>
  .editor-help-panel {
    background-color: var(--color-bg-hover);
    border: 1px solid var(--color-border-default);
  }
</style>
