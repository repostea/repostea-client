<template>
  <div class="space-y-6">
    <!-- Loading while fetching metadata -->
    <div v-if="isLoading" class="text-center py-12">
      <Icon
        name="fa6-solid:spinner"
        class="animate-spin text-4xl text-primary mb-4"
        aria-hidden="true"
      />
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('submit.wizard.loading_metadata') }}
      </p>
    </div>

    <template v-else>
      <div class="text-center">
        <h2 class="text-xl font-semibold mb-2">{{ t('submit.wizard.link_details_step') }}</h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('submit.wizard.link_details_subtitle') }}
        </p>
      </div>

      <div class="max-w-2xl mx-auto space-y-4">
        <!-- Pre-filled data indicator -->
        <div
          v-if="metadataApplied"
          class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
        >
          <p class="text-xs text-blue-700 dark:text-blue-300 flex items-center">
            <Icon
              name="fa6-solid:wand-magic-sparkles"
              class="mr-2 flex-shrink-0"
              aria-hidden="true"
            />
            {{ t('submit.wizard.metadata_prefilled') }}
          </p>
        </div>

        <!-- Metadata error (non-blocking) -->
        <div
          v-else-if="metadataError"
          class="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
        >
          <p class="text-xs text-yellow-700 dark:text-yellow-300 flex items-center">
            <Icon
              name="fa6-solid:triangle-exclamation"
              class="mr-2 flex-shrink-0"
              aria-hidden="true"
            />
            {{ t('submit.wizard.metadata_error_continue') }}
          </p>
        </div>

        <!-- Title -->
        <div>
          <label for="link-title" class="block text-sm font-medium mb-2">
            {{ t('submit.form.title') }} *
          </label>
          <input
            id="link-title"
            :value="title"
            type="text"
            data-testid="title-input"
            class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
            :class="{
              'border-red-500 focus:ring-red-500': titleError,
              'wizard-input-border focus:ring-primary': !titleError,
            }"
            :placeholder="t('submit.wizard.title_placeholder')"
            maxlength="255"
            @input="$emit('update:title', $event.target.value)"
            @blur="$emit('title-blur')"
          >
          <div class="flex justify-between mt-2">
            <p v-if="titleError" class="text-sm text-red-500" data-testid="title-error">
              {{ titleError }}
            </p>
            <span class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
              {{ title.length }}/255
            </span>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="link-description" class="block text-sm font-medium mb-2">
            {{ t('submit.form.description') }} *
          </label>
          <DescriptionEditor
            :model-value="content"
            :placeholder="t('submit.form.description_help')"
            :error="contentError"
            @update:model-value="$emit('update:content', $event)"
            @blur="$emit('content-blur')"
          />
          <p v-if="contentError" class="mt-2 text-sm text-red-500">{{ contentError }}</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('submit.form.description_required_for_links') }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    isLoading: {
      type: Boolean,
      default: false,
    },
    metadataApplied: {
      type: Boolean,
      default: false,
    },
    metadataError: {
      type: Boolean,
      default: false,
    },
    title: {
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
  })

  defineEmits(['update:title', 'update:content', 'title-blur', 'content-blur'])
</script>
