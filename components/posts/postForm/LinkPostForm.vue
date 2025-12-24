<template>
  <div>
    <div class="mb-4">
      <label for="url" class="block text-sm font-medium mb-1"> {{ t('submit.form.url') }} * </label>
      <input
        id="url"
        :value="url"
        type="url"
        class="post-form-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        :class="{ 'border-red-500': error }"
        placeholder="https://"
        required
        @input="updateUrl"
      >
      <p v-if="error" class="mt-1 text-sm text-red-500">
        {{ error }}
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ t('submit.form.url_help') }}
      </p>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-1">
        {{ t('submit.form.description') }} *
      </label>
      <DescriptionEditor
        :model-value="content"
        :placeholder="t('submit.form.description_placeholder')"
        :error="contentError"
        @update:model-value="updateContent"
      />
      <p v-if="contentError" class="mt-1 text-sm text-red-500">
        {{ contentError }}
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ t('submit.form.description_required_for_links') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { watch } from 'vue'
  import { useI18n } from '#i18n'
  import DescriptionEditor from '~/components/posts/DescriptionEditor.vue'

  const props = defineProps({
    url: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
    contentError: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['update:url', 'update:content', 'validate-url'])

  const { t } = useI18n()

  function updateUrl(e) {
    emit('update:url', e.target.value)
    emit('validate-url')
  }

  function updateContent(value) {
    emit('update:content', value)
  }

  watch(
    () => props.url,
    (newVal) => {
      if (newVal && !newVal.match(/^https?:\/\/.*$/)) {
        emit('update:url', 'https://' + newVal)
      }
    }
  )
</script>

<style scoped>
  .post-form-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }
</style>
