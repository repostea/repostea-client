<template>
  <div class="p-6">
    <div
      v-if="successMessage"
      class="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-4 rounded-md border border-green-200 dark:border-green-800 mb-4 flex items-start"
    >
      <Icon name="fa6-solid:circle-check" class="text-green-500 mt-1 mr-3" aria-hidden="true" />
      <div>
        <p class="font-medium">{{ successMessage }}</p>
        <div class="mt-2 flex space-x-3">
          <NuxtLink
            :to="localePath('/')"
            class="text-green-700 dark:text-green-300 hover:underline text-sm"
          >
            {{ t('navigation.home') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/submit')"
            class="text-green-700 dark:text-green-300 hover:underline text-sm"
          >
            {{ t('submit.title') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md border border-red-200 dark:border-red-800 mb-4"
    >
      <p class="font-medium">{{ errorMessage }}</p>
    </div>

    <form v-if="!successMessage" ref="postForm" @submit.prevent="submitPost">
      <div class="mb-4">
        <div class="flex justify-between items-center mb-1">
          <label for="title" class="block text-sm font-medium">
            {{ t('submit.form.title') }} *
          </label>
        </div>
        <input
          id="title"
          v-model="form.title"
          type="text"
          class="post-form-input w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          :class="{ 'border-red-500': errors.title }"
          :aria-invalid="!!errors.title"
          :aria-describedby="errors.title ? 'title-error' : undefined"
          required
          maxlength="255"
        >
        <p v-if="errors.title" id="title-error" role="alert" class="mt-1 text-sm text-red-500">
          {{ errors.title }}
        </p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ t('submit.form.title_help', { max: 255 }) }}
        </p>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">{{ t('submit.form.content_type') }} *</label>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="px-3 py-2 rounded-md text-sm border inline-flex items-center"
            :class="
              form.content_type === 'link'
                ? 'bg-primary text-white border-primary'
                : 'post-form-type-btn-inactive'
            "
            @click="setContentType('link')"
          ><Icon name="fa6-solid:link" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.type_link') }}</span>
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-md text-sm border inline-flex items-center"
            :class="
              form.content_type === 'text'
                ? 'bg-primary text-white border-primary'
                : 'post-form-type-btn-inactive'
            "
            @click="setContentType('text')"
          ><Icon name="fa6-solid:file-lines" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.type_text') }}</span>
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-md text-sm border inline-flex items-center"
            :class="
              form.content_type === 'video'
                ? 'bg-primary text-white border-primary'
                : 'post-form-type-btn-inactive'
            "
            @click="setContentType('video')"
          ><Icon name="fa6-solid:video" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.type_video') }}</span>
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-md text-sm border inline-flex items-center"
            :class="
              form.content_type === 'audio'
                ? 'bg-primary text-white border-primary'
                : 'post-form-type-btn-inactive'
            "
            @click="setContentType('audio')"
          ><Icon name="fa6-solid:headphones" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.type_audio') }}</span>
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-md text-sm border inline-flex items-center"
            :class="
              form.content_type === 'image'
                ? 'bg-primary text-white border-primary'
                : 'post-form-type-btn-inactive'
            "
            @click="setContentType('image')"
          ><Icon name="fa6-solid:image" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.type_image') }}</span>
          </button>
          <button
            type="button"
            class="px-3 py-2 rounded-md text-sm border inline-flex items-center"
            :class="
              form.content_type === 'poll'
                ? 'bg-primary text-white border-primary'
                : 'post-form-type-btn-inactive'
            "
            @click="setContentType('poll')"
          ><Icon name="fa6-solid:square-poll-vertical" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.type_poll') }}</span>
          </button>
        </div>
      </div>

      <component
        :is="currentFormComponent"
        v-if="currentFormComponent"
        v-model:url="form.url"
        v-model:content="form.content"
        v-model:poll-options="form.poll_options"
        v-model:expires-at="form.expires_at"
        v-model:allow-multiple-options="form.allow_multiple_options"
        :error="errors.url"
        :content-error="errors.content"
        :poll-options-error="errors.poll_options"
        :existing-options="existingPollOptions"
        :has-votes="pollHasVotes"
        :is-edit-mode="isEditMode"
        @validate-url="validateUrl"
      />
      <div v-if="!isEditMode" class="mb-4">
        <TagSelector v-model="form.tags" @update:value="updateTags" />
        <p v-if="errors.tags" role="alert" class="mt-1 text-sm text-red-500">
          {{ errors.tags }}
        </p>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">
          {{ t('submit.form.language') }}
          <span class="text-red-500">*</span>
        </label>
        <div v-if="isEditMode && (initialData?.moderated_by || initialData?.language_locked_by_admin)">
          <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600 rounded-lg">
            <p class="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Icon name="fa6-solid:lock" aria-hidden="true" />
              <span>{{ t('submit.form.language_locked') }}</span>
            </p>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-xl">{{ languages.find(l => l.code === form.language_code)?.flag }}</span>
              <span class="font-medium text-text dark:text-text-dark">
                {{ languages.find(l => l.code === form.language_code)?.native }}
              </span>
            </div>
          </div>
        </div>
        <PostLanguageSelector v-else v-model="form.language_code" />
        <p v-if="errors.language_code" role="alert" class="mt-2 text-sm text-red-500 inline-flex items-start"><Icon name="fa6-solid:circle-exclamation" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ errors.language_code }}</span></p>
        <p v-if="!isEditMode || (!initialData?.moderated_by && !initialData?.language_locked_by_admin)" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {{ t('submit.form.language_help') }}
        </p>
      </div>

      <!-- Sub selector -->
      <div v-if="authStore.isAuthenticated && !authStore.isGuest" class="mb-4">
        <label class="block text-sm font-medium mb-2">
          {{ t('subs.post_in_sub') }}
        </label>
        <PostSubSelector v-model="form.sub_id" :my-subs="mySubs" :current-sub="currentPostSub" />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">
          {{ t('submit.form.image') }}
        </label>
        <ClientOnly>
          <ThumbnailUploader
            :current-thumbnail="form.thumbnail_url"
            :post-id="postId"
            @thumbnail-updated="handleThumbnailUpdated"
            @thumbnail-deleted="handleThumbnailDeleted"
          />
        </ClientOnly>
      </div>

      <div
        v-if="externalSource"
        class="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800"
      >
        <div class="flex items-start">
          <Icon name="fa6-solid:circle-info" class="text-blue-500 mt-1 mr-3" aria-hidden="true" />
          <div>
            <p class="text-sm text-blue-800 dark:text-blue-200">
              {{ t('submit.form.external_source_notice', { source: externalSource }) }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="isEditMode && form.status === 'hidden'"
        class="mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800"
      >
        <div class="flex items-start">
          <Icon name="fa6-solid:triangle-exclamation" class="text-red-500 mt-1 mr-3" aria-hidden="true" />
          <div>
            <p class="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              {{ t('posts.post_hidden_by_admin') }}
            </p>
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ t('posts.post_hidden_explanation') }}
            </p>
          </div>
        </div>
      </div>

      <div class="mb-6 space-y-3">
        <div class="flex items-center">
          <input
            v-if="!isEditMode"
            id="is_original"
            v-model="form.is_original"
            type="checkbox"
            class="post-form-checkbox w-6 h-6 rounded text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
            :disabled="!!externalSource"
          >
          <label v-if="!isEditMode" for="is_original" class="ml-2 text-sm">
            {{ t('submit.form.is_original') }}
          </label>
          <input
            v-if="isEditMode"
            id="is_anonymous"
            v-model="form.is_anonymous"
            type="checkbox"
            class="post-form-checkbox w-6 h-6 rounded text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
          >
          <label v-if="isEditMode" for="is_anonymous" class="ml-2 text-sm">
            {{ t('submit.form.is_anonymous') }}
          </label>
        </div>

        <!-- Checkbox NSFW -->
        <div class="flex items-start">
          <input
            id="is_nsfw"
            v-model="form.is_nsfw"
            type="checkbox"
            class="post-form-checkbox w-6 h-6 mt-0.5 rounded text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isEditMode && (initialData?.moderated_by || initialData?.nsfw_locked_by_admin)"
          >
          <div class="ml-2">
            <label for="is_nsfw" class="text-sm font-medium">
              {{ t('submit.form.is_nsfw') }}
            </label>
            <p v-if="isEditMode && (initialData?.moderated_by || initialData?.nsfw_locked_by_admin)" class="text-xs text-amber-600 dark:text-amber-400 mt-1 inline-flex items-start"><Icon name="fa6-solid:lock" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.nsfw_locked') }}</span></p>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ t('submit.form.nsfw_help') }}
            </p>
          </div>
        </div>

        <!-- Federation toggle (only in edit mode and if federation is enabled) -->
        <div v-if="isEditMode && isFederationEnabled" class="flex items-start">
          <input
            id="should_federate"
            v-model="form.should_federate"
            type="checkbox"
            class="post-form-checkbox w-6 h-6 mt-0.5 rounded text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
          >
          <div class="ml-2">
            <label for="should_federate" class="text-sm font-medium inline-flex items-center gap-1">
              <Icon name="fa6-solid:globe" class="text-primary" aria-hidden="true" />
              {{ t('submit.form.federate_post') }}
            </label>
            <p v-if="initialData?.federation?.is_federated" class="text-xs text-green-600 dark:text-green-400 mt-1 inline-flex items-center gap-1">
              <Icon name="fa6-solid:circle-check" aria-hidden="true" />
              {{ t('submit.form.already_federated') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ t('submit.form.federate_help') }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3">
        <button
          type="button"
          class="post-form-cancel-btn px-4 py-2 rounded-md transition-colors"
          @click="$emit('cancel')"
        >
          {{ t('submit.form.cancel') }}
        </button>
        <button
          v-if="!isEditMode"
          type="button"
          class="post-form-cancel-btn px-4 py-2 rounded-md transition-colors inline-flex items-center"
          :disabled="loading"
          @click="submitPost('draft')"
        >
          <span
            v-if="loading && savingAsDraft"
            class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-gray-500 border-t-transparent rounded-full flex-shrink-0"
          /><Icon v-else name="fa6-solid:floppy-disk" class="mr-2 flex-shrink-0" aria-hidden="true" /> <span>{{ t('posts.save_as_draft') }}</span>
        </button>
        <button
          v-if="!isPostHidden"
          type="submit"
          class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          :disabled="loading"
        >
          <span
            v-if="loading && !savingAsDraft"
            class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
          />
          {{ isEditMode ? t('submit.form.update') : t('posts.publish') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted, watch, computed, defineAsyncComponent } from 'vue'
  import { usePostsStore } from '~/stores/posts'
  import { useSubsStore } from '~/stores/subs'
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath, useI18n } from '#i18n'
  import { useNuxtApp } from '#app'
  import TagSelector from '~/components/posts/TagSelector.vue'
  import ThumbnailUploader from '~/components/posts/ThumbnailUploader.vue'
  import PostLanguageSelector from '~/components/posts/PostLanguageSelector.vue'
  import PostSubSelector from '~/components/posts/PostSubSelector.vue'
  import postService from '~/services/postService'
  import { languages } from '~/utils/language-data.js'
  import { useActivityPub } from '~/composables/useActivityPub'

  const TextPostForm = defineAsyncComponent(
    () => import('~/components/posts/postForm/TextPostForm.vue')
  )
  const LinkPostForm = defineAsyncComponent(
    () => import('~/components/posts/postForm/LinkPostForm.vue')
  )
  const VideoPostForm = defineAsyncComponent(
    () => import('~/components/posts/postForm/VideoPostForm.vue')
  )
  const AudioPostForm = defineAsyncComponent(
    () => import('~/components/posts/postForm/AudioPostForm.vue')
  )
  const PollPostForm = defineAsyncComponent(
    () => import('~/components/posts/postForm/PollPostForm.vue')
  )

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

  const { $api } = useNuxtApp()
  const localePath = useLocalePath()
  const { t } = useI18n()
  const postsStore = usePostsStore()
  const subsStore = useSubsStore()
  const authStore = useAuthStore()

  // ActivityPub federation
  const {
    isFederationEnabled,
    fetchUserSettings: fetchFederationSettings,
  } = useActivityPub()

  const loading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const postForm = ref(null)
  const isEditMode = computed(() => props.editMode)
  const updatingTags = ref(false)
  const savingAsDraft = ref(false)
  const isPostHidden = computed(() => isEditMode.value && form.status === 'hidden')
  const existingPollOptions = ref([])
  const pollHasVotes = ref(false)
  const currentPostSub = ref(null)

  // Sub selector
  const mySubs = computed(() => subsStore.getMySubs || [])

  const form = reactive({
    title: '',
    url: '',
    content: '',
    thumbnail_url: '',
    is_original: false,
    is_anonymous: false,
    is_nsfw: false,
    should_federate: false,
    status: 'published',
    source: props.externalSource || '',
    source_name: props.externalSource || '',
    source_url: '',
    content_type: 'link',
    media_provider: '',
    tags: [],
    poll_options: [],
    expires_at: null,
    allow_multiple_options: false,
    language_code: 'es',
    sub_id: null,
  })

  const errors = reactive({
    title: '',
    url: '',
    content: '',
    category_id: '',
    thumbnail_url: '',
    tags: '',
    poll_options: '',
    language_code: '',
  })

  const currentFormComponent = computed(() => {
    switch (form.content_type) {
      case 'text':
        return TextPostForm
      case 'link':
      case 'image':
        return LinkPostForm
      case 'video':
        return VideoPostForm
      case 'audio':
        return AudioPostForm
      case 'poll':
        return PollPostForm
      default:
        return null
    }
  })

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

  function updateTags(newTags) {
    if (updatingTags.value) return
    updatingTags.value = true

    if (newTags && newTags.length > 0) {
      errors.tags = ''
    }

    form.tags = JSON.parse(JSON.stringify(newTags))

    setTimeout(() => {
      updatingTags.value = false
    }, 0)
  }

  watch(
    () => props.initialData,
    (newVal) => {
      if (newVal) {
        form.title = newVal.title || ''
        form.url = newVal.url || ''
        form.content = newVal.content || newVal.body || ''
        form.category_id = newVal.category_id || ''
        form.thumbnail_url = newVal.thumbnail_url || ''
        form.source = newVal.source || props.externalSource || ''
        form.source_name = newVal.source_name || props.externalSource || ''
        form.source_url = newVal.source_url || newVal.url || ''
        form.external_source = newVal.external_source || props.externalSource || ''
        form.content_type = newVal.content_type || 'link'
        form.media_provider = newVal.media_provider || ''
        form.tags = newVal.tags || []
        form.is_original = newVal.is_original || false
        form.is_anonymous = newVal.is_anonymous || false
        form.is_nsfw = newVal.is_nsfw || false
        form.should_federate = newVal.federation?.should_federate || false
        form.language_code = newVal.language_code || 'es'
        form.status = newVal.status || 'published'
        form.sub_id = newVal.sub?.id || null
        currentPostSub.value = newVal.sub || null

        if (props.externalSource) {
          form.is_original = false
        }
      }
    },
    { immediate: true }
  )

  async function loadPostData() {
    if (props.editMode && props.postId) {
      loading.value = true
      try {
        const post = await postsStore.fetchPost(props.postId)
        form.title = post.title || ''
        form.url = post.url || ''
        form.content = post.content || post.body || ''
        form.thumbnail_url = post.thumbnail_url || ''
        form.content_type = post.content_type || 'link'
        form.media_provider = post.media_provider || ''
        form.is_original = post.is_original || false
        form.is_anonymous = post.is_anonymous || false
        form.is_nsfw = post.is_nsfw || false
        form.should_federate = post.federation?.should_federate || false
        form.language_code = post.language_code || 'es'
        form.status = post.status || 'published'
        form.tags = post.tags || []
        form.sub_id = post.sub?.id || null
        currentPostSub.value = post.sub || null

        // Load poll data if it's a poll
        if (post.content_type === 'poll' && post.poll) {
          existingPollOptions.value = post.poll.options || []
          pollHasVotes.value = post.poll.total_votes > 0
          form.poll_options = post.poll.options.map(opt => opt.text) || []
          form.allow_multiple_options = post.poll.allow_multiple_options || false

          // Set expires_at if poll has expiration
          if (post.poll.expires_at) {
            form.expires_at = new Date(post.poll.expires_at)
          }
        }
      } catch (error) {
        errorMessage.value = t('posts.load_error')
        console.error('Error al cargar post:', error)
      } finally {
        loading.value = false
      }
    }
  }

  function scrollToFirstError() {
    if (!postForm.value) return

    const firstErrorField = postForm.value.querySelector('.border-red-500')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
  }

  function validate() {
    let isValid = true

    for (const key in errors) {
      errors[key] = ''
    }

    if (!form.title.trim()) {
      errors.title = t('validation.title.required')
      isValid = false
    } else if (form.title.length < 5) {
      errors.title = t('validation.title.min', { min: 5 })
      isValid = false
    }

    if (form.content_type === 'text') {
      if (!form.content.trim()) {
        errors.content = t('validation.content.required')
        isValid = false
      }
    } else if (form.content_type === 'poll') {
      // Validate poll options
      const validOptions = form.poll_options.filter((option) => option.trim() !== '')
      if (validOptions.length < 2) {
        errors.poll_options = t('validation.poll_options.min', { min: 2 })
        isValid = false
      } else if (validOptions.length > 10) {
        errors.poll_options = t('validation.poll_options.max', { max: 10 })
        isValid = false
      }
    } else if (
      form.content_type === 'link' ||
      form.content_type === 'video' ||
      form.content_type === 'audio'
    ) {
      if (!form.url) {
        errors.url = t('validation.url.required')
        isValid = false
      } else if (!form.url.match(/^https?:\/\/.*$/)) {
        errors.url = t('validation.url.format')
        isValid = false
      }
    }

    if (form.tags && form.tags.length > 5) {
      errors.tags = t('validation.tags.max', { max: 5 })
      isValid = false
    }

    if (form.thumbnail_url && !form.thumbnail_url.match(/^https?:\/\/.*$/)) {
      errors.thumbnail_url = t('validation.thumbnail_url.format')
      isValid = false
    }

    if (!isValid) {
      setTimeout(scrollToFirstError, 100)
    }

    return isValid
  }

  function handleThumbnailUpdated(urls) {
    // Update form with medium size URL (for backward compatibility)
    form.thumbnail_url = urls.medium
  }

  function handleThumbnailDeleted() {
    form.thumbnail_url = ''
  }

  async function submitPost(status = 'published') {
    if (!validate()) return

    // If post is hidden, don't allow editing
    if (isPostHidden.value) {
      errorMessage.value = t('posts.cannot_edit_hidden_post')
      return
    }

    loading.value = true
    savingAsDraft.value = status === 'draft'
    errorMessage.value = ''

    try {
      if (props.externalSource && !form.external_source) {
        form.external_source = props.externalSource
      }

      const postData = {
        ...form,
        content_type: form.content_type,
        media_provider: form.media_provider || detectMediaProvider(form.url),
        tag_ids: form.tags.map((tag) => tag.id || tag),
      }

      // Only include status when creating posts, not editing
      if (!isEditMode.value) {
        postData.status = status
      }

      // Exclude status field from form spread in edit mode
      if (isEditMode.value) {
        delete postData.status
      }

      let post

      if (isEditMode.value) {
        post = await postService.updatePost($api, props.postId, postData)
        successMessage.value = t('posts.update_success')
        emit('update', post)
      } else {
        const isImport = !!form.external_source
        post = isImport
          ? await postsStore.importPost(postData)
          : await postsStore.createPost(postData)

        successMessage.value = status === 'draft' ? t('posts.draft_saved') : t('submit.success')
        emit('submit', post)

        form.title = ''
        form.url = ''
        form.content = ''
        form.thumbnail_url = ''
        form.is_original = false
        form.content_type = 'link'
        form.tags = []
        form.poll_options = []
        form.expires_at = null
        form.allow_multiple_options = false
        form.status = 'published'
      }
    } catch (error) {
      console.error('Error al enviar post:', error)

      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors
        for (const key in backendErrors) {
          if (Object.prototype.hasOwnProperty.call(errors, key)) {
            errors[key] = backendErrors[key][0]
          }
        }
        setTimeout(scrollToFirstError, 100)
      } else {
        errorMessage.value = error.response?.data?.message || 'Error al enviar el enlace'
      }
    } finally {
      loading.value = false
      savingAsDraft.value = false
    }
  }

  function detectMediaProvider(url) {
    if (!url) return ''

    if (
      url.includes('spotify.com/show/') ||
      url.includes('spotify.com/episode/') ||
      url.includes('spotify.com/podcast/')
    ) {
      return 'spotify'
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube'
    } else if (url.includes('vimeo.com')) {
      return 'vimeo'
    } else if (url.includes('soundcloud.com')) {
      return 'soundcloud'
    } else if (url.includes('spotify.com')) {
      return 'spotify'
    } else if (url.includes('podcasts.apple.com')) {
      return 'apple_podcasts'
    }

    return ''
  }

  function autoDetectContentType(url) {
    if (!url) return

    const videoRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|facebook\.com\/watch|dailymotion\.com)\/.*$/i
    const audioRegex =
      /^(https?:\/\/)?(www\.)?(soundcloud\.com|spotify\.com\/(track|album|show|episode|podcast)|podcasts\.apple\.com|player\.simplecast\.com)\/.*$/i

    if (videoRegex.test(url)) {
      setContentType('video')
    } else if (audioRegex.test(url)) {
      setContentType('audio')
    }
  }

  function validateUrl() {
    if (form.url && !form.url.match(/^https?:\/\/.*$/)) {
      form.url = 'https://' + form.url
    }

    if (form.url) {
      autoDetectContentType(form.url)
    }
  }

  onMounted(async () => {
    // Load user's subscribed subs and federation settings
    if (authStore.isAuthenticated && !authStore.isGuest) {
      try {
        await subsStore.fetchSubs({ my_subs: true })
      } catch (error) {
        console.error('Error loading subs:', error)
      }

      // Fetch federation settings to check if user has federation enabled
      try {
        await fetchFederationSettings()
      } catch (error) {
        console.error('Error fetching federation settings:', error)
      }
    }

    if (props.editMode && props.postId) {
      await loadPostData()
    }
  })
</script>

<style scoped>
  .post-form-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }

  .post-form-type-btn-inactive {
    background-color: var(--color-bg-card);
    border-color: var(--color-border-default);
  }

  .post-form-checkbox {
    border: 1px solid var(--color-border-default);
  }

  .post-form-cancel-btn {
    background-color: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .post-form-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }
</style>
