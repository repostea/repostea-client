<template>
  <div ref="postForm" class="p-3 sm:p-6" :data-hydrated="isHydrated">
    <!-- Success message -->
    <div
      v-if="successMessage"
      class="mb-6 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-4 rounded-lg border border-green-200 dark:border-green-800"
    >
      <div class="flex items-center">
        <Icon name="fa6-solid:circle-check" class="text-green-500 mr-3" aria-hidden="true" />
        <p class="font-medium">{{ successMessage }}</p>
      </div>
    </div>

    <!-- Notifications now handled globally by NotificationContainer -->

    <!-- General error message -->
    <div
      v-if="errorMessage"
      class="mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg border border-red-200 dark:border-red-800"
      data-testid="error-message"
    >
      <div class="flex items-center">
        <Icon name="fa6-solid:circle-exclamation" class="text-red-500 mr-3" aria-hidden="true" />
        <p class="font-medium">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Wizard content (hidden if successful) -->
    <div v-if="!successMessage">
      <!-- Progress indicator -->
      <WizardProgress
        :current-step="currentStep"
        :total-steps="totalSteps"
        :percentage="getProgressPercentage()"
      />

      <!-- Step 1: Content type -->
      <ContentTypeSelector
        v-if="currentStep === 1"
        :content-types="contentTypes"
        :selected-type="form.content_type"
        @select="selectContentType"
      />

      <!-- Step 2: For links/audio/video/image = URL, For others = Title and description -->
      <div v-if="currentStep === 2" class="space-y-6">
        <!-- LINKS, VIDEO, AUDIO, IMAGE: Step 2 = URL -->
        <MediaUrlStep
          v-if="['link', 'video', 'audio', 'image'].includes(form.content_type)"
          v-model="form.url"
          :content-type="form.content_type"
          :error="errors.url"
          :title="getStep2UrlTitle()"
          :subtitle="getStep2UrlSubtitle()"
          :placeholder="getUrlPlaceholder()"
          @blur="validateUrl"
          @paste="handleLinkUrlPaste"
          @image-uploaded="handleImageUploaded"
          @image-deleted="handleImageDeleted"
          @show-audio-help="showAudioHelp = true"
        />

        <!-- TEXT, POLL: Step 2 = Title -->
        <TitleStep
          v-else
          v-model="form.title"
          :error="errors.title"
          @blur="validateTitle"
        />
      </div>

      <!-- Step 3: For links/audio/video/image = Title/Description, For text/poll = Content -->
      <div v-if="currentStep === 3" class="space-y-6">
        <!-- LINKS, VIDEO, AUDIO, IMAGE: Step 3 = Title and Description -->
        <MediaDetailsStep
          v-if="['link', 'video', 'audio', 'image'].includes(form.content_type)"
          :is-loading="isLoadingMetadata"
          :metadata-applied="metadataApplied"
          :metadata-error="metadataError"
          :title="form.title"
          :title-error="errors.title"
          :content="form.content"
          :content-error="errors.content"
          @update:title="form.title = $event"
          @update:content="form.content = $event"
          @title-blur="validateTitle"
          @content-blur="validateContent"
        />

        <!-- TEXT, POLL: Step 3 = Content -->
        <template v-else>
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2">{{ getStep3Title() }}</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ getStep3Subtitle() }}</p>
          </div>

          <div class="w-full">
            <!-- Text content with markdown editor -->
            <TextContentStep
              v-if="form.content_type === 'text'"
              ref="textContentStepRef"
              :title-value="form.title"
              :title-error="errors.title"
              :content="form.content"
              :content-error="errors.content"
              :preview-active="articlePreviewActive"
              @update:title-value="form.title = $event"
              @update:content="form.content = $event"
              @title-blur="validateTitle"
              @toggle-preview="toggleArticlePreview"
              @toggle-fullscreen="toggleArticleFullscreen"
            />

            <!-- Poll options -->
            <PollCreationStep
              v-if="form.content_type === 'poll'"
              :content="form.content"
              :poll-options="form.poll_options"
              :expiration-option="pollExpirationOption"
              :allow-multiple="form.allow_multiple_options"
              :poll-has-votes="pollHasVotes"
              :is-edit-mode="isEditMode"
              @update:content="form.content = $event"
              @update:poll-options="form.poll_options = $event"
              @update:expiration-option="pollExpirationOption = $event"
              @update:allow-multiple="form.allow_multiple_options = $event"
              @add-option="addPollOption"
              @remove-option="removePollOption"
            />
          </div>
        </template>
      </div>

      <!-- Step 4: Optional details -->
      <PostDetailsStep
        v-if="currentStep === 4"
        :language-code="form.language_code"
        :sub-id="form.sub_id"
        :my-subs="mySubs"
        :current-post-sub="currentPostSub"
        :is-anonymous="form.is_anonymous"
        :is-nsfw="form.is_nsfw"
        :should-federate="shouldFederate"
        :is-federation-enabled="isFederationEnabled"
        :is-authenticated="authStore.isAuthenticated"
        :is-guest="authStore.isGuest"
        :content-type="form.content_type"
        :thumbnail-url="form.thumbnail_url"
        :effective-post-id="effectivePostId"
        :post-relationships="postRelationships"
        @update:language-code="form.language_code = $event"
        @update:sub-id="form.sub_id = $event"
        @update:is-anonymous="form.is_anonymous = $event"
        @update:is-nsfw="form.is_nsfw = $event"
        @update:should-federate="shouldFederate = $event"
        @thumbnail-updated="handleThumbnailUpdated"
        @thumbnail-deleted="handleThumbnailDeleted"
        @add-relationship="openAddRelationshipModal"
        @remove-relationship="removeRelationship"
      />

      <!-- Indicador de campos requeridos (sutil al final) -->
      <div v-if="currentStep >= 2 && currentStep <= 3" class="mt-4 text-center">
        <RequiredFieldIndicator />
      </div>

      <!-- Navigation -->
      <WizardNavigation
        :current-step="currentStep"
        :total-steps="totalSteps"
        :can-proceed="canProceed"
        :is-submitting="isSubmitting"
        :saving-as-draft="savingAsDraft"
        :is-form-valid="isFormValid"
        @previous="previousStep"
        @next="nextStep"
        @save-draft="submitPost('draft')"
        @publish="submitPost('published')"
      />
    </div>
    <!-- Fin del contenido del wizard -->

    <!-- Modal de ayuda de plataformas de audio -->
    <AudioPlatformsModal :is-open="showAudioHelp" @close="showAudioHelp = false" />

    <!-- Add relationships modal -->
    <AddRelationshipModal
      v-if="showAddRelationship && effectivePostId"
      :post-id="effectivePostId"
      :current-post-title="form.title"
      :post-author-id="authStore.user?.id"
      :initial-category="selectedRelationCategory"
      @close="closeAddRelationshipModal"
      @created="handleRelationshipCreated"
    />
  </div>
