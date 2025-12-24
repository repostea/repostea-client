<template>
  <div>
    <!-- Warning when poll has votes -->
    <div
      v-if="hasVotes && isEditMode"
      class="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800"
    >
      <div class="flex items-start">
        <Icon name="fa6-solid:triangle-exclamation" class="text-yellow-500 mt-1 mr-3" aria-hidden="true" />
        <div>
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            {{ t('submit.form.poll_has_votes_warning') }}
          </p>
          <p class="text-sm text-yellow-700 dark:text-yellow-300">
            {{ t('submit.form.poll_has_votes_explanation') }}
          </p>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-1">
        {{ t('submit.form.poll_description') }}
      </label>
      <DescriptionEditor
        v-if="!(hasVotes && isEditMode)"
        v-model="localContent"
        :placeholder="t('submit.form.description_placeholder')"
        :error="contentError"
      />
      <div
        v-else
        class="post-form-input w-full rounded-md px-3 py-2 opacity-50 cursor-not-allowed min-h-[80px]"
      >
        {{ localContent || t('submit.form.no_description') }}
      </div>
      <p v-if="contentError" class="mt-1 text-sm text-red-500">
        {{ contentError }}
      </p>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-1"> {{ t('submit.form.poll_options') }} * </label>
      <div v-for="(option, index) in pollOptions" :key="index" class="flex mb-2 items-center">
        <span class="text-gray-500 dark:text-gray-400 mr-2 text-sm">{{ String.fromCharCode(65 + index) }})</span>
        <input
          v-model="pollOptions[index]"
          type="text"
          :disabled="hasVotes && isEditMode"
          class="post-form-input flex-grow rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          :placeholder="`${t('submit.form.poll_option')} ${index + 1}`"
          :class="{ 'border-red-500': pollOptionsError }"
        >
        <button
          v-if="index > 1 && !(hasVotes && isEditMode)"
          type="button"
          class="ml-2 px-3 py-2 text-red-500 hover:text-red-700 transition-colors"
          aria-label="Remove option"
          @click="removeOption(index)"
        >
          <Icon name="fa6-solid:xmark" aria-hidden="true" />
        </button>
      </div>
      <button
        v-if="pollOptions.length < 10 && !(hasVotes && isEditMode)"
        type="button"
        class="mt-2 px-3 py-2 text-sm text-primary hover:text-primary-dark transition-colors flex items-center"
        @click="addOption"
      ><Icon name="fa6-solid:plus" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.add_option') }}</span>
      </button>
      <p v-if="pollOptionsError" class="mt-1 text-sm text-red-500">
        {{ pollOptionsError }}
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ t('submit.form.poll_options_help', { min: 2, max: 10 }) }}
      </p>
    </div>

    <div class="mb-4">
      <label for="expires_at" class="block text-sm font-medium mb-1">
        {{ t('submit.form.poll_expires_at') }}
      </label>
      <select
        id="expires_at"
        v-model="expirationOption"
        :class="{
          'poll-select-active':
            expirationOption !== 'never',
          'poll-select-default': expirationOption === 'never',
        }"
        class="poll-select w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <option value="never">{{ t('submit.form.poll_never_expires') }}</option>
        <option value="1d">{{ t('submit.form.poll_expires_1d') }}</option>
        <option value="3d">{{ t('submit.form.poll_expires_3d') }}</option>
        <option value="1w">{{ t('submit.form.poll_expires_1w') }}</option>
        <option value="2w">{{ t('submit.form.poll_expires_2w') }}</option>
        <option value="1m">{{ t('submit.form.poll_expires_1m') }}</option>
      </select>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ t('submit.form.poll_expires_help') }}
      </p>
    </div>

    <div class="mb-4">
      <div class="flex items-center">
        <input
          id="allow_multiple_options"
          v-model="allowMultipleOptions"
          type="checkbox"
          class="poll-checkbox w-6 h-6 rounded text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
        >
        <label for="allow_multiple_options" class="ml-2 text-sm">
          {{ t('submit.form.poll_allow_multiple') }}
        </label>
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
        {{ t('submit.form.poll_allow_multiple_help') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch, computed, onMounted } from 'vue'
  import { useI18n } from '#i18n'
  import DescriptionEditor from '~/components/posts/DescriptionEditor.vue'

  const props = defineProps({
    content: {
      type: String,
      default: '',
    },
    contentError: {
      type: String,
      default: '',
    },
    pollOptionsError: {
      type: String,
      default: '',
    },
    existingOptions: {
      type: Array,
      default: () => [],
    },
    hasVotes: {
      type: Boolean,
      default: false,
    },
    isEditMode: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits([
    'update:content',
    'update:pollOptions',
    'update:expiresAt',
    'update:allowMultipleOptions',
  ])

  const { t } = useI18n()

  const localContent = ref(props.content)
  const pollOptions = ref(['', '']) // Start with 2 empty options
  const expirationOption = ref('1w') // Default to 1 week
  const allowMultipleOptions = ref(false)

  // Load existing poll options when in edit mode
  onMounted(() => {
    if (props.isEditMode && props.existingOptions.length > 0) {
      pollOptions.value = props.existingOptions.map(opt => opt.text || opt)
    }
  })

  // Calculate the actual expiration date based on the selected option
  const expiresAt = computed(() => {
    if (expirationOption.value === 'never') {
      return null
    }

    const now = new Date()

    switch (expirationOption.value) {
      case '1d':
        return new Date(now.setDate(now.getDate() + 1))
      case '3d':
        return new Date(now.setDate(now.getDate() + 3))
      case '1w':
        return new Date(now.setDate(now.getDate() + 7))
      case '2w':
        return new Date(now.setDate(now.getDate() + 14))
      case '1m':
        return new Date(now.setMonth(now.getMonth() + 1))
      default:
        return null
    }
  })

  function addOption() {
    if (pollOptions.value.length < 10) {
      pollOptions.value.push('')
    }
  }

  function removeOption(index) {
    if (pollOptions.value.length > 2) {
      pollOptions.value.splice(index, 1)
    }
  }

  watch(localContent, (newValue) => {
    emit('update:content', newValue)
  })

  watch(
    pollOptions,
    (newValue) => {
      emit(
        'update:pollOptions',
        newValue.filter((option) => option.trim() !== '')
      )
    },
    { deep: true }
  )

  watch(expiresAt, (newValue) => {
    emit('update:expiresAt', newValue)
  })

  watch(allowMultipleOptions, (newValue) => {
    emit('update:allowMultipleOptions', newValue)
  })
</script>

<style scoped>
  .post-form-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }

  .poll-select {
    background-color: var(--color-bg-input);
  }

  .poll-select-default {
    border: 1px solid var(--color-border-default);
  }

  .poll-select-active {
    @apply font-medium;
    border-color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
  }

  .dark .poll-select-active {
    color: var(--color-primary-light);
  }

  .poll-checkbox {
    border: 1px solid var(--color-border-default);
  }
</style>
