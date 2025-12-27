<template>
  <div class="space-y-4">
    <!-- Title for articles -->
    <div>
      <label for="article-title" class="block text-sm font-medium mb-2">
        {{ t('submit.form.title') }} *
      </label>
      <input
        id="article-title"
        :value="titleValue"
        type="text"
        class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
        :class="{
          'border-red-500 focus:ring-red-500': titleError,
          'wizard-input-border focus:ring-primary': !titleError,
        }"
        :placeholder="t('submit.wizard.title_placeholder')"
        maxlength="255"
        @input="$emit('update:titleValue', $event.target.value)"
        @blur="$emit('title-blur')"
      >
      <div class="flex justify-between mt-2">
        <p v-if="titleError" class="text-sm text-red-500">{{ titleError }}</p>
        <span class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          {{ titleValue.length }}/255
        </span>
      </div>
    </div>

    <!-- Article content -->
    <div>
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2"
      >
        <label for="content" class="block text-sm font-medium">
          {{ t('submit.form.content') }} *
        </label>
        <!-- Prominent action buttons -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            :class="
              previewActive
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-600'
            "
            @click="$emit('toggle-preview')"
          >
            <Icon
              :name="previewActive ? 'fa6-solid:pen-to-square' : 'fa6-solid:eye'"
              class="text-sm"
              aria-hidden="true"
            />
            <span class="hidden sm:inline">{{
              previewActive ? t('submit.wizard.edit') : t('submit.wizard.preview')
            }}</span>
          </button>
          <button
            type="button"
            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
            @click="$emit('toggle-fullscreen')"
          >
            <Icon name="fa6-solid:expand" class="text-sm" aria-hidden="true" />
            <span class="hidden sm:inline">{{ t('submit.wizard.fullscreen') }}</span>
          </button>
        </div>
      </div>
      <MarkdownEditor
        ref="editorRef"
        :model-value="content"
        :placeholder="t('submit.wizard.content_placeholder')"
        data-testid="content-textarea"
        @update:model-value="$emit('update:content', $event)"
      />
      <p v-if="contentError" class="mt-2 text-sm text-red-500">{{ contentError }}</p>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    titleValue: {
      type: String,
      default: '',
    },
    titleError: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    contentError: {
      type: String,
      default: '',
    },
    previewActive: {
      type: Boolean,
      default: false,
    },
  })

  defineEmits([
    'update:titleValue',
    'update:content',
    'title-blur',
    'toggle-preview',
    'toggle-fullscreen',
  ])

  const editorRef = ref(null)

  defineExpose({
    editorRef,
  })
</script>
