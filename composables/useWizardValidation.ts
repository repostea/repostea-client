import { computed, type Ref, type ComputedRef } from 'vue'

export interface WizardForm {
  content_type: string
  url: string
  title: string
  content: string
  poll_options: string[]
  language_code: string
}

export interface WizardErrors {
  title: string
  url: string
  content: string
  tags: string
  poll_options: string
}

export interface UseWizardValidationOptions {
  form: WizardForm
  errors: WizardErrors
  currentStep: Ref<number>
  postFormRef: Ref<HTMLElement | null>
  t: (key: string) => string
  warning: (message: string, options?: Record<string, unknown>) => void
}

export function useWizardValidation(options: UseWizardValidationOptions) {
  const { form, errors, currentStep, postFormRef, t, warning } = options

  // Check if URL is valid
  function isValidUrl(string: string): boolean {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  // Reset all errors
  function resetErrors(): void {
    Object.keys(errors).forEach((key) => {
      ;(errors as Record<string, string>)[key] = ''
    })
  }

  // Validate title field
  function validateTitle(): void {
    errors.title = ''
    if (form.title.trim().length < 5) {
      errors.title = t('submit.validation.title_min_length')
    }
  }

  // Validate URL field
  function validateUrl(): void {
    errors.url = ''

    if (form.url && !form.url.match(/^https?:\/\/.*$/)) {
      form.url = 'https://' + form.url
    }

    if (form.url && !isValidUrl(form.url)) {
      errors.url = t('submit.validation.invalid_url')
    }
  }

  // Validate content based on type and step
  function validateContent(): void {
    errors.content = ''

    // For text type, only validate content in step 3
    if (
      form.content_type === 'text' &&
      currentStep.value === 3 &&
      form.content.trim().length < 10
    ) {
      errors.content = t('submit.validation.content_min_length')
    }

    // For links, validate description in step 3 (new flow)
    if (form.content_type === 'link' && currentStep.value === 3) {
      if (!form.content.trim()) {
        errors.content = t('submit.validation.description_required')
      } else if (form.content.trim().length < 10) {
        errors.content = t('submit.validation.description_min_length')
      }
    }

    // For video/audio/image, validate description in step 2
    if (['video', 'audio', 'image'].includes(form.content_type) && currentStep.value === 2) {
      if (!form.content.trim()) {
        errors.content = t('submit.validation.description_required')
      } else if (form.content.trim().length < 10) {
        errors.content = t('submit.validation.description_min_length')
      }
    }
  }

  // Validate poll options
  function validatePollOptions(): void {
    errors.poll_options = ''

    const validOptions = form.poll_options.filter((o) => o.trim()).length
    if (form.content_type === 'poll' && validOptions < 2) {
      errors.poll_options = t('submit.validation.poll_min_options')
    }
  }

  // Check if can proceed to next step
  const canProceed: ComputedRef<boolean> = computed(() => {
    switch (currentStep.value) {
      case 1:
        return form.content_type !== ''
      case 2:
        // For link, video, audio, image: validate URL in step 2
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          return form.url.trim() !== '' && isValidUrl(form.url.trim())
        }
        // For text and poll: validate title in step 2
        if (!form.title.trim() || form.title.trim().length < 5) return false
        return true
      case 3:
        // For link, video, audio, image: validate title and description in step 3
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          if (!form.title.trim() || form.title.trim().length < 5) return false
          return form.content.trim().length > 0
        }
        // For text: validate content
        if (form.content_type === 'text') {
          return form.content.trim().length >= 10
        }
        // For poll: validate options
        if (form.content_type === 'poll') {
          return form.poll_options.filter((o) => o.trim()).length >= 2
        }
        return false
      case 4:
        return true
      default:
        return false
    }
  })

  // Check if entire form is valid
  const isFormValid: ComputedRef<boolean> = computed(() => {
    return form.title.trim().length >= 5 && canProceed.value && !!form.language_code
  })

  // Detect which step has an error
  function detectErrorStep(): number | null {
    // Step 1: Content type
    if (!form.content_type) {
      return 1
    }

    // Step 2: URL for link/video/audio/image, title for text/poll
    if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
      if (!form.url.trim() || !isValidUrl(form.url.trim())) {
        return 2
      }
    } else {
      if (!form.title.trim() || form.title.trim().length < 5) {
        return 2
      }
    }

    // Step 3: Title and description for link/video/audio/image, content for text/poll
    if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
      if (!form.title.trim() || form.title.trim().length < 5) {
        return 3
      }
      if (!form.content.trim() || form.content.trim().length < 10) {
        return 3
      }
    }
    if (form.content_type === 'text' && form.content.trim().length < 10) {
      return 3
    }
    if (form.content_type === 'poll' && form.poll_options.filter((o) => o.trim()).length < 2) {
      return 3
    }

    // Step 4: Language
    if (!form.language_code) {
      return 4
    }

    return null
  }

  // Get specific error message for a step
  function getStepErrorMessage(step: number): string {
    switch (step) {
      case 1:
        return t('submit.validation.content_type_required')
      case 2:
        // For link/video/audio/image: URL
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          if (!form.url.trim()) {
            return t('submit.validation.url_required')
          }
          if (!isValidUrl(form.url.trim())) {
            return t('submit.validation.invalid_url')
          }
        }
        // For text/poll: title
        if (!form.title.trim() || form.title.trim().length < 5) {
          return t('submit.validation.title_min_length')
        }
        return t('submit.validation.complete_required_fields')
      case 3:
        // For link/video/audio/image: title and description
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          if (!form.title.trim() || form.title.trim().length < 5) {
            return t('submit.validation.title_min_length')
          }
          if (!form.content.trim() || form.content.trim().length < 10) {
            return t('submit.validation.description_min_length_content_type')
          }
        }
        if (form.content_type === 'text' && form.content.trim().length < 10) {
          return t('submit.validation.content_min_length')
        }
        if (form.content_type === 'poll' && form.poll_options.filter((o) => o.trim()).length < 2) {
          return t('submit.validation.poll_min_options')
        }
        return t('submit.validation.complete_content')
      case 4:
        if (!form.language_code) {
          return t('submit.form.language_required_notice')
        }
        return t('submit.validation.complete_required_fields')
      default:
        return t('submit.validation.form_errors')
    }
  }

  // Validate current step
  function validateCurrentStep(): boolean {
    resetErrors()

    switch (currentStep.value) {
      case 1:
        // No specific validations for step 1
        break
      case 2:
        // For link/video/audio/image: validate URL in step 2
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          validateUrl()
        } else {
          // For text/poll: validate title
          validateTitle()
        }
        break
      case 3:
        // For link/video/audio/image: validate title and description in step 3
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          validateTitle()
          validateContent()
        } else if (form.content_type === 'text') {
          validateContent()
        } else if (form.content_type === 'poll') {
          validatePollOptions()
        }
        break
      case 4:
        // Final validations if needed
        break
    }

    return Object.values(errors).every((error) => error === '')
  }

  // Validate all form steps
  function validateAllSteps(): boolean {
    resetErrors()

    // Validate step 1: Content type
    if (!form.content_type) {
      return false
    }

    // For link/video/audio/image: validate URL first (step 2)
    if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
      if (!form.url.trim()) {
        errors.url = t('submit.validation.url_required')
        return false
      }
      if (!isValidUrl(form.url.trim())) {
        errors.url = t('submit.validation.url_invalid')
        return false
      }
    }

    // Validate title (step 2 for text/poll, step 3 for others)
    if (!form.title.trim() || form.title.trim().length < 5) {
      errors.title = t('submit.validation.title_min_length')
      return false
    }

    // For link/video/audio/image: validate description (step 3)
    if (['link', 'video', 'audio', 'image'].includes(form.content_type) && !form.content.trim()) {
      errors.content = t('submit.validation.description_required')
      return false
    }

    // For text: validate content (step 3)
    if (form.content_type === 'text') {
      if (form.content.trim().length < 10) {
        errors.content = t('submit.validation.content_min_length')
        return false
      }
    }

    // For poll: validate options (step 3)
    if (form.content_type === 'poll') {
      const validOptions = form.poll_options.filter((o) => o.trim()).length
      if (validOptions < 2) {
        errors.poll_options = t('submit.validation.poll_min_options')
        return false
      }
    }

    return true
  }

  // Scroll to first error field
  function scrollToFirstError(): void {
    if (!postFormRef.value) return

    const firstErrorField = postFormRef.value.querySelector('.border-red-500')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ;(firstErrorField as HTMLElement).focus()
    }
  }

  // Navigate to step with error
  function navigateToErrorStep(): boolean {
    const errorStep = detectErrorStep()

    if (errorStep !== null && errorStep !== currentStep.value) {
      currentStep.value = errorStep

      // Show specific error message
      const errorMsg = getStepErrorMessage(errorStep)
      warning(errorMsg, { priority: 'normal' })

      // Scroll to first field with error after small delay
      setTimeout(() => {
        scrollToFirstError()
      }, 300)

      return true // Indicates we navigated to an error
    }

    return false // No errors or already on correct step
  }

  return {
    // Computed
    canProceed,
    isFormValid,
    // Functions
    isValidUrl,
    resetErrors,
    validateTitle,
    validateUrl,
    validateContent,
    validatePollOptions,
    validateCurrentStep,
    validateAllSteps,
    detectErrorStep,
    getStepErrorMessage,
    scrollToFirstError,
    navigateToErrorStep,
  }
}
