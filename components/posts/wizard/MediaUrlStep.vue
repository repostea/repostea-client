<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-xl font-semibold mb-2">{{ title }}</h2>
      <p class="text-gray-600 dark:text-gray-400">{{ subtitle }}</p>
    </div>

    <div class="max-w-2xl mx-auto space-y-4">
      <!-- Image uploader for image-type posts -->
      <div v-if="contentType === 'image'">
        <label class="block text-sm font-medium mb-2">
          {{ t('submit.form.image_url') }} *
        </label>
        <ImageUploader
          :current-image="modelValue"
          @image-uploaded="$emit('image-uploaded', $event)"
          @image-deleted="$emit('image-deleted')"
        />
        <p
          v-if="error"
          class="mt-2 text-sm text-red-500 flex items-center"
          data-testid="url-error"
        >
          <Icon
            name="fa6-solid:circle-exclamation"
            class="mr-1 flex-shrink-0"
            aria-hidden="true"
          />
          <span>{{ error }}</span>
        </p>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <Icon
            name="fa6-solid:shield-halved"
            class="mr-1 flex-shrink-0"
            aria-hidden="true"
          />
          <span>{{ t('submit.wizard.image_storage_info') }}</span>
        </p>
      </div>

      <!-- URL input for video/audio -->
      <div v-else-if="['video', 'audio'].includes(contentType)">
        <label for="url" class="block text-sm font-medium mb-2">
          {{ t('submit.form.url') }} *
        </label>

        <!-- Input with integrated button for audio -->
        <div v-if="contentType === 'audio'" class="relative">
          <input
            id="url"
            :value="modelValue"
            type="url"
            data-testid="url-input"
            class="w-full text-lg rounded-lg border px-4 py-3 pr-24 sm:pr-48 focus:outline-none focus:ring-2 focus:border-transparent"
            :class="{
              'border-red-500 focus:ring-red-500': error,
              'wizard-input-border focus:ring-primary': !error,
            }"
            :placeholder="placeholder"
            @input="$emit('update:modelValue', $event.target.value)"
            @blur="$emit('blur')"
          >
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 px-2 sm:px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md transition-colors flex items-center gap-1 sm:gap-2 shadow-sm"
            @click="$emit('show-audio-help')"
          >
            <Icon
              name="fa6-solid:magnifying-glass"
              class="flex-shrink-0"
              aria-hidden="true"
            />
            <span class="hidden sm:inline">{{ t('audio_help.search_platforms_button') }}</span>
            <span class="sm:hidden">{{ t('common.search') }}</span>
          </button>
        </div>

        <!-- Normal input for video -->
        <input
          v-else
          id="url"
          :value="modelValue"
          type="url"
          data-testid="url-input"
          class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
          :class="{
            'border-red-500 focus:ring-red-500': error,
            'wizard-input-border focus:ring-primary': !error,
          }"
          :placeholder="placeholder"
          @input="$emit('update:modelValue', $event.target.value)"
          @blur="$emit('blur')"
        >

        <p v-if="error" class="mt-2 text-sm text-red-500" data-testid="url-error">
          {{ error }}
        </p>
      </div>

      <!-- URL input for links -->
      <div v-else>
        <label for="url" class="block text-sm font-medium mb-2">
          {{ t('submit.form.url') }} *
        </label>
        <input
          id="url"
          :value="modelValue"
          type="url"
          data-testid="url-input"
          class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
          :class="{
            'border-red-500 focus:ring-red-500': error,
            'wizard-input-border focus:ring-primary': !error,
          }"
          :placeholder="t('submit.wizard.link_url_placeholder')"
          @input="$emit('update:modelValue', $event.target.value)"
          @paste="$emit('paste', $event)"
        >
        <p v-if="error" class="mt-2 text-sm text-red-500" data-testid="url-error">
          {{ error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    contentType: {
      type: String,
      required: true,
    },
    modelValue: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
  })

  defineEmits([
    'update:modelValue',
    'blur',
    'paste',
    'image-uploaded',
    'image-deleted',
    'show-audio-help',
  ])
</script>
