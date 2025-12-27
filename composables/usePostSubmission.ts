import { ref, type Ref, type ComputedRef } from 'vue'
import postService from '~/services/postService'

export interface PostForm {
  title: string
  content_type: string
  url: string
  content: string
  is_anonymous: boolean
  is_nsfw: boolean
  poll_options: string[]
  language_code: string
  is_original: boolean
  thumbnail_url: string
  expires_at: Date | null
  allow_multiple_options: boolean
  tags: Array<{ id: number } | number>
  source: string
  source_name: string
  source_url: string
  sub_id: number | null
  media_provider?: string
}

export interface PostSubmissionErrors {
  title: string
  url: string
  content: string
  tags: string
  poll_options: string
}

export interface UsePostSubmissionOptions {
  form: PostForm
  errors: PostSubmissionErrors
  currentStep: Ref<number>
  isEditMode: ComputedRef<boolean>
  postId: number | string | null
  savedDraftId: Ref<number | null>
  externalSource: string | null
  shouldFederate: Ref<boolean>
  pollExpirationOption: Ref<string>
  postsStore: {
    createPost: (data: Record<string, unknown>) => Promise<unknown>
    importPost: (data: Record<string, unknown>) => Promise<unknown>
  }
  $api: {
    posts: Record<string, unknown>
  }
  t: (key: string) => string
  warning: (message: string, options?: Record<string, unknown>) => void
  validateAllSteps: () => boolean
  navigateToErrorStep: () => boolean
  isFormValid: ComputedRef<boolean>
  resetErrors: () => void
  scrollToFirstError: () => void
}

