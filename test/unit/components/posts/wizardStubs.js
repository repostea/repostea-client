/**
 * Shared stubs for PostFormWizard component tests.
 * These stubs provide the expected data-testid attributes for testing.
 */

export const WizardProgressStub = {
  name: 'WizardProgress',
  template: `
    <div class="wizard-progress">
      <span data-testid="step-indicator">
        submit.wizard.step {{ currentStep }} submit.wizard.of {{ totalSteps }}
      </span>
      <div data-testid="progress-bar" :style="{ width: percentage + '%' }"></div>
    </div>
  `,
  props: ['currentStep', 'totalSteps', 'percentage'],
}

export const ContentTypeSelectorStub = {
  name: 'ContentTypeSelector',
  template: `
    <div class="content-type-selector">
      <button
        v-for="type in contentTypes"
        :key="type.value || type.id"
        :data-testid="'content-type-' + (type.value || type.id)"
        class="content-type-option"
        :class="{ 'border-primary bg-primary/10': selectedType === (type.value || type.id) }"
        @click="$emit('select', type.value || type.id)"
      >
        {{ type.title || type.label }}
      </button>
    </div>
  `,
  props: ['contentTypes', 'selectedType'],
  emits: ['select'],
}

export const WizardNavigationStub = {
  name: 'WizardNavigation',
  template: `
    <div class="wizard-navigation">
      <button
        v-if="currentStep > 1"
        data-testid="previous-button"
        @click="$emit('previous')"
      >
        Previous
      </button>
      <button
        v-if="currentStep < totalSteps"
        data-testid="next-button"
        :disabled="!canProceed"
        @click="$emit('next')"
      >
        Next
      </button>
      <button
        v-if="currentStep === totalSteps"
        data-testid="draft-button"
        :disabled="isSubmitting"
        @click="$emit('save-draft')"
      >
        <span v-if="isSubmitting && savingAsDraft" data-testid="loading-spinner">Loading...</span>
        Draft
      </button>
      <button
        v-if="currentStep === totalSteps"
        data-testid="publish-button"
        :disabled="isSubmitting || !isFormValid"
        @click="$emit('publish')"
      >
        <span v-if="isSubmitting && !savingAsDraft" data-testid="loading-spinner">Loading...</span>
        Publish
      </button>
    </div>
  `,
  props: [
    'currentStep',
    'totalSteps',
    'canProceed',
    'isSubmitting',
    'savingAsDraft',
    'isFormValid',
  ],
  emits: ['previous', 'next', 'save-draft', 'publish'],
}

export const MediaUrlStepStub = {
  name: 'MediaUrlStep',
  template: `
    <div class="media-url-step">
      <input
        data-testid="url-input"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
        @paste="$emit('paste', $event)"
      />
      <p v-if="error" data-testid="url-error">{{ error }}</p>
    </div>
  `,
  props: ['contentType', 'modelValue', 'error', 'title', 'subtitle', 'placeholder'],
  emits: [
    'update:modelValue',
    'blur',
    'paste',
    'image-uploaded',
    'image-deleted',
    'show-audio-help',
  ],
}

export const TitleStepStub = {
  name: 'TitleStep',
  template: `
    <div class="title-step">
      <input
        data-testid="title-input"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      />
      <p v-if="error" data-testid="title-error">{{ error }}</p>
      <span data-testid="character-count">{{ modelValue.length }}/255</span>
    </div>
  `,
  props: ['modelValue', 'error'],
  emits: ['update:modelValue', 'blur'],
}

export const MediaDetailsStepStub = {
  name: 'MediaDetailsStep',
  template: `
    <div class="media-details-step">
      <div v-if="isLoading">Loading...</div>
      <template v-else>
        <input
          data-testid="title-input"
          :value="title"
          @input="$emit('update:title', $event.target.value)"
          @blur="$emit('title-blur')"
        />
        <p v-if="titleError" data-testid="title-error">{{ titleError }}</p>
        <textarea
          data-testid="content-textarea"
          :value="content"
          @input="$emit('update:content', $event.target.value)"
          @blur="$emit('content-blur')"
        />
        <p v-if="contentError" data-testid="content-error">{{ contentError }}</p>
      </template>
    </div>
  `,
  props: [
    'isLoading',
    'metadataApplied',
    'metadataError',
    'title',
    'titleError',
    'content',
    'contentError',
  ],
  emits: ['update:title', 'update:content', 'title-blur', 'content-blur'],
}

