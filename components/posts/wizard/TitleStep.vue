<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-xl font-semibold mb-2">{{ t('submit.wizard.title_step') }}</h2>
      <p class="text-gray-600 dark:text-gray-400">{{ t('submit.wizard.title_subtitle') }}</p>
    </div>

    <div class="w-full space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium mb-2">
          {{ t('submit.form.title') }} *
        </label>
        <input
          id="title"
          :value="modelValue"
          type="text"
          data-testid="title-input"
          class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
          :class="{
            'border-red-500 focus:ring-red-500': error,
            'wizard-input-border focus:ring-primary': !error,
          }"
          :placeholder="t('submit.wizard.title_placeholder')"
          maxlength="255"
          @input="$emit('update:modelValue', $event.target.value)"
          @blur="$emit('blur')"
        >
        <div class="flex justify-between mt-2">
          <p v-if="error" class="text-sm text-red-500" data-testid="title-error">
            {{ error }}
          </p>
          <span
            class="text-sm text-gray-500 dark:text-gray-400 ml-auto"
            data-testid="character-count"
          >
            {{ modelValue.length }}/255
          </span>
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
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
  })

  defineEmits(['update:modelValue', 'blur'])
</script>
