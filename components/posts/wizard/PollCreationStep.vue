<template>
  <div class="space-y-4">
    <!-- Warning when poll has votes -->
    <div
      v-if="pollHasVotes && isEditMode"
      class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800"
    >
      <div class="flex items-start">
        <Icon
          name="fa6-solid:triangle-exclamation"
          class="text-yellow-500 mt-1 mr-3"
          aria-hidden="true"
        />
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

    <!-- Optional poll description -->
    <div>
      <label for="poll_description" class="block text-sm font-medium mb-2">
        {{ t('submit.form.poll_description') }}
      </label>
      <textarea
        id="poll_description"
        :value="content"
        rows="3"
        :disabled="pollHasVotes && isEditMode"
        class="w-full rounded-lg wizard-form-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        :placeholder="t('submit.form.poll_description_placeholder')"
        @input="$emit('update:content', $event.target.value)"
      />
    </div>

    <!-- Poll options -->
    <div>
      <label class="block text-sm font-medium mb-2">
        {{ t('submit.form.poll_options') }} *
      </label>
      <div class="space-y-3" data-testid="poll-options">
        <div
          v-for="(option, index) in pollOptions"
          :key="index"
          class="flex items-center space-x-2"
        >
          <input
            :value="pollOptions[index]"
            type="text"
            :disabled="pollHasVotes && isEditMode"
            class="flex-1 rounded-lg wizard-form-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            :placeholder="`${t('submit.form.option')} ${index + 1}`"
            @input="updateOption(index, $event.target.value)"
          >
          <button
            v-if="pollOptions.length > 2 && !(pollHasVotes && isEditMode)"
            type="button"
            class="text-red-500 hover:text-red-700"
            @click="$emit('remove-option', index)"
          >
            <Icon name="fa6-solid:trash" aria-hidden="true" />
          </button>
        </div>
        <button
          v-if="!(pollHasVotes && isEditMode)"
          type="button"
          class="text-primary hover:text-primary-dark text-sm flex items-center"
          @click="$emit('add-option')"
        >
          <Icon name="fa6-solid:plus" class="mr-1 flex-shrink-0" aria-hidden="true" />
          <span>{{ t('submit.form.add_option') }}</span>
        </button>
      </div>
    </div>

    <!-- Expiration configuration -->
    <div>
      <label for="poll_expires" class="block text-sm font-medium mb-2">
        {{ t('submit.form.poll_expires_at') }}
      </label>
      <select
        id="poll_expires"
        :value="expirationOption"
        class="w-full rounded-lg wizard-form-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        @change="$emit('update:expirationOption', $event.target.value)"
      >
        <option value="never">{{ t('submit.form.poll_never_expires') }}</option>
        <option value="1d">{{ t('submit.form.poll_expires_1d') }}</option>
        <option value="3d">{{ t('submit.form.poll_expires_3d') }}</option>
        <option value="1w">{{ t('submit.form.poll_expires_1w') }}</option>
        <option value="2w">{{ t('submit.form.poll_expires_2w') }}</option>
        <option value="1m">{{ t('submit.form.poll_expires_1m') }}</option>
      </select>
      <p class="mt-1 text-xs text-gray-500">{{ t('submit.form.poll_expires_help') }}</p>
    </div>

    <!-- Allow multiple options -->
    <div class="flex items-start space-x-3">
      <input
        id="allow_multiple"
        :checked="allowMultiple"
        type="checkbox"
        class="w-6 h-6 mt-1 rounded wizard-checkbox-border text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
        @change="$emit('update:allowMultiple', $event.target.checked)"
      >
      <div>
        <label for="allow_multiple" class="text-sm font-medium">
          {{ t('submit.form.poll_allow_multiple') }}
        </label>
        <p class="text-xs text-gray-500 mt-1">
          {{ t('submit.form.poll_allow_multiple_help') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  const props = defineProps({
    content: {
      type: String,
      default: '',
    },
    pollOptions: {
      type: Array,
      required: true,
    },
    expirationOption: {
      type: String,
      default: 'never',
    },
    allowMultiple: {
      type: Boolean,
      default: false,
    },
    pollHasVotes: {
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
    'update:expirationOption',
    'update:allowMultiple',
    'update:pollOptions',
    'add-option',
    'remove-option',
  ])

  const updateOption = (index, value) => {
    const newOptions = [...props.pollOptions]
    newOptions[index] = value
    emit('update:pollOptions', newOptions)
  }
</script>