export function usePostSubmission(options: UsePostSubmissionOptions) {
  const {
    form,
    errors,
    currentStep,
    isEditMode,
    postId,
    savedDraftId,
    externalSource,
    shouldFederate,
    pollExpirationOption,
    postsStore,
    $api,
    t,
    warning,
    validateAllSteps,
    navigateToErrorStep,
    isFormValid,
    resetErrors,
    scrollToFirstError,
  } = options

  const isSubmitting = ref(false)
  const savingAsDraft = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

  // Detect media provider from URL
  function detectMediaProvider(url: string): string {
    if (!url) return ''

    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('vimeo.com')) return 'vimeo'
    if (url.includes('soundcloud.com')) return 'soundcloud'
    if (url.includes('spotify.com')) return 'spotify'
    return ''
  }

  // Calculate poll expiration date
  function calculatePollExpiration(): Date | null {
    if (pollExpirationOption.value === 'never') {
      return null
    }

    const now = new Date()

    switch (pollExpirationOption.value) {
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
  }

  // Reset form to initial state
  function resetForm(): void {
    Object.assign(form, {
      title: '',
      content_type: '',
      url: '',
      content: '',
      is_anonymous: false,
      poll_options: ['', ''],
      language_code: 'es',
      is_original: false,
      thumbnail_url: '',
      expires_at: null,
      allow_multiple_options: false,
      tags: [],
      source: externalSource || '',
      source_name: externalSource || '',
      source_url: '',
    })
    currentStep.value = 1
  }

  // Submit post
  async function submitPost(
    status: 'draft' | 'published' = 'published',
    keepForm = false,
    emit?: {
      submit: (response: unknown) => void
      update: (response: unknown) => void
    }
  ): Promise<unknown> {
    if (isSubmitting.value) return

    savingAsDraft.value = status === 'draft'

    // If saving as draft, only validate minimum fields
    if (status === 'draft') {
      // For drafts we only require title
      if (!form.title.trim()) {
        errors.title = t('submit.validation.title_required')
        currentStep.value = 1
        warning(t('submit.validation.title_required'), { priority: 'normal' })
        return
      }
    } else {
      // For publishing, validate entire form
      const hasValidationErrors = !validateAllSteps()

      if (hasValidationErrors) {
        // Auto-navigate to step with error
        const navigatedToError = navigateToErrorStep()

        if (!navigatedToError) {
          // If didn't navigate to a specific step, go to start to review everything
          currentStep.value = 1
          warning(t('submit.validation.review_all_fields'), { priority: 'normal' })
        }

        return
      }

      if (!isFormValid.value) {
        navigateToErrorStep()
        return
      }
    }

    isSubmitting.value = true
    resetErrors()
    errorMessage.value = ''

    try {
      // Handle external sources
      if (externalSource && !form.source) {
        form.source = externalSource
        form.source_name = externalSource
        form.is_original = false
      }

      // Prepare post data
      const postData: Record<string, unknown> = {
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        url: form.url.trim(),
        content_type: form.content_type,
        is_anonymous: form.is_anonymous,
        is_nsfw: form.is_nsfw,
        language_code: form.language_code,
        is_original: form.is_original,
        thumbnail_url: form.thumbnail_url,
        media_provider: detectMediaProvider(form.url),
        tag_ids: form.tags ? form.tags.map((tag) => (typeof tag === 'object' ? tag.id : tag)) : [],
        poll_options:
          form.content_type === 'poll' ? form.poll_options.filter((o) => o.trim()) : undefined,
        expires_at: form.content_type === 'poll' ? calculatePollExpiration() : null,
        allow_multiple_options: form.allow_multiple_options,
        sub_id: form.sub_id,
        status: status,
        should_federate: shouldFederate.value === true ? true : undefined,
      }

      // Remove empty/undefined fields and unnecessary fields
      Object.keys(postData).forEach((key) => {
        if (postData[key] === '' || postData[key] === undefined) {
          delete postData[key]
        }
      })

      // Remove source fields if not importing
      if (!externalSource) {
        delete postData.source
        delete postData.source_name
        delete postData.source_url
      }

      let response

      if (isEditMode.value) {
        response = await postService.updatePost($api as never, postId, postData)
        successMessage.value = t('posts.update_success')
        emit?.update(response)
      } else if (savedDraftId.value) {
        response = await postService.updatePost($api as never, savedDraftId.value, postData)

        if (!keepForm) {
          successMessage.value = status === 'draft' ? t('posts.draft_saved') : t('submit.success')
          emit?.submit(response)
        }
      } else {
        const isImport = !!form.source
        response = isImport
          ? await postsStore.importPost(postData)
          : await postsStore.createPost(postData)

        if (!keepForm) {
          successMessage.value = status === 'draft' ? t('posts.draft_saved') : t('submit.success')
          emit?.submit(response)
        }

        // Reset form after successful submission (only if not auto-save)
        if (!keepForm) {
          resetForm()
        }
      }

      return response
    } catch (error: unknown) {
      console.error('Error submitting post:', error)

      const err = error as {
        response?: {
          data?: {
            errors?: Record<string, string | string[]>
            message?: string
          }
        }
        message?: string
      }

      // Handle validation errors
      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors
        Object.keys(backendErrors).forEach((key) => {
          if ((errors as Record<string, string>)[key] !== undefined) {
            const errorValue = backendErrors[key]
            ;(errors as Record<string, string>)[key] = Array.isArray(errorValue)
              ? errorValue[0]
              : errorValue
          }
        })

        // Try to navigate to the step with the error
        const navigatedToError = navigateToErrorStep()

        if (!navigatedToError) {
          // If we can't navigate to a specific step, show error on current step
          errorMessage.value = err.response?.data?.message || t('submit.validation.error')
        }
      } else {
        errorMessage.value = err.response?.data?.message || err.message || t('submit.error')
      }

      if (!isFormValid.value) {
        setTimeout(scrollToFirstError, 100)
      }
    } finally {
      isSubmitting.value = false
      savingAsDraft.value = false
    }
  }

  return {
    // State
    isSubmitting,
    savingAsDraft,
    successMessage,
    errorMessage,
    // Functions
    detectMediaProvider,
    calculatePollExpiration,
    resetForm,
    submitPost,
  }
}
