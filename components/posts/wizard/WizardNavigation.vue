<template>
  <div class="flex justify-between items-center gap-3 mt-8 pt-6 wizard-nav-border-top">
    <button
      v-if="currentStep > 1"
      type="button"
      data-testid="previous-button"
      class="px-4 sm:px-6 py-2 wizard-nav-btn rounded-lg transition-colors inline-flex items-center"
      @click="$emit('previous')"
    >
      <Icon name="fa6-solid:arrow-left" aria-hidden="true" />
      <span class="hidden sm:inline ml-2">{{ t('submit.wizard.previous') }}</span>
    </button>

    <!-- Spacer when no previous button -->
    <div v-else />

    <div class="flex items-center gap-2 sm:gap-3">
      <button
        v-if="currentStep < totalSteps"
        :disabled="!canProceed"
        type="button"
        data-testid="next-button"
        class="px-4 sm:px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
        @click="$emit('next')"
      >
        <span>{{ t('submit.wizard.next') }}</span>
        <Icon name="fa6-solid:arrow-right" class="ml-2" aria-hidden="true" />
      </button>

      <button
        v-if="currentStep === totalSteps"
        :disabled="isSubmitting"
        type="button"
        data-testid="draft-button"
        class="px-3 sm:px-6 py-2 wizard-draft-btn rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base flex items-center"
        @click="$emit('save-draft')"
      >
        <span v-if="isSubmitting && savingAsDraft" class="mr-2 flex items-center">
          <Icon
            name="fa6-solid:spinner"
            class="flex-shrink-0 animate-spin"
            aria-hidden="true"
          />
        </span>
        <Icon name="fa6-solid:floppy-disk" class="mr-2 flex-shrink-0" aria-hidden="true" />
        <span class="hidden sm:inline">{{ t('posts.save_as_draft') }}</span>
        <span class="sm:hidden">Borrador</span>
      </button>

      <button
        v-if="currentStep === totalSteps"
        :disabled="isSubmitting || !isFormValid"
        type="button"
        data-testid="publish-button"
        class="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        @click="$emit('publish')"
      >
        <span
          v-if="isSubmitting && !savingAsDraft"
          class="mr-2 flex items-center"
          data-testid="loading-spinner"
        >
          <Icon name="fa6-solid:spinner" class="animate-spin" aria-hidden="true" />
        </span>
        {{ t('submit.wizard.publish') }}
      </button>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    currentStep: {
      type: Number,
      required: true,
    },
    totalSteps: {
      type: Number,
      required: true,
    },
    canProceed: {
      type: Boolean,
      default: false,
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
    savingAsDraft: {
      type: Boolean,
      default: false,
    },
    isFormValid: {
      type: Boolean,
      default: false,
    },
  })

  defineEmits(['previous', 'next', 'save-draft', 'publish'])
</script>
