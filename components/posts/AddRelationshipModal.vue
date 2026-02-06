<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4"
      @click.self="$emit('close')"
    >
      <div
        class="card-bg rounded-lg shadow-xl max-w-2xl lg:max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-relationship-modal-title"
        @click.stop
      >
        <!-- Header -->
        <div class="add-rel-header px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
          <div class="flex items-center justify-between">
            <h3
              id="add-relationship-modal-title"
              class="text-base sm:text-lg font-semibold text-text dark:text-text-dark inline-flex items-center"
            >
              <Icon
                name="fa6-solid:link"
                class="mr-1 sm:mr-2 text-sm sm:text-base flex-shrink-0"
                aria-hidden="true"
              />
              <span class="hidden sm:inline">{{ t('posts.relationships.add_title') }}</span>
              <span class="sm:hidden">{{ t('posts.relationships.add') }}</span>
            </h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              :aria-label="t('common.close')"
              @click="$emit('close')"
            >
              <Icon name="fa6-solid:xmark" class="text-lg sm:text-xl" aria-hidden="true" />
            </button>
          </div>
          <!-- Error Message at Top -->
          <div
            v-if="error"
            class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-start"
          >
            <Icon
              name="fa6-solid:triangle-exclamation"
              class="mr-2 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Body -->
        <div class="p-3 sm:p-6">
          <!-- Search Target Post -->
          <div class="mb-4 sm:mb-6">
            <label class="block text-xs sm:text-sm font-medium text-text dark:text-text-dark mb-2">
              {{ t('posts.relationships.target_post') }}
              <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('posts.relationships.search_placeholder')"
                class="add-rel-input w-full px-3 sm:px-4 py-2 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                @input="handleSearch"
              />
              <Icon
                name="fa6-solid:magnifying-glass"
                class="absolute right-3 top-3 text-gray-400 text-sm"
                aria-hidden="true"
              />
            </div>

            <!-- Search Results -->
            <div
              v-if="searchResults.length > 0"
              class="add-rel-results mt-2 rounded-lg max-h-60 sm:max-h-80 overflow-y-auto"
            >
              <button
                v-for="post in searchResults"
                :key="post.id"
                :class="[
                  'add-rel-result-item w-full text-left p-3 sm:p-4 transition-colors',
                  selectedPost?.id === post.id ? 'bg-primary/10 dark:bg-primary/20' : '',
                ]"
                @click="selectPost(post)"
              >
                <div>
                  <div class="font-medium text-sm text-text dark:text-text-dark line-clamp-2">
                    {{ post.title }}
                  </div>
                  <div
                    class="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400"
                  >
                    <span class="flex items-center gap-1">
                      <Icon name="fa6-solid:user" class="text-xs" aria-hidden="true" />
                      {{ post.author }}
                    </span>
                    <span>•</span>
                    <span class="flex items-center gap-1">
                      <Icon name="fa6-solid:clock" class="text-xs" aria-hidden="true" />
                      {{ formatDate(post.created_at) }}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div
              v-else-if="searching"
              class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 py-4"
            >
              <div
                class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"
              />
              {{ t('common.searching') }}...
            </div>

            <div
              v-else-if="searchQuery && searchResults.length === 0 && !searching"
              class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 py-4"
            >
              {{ t('posts.relationships.no_results') }}
            </div>
          </div>

          <!-- Selected Post Preview -->
          <div v-if="selectedPost" class="mb-6">
            <div
              class="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg shadow-sm"
            >
              <!-- Header -->
              <div
                class="px-4 py-3 border-b border-primary/20 dark:border-primary/30 flex items-center justify-between"
              >
                <div
                  class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <Icon
                    name="fa6-solid:circle-check"
                    class="text-primary dark:text-primary-light"
                    aria-hidden="true"
                  />
                  {{ t('posts.relationships.selected') }}
                </div>
                <button
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  :title="t('common.remove')"
                  :aria-label="t('common.remove')"
                  @click="selectedPost = null"
                >
                  <Icon name="fa6-solid:xmark" class="text-lg" aria-hidden="true" />
                </button>
              </div>

              <!-- Content -->
              <div class="p-4">
                <!-- Title (clickable) -->
                <a
                  :href="localePath(`/p/${selectedPost.uuid}`)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg p-3 -m-3 mb-2 transition-colors group"
                >
                  <h4
                    class="font-semibold text-base text-text dark:text-text-dark group-hover:text-primary dark:group-hover:text-primary-light transition-colors flex items-center gap-2"
                  >
                    {{ selectedPost.title }}
                    <Icon
                      name="fa6-solid:arrow-up-right-from-square"
                      class="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-hidden="true"
                    />
                  </h4>
                </a>

                <!-- Meta info (author, date, source, language) -->
                <div
                  class="text-xs text-text-muted dark:text-text-dark-muted flex flex-wrap items-center gap-1"
                >
                  <AuthorInfo
                    :user="selectedPost.user"
                    :is-anonymous="selectedPost.is_anonymous"
                    :author-name="selectedPost.author"
                  />
                  <span class="mx-1">·</span>
                  <span v-if="selectedPost.is_external_import" class="flex items-center">
                    {{ t('posts.seen_on') }} {{ selectedPost.source_name || selectedPost.source }}
                  </span>
                  <span v-else class="flex items-center">
                    {{ t('posts.written_in_repostea') }}
                  </span>
                  <template v-if="selectedPost.language_code">
                    <span class="mx-1">·</span>
                    <span class="language-badge uppercase">{{ selectedPost.language_code }}</span>
                  </template>
                </div>

                <!-- Content preview (if available) -->
                <p
                  v-if="selectedPost.content"
                  class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2"
                >
                  {{ selectedPost.content }}
                </p>
              </div>
            </div>
          </div>

          <!-- Relationship Type -->
          <div v-if="selectedPost" class="mb-4 sm:mb-6">
            <label class="block text-xs sm:text-sm font-medium text-text dark:text-text-dark mb-3">
              {{ t('posts.relationships.type') }}
              <span class="text-red-500">*</span>
            </label>

            <!-- Mobile: Stacked sections -->
            <div class="lg:hidden space-y-4">
              <!-- Own Content Relations -->
              <div v-if="ownContentTypes.length > 0">
                <h5
                  class="text-xs font-semibold text-text dark:text-text-dark mb-2 inline-flex items-center"
                >
                  <Icon
                    name="fa6-solid:user-pen"
                    class="mr-2 text-primary flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>{{ t('posts.relationships.own_content') }}</span>
                </h5>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {{ t('posts.relationships.own_content_hint') }}
                </p>
                <div class="grid grid-cols-1 gap-2">
                  <button
                    v-for="type in ownContentTypes"
                    :key="type.value"
                    :class="[
                      'p-2 sm:p-3 rounded-lg border-2 transition-all text-left',
                      selectedType === type.value
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md ring-2 ring-primary/30 dark:ring-primary/40'
                        : 'add-rel-type-btn-inactive',
                    ]"
                    @click="selectedType = type.value"
                  >
                    <div class="flex items-start">
                      <Icon
                        :name="`fa6-solid:${type.icon}`"
                        :class="['text-base mr-2 flex-shrink-0', getTypeColorClass(type.value)]"
                        aria-hidden="true"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-xs text-text dark:text-text-dark">
                          {{ type.label }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {{ type.description }}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- External Content Relations -->
              <div v-if="externalContentTypes.length > 0">
                <h5
                  class="text-xs font-semibold text-text dark:text-text-dark mb-2 inline-flex items-center"
                >
                  <Icon
                    name="fa6-solid:link"
                    class="mr-2 text-primary dark:text-primary-light flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>{{ t('posts.relationships.external_content') }}</span>
                </h5>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {{ t('posts.relationships.external_content_hint') }}
                </p>
                <div class="grid grid-cols-1 gap-2">
                  <button
                    v-for="type in externalContentTypes"
                    :key="type.value"
                    :class="[
                      'p-2 sm:p-3 rounded-lg border-2 transition-all text-left',
                      selectedType === type.value
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md ring-2 ring-primary/30 dark:ring-primary/40'
                        : 'add-rel-type-btn-inactive',
                    ]"
                    @click="selectedType = type.value"
                  >
                    <div class="flex items-start">
                      <Icon
                        :name="`fa6-solid:${type.icon}`"
                        :class="['text-base mr-2 flex-shrink-0', getTypeColorClass(type.value)]"
                        aria-hidden="true"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-xs text-text dark:text-text-dark">
                          {{ type.label }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {{ type.description }}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Desktop: Responsive grid layout (2 items vs 4 items) -->
            <div class="hidden lg:block">
              <div class="grid grid-cols-3 gap-4">
                <!-- Own Content Relations Column (1/3 width or full width if alone) -->
                <div
                  v-if="ownContentTypes.length > 0"
                  :class="[
                    'border border-primary/30 dark:border-primary/40 rounded-lg p-4 bg-primary/5 dark:bg-primary/10 h-full',
                    externalContentTypes.length > 0 ? 'col-span-1' : 'col-span-3',
                  ]"
                >
                  <div class="h-[60px] mb-3">
                    <h5
                      class="text-sm font-bold text-text dark:text-text-dark mb-2 inline-flex items-center"
                    >
                      <Icon
                        name="fa6-solid:list-ol"
                        class="mr-2 text-primary flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ t('posts.relationships.own_content') }}</span>
                    </h5>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ t('posts.relationships.own_content_hint') }}
                    </p>
                  </div>
                  <div
                    :class="
                      externalContentTypes.length > 0 ? 'space-y-2' : 'grid grid-cols-2 gap-2'
                    "
                  >
                    <button
                      v-for="type in ownContentTypes"
                      :key="type.value"
                      :class="[
                        'w-full p-3 rounded-lg border-2 transition-all text-left',
                        selectedType === type.value
                          ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md ring-2 ring-primary/30 dark:ring-primary/40'
                          : 'add-rel-type-btn-desktop',
                      ]"
                      @click="selectedType = type.value"
                    >
                      <div class="flex items-start">
                        <Icon
                          :name="`fa6-solid:${type.icon}`"
                          :class="['text-lg mr-3 flex-shrink-0', getTypeColorClass(type.value)]"
                          aria-hidden="true"
                        />
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-sm text-text dark:text-text-dark">
                            {{ type.label }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {{ type.description }}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- External Content Relations Column (2/3 width or full width if alone) -->
                <div
                  v-if="externalContentTypes.length > 0"
                  :class="[
                    'border border-primary/30 dark:border-primary-light/40 rounded-lg p-4 bg-primary/5 dark:bg-primary/10 h-full',
                    ownContentTypes.length > 0 ? 'col-span-2' : 'col-span-3',
                  ]"
                >
                  <div class="h-[60px] mb-3">
                    <h5
                      class="text-sm font-bold text-text dark:text-text-dark mb-2 inline-flex items-center"
                    >
                      <Icon
                        name="fa6-solid:diagram-project"
                        class="mr-2 text-primary dark:text-primary-light flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ t('posts.relationships.external_content') }}</span>
                    </h5>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ t('posts.relationships.external_content_hint') }}
                    </p>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="type in externalContentTypes"
                      :key="type.value"
                      :class="[
                        'w-full p-3 rounded-lg border-2 transition-all text-left',
                        selectedType === type.value
                          ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-md ring-2 ring-primary/30 dark:ring-primary/40'
                          : 'add-rel-type-btn-desktop',
                      ]"
                      @click="selectedType = type.value"
                    >
                      <div class="flex items-start">
                        <Icon
                          :name="`fa6-solid:${type.icon}`"
                          :class="['text-lg mr-3 flex-shrink-0', getTypeColorClass(type.value)]"
                          aria-hidden="true"
                        />
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-sm text-text dark:text-text-dark">
                            {{ type.label }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {{ type.description }}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Why is it related (Optional) -->
          <div class="mb-4 sm:mb-6">
            <label class="block text-xs sm:text-sm font-medium text-text dark:text-text-dark mb-2">
              {{ t('posts.relationships.why_related_label') }}
              <span class="text-gray-400 text-xs ml-1 inline-flex items-center">
                ({{ t('common.optional') }} ·
                <Icon name="fa6-solid:eye" class="text-xs flex-shrink-0" aria-hidden="true" />
                <span>{{ t('posts.relationships.note_is_public') }})</span>
              </span>
            </label>
            <textarea
              v-model="notes"
              :placeholder="t('posts.relationships.notes_placeholder')"
              rows="3"
              maxlength="500"
              class="w-full px-3 sm:px-4 py-2 text-sm border add-rel-textarea rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {{ notes.length }}/500
            </div>
          </div>

          <!-- Publish as Anonymous (only for external content types) -->
          <div v-if="isExternalContentType" class="mb-4 sm:mb-6">
            <label class="flex items-start sm:items-center cursor-pointer">
              <input
                v-model="publishAsAnonymous"
                type="checkbox"
                class="w-4 h-4 mt-0.5 sm:mt-0 text-primary rounded focus:ring-primary focus:ring-2 flex-shrink-0 relationship-checkbox"
              />
              <span class="ml-2 text-xs sm:text-sm text-text dark:text-text-dark">
                {{ t('posts.relationships.publish_anonymous') }}
              </span>
            </label>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              {{ t('posts.relationships.publish_anonymous_description') }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="add-rel-footer px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0"
        >
          <button
            class="add-rel-cancel px-4 py-2 text-sm sm:text-base rounded-lg transition-colors order-2 sm:order-1"
            @click="$emit('close')"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            :disabled="!canSubmit || submitting"
            :class="[
              'px-4 py-2 text-sm sm:text-base rounded-lg transition-colors flex items-center justify-center order-1 sm:order-2',
              canSubmit && !submitting
                ? 'bg-primary hover:bg-primary-dark text-white'
                : 'add-rel-submit-disabled',
            ]"
            @click="createRelationship"
          >
            <span v-if="submitting" class="flex items-center">
              <div
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
              />
              {{ t('common.saving') }}...
            </span>
            <span v-else class="inline-flex items-center">
              <Icon name="fa6-solid:check" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('common.create') }}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { useNuxtApp } from '#app'
  import { useI18n, useLocalePath } from '#i18n'
  import { useAuthStore } from '~/stores/auth'
  import AuthorInfo from '~/components/common/AuthorInfo.vue'

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  // Simple debounce implementation
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const props = defineProps({
    postId: {
      type: [Number, String],
      required: true,
    },
    currentPostTitle: {
      type: String,
      default: '',
    },
    postAuthorId: {
      type: [Number, String],
      default: null,
    },
    initialCategory: {
      type: String,
      default: null,
      validator: (value) => value === null || ['own', 'external'].includes(value),
    },
  })

  const emit = defineEmits(['close', 'created'])

  const ownTypes = ref([])
  const externalTypes = ref([])
  const selectedType = ref(null)
  const searchQuery = ref('')
  const searchResults = ref([])
  const selectedPost = ref(null)
  const notes = ref('')
  const publishAsAnonymous = ref(false)
  const searching = ref(false)
  const submitting = ref(false)
  const error = ref(null)

  // Check if current user is author of the current post
  const isCurrentPostAuthor = computed(() => {
    return authStore.isAuthenticated && authStore.user?.id === props.postAuthorId
  })

  // Check if selected post is by current user
  const isTargetPostByCurrentUser = computed(() => {
    return (
      selectedPost.value &&
      authStore.isAuthenticated &&
      selectedPost.value.user_id === authStore.user?.id
    )
  })

  // Own content types (only available if user is author of current post)
  const ownContentTypes = computed(() => {
    // If initialCategory is 'external', hide own types
    if (props.initialCategory === 'external') return []
    return isCurrentPostAuthor.value ? ownTypes.value : []
  })

  // External content types (filtered based on target post ownership)
  const externalContentTypes = computed(() => {
    // If initialCategory is 'own', hide external types
    if (props.initialCategory === 'own') return []

    if (!selectedPost.value) return externalTypes.value

    // Filter out 'reply' if target post is by current user
    return externalTypes.value.filter((type) => {
      if (type.value === 'reply' && isTargetPostByCurrentUser.value) {
        return false
      }
      return true
    })
  })

  const canSubmit = computed(() => {
    return selectedType.value && selectedPost.value && !submitting.value
  })

  // Check if selected type is an external content type
  const isExternalContentType = computed(() => {
    if (!selectedType.value) return false
    return ['update', 'reply', 'related', 'duplicate'].includes(selectedType.value)
  })

  function getTypeColorClass(type) {
    const colorMap = {
      // Own content types
      continuation: 'text-purple-600 dark:text-purple-400', // purple
      correction: 'text-red-600 dark:text-red-400', // red
      update: 'text-amber-600 dark:text-amber-400', // amber
      // External content types
      reply: 'text-blue-600 dark:text-blue-400', // blue
      related: 'text-green-600 dark:text-green-400', // green
      duplicate: 'text-gray-600 dark:text-gray-400', // gray
    }
    return colorMap[type] || 'text-gray-600 dark:text-gray-400'
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(locale.value, { timeZone: timezone })
  }

  const handleSearch = debounce(async () => {
    if (!searchQuery.value || searchQuery.value.length < 2) {
      searchResults.value = []
      return
    }

    try {
      searching.value = true

      // Check if user pasted a permalink (with or without domain) or just a UUID
      // Supports: http://domain/p/uuid, /p/uuid, /es/p/uuid, or just uuid
      const permalinkMatch = searchQuery.value.match(/\/p\/([a-f0-9-]+)/i)
      const uuidMatch = searchQuery.value.match(/^([a-f0-9-]{36})$/i)

      if (permalinkMatch || uuidMatch) {
        // Extract and clean UUID (take only first 36 characters if longer)
        let uuid = permalinkMatch ? permalinkMatch[1] : searchQuery.value.trim()
        uuid = uuid.substring(0, 36)

        // Validate UUID format (36 characters with hyphens in correct positions)
        const validUuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
        if (!validUuidPattern.test(uuid)) {
          searchResults.value = []
          error.value = t('posts.relationships.error_invalid_permalink')
          searching.value = false
          return
        }

        try {
          // Fetch post by UUID directly
          const response = await $api.posts.getPostByUuid(uuid)
          const postData = response.data.data || response.data

          if (postData && postData.id !== props.postId) {
            // Auto-select the post
            selectedPost.value = postData
            searchQuery.value = ''
            searchResults.value = []
            error.value = null
          } else if (postData && postData.id === props.postId) {
            // Show error: cannot relate to itself
            searchResults.value = []
            error.value = t('posts.relationships.error_self_relation')
          }
        } catch {
          // Post not found
          searchResults.value = []
          error.value = t('posts.not_found')
        }
      } else {
        // Normal text search
        const searchParams = { q: searchQuery.value, per_page: 10 }

        // If a type is selected and it's an "own content" type, filter by current user
        if (
          selectedType.value &&
          ['continuation', 'correction', 'update'].includes(selectedType.value)
        ) {
          if (authStore.user?.username) {
            searchParams.author = authStore.user.username
          }
        }

        const response = await $api.posts.search(searchParams)
        searchResults.value = (response.data.data || []).filter((post) => post.id !== props.postId)
      }
    } catch (err) {
      console.error('Error searching posts:', err)
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)

  function selectPost(post) {
    selectedPost.value = post
    searchQuery.value = ''
    searchResults.value = []
  }

  async function createRelationship() {
    if (!canSubmit.value) {
      return
    }

    try {
      submitting.value = true
      error.value = null

      await $api.posts.createRelationship(props.postId, {
        target_post_id: selectedPost.value.id,
        relationship_type: selectedType.value,
        notes: notes.value || null,
        is_anonymous: publishAsAnonymous.value,
      })

      emit('created')
    } catch (err) {
      console.error('Error creating relationship:', err)
      console.error('Error response:', err.response)
      error.value = err.response?.data?.message || t('posts.relationships.error_creating')
    } finally {
      submitting.value = false
    }
  }

  async function loadRelationshipTypes() {
    try {
      const response = await $api.posts.getRelationshipTypes()
      const data = response.data.data || {}

      // Handle new grouped structure
      if (data.own !== undefined && data.external !== undefined) {
        ownTypes.value = data.own || []
        externalTypes.value = data.external || []
      } else {
        // Fallback for old structure (backwards compatibility)
        const allTypes = Array.isArray(data) ? data : []
        // Categorize manually if old structure
        ownTypes.value = allTypes.filter((t) =>
          ['continuation', 'correction', 'update'].includes(t.value)
        )
        externalTypes.value = allTypes.filter((t) =>
          ['reply', 'related', 'duplicate'].includes(t.value)
        )
      }
    } catch (err) {
      console.error('Error loading relationship types:', err)
    }
  }

  watch(
    () => props.postId,
    () => {
      loadRelationshipTypes()
    },
    { immediate: true }
  )

  // Re-run search when selectedType changes (to filter by author for own content)
  watch(selectedType, () => {
    if (searchQuery.value && searchQuery.value.length >= 2) {
      handleSearch()
    }
  })
</script>

<style scoped>
  .add-rel-header {
    background-color: var(--color-bg-card);
    border-bottom: 1px solid var(--color-border-default);
  }

  .add-rel-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .add-rel-results {
    border: 1px solid var(--color-border-default);
  }

  .add-rel-result-item {
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .add-rel-result-item:last-child {
    border-bottom: none;
  }

  .add-rel-result-item:hover {
    background-color: var(--color-bg-hover);
  }

  .add-rel-type-btn-inactive {
    border-color: var(--color-border-default);
  }

  .add-rel-type-btn-inactive:hover {
    border-color: var(--color-primary);
  }

  .add-rel-type-btn-desktop {
    background-color: var(--color-bg-card);
    border-color: var(--color-border-default);
  }

  .add-rel-type-btn-desktop:hover {
    border-color: var(--color-primary);
  }

  .add-rel-footer {
    background-color: var(--color-bg-card);
    border-top: 1px solid var(--color-border-default);
  }

  .add-rel-cancel {
    color: var(--color-text-secondary);
  }

  .add-rel-cancel:hover {
    background-color: var(--color-bg-hover);
  }

  .add-rel-submit-disabled {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }

  .add-rel-textarea {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
    color: var(--color-text-primary);
  }

  .relationship-checkbox {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }
</style>