</template>

<script setup>
  import { ref, computed, reactive, onMounted, watch, nextTick } from 'vue'
  import { useI18n } from '#i18n'
  import { usePostsStore } from '~/stores/posts'
  import { useAuthStore } from '~/stores/auth'
  import { useSubsStore } from '~/stores/subs'
  import { useNuxtApp } from '#app'
  import { useRoute } from 'vue-router'
  import { useNotification } from '~/composables/useNotification'
  import { useUrlMetadata } from '~/composables/useUrlMetadata'
  import { useActivityPub } from '~/composables/useActivityPub'
  import { useWizardValidation } from '~/composables/useWizardValidation'
  import { usePostSubmission } from '~/composables/usePostSubmission'
  import MarkdownEditor from '~/components/posts/MarkdownEditor.vue'
  import DescriptionEditor from '~/components/posts/DescriptionEditor.vue'
  import ThumbnailUploader from '~/components/posts/ThumbnailUploader.vue'
  import ImageUploader from '~/components/posts/ImageUploader.vue'
  import RequiredFieldIndicator from '~/components/common/RequiredFieldIndicator.vue'
  import AudioPlatformsModal from '~/components/help/AudioPlatformsModal.vue'
  import AddRelationshipModal from '~/components/posts/AddRelationshipModal.vue'
  import PostLanguageSelector from '~/components/posts/PostLanguageSelector.vue'
  import PostSubSelector from '~/components/posts/PostSubSelector.vue'

  const { t } = useI18n()
  const postsStore = usePostsStore()
  const authStore = useAuthStore()
  const subsStore = useSubsStore()
  const { $api } = useNuxtApp()
  const { success, error: showError, warning, info } = useNotification()

  // URL metadata extraction for links
  const {
    isLoading: isLoadingMetadata,
    error: metadataError,
    fetchMetadata,
    clearMetadata,
  } = useUrlMetadata()
  const metadataApplied = ref(false) // Track if metadata was applied to form
  const suggestedThumbnailUrl = ref(null) // URL de imagen sugerida (no auto-aplicada)

  // ActivityPub federation
  const {
    isFederationEnabled,
    defaultFederatePosts,
    fetchUserSettings: fetchFederationSettings,
  } = useActivityPub()
  const shouldFederate = ref(false) // Local state for this post's federation setting

  // Get user's subscribed subs
  const mySubs = computed(() => subsStore.getMySubs || [])

  const props = defineProps({
    initialData: {
      type: Object,
      default: () => ({}),
    },
    externalSource: {
      type: String,
      default: null,
    },
    editMode: {
      type: Boolean,
      default: false,
    },
    postId: {
      type: [Number, String],
      default: null,
    },
  })

  const emit = defineEmits(['submit', 'cancel', 'update'])

  // Get route to read query parameters
  const route = useRoute()

  // Wizard state
  const currentStep = ref(1)
  const totalSteps = 4
  const postForm = ref(null)

  const errors = reactive({
    title: '',
    url: '',
    content: '',
    tags: '',
    poll_options: '',
  })

  // Form data
  const form = reactive({
    title: '',
    content_type: '',
    url: '',
    content: '',
    is_anonymous: false,
    is_nsfw: false,
    poll_options: ['', ''],
    language_code: '',
    is_original: false,
    thumbnail_url: '',
    expires_at: null,
    allow_multiple_options: false,
    tags: [],
    source: props.externalSource || '',
    source_name: props.externalSource || '',
    source_url: '',
    sub_id: null, // null means "General" (no sub)
  })

  const showAIAssistant = ref(false)
  const aiAssistantMode = ref('title')
  const pollExpirationOption = ref('1w')
  const isEditMode = computed(() => props.editMode)
  const isHydrated = ref(false)
  const savedDraftId = ref(null)

  // Initialize validation composable
  const {
    canProceed,
    isFormValid,
    isValidUrl,
    resetErrors,
    validateTitle,
    validateUrl: validateUrlBase,
    validateContent,
    validatePollOptions,
    validateCurrentStep,
    validateAllSteps,
    detectErrorStep,
    getStepErrorMessage,
    scrollToFirstError,
    navigateToErrorStep,
  } = useWizardValidation({
    form,
    errors,
    currentStep,
    postFormRef: postForm,
    t,
    warning,
  })

  // Initialize submission composable
  const {
    isSubmitting,
    savingAsDraft,
    successMessage,
    errorMessage,
    detectMediaProvider,
    calculatePollExpiration,
    submitPost: submitPostBase,
  } = usePostSubmission({
    form,
    errors,
    currentStep,
    isEditMode,
    postId: props.postId,
    savedDraftId,
    externalSource: props.externalSource,
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
  })

  const showAudioHelp = ref(false)
  const showAddRelationship = ref(false)
  const selectedRelationCategory = ref(null)
  const postRelationships = ref([])
  const pollHasVotes = ref(false)
  const currentPostSub = ref(null)
  const articleEditor = ref(null)
  const articlePreviewActive = ref(false)

  // Computed for the effective postId passed to ThumbnailUploader
  const effectivePostId = computed(() => {
    return savedDraftId.value || props.postId
  })

  // Notification system (migrated to useNotification)

  // Content types
  const contentTypes = computed(() => [
    {
      value: 'link',
      title: t('submit.form.type_link'),
      description: t('submit.wizard.link_description'),
      icon: 'fa6-solid:link',
      color: 'text-blue-500',
    },
    {
      value: 'text',
      title: t('submit.form.type_text'),
      description: t('submit.wizard.text_description'),
      icon: 'fa6-solid:file-lines',
      color: 'text-green-500',
    },
    {
      value: 'video',
      title: t('submit.form.type_video'),
      description: t('submit.wizard.video_description'),
      icon: 'fa6-solid:video',
      color: 'text-red-500',
    },
    {
      value: 'audio',
      title: t('submit.form.type_audio'),
      description: t('submit.wizard.audio_description'),
      icon: 'fa6-solid:headphones',
      color: 'text-purple-500',
    },
    {
      value: 'image',
      title: t('submit.form.type_image'),
      description: t('submit.wizard.image_description'),
      icon: 'fa6-solid:image',
      color: 'text-pink-500',
    },
    {
      value: 'poll',
      title: t('submit.form.type_poll'),
      description: t('submit.wizard.poll_description'),
      icon: 'fa6-solid:square-poll-vertical',
      color: 'text-primary',
    },
  ])


  // Function to calculate more intuitive progress
  function getProgressPercentage() {
    switch (currentStep.value) {
      case 1:
        // Step 1: 0% at start, 25% when type is selected
        return form.content_type !== '' ? 25 : 0
      case 2:
        // Step 2: 25% at start, 50% when URL or title is complete
        return canProceed.value ? 50 : 25
      case 3:
        // Step 3: 50% at start, 75% when content is complete
        return canProceed.value ? 75 : 50
      case 4:
        // Step 4: 75% at start, 100% when ready to submit
        return isFormValid.value ? 100 : 75
      default:
        return 0
    }
  }

  // Methods
  function selectContentType(type) {
    form.content_type = type
    if (type === 'poll' && form.poll_options.length < 2) {
      form.poll_options = ['', '']
    }

    // Auto-advance to next step after a small delay
    setTimeout(() => {
      if (currentStep.value === 1 && canProceed.value) {
        nextStep()
      }
    }, 300) // Small delay so user can see the selection
  }

  async function nextStep() {
    // Validate current step before advancing
    if (!validateCurrentStep()) {
      // If there are errors, show notification and don't advance
      const errorMsg = getStepErrorMessage(currentStep.value)
      warning(errorMsg, { priority: 'normal', timeout: 5000 })

      // Focus on first field with error
      setTimeout(() => {
        scrollToFirstError()
      }, 300)

      return
    }

    // For links: fetch metadata when going from step 2 to step 3
    if (form.content_type === 'link' && currentStep.value === 2) {
      await fetchAndApplyMetadata()
    }

    // If moving from step 3 to 4, auto-save as draft
    if (currentStep.value === 3 && !isEditMode.value && !savedDraftId.value) {
      try {
        // Save post as draft (submitPost handles isSubmitting internally)
        const draftPost = await submitPost('draft', true) // true = don't reset form

        if (draftPost && draftPost.id) {
          savedDraftId.value = draftPost.id
          // Show subtle confirmation notification
          success(t('posts.draft_saved_auto'), { priority: 'low', timeout: 4000 })

          // Auto-download suggested thumbnail if exists
          if (suggestedThumbnailUrl.value) {
            downloadSuggestedThumbnail()
          }
        }
      } catch (err) {
        console.error('Error auto-saving draft:', err)
        showError(t('posts.draft_save_error'), { priority: 'high', timeout: 5000 })
        return // Don't advance if save failed
      }
    }

    if (canProceed.value && currentStep.value < totalSteps) {
      currentStep.value++
    }
  }

  function previousStep() {
    if (currentStep.value > 1) {
      // Reset metadata when going back to URL step for links
      if (form.content_type === 'link' && currentStep.value === 3) {
        clearMetadata()
        metadataApplied.value = false
        suggestedThumbnailUrl.value = null
      }
      currentStep.value--
    }
  }

  // Extended validateUrl that also auto-detects content type
  function validateUrl() {
    validateUrlBase()

    if (form.url) {
      autoDetectContentType(form.url)
      form.media_provider = detectMediaProvider(form.url)
    }
  }

  function toggleArticlePreview() {
    if (articleEditor.value) {
      articleEditor.value.togglePreview()
      articlePreviewActive.value = !articlePreviewActive.value
    }
  }

  function toggleArticleFullscreen() {
    if (articleEditor.value) {
      articleEditor.value.toggleFullscreen()
    }
  }

  async function handleLinkUrlPaste() {
    // Wait for value to update after paste
    await nextTick()

    // Normalize URL
    if (form.url && !form.url.match(/^https?:\/\/.*$/)) {
      form.url = 'https://' + form.url
    }

    validateUrl()
  }

  async function fetchAndApplyMetadata() {
    // Only extract metadata if not already applied for this URL
    const result = await fetchMetadata(form.url)

    if (result) {
      // Apply metadata to form only if fields are empty
      if (result.title && !form.title.trim()) {
        form.title = result.title
      }
      if (result.description && !form.content.trim()) {
        form.content = result.description
      }
      // Save image for download after creating draft
      if (result.image) {
        suggestedThumbnailUrl.value = result.image
      }

      metadataApplied.value = true
    }
  }

  // Download suggested thumbnail to server
  async function downloadSuggestedThumbnail() {
    if (!suggestedThumbnailUrl.value || !effectivePostId.value) return

    try {
      const response = await $api.images.uploadPostThumbnailFromUrl(
        effectivePostId.value,
        suggestedThumbnailUrl.value,
        { silent: true }
      )
      if (response.data?.image?.urls) {
        form.thumbnail_url = response.data.image.urls.url
      }
    } catch {
      // Silent fail - image format not supported or download failed
      // User can still upload manually in step 4
    } finally {
      suggestedThumbnailUrl.value = null
    }
  }


  function addPollOption() {
    if (form.poll_options.length < 10) {
      form.poll_options.push('')
    }
  }

  function removePollOption(index) {
    if (form.poll_options.length > 2) {
      form.poll_options.splice(index, 1)
    }
  }

  function getStep2UrlTitle() {
    switch (form.content_type) {
      case 'link':
        return t('submit.wizard.link_url_step')
      case 'video':
        return t('submit.wizard.video_step')
      case 'audio':
        return t('submit.wizard.audio_step')
      case 'image':
        return t('submit.wizard.image_step')
      default:
        return t('submit.wizard.content_step')
    }
  }

  function getStep2UrlSubtitle() {
    switch (form.content_type) {
      case 'link':
        return t('submit.wizard.link_url_subtitle')
      case 'video':
        return t('submit.wizard.video_subtitle')
      case 'audio':
        return t('submit.wizard.audio_subtitle')
      case 'image':
        return t('submit.wizard.image_subtitle')
      default:
        return ''
    }
  }

  function getStep3Title() {
    switch (form.content_type) {
      case 'link':
      case 'video':
      case 'audio':
      case 'image':
        return t('submit.wizard.title_step')
      case 'text':
        return t('submit.wizard.text_step')
      case 'poll':
        return t('submit.wizard.poll_step')
      default:
        return t('submit.wizard.content_step')
    }
  }

  function getStep3Subtitle() {
    switch (form.content_type) {
      case 'link':
      case 'video':
      case 'audio':
      case 'image':
        return t('submit.wizard.title_subtitle')
      case 'text':
        return t('submit.wizard.text_subtitle')
      case 'poll':
        return t('submit.wizard.poll_subtitle')
      default:
        return ''
    }
  }

  function getUrlPlaceholder() {
    switch (form.content_type) {
      case 'video':
        return 'https://youtube.com/watch?v=...'
      case 'audio':
        return 'https://soundcloud.com/...'
      case 'image':
        return 'https://i.imgur.com/ejemplo.jpg'
      default:
        return 'https://ejemplo.com'
    }
  }

  function showAINotAvailable() {
    // Show notification that AI Assistant is not available
    info(t('submit.ai_assistant_not_available'), { priority: 'normal' })
  }

  function toggleAIAssistant(mode) {
    aiAssistantMode.value = mode
    showAIAssistant.value = !showAIAssistant.value
  }

  function updateTags(newTags) {
    form.tags = Array.isArray(newTags) ? newTags : []
  }

  function setContentType(type) {
    form.content_type = type

    if (type === 'text' || type === 'poll') {
      form.url = ''
    }

    if (form.url && (type === 'video' || type === 'audio')) {
      form.media_provider = detectMediaProvider(form.url)
    }

    if (type === 'poll' && form.poll_options.length === 0) {
      form.poll_options = ['', ''] // Initialize with two empty options
    }
  }

  function autoDetectContentType(url) {
    if (!url) return

    const videoRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|facebook\.com\/watch|dailymotion\.com|twitter\.com|x\.com)\/.*$/i
    const audioRegex =
      /^(https?:\/\/)?(www\.)?(soundcloud\.com|spotify\.com\/(track|album|show|episode|podcast)|podcasts\.apple\.com|player\.simplecast\.com)\/.*$/i

    if (videoRegex.test(url)) {
      form.content_type = 'video'
    } else if (audioRegex.test(url)) {
      form.content_type = 'audio'
    } else if (['video', 'audio'].includes(form.content_type)) {
      form.content_type = 'link'
    }
  }

  async function loadPostData() {
    if (props.editMode && props.postId) {
      isSubmitting.value = true
      try {
        const post = await postsStore.fetchPost(props.postId)

        // Check if trying to edit a poll - temporarily disabled
        if (post.content_type === 'poll') {
          showError(t('posts.poll_edit_disabled'))
          emit('cancel')
          return
        }

        form.title = post.title || ''
        form.url = post.url || ''
        form.content = post.content || post.body || ''
        form.thumbnail_url = post.thumbnail_url || ''
        form.content_type = post.content_type || ''
        form.media_provider = post.media_provider || ''
        form.is_original = post.is_original || false
        form.tags = post.tags || []
        form.is_anonymous = post.is_anonymous || false
        form.language_code = post.language_code || 'es'
        form.sub_id = post.sub?.id || null
        currentPostSub.value = post.sub || null

        // Load poll data if it's a poll (this won't execute due to check above)
        if (post.content_type === 'poll' && post.poll) {
          form.poll_options = post.poll.options.map((opt) => opt.text) || ['', '']
          form.allow_multiple_options = post.poll.allow_multiple_options || false
          pollHasVotes.value = post.poll.total_votes > 0

          // Set expires_at if poll has expiration
          if (post.poll.expires_at) {
            form.expires_at = new Date(post.poll.expires_at)
          }
        }
      } catch (error) {
        errorMessage.value = t('posts.load_error')
        console.error('Error al cargar post:', error)
      } finally {
        isSubmitting.value = false
      }
    }
  }

  function handleThumbnailUpdated(urls) {
    form.thumbnail_url = urls.url
  }

  function handleThumbnailDeleted() {
    form.thumbnail_url = ''
  }

  function handleImageUploaded(imageData) {
    form.url = imageData.url
    errors.url = ''
  }

  function handleImageDeleted() {
    form.url = ''
  }

  // Wrapper to pass emit to composable's submitPost
  async function submitPost(status = 'published', keepForm = false) {
    return await submitPostBase(status, keepForm, {
      submit: (response) => emit('submit', response),
      update: (response) => emit('update', response),
    })
  }

  // Watchers and lifecycle
  watch(
    () => props.initialData,
    (newVal) => {
      if (newVal) {
        form.title = newVal.title || ''
        form.url = newVal.url || ''
        form.content = newVal.content || newVal.body || ''
        form.thumbnail_url = newVal.thumbnail_url || ''
        form.source = newVal.source || props.externalSource || ''
        form.source_name = newVal.source_name || props.externalSource || ''
        form.source_url = newVal.source_url || newVal.url || ''
        form.content_type = newVal.content_type || ''
        form.media_provider = newVal.media_provider || ''
        form.tags = newVal.tags || []
        form.is_original = newVal.is_original || false
        form.is_anonymous = newVal.is_anonymous || false
        form.language_code = newVal.language_code || 'es'

        if (props.externalSource) {
          form.is_original = false
        }
      }
    },
    { immediate: true }
  )

  // Cargar relaciones cuando hay un post ID
  async function loadRelationships() {
    if (!effectivePostId.value) return

    try {
      const response = await $api.posts.getRelationships(effectivePostId.value)
      const data = response.data?.data || {}

      // Handle new grouped structure
      if (data.own !== undefined && data.external !== undefined) {
        // Flatten both arrays into single array for display
        postRelationships.value = [...(data.own || []), ...(data.external || [])]
      } else {
        // Fallback for old structure (backwards compatibility)
        postRelationships.value = Array.isArray(data) ? data : []
      }
    } catch (err) {
      console.error('Error loading relationships:', err)
    }
  }

  // Open add relationship modal with specific category
  function openAddRelationshipModal(category) {
    selectedRelationCategory.value = category
    showAddRelationship.value = true
  }

  // Close add relationship modal
  function closeAddRelationshipModal() {
    showAddRelationship.value = false
    selectedRelationCategory.value = null
  }

  // Handle relationship creation
  function handleRelationshipCreated() {
    closeAddRelationshipModal()
    loadRelationships()
  }

  // Remove relationship
  async function removeRelationship(relationshipId) {
    if (!effectivePostId.value) return

    try {
      await $api.posts.deleteRelationship(effectivePostId.value, relationshipId)
      postRelationships.value = postRelationships.value.filter((r) => r.id !== relationshipId)
    } catch (err) {
      console.error('Error deleting relationship:', err)
    }
  }

  // Watch to load relationships when draft is created
  watch(effectivePostId, (newVal) => {
    if (newVal) {
      loadRelationships()
    }
  })

  onMounted(async () => {
    // Mark component as hydrated for E2E tests
    isHydrated.value = true

    // Fetch user's subscribed subs if authenticated
    if (authStore.isAuthenticated && !authStore.isGuest) {
      try {
        await subsStore.fetchSubs({ my_subs: true })
      } catch (error) {
        console.error('Error fetching subs:', error)
      }

      // Fetch federation settings and set default
      try {
        await fetchFederationSettings()
        shouldFederate.value = defaultFederatePosts.value
      } catch (error) {
        console.error('Error fetching federation settings:', error)
      }
    }

    // Check if there's a sub query parameter and preselect it
    if (route.query.sub) {
      // Check if it's a numeric ID or a name
      const subParam = route.query.sub
      const subId = parseInt(subParam)

      if (!isNaN(subId)) {
        // It's an ID, use it directly
        form.sub_id = subId
      } else {
        // It's a name, find the sub by name
        // Wait a bit for mySubs to be populated after fetchSubs
        await nextTick()
        const sub = mySubs.value.find((s) => s.name === subParam)
        if (sub) {
          form.sub_id = sub.id
        } else {
          // If not found in user's subs, try to fetch the sub by name from the API
          try {
            const fetchedSub = await subsStore.fetchSub(subParam)
            if (fetchedSub) {
              form.sub_id = fetchedSub.id
            }
          } catch {
            // Sub not found, ignore
          }
        }
      }
    }

    if (props.editMode && props.postId) {
      await loadPostData()
    }
    // Cargar relaciones si ya hay un post ID
    if (effectivePostId.value) {
      loadRelationships()
    }
  })
</script>

<style scoped>
  .wizard-input-border {
    border-color: var(--color-border-default);
  }

  .wizard-form-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }

  .wizard-checkbox-border {
    border-color: var(--color-border-default);
  }

  .wizard-relations-box {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .wizard-relation-btn {
    border: 2px solid var(--color-border-default);
  }

  .wizard-relation-btn:hover {
    border-color: var(--color-border-strong);
  }

  .wizard-relation-item {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .wizard-nav-btn {
    border: 1px solid var(--color-border-default);
  }

  .wizard-nav-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .wizard-draft-btn {
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .wizard-draft-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .wizard-progress-bg {
    background-color: var(--color-border-default);
  }

  .wizard-type-border-inactive {
    border-color: var(--color-border-default);
  }

  .wizard-nav-border-top {
    border-top: 1px solid var(--color-border-default);
  }

  .wizard-metadata-preview {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
