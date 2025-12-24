<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
      />
    </div>

    <template v-else>
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="mr-3">
              <Icon :name="getListIconIconify(list)" class="text-2xl" :class="getListIconColor(list)" aria-hidden="true" />
            </div>
            <div>
              <h1 class="text-2xl font-bold">
                {{ list?.name }}
                <span
                  v-if="list?.is_public"
                  class="ml-2 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full"
                >
                  {{ t('saved_lists.public') }}
                </span>
              </h1>
              <p v-if="list?.description" class="text-text-muted dark:text-text-dark-muted">
                {{ list.description }}
              </p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              v-if="list?.type === 'custom'"
              class="flex items-center px-3 py-1.5 rounded-md border list-detail-btn"
              @click="openEditModal"
            >
              <Icon name="fa6-solid:pen-to-square" class="mr-1" aria-hidden="true" />
              {{ t('common.edit') }}
            </button>
            <NuxtLink
              :to="localePath('/lists')"
              class="flex items-center px-3 py-1.5 rounded-md border list-detail-btn"
            >
              <Icon name="fa6-solid:arrow-left" class="mr-1" aria-hidden="true" />
              {{ t('common.back') }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <template v-if="posts.length === 0">
            <div class="card-bg p-6 rounded-lg shadow text-center">
              <Icon name="fa6-solid:circle-info" class="text-primary text-3xl mb-2" aria-hidden="true" />
              <p class="text-lg">{{ t('saved_lists.no_posts_in_list') }}</p>
              <p class="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
                {{ t('saved_lists.add_posts_instruction') }}
              </p>
              <NuxtLink
                :to="localePath('/')"
                class="mt-4 inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
              >
                <Icon name="fa6-solid:magnifying-glass" class="mr-1" aria-hidden="true" />
                {{ t('saved_lists.explore_posts') }}
              </NuxtLink>
            </div>
          </template>

          <template v-else>
            <div class="mb-4 flex justify-between items-center">
              <h2 class="text-lg font-bold">
                {{ t('saved_lists.posts_in_list', { count: meta.total || posts.length }) }}
              </h2>
              <div class="flex items-center">
                <span class="text-sm text-text-muted dark:text-text-dark-muted mr-2">
                  {{ t('links.sort_by') }}:
                </span>
                <select
                  v-model="sortOption"
                  class="px-2 py-1 rounded-md border list-detail-select text-sm"
                  :aria-label="t('links.sort_by')"
                  @change="updateSort"
                >
                  <option value="added_desc">{{ t('saved_lists.sort_added_desc') }}</option>
                  <option value="added_asc">{{ t('saved_lists.sort_added_asc') }}</option>
                  <option value="votes_desc">{{ t('links.popular') }}</option>
                  <option value="name_asc">{{ t('saved_lists.sort_name_asc') }}</option>
                </select>
              </div>
            </div>

            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="processPostForDisplay(post)"
              class="mb-4"
              @click="() => {}"
            >
              <template #actions>
                <div class="flex items-center space-x-3">
                  <button
                    class="flex items-center text-text-muted dark:text-text-dark-muted hover:text-red-500"
                    :title="t('saved_lists.remove_from_list')"
                    @click.stop="removePostFromList(post.id)"
                  >
                    <Icon name="fa6-solid:trash-can" aria-hidden="true" />
                    <span class="ml-1 text-sm">{{ t('saved_lists.remove') }}</span>
                  </button>
                  <div v-if="hasNotes(post.id)" class="text-text-muted dark:text-text-dark-muted">
                    <button
                      class="flex items-center hover:text-primary"
                      :title="t('saved_lists.view_notes')"
                      @click.stop="showPostNotes(post)"
                    >
                      <Icon name="fa6-solid:sticky-note" aria-hidden="true" />
                      <span class="ml-1 text-sm">{{ t('saved_lists.notes') }}</span>
                    </button>
                  </div>
                  <button
                    v-else
                    class="flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary"
                    :title="t('saved_lists.add_notes')"
                    @click.stop="addNotes(post)"
                  >
                    <Icon name="fa6-solid:circle-plus" aria-hidden="true" />
                    <span class="ml-1 text-sm">{{ t('saved_lists.add_notes') }}</span>
                  </button>
                </div>
              </template>
            </PostCard>

            <div v-if="meta && meta.lastPage > 1" class="flex justify-center mt-4">
              <div class="flex space-x-1">
                <button
                  v-for="p in paginationRange"
                  :key="p"
                  class="px-3 py-1 rounded-md text-sm"
                  :class="
                    p === page
                      ? 'bg-primary text-white'
                      : 'list-detail-page-btn text-text dark:text-text-dark'
                  "
                  @click="page = p"
                >
                  {{ p }}
                </button>
              </div>
            </div>
          </template>
        </div>

        <div class="lg:col-span-1">
          <div
            class="card-bg p-4 rounded-lg shadow-sm border list-detail-border mb-4"
          >
            <h3 class="text-lg font-bold mb-3">
              <Icon name="fa6-solid:circle-info" class="mr-1" aria-hidden="true" />
              {{ t('saved_lists.list_info') }}
            </h3>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-text-muted dark:text-text-dark-muted"
                  >{{ t('saved_lists.type') }}:</span
                >
                <span class="font-medium">{{ getListTypeName(list?.type) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted dark:text-text-dark-muted"
                  >{{ t('saved_lists.privacy') }}:</span
                >
                <span class="font-medium">
                  {{ list?.is_public ? t('saved_lists.public') : t('saved_lists.private') }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted dark:text-text-dark-muted"
                  >{{ t('saved_lists.posts_count') }}:</span
                >
                <span class="font-medium">{{ meta.total || posts.length }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted dark:text-text-dark-muted"
                  >{{ t('saved_lists.created_at') }}:</span
                >
                <span class="font-medium">{{ formatDate(list?.created_at) }}</span>
              </div>
            </div>
          </div>

          <div
            class="card-bg p-4 rounded-lg shadow-sm border list-detail-border mb-4"
          >
            <h3 class="text-lg font-bold mb-3">
              <Icon name="fa6-solid:bolt" class="mr-1" aria-hidden="true" />
              {{ t('saved_lists.quick_actions') }}
            </h3>

            <div class="space-y-2">
              <button
                class="w-full py-2 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors flex items-center justify-center"
                @click="exportList"
              >
                <Icon name="fa6-solid:file-export" class="mr-2" aria-hidden="true" />
                {{ t('saved_lists.export') }}
              </button>

              <button
                :disabled="!list?.is_public"
                class="w-full py-2 px-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 rounded-md hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                @click="shareList"
              >
                <Icon name="fa6-solid:share-nodes" class="mr-2" aria-hidden="true" />
                {{ t('saved_lists.share') }}
              </button>

              <button
                v-if="list?.type === 'custom'"
                class="w-full py-2 px-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors flex items-center justify-center"
                @click="confirmClearList"
              >
                <Icon name="fa6-solid:trash-can" class="mr-2" aria-hidden="true" />
                {{ t('saved_lists.clear_list') }}
              </button>
            </div>

            <div
              v-if="!list?.is_public"
              class="mt-4 text-xs text-text-muted dark:text-text-dark-muted"
            >
              <Icon name="fa6-solid:circle-info" class="mr-1" aria-hidden="true" />
              {{ t('saved_lists.sharing_private_info') }}
            </div>
          </div>

          <div
            class="card-bg p-4 rounded-lg shadow-sm border list-detail-border"
          >
            <h3 class="text-lg font-bold mb-3">
              <Icon name="fa6-solid:lightbulb" class="mr-1" aria-hidden="true" />
              {{ t('saved_lists.tips') }}
            </h3>

            <ul class="list-disc pl-5 text-sm space-y-2">
              <li>{{ t('saved_lists.list_tip_1') }}</li>
              <li>{{ t('saved_lists.list_tip_2') }}</li>
              <li>{{ t('saved_lists.list_tip_3') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" @click="showEditModal = false"/>

          <div
            class="list-detail-modal-bg rounded-lg shadow-xl max-w-md w-full p-6 relative z-10"
          >
            <h3 class="text-lg font-medium mb-4">
              {{ t('saved_lists.edit_list') }}
            </h3>

            <div class="mb-4">
              <label for="list-name" class="block text-sm font-medium mb-1">
                {{ t('saved_lists.name') }} *
              </label>
              <input
                id="list-name"
                v-model="formData.name"
                type="text"
                class="w-full rounded-md border list-detail-input px-3 py-2"
                required
              >
            </div>

            <div class="mb-4">
              <label for="list-description" class="block text-sm font-medium mb-1">
                {{ t('saved_lists.description') }}
              </label>
              <textarea
                id="list-description"
                v-model="formData.description"
                rows="3"
                class="w-full rounded-md border list-detail-input px-3 py-2"
              />
            </div>

            <div class="mb-4">
              <div class="flex items-center">
                <input
                  id="is-public"
                  v-model="formData.is_public"
                  type="checkbox"
                  class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                >
                <label for="is-public" class="ml-2 text-sm">
                  {{ t('saved_lists.is_public') }}
                </label>
              </div>
              <p class="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                {{ t('saved_lists.public_list_info') }}
              </p>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                class="px-4 py-2 border list-detail-cancel-btn rounded-md text-text dark:text-text-dark"
                @click="showEditModal = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md"
                :disabled="!formData.name || formSubmitting"
                @click="updateList"
              >
                <span v-if="formSubmitting" class="flex items-center">
                  <Icon name="fa6-solid:spinner" class="mr-2" aria-hidden="true" />
                  {{ t('common.saving') }}
                </span>
                <span v-else>
                  {{ t('common.update') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showNotesModal" class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" @click="showNotesModal = false"/>

          <div
            class="list-detail-modal-bg rounded-lg shadow-xl max-w-md w-full p-6 relative z-10"
          >
            <h3 class="text-lg font-medium mb-2">
              {{ t('saved_lists.notes_for_post') }}
            </h3>
            <p class="text-text-muted dark:text-text-dark-muted mb-4">
              {{ selectedPost?.title }}
            </p>

            <div class="mb-4">
              <textarea
                v-model="notesText"
                rows="5"
                class="w-full rounded-md border list-detail-input px-3 py-2"
                :placeholder="t('saved_lists.notes_placeholder')"
                :aria-label="t('saved_lists.notes_placeholder')"
              />
            </div>

            <div class="flex justify-end space-x-3">
              <button
                class="px-4 py-2 border list-detail-cancel-btn rounded-md text-text dark:text-text-dark"
                @click="showNotesModal = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md"
                :disabled="notesSubmitting"
                @click="saveNotes"
              >
                <span v-if="notesSubmitting" class="flex items-center">
                  <Icon name="fa6-solid:spinner" class="mr-2" aria-hidden="true" />
                  {{ t('common.saving') }}
                </span>
                <span v-else>
                  {{ t('common.save') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showShareModal" class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" @click="showShareModal = false"/>

          <div
            class="list-detail-modal-bg rounded-lg shadow-xl max-w-md w-full p-6 relative z-10"
          >
            <h3 class="text-lg font-medium mb-2">
              {{ t('saved_lists.share_list') }}
            </h3>

            <div class="space-y-4">
              <div class="flex space-x-4 justify-center mb-4">
                <button
                  class="w-12 h-12 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition-colors"
                  :aria-label="t('links.show.share_on', { platform: 'Twitter' })"
                  @click="shareOnSocialMedia('twitter')"
                >
                  <Icon name="fa6-brands:twitter" aria-hidden="true" />
                </button>
                <button
                  class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                  :aria-label="t('links.show.share_on', { platform: 'Facebook' })"
                  @click="shareOnSocialMedia('facebook')"
                >
                  <Icon name="fa6-brands:facebook-f" aria-hidden="true" />
                </button>
                <button
                  class="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                  :aria-label="t('links.show.share_on', { platform: 'WhatsApp' })"
                  @click="shareOnSocialMedia('whatsapp')"
                >
                  <Icon name="fa6-brands:whatsapp" aria-hidden="true" />
                </button>
              </div>

              <div>
                <div
                  class="flex items-center border list-detail-share-input rounded-md overflow-hidden"
                >
                  <input
                    v-model="shareUrl"
                    type="text"
                    readonly
                    :aria-label="t('common.share_link')"
                    class="flex-grow py-2 px-3 list-detail-share-readonly focus:outline-none"
                  >
                  <button
                    class="px-3 py-2 list-detail-copy-btn transition-colors"
                    :aria-label="t('common.copy_link')"
                    @click="copyToClipboard()"
                  >
                    <Icon name="fa6-solid:copy" aria-hidden="true" />
                  </button>
                </div>
                <p v-if="copied" class="text-green-500 text-sm mt-1">{{ t('common.copied') }}</p>
              </div>
            </div>

            <div class="flex justify-end mt-4">
              <button
                class="px-4 py-2 border list-detail-cancel-btn rounded-md text-text dark:text-text-dark"
                @click="showShareModal = false"
              >
                {{ t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showClearConfirm" class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" @click="showClearConfirm = false"/>

          <div
            class="list-detail-modal-bg rounded-lg shadow-xl max-w-md w-full p-6 relative z-10"
          >
            <h3 class="text-lg font-medium mb-2">
              {{ t('saved_lists.confirm_clear') }}
            </h3>

            <p class="text-text-muted dark:text-text-dark-muted mb-4">
              {{
                t('saved_lists.clear_warning', {
                  name: list?.name,
                  count: meta.total || posts.length,
                })
              }}
            </p>

            <div class="flex justify-end space-x-3">
              <button
                class="px-4 py-2 border list-detail-cancel-btn rounded-md text-text dark:text-text-dark"
                @click="showClearConfirm = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                :disabled="clearSubmitting"
                @click="clearList"
              >
                <span v-if="clearSubmitting" class="flex items-center">
                  <Icon name="fa6-solid:spinner" class="mr-2" aria-hidden="true" />
                  {{ t('common.clearing') }}
                </span>
                <span v-else>
                  {{ t('common.confirm') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useLocalePath, useI18n  } from '#i18n'
  import { useSavedListsStore } from '~/stores/savedLists'
  import { useAuthStore } from '~/stores/auth'
  import PostCard from '~/components/posts/PostCard.vue'

  
  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()

  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const savedListsStore = useSavedListsStore()
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()

  const loading = ref(true)
  const list = ref(null)
  const posts = ref([])
  const meta = ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  })
  const page = ref(1)
  const sortOption = ref('added_desc')
  const postsNotes = ref({})

  const showEditModal = ref(false)
  const showNotesModal = ref(false)
  const showShareModal = ref(false)
  const showClearConfirm = ref(false)

  const formSubmitting = ref(false)
  const notesSubmitting = ref(false)
  const clearSubmitting = ref(false)
  const copied = ref(false)

  const formData = ref({
    name: '',
    description: '',
    is_public: false,
  })
  const selectedPost = ref(null)
  const notesText = ref('')
  const shareUrl = ref('')

  const listIdentifier = computed(() => route.params.identifier)

  const paginationRange = computed(() => {
    const range = []
    const maxButtons = 5

    if (!meta.value || !meta.value.lastPage) return range

    if (meta.value.lastPage <= maxButtons) {
      for (let i = 1; i <= meta.value.lastPage; i++) {
        range.push(i)
      }
    } else {
      let start = Math.max(1, page.value - Math.floor(maxButtons / 2))
      const end = Math.min(meta.value.lastPage, start + maxButtons - 1)

      if (end - start < maxButtons - 1) {
        start = Math.max(1, end - maxButtons + 1)
      }

      for (let i = start; i <= end; i++) {
        range.push(i)
      }
    }

    return range
  })

  const processPostForDisplay = (post) => {
    return {
      ...post,
      votes: post.vote_count || post.votes || 0,
      userVote: post.user_vote || post.userVote || null,
      numComments: post.comment_count || post.numComments || 0,
      views: post.views || 0,
    }
  }

  const fetchList = async () => {
    loading.value = true
    try {
      list.value = await savedListsStore.fetchList(listIdentifier.value)
      await fetchListPosts()
    } catch (error) {
      console.error('Error al cargar lista:', error)
      router.push(localePath('/lists'))
    } finally {
      loading.value = false
    }
  }

  const fetchListPosts = async () => {
    try {
      const sortParams = sortOption.value.split('_')
      const sortBy = sortParams[0]
      const sortDir = sortParams[1]

      const listPosts = await savedListsStore.fetchListPosts(listIdentifier.value, page.value, 15, {
        sort_by: sortBy,
        sort_dir: sortDir,
      })

      posts.value = listPosts
      meta.value = savedListsStore.meta

      loadPostsNotes()
    } catch (error) {
      console.error('Error al cargar posts de la lista:', error)
    }
  }

  const loadPostsNotes = () => {
    const notes = {}

    posts.value.forEach((post) => {
      if (post.pivot && post.pivot.notes) {
        notes[post.id] = post.pivot.notes
      }
    })

    postsNotes.value = notes
  }

  const hasNotes = (postId) => {
    return (
      postsNotes.value[postId] !== undefined &&
      postsNotes.value[postId] !== null &&
      postsNotes.value[postId] !== ''
    )
  }

  const updateSort = () => {
    page.value = 1
    fetchListPosts()
  }

  const getListIconIconify = (list) => {
    if (!list) return 'fa6-solid:list'

    switch (list.type) {
      case 'favorite':
        return 'fa6-solid:star'
      case 'read_later':
        return 'fa6-solid:bookmark'
      default:
        return 'fa6-solid:list'
    }
  }

  const getListIconColor = (list) => {
    if (!list) return ''

    switch (list.type) {
      case 'favorite':
        return 'text-yellow-400'
      case 'read_later':
        return 'text-blue-400'
      default:
        return 'text-primary'
    }
  }

  const getListTypeName = (type) => {
    switch (type) {
      case 'favorite':
        return 'Favoritos'
      case 'read_later':
        return 'Leer más tarde'
      default:
        return 'Personalizada'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(locale.value, { timeZone: timezone })
  }

  const openEditModal = () => {
    formData.value = {
      name: list.value.name,
      description: list.value.description || '',
      is_public: list.value.is_public,
    }
    showEditModal.value = true
  }

  const removePostFromList = async (postId) => {
    try {
      await savedListsStore.removePostFromList(listIdentifier.value, postId)
      posts.value = posts.value.filter((post) => post.id !== postId)

      if (meta.value.total > 0) {
        meta.value.total--
      }

      if (posts.value.length === 0 && page.value > 1) {
        page.value = 1
        fetchListPosts()
      }
    } catch (error) {
      console.error('Error al eliminar post de la lista:', error)
    }
  }

  const showPostNotes = (post) => {
    selectedPost.value = post
    notesText.value = postsNotes.value[post.id] || ''
    showNotesModal.value = true
  }

  const addNotes = (post) => {
    selectedPost.value = post
    notesText.value = ''
    showNotesModal.value = true
  }

  const saveNotes = async () => {
    if (!selectedPost.value) return

    notesSubmitting.value = true

    try {
      await savedListsStore.updatePostNotes(
        listIdentifier.value,
        selectedPost.value.id,
        notesText.value
      )
      postsNotes.value[selectedPost.value.id] = notesText.value
      showNotesModal.value = false
      selectedPost.value = null
      notesText.value = ''
    } catch (error) {
      console.error('Error al guardar notas:', error)
    } finally {
      notesSubmitting.value = false
    }
  }

  const updateList = async () => {
    if (!formData.value.name) return

    formSubmitting.value = true

    try {
      await savedListsStore.updateList(listIdentifier.value, {
        name: formData.value.name,
        description: formData.value.description,
        is_public: formData.value.is_public,
      })

      list.value = {
        ...list.value,
        name: formData.value.name,
        description: formData.value.description,
        is_public: formData.value.is_public,
      }

      showEditModal.value = false
    } catch (error) {
      console.error('Error al actualizar lista:', error)
    } finally {
      formSubmitting.value = false
    }
  }

  const shareList = () => {
    if (!list.value.is_public) return

    const identifier = list.value.type === 'custom' ? list.value.uuid : list.value.slug
    shareUrl.value = `${window.location.origin}${localePath(`/lists/${identifier}`)}`
    showShareModal.value = true
  }

  const shareOnSocialMedia = (platform) => {
    const url = encodeURIComponent(shareUrl.value)
    const appName = runtimeConfig.public.appName || 'Repostea'
    const title = encodeURIComponent(`${t('saved_lists.list_from', { app: appName })}: ${list.value.name}`)

    let socialUrl

    switch (platform) {
      case 'twitter':
        socialUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`
        break
      case 'facebook':
        socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case 'whatsapp':
        socialUrl = `https://api.whatsapp.com/send?text=${title} ${url}`
        break
      default:
        return
    }

    window.open(socialUrl, '_blank')
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(shareUrl.value)
      .then(() => {
        copied.value = true
        setTimeout(() => {
          copied.value = false
        }, 2000)
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles:', err)
      })
  }

  const exportList = () => {
    if (!list.value || posts.value.length === 0) return

    const exportData = posts.value.map((post) => ({
      title: post.title,
      url: post.url,
      content: post.content,
      author: post.user?.username,
      notes: postsNotes.value[post.id] || '',
      added_at: post.pivot?.created_at || '',
    }))

    const headers = ['Título', 'URL', 'Contenido', 'Autor', 'Notas', 'Fecha de adición']
    let csv = headers.join(',') + '\n'

    exportData.forEach((item) => {
      const escapeField = (field) => {
        if (field === null || field === undefined) return '""'
        return `"${String(field).replace(/"/g, '""')}"`
      }

      csv +=
        [
          escapeField(item.title),
          escapeField(item.url),
          escapeField(item.content),
          escapeField(item.author),
          escapeField(item.notes),
          escapeField(item.added_at),
        ].join(',') + '\n'
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    const appName = (runtimeConfig.public.appName || 'repostea').toLowerCase()
    link.setAttribute('download', `${appName}-list-${list.value.name.replace(/\s+/g, '-')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const confirmClearList = () => {
    showClearConfirm.value = true
  }

  const clearList = async () => {
    clearSubmitting.value = true

    try {
      await savedListsStore.clearList(listIdentifier.value)
      posts.value = []
      meta.value.total = 0
      showClearConfirm.value = false
    } catch (error) {
      console.error('Error al limpiar lista:', error)
    } finally {
      clearSubmitting.value = false
    }
  }

  watch(page, () => {
    fetchListPosts()
  })

  onMounted(() => {
    if (authStore.isAuthenticated) {
      if (listIdentifier.value) {
        fetchList()
      } else {
        router.push(localePath('/lists'))
      }
    } else {
      router.push(localePath('/auth/login'))
    }
  })
</script>

<style scoped>
  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .list-detail-btn {
    border-color: var(--color-border-default);
  }

  .list-detail-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .list-detail-select {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .list-detail-page-btn {
    background-color: var(--color-bg-subtle);
  }

  .list-detail-border {
    border-color: var(--color-border-default);
  }

  .list-detail-modal-bg {
    background-color: var(--color-bg-card);
  }

  .list-detail-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .list-detail-cancel-btn {
    border-color: var(--color-border-default);
  }

  .list-detail-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .list-detail-share-input {
    border-color: var(--color-border-default);
  }

  .list-detail-share-readonly {
    background-color: var(--color-bg-subtle);
  }

  .list-detail-copy-btn {
    background-color: var(--color-bg-subtle);
  }

  .list-detail-copy-btn:hover {
    background-color: var(--color-bg-active);
  }
</style>