export const TextContentStepStub = {
  name: 'TextContentStep',
  template: `
    <div class="text-content-step">
      <input
        data-testid="title-input"
        :value="titleValue"
        @input="$emit('update:titleValue', $event.target.value)"
        @blur="$emit('title-blur')"
      />
      <p v-if="titleError" data-testid="title-error">{{ titleError }}</p>
      <textarea
        data-testid="content-textarea"
        :value="content"
        @input="$emit('update:content', $event.target.value)"
      />
      <p v-if="contentError" data-testid="content-error">{{ contentError }}</p>
    </div>
  `,
  props: ['titleValue', 'titleError', 'content', 'contentError', 'previewActive'],
  emits: [
    'update:titleValue',
    'update:content',
    'title-blur',
    'toggle-preview',
    'toggle-fullscreen',
  ],
}

export const PollCreationStepStub = {
  name: 'PollCreationStep',
  template: `
    <div class="poll-creation-step">
      <textarea
        data-testid="poll-description"
        :value="content"
        @input="$emit('update:content', $event.target.value)"
      />
      <div data-testid="poll-options">
        <div v-for="(option, index) in pollOptions" :key="index">
          <input
            :value="option"
            @input="updateOption(index, $event.target.value)"
          />
        </div>
      </div>
      <button @click="$emit('add-option')">Add option</button>
    </div>
  `,
  props: [
    'content',
    'pollOptions',
    'expirationOption',
    'allowMultiple',
    'pollHasVotes',
    'isEditMode',
  ],
  emits: [
    'update:content',
    'update:expirationOption',
    'update:allowMultiple',
    'update:pollOptions',
    'add-option',
    'remove-option',
  ],
  methods: {
    updateOption(index, value) {
      const newOptions = [...this.pollOptions]
      newOptions[index] = value
      this.$emit('update:pollOptions', newOptions)
    },
  },
}

export const PostDetailsStepStub = {
  name: 'PostDetailsStep',
  template: `
    <div class="post-details-step">
      <select
        data-testid="language-select"
        :value="languageCode"
        @change="$emit('update:languageCode', $event.target.value)"
      >
        <option value="">Select language</option>
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
      <input
        type="checkbox"
        data-testid="guest-checkbox"
        :checked="isAnonymous"
        @change="$emit('update:isAnonymous', $event.target.checked)"
      />
      <input
        type="checkbox"
        data-testid="nsfw-checkbox"
        :checked="isNsfw"
        @change="$emit('update:isNsfw', $event.target.checked)"
      />
      <input
        type="checkbox"
        data-testid="federate-checkbox"
        :checked="shouldFederate"
        @change="$emit('update:shouldFederate', $event.target.checked)"
      />
    </div>
  `,
  props: [
    'languageCode',
    'subId',
    'mySubs',
    'currentPostSub',
    'isAnonymous',
    'isNsfw',
    'shouldFederate',
    'isFederationEnabled',
    'isAuthenticated',
    'isGuest',
    'contentType',
    'thumbnailUrl',
    'effectivePostId',
    'postRelationships',
  ],
  emits: [
    'update:languageCode',
    'update:subId',
    'update:isAnonymous',
    'update:isNsfw',
    'update:shouldFederate',
    'thumbnail-updated',
    'thumbnail-deleted',
    'add-relationship',
    'remove-relationship',
  ],
}

/**
 * All wizard component stubs for easy import
 */
export const wizardStubs = {
  WizardProgress: WizardProgressStub,
  ContentTypeSelector: ContentTypeSelectorStub,
  WizardNavigation: WizardNavigationStub,
  MediaUrlStep: MediaUrlStepStub,
  TitleStep: TitleStepStub,
  MediaDetailsStep: MediaDetailsStepStub,
  TextContentStep: TextContentStepStub,
  PollCreationStep: PollCreationStepStub,
  PostDetailsStep: PostDetailsStepStub,
}
