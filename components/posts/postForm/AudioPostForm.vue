<template>
  <div>
    <div class="mb-4">
      <label for="audio-url" class="block text-sm font-medium mb-1">
        {{ t('submit.form.audio_url') }} *
      </label>
      <input
        id="audio-url"
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
        {{ t('submit.form.audio_url_help') }}
      </p>

      <div
        v-if="isValidAudioUrl"
        class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800"
      >
        <p class="text-sm text-green-800 dark:text-green-200">
          <Icon name="fa6-solid:circle-check" class="mr-1" aria-hidden="true" />
          {{ t('submit.form.audio_detected') }}
        </p>
      </div>
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
        {{ t('submit.form.description_help') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { computed, watch } from 'vue'
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

  const isValidAudioUrl = computed(() => {
    if (!props.url) return false

    const audioRegex =
      /^(https?:\/\/)?(www\.)?(soundcloud\.com|spotify\.com\/(track|album|show|episode|podcast)|podcasts\.apple\.com|player\.simplecast\.com|suno\.com\/(song|embed))\/.*$/i
    return audioRegex.test(props.url)
  })

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
