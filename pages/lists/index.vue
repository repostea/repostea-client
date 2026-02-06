<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2 inline-flex items-center">
        <Icon name="fa6-solid:bookmark" class="mr-2" aria-hidden="true" />
        <span>{{ t('saved_lists.title') }}</span>
      </h1>
      <p class="text-text-muted dark:text-text-dark-muted">
        {{ t('saved_lists.description') }}
      </p>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
      />
    </div>

    <template v-else-if="lists.length === 0">
      <div class="card-bg p-6 rounded-lg shadow text-center">
        <Icon name="fa6-solid:circle-info" class="text-primary text-3xl mb-2" aria-hidden="true" />
        <p class="text-lg">{{ t('saved_lists.no_lists') }}</p>
        <button
          class="mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors inline-flex items-center"
          @click="showCreateForm = true"
        >
          <Icon name="fa6-solid:circle-plus" class="mr-1 flex-shrink-0" aria-hidden="true" />
          <span>{{ t('saved_lists.create_new') }}</span>
        </button>
      </div>
    </template>

    <template v-else>
      <!-- Main section with lists -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <!-- Predefined lists (favorites and read later) -->
          <div class="mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Favorites list -->
              <div
                v-if="favoritesList"
                class="card-bg rounded-lg shadow-sm border lists-border hover:shadow-md transition-shadow"
              >
                <div
                  class="p-4 border-l-4 border-yellow-400 rounded-tl-lg"
                  @click="navigateToList(null, favoritesList.uuid || favoritesList.id)"
                >
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold inline-flex items-center">
                      <Icon
                        name="fa6-solid:star"
                        class="text-yellow-400 mr-2 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ favoritesList.name }}</span>
                    </h3>
                    <span
                      class="lists-badge-bg text-text-muted dark:text-text-dark-muted px-2 py-1 rounded-full text-sm"
                    >
                      {{ favoritesList.posts_count || 0 }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
                    {{ t('saved_lists.favorites_description') }}
                  </p>
                </div>
                <div class="p-4 border-t lists-divider flex justify-end">
                  <NuxtLink
                    :to="localePath(`/lists/${favoritesList.uuid || favoritesList.id}`)"
                    class="text-primary hover:text-primary-dark text-sm flex items-center"
                  >
                    {{ t('saved_lists.view_all') }}
                    <Icon name="fa6-solid:chevron-right" class="ml-1" aria-hidden="true" />
                  </NuxtLink>
                </div>
              </div>

              <!-- Read later list -->
              <div
                v-if="readLaterList"
                class="card-bg rounded-lg shadow-sm border lists-border hover:shadow-md transition-shadow"
              >
                <div
                  class="p-4 border-l-4 border-blue-400 rounded-tl-lg"
                  @click="navigateToList(null, readLaterList.uuid || readLaterList.id)"
                >
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold inline-flex items-center">
                      <Icon
                        name="fa6-solid:bookmark"
                        class="text-blue-400 mr-2 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ readLaterList.name }}</span>
                    </h3>
                    <span
                      class="lists-badge-bg text-text-muted dark:text-text-dark-muted px-2 py-1 rounded-full text-sm"
                    >
                      {{ readLaterList.posts_count || 0 }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-text-muted dark:text-text-dark-muted">
                    {{ t('saved_lists.read_later_description') }}
                  </p>
                </div>
                <div class="p-4 border-t lists-divider flex justify-end">
                  <NuxtLink
                    :to="localePath(`/lists/${readLaterList.uuid || readLaterList.id}`)"
                    class="text-primary hover:text-primary-dark text-sm flex items-center"
                  >
                    {{ t('saved_lists.view_all') }}
                    <Icon name="fa6-solid:chevron-right" class="ml-1" aria-hidden="true" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- Custom lists -->
          <div v-if="customLists.length > 0">
            <h2 class="text-xl font-bold mb-4 inline-flex items-center">
              <Icon name="fa6-solid:list-ul" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('saved_lists.custom_lists') }}</span>
            </h2>

            <div class="grid grid-cols-1 gap-4">
              <div
                v-for="list in customLists"
                :key="list.id"
                class="card-bg rounded-lg shadow-sm border lists-border hover:shadow-md transition-shadow"
              >
                <div
                  class="p-4 border-l-4 border-primary rounded-tl-lg"
                  @click="navigateToList(list.username, list.slug)"
                >
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold inline-flex items-center">
                      <Icon
                        name="fa6-solid:list"
                        class="text-primary mr-2 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ list.name }}</span>
                      <span
                        v-if="list.is_public"
                        class="ml-2 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full"
                      >
                        {{ t('saved_lists.public') }}
                      </span>
                    </h3>
                    <span
                      class="lists-badge-bg text-text-muted dark:text-text-dark-muted px-2 py-1 rounded-full text-sm"
                    >
                      {{ list.posts_count || 0 }}
                    </span>
                  </div>
                  <p v-if="list.description" class="mt-2 text-sm">
                    {{ list.description }}
                  </p>
                  <p v-else class="mt-2 text-sm text-text-muted dark:text-text-dark-muted italic">
                    {{ t('saved_lists.no_description') }}
                  </p>
                </div>
                <div class="p-4 border-t lists-divider flex justify-end">
                  <div class="flex space-x-3">
                    <button
                      class="text-text-muted dark:text-text-dark-muted hover:text-primary text-sm inline-flex items-center"
                      @click="openEditModal(list)"
                    >
                      <Icon
                        name="fa6-solid:pen-to-square"
                        class="mr-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ t('common.edit') }}</span>
                    </button>
                    <button
                      class="text-red-500 hover:text-red-600 text-sm inline-flex items-center"
                      @click="confirmDelete(list)"
                    >
                      <Icon
                        name="fa6-solid:trash-can"
                        class="mr-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{{ t('common.delete') }}</span>
                    </button>
                    <NuxtLink
                      :to="localePath(`/lists/${list.uuid}`)"
                      class="text-primary hover:text-primary-dark text-sm flex items-center"
                    >
                      {{ t('saved_lists.view_all') }}
                      <Icon name="fa6-solid:chevron-right" class="ml-1" aria-hidden="true" />
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Create new list button -->
          <div class="mt-6">
            <button
              class="w-full py-3 border-2 border-dashed border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors inline-flex items-center justify-center"
              @click="showCreateForm = true"
            >
              <Icon name="fa6-solid:circle-plus" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('saved_lists.create_new') }}</span>
            </button>
          </div>
        </div>

        <!-- Columna lateral -->
        <div class="lg:col-span-1">
          <div class="card-bg p-4 rounded-lg shadow-sm border lists-border mb-4">
            <h3 class="text-lg font-bold mb-3 inline-flex items-center">
              <Icon name="fa6-solid:circle-info" class="mr-1" aria-hidden="true" />
              <span>{{ t('saved_lists.about') }}</span>
            </h3>
            <p class="text-sm mb-4">
              {{ t('saved_lists.about_description') }}
            </p>

            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <Icon name="fa6-solid:star" class="text-yellow-400 mr-2" aria-hidden="true" />
                <span>{{ t('saved_lists.about_favorites') }}</span>
              </div>
              <div class="flex items-center">
                <Icon name="fa6-solid:bookmark" class="text-blue-400 mr-2" aria-hidden="true" />
                <span>{{ t('saved_lists.about_read_later') }}</span>
              </div>
              <div class="flex items-center">
                <Icon name="fa6-solid:list" class="text-primary mr-2" aria-hidden="true" />
                <span>{{ t('saved_lists.about_custom_lists') }}</span>
              </div>
              <div class="flex items-center">
                <Icon name="fa6-solid:globe" class="text-green-500 mr-2" aria-hidden="true" />
                <span>{{ t('saved_lists.about_public_lists') }}</span>
              </div>
            </div>
          </div>

          <div class="card-bg p-4 rounded-lg shadow-sm border lists-border">
            <h3 class="text-lg font-bold mb-3 inline-flex items-center">
              <Icon name="fa6-solid:lightbulb" class="mr-1" aria-hidden="true" />
              <span>{{ t('saved_lists.tips') }}</span>
            </h3>
            <ul class="list-disc pl-5 text-sm space-y-2">
              <li>{{ t('saved_lists.tip_1') }}</li>
              <li>{{ t('saved_lists.tip_2') }}</li>
              <li>{{ t('saved_lists.tip_3') }}</li>
              <li>{{ t('saved_lists.tip_4') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal para crear/editar lista -->
    <Teleport to="body">
      <div
        v-if="showCreateForm || editingList"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-modal="true"
      >
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" @click="cancelForm" />

          <div class="lists-modal-bg rounded-lg shadow-xl max-w-md w-full p-6 relative z-10">
            <h3 class="text-lg font-medium mb-4">
              {{ editingList ? t('saved_lists.edit_list') : t('saved_lists.create_new_list') }}
            </h3>

            <div class="mb-4">
              <label for="list-name" class="block text-sm font-medium mb-1">
                {{ t('saved_lists.name') }} *
              </label>
              <input
                id="list-name"
                v-model="formData.name"
                type="text"
                class="w-full rounded-md border lists-input px-3 py-2"
                required
              />
            </div>

            <div class="mb-4">
              <label for="list-description" class="block text-sm font-medium mb-1">
                {{ t('saved_lists.description') }}
              </label>
              <textarea
                id="list-description"
                v-model="formData.description"
                rows="3"
                class="w-full rounded-md border lists-input px-3 py-2"
              />
            </div>

            <div class="mb-4">
              <div class="flex items-center">
                <input
                  id="is-public"
                  v-model="formData.is_public"
                  type="checkbox"
                  class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
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
                class="px-4 py-2 border lists-btn-border rounded-md text-text dark:text-text-dark lists-hover"
                @click="cancelForm"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md"
                :disabled="!formData.name || formSubmitting"
                @click="saveList"
              >
                <span v-if="formSubmitting" class="inline-flex items-center"
                  ><Icon
                    name="fa6-solid:spinner"
                    class="mr-2 flex-shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                  <span>{{ t('common.saving') }}</span>
                </span>
                <span v-else>
                  {{ editingList ? t('common.update') : t('common.create') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" @click="showDeleteConfirm = false" />

          <div class="lists-modal-bg rounded-lg shadow-xl max-w-md w-full p-6 relative z-10">
            <h3 class="text-lg font-medium mb-2">
              {{ t('saved_lists.confirm_delete') }}
            </h3>

            <p class="text-text-muted dark:text-text-dark-muted mb-4">
              {{ t('saved_lists.delete_warning', { name: listToDelete?.name }) }}
            </p>

            <div class="flex justify-end space-x-3">
              <button
                class="px-4 py-2 border lists-btn-border rounded-md text-text dark:text-text-dark lists-hover"
                @click="showDeleteConfirm = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                :disabled="deleteSubmitting"
                @click="deleteList"
              >
                <span v-if="deleteSubmitting" class="inline-flex items-center"
                  ><Icon
                    name="fa6-solid:spinner"
                    class="mr-2 flex-shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                  <span>{{ t('common.deleting') }}</span>
                </span>
                <span v-else>
                  {{ t('common.delete') }}
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
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useLocalePath, useI18n } from '#i18n'
  import { useSavedListsStore } from '~/stores/savedLists'
  import { useAuthStore } from '~/stores/auth'

  const { t } = useI18n()

  const localePath = useLocalePath()
  const router = useRouter()
  const savedListsStore = useSavedListsStore()
  const authStore = useAuthStore()

  // Estado
  const loading = ref(true)
  const showCreateForm = ref(false)
  const editingList = ref(null)
  const showDeleteConfirm = ref(false)
  const listToDelete = ref(null)
  const formSubmitting = ref(false)
  const deleteSubmitting = ref(false)

  // Form data
  const formData = ref({
    name: '',
    description: '',
    is_public: false,
    type: 'custom',
  })

  // Computed properties
  const lists = computed(() => savedListsStore.lists)
  const favoritesList = computed(() => savedListsStore.favoritesList)
  const readLaterList = computed(() => savedListsStore.readLaterList)
  const customLists = computed(() => savedListsStore.customLists)

  // Methods
  const fetchLists = async () => {
    loading.value = true
    try {
      await savedListsStore.fetchLists()
    } catch (error) {
      console.error('Error loading lists:', error)
    } finally {
      loading.value = false
    }
  }

  const navigateToList = (username, slug) => {
    // For system lists (favorites, read-later), use the old format with UUID
    if (!username || !slug) {
      // Fallback to UUID for system lists
      const identifier = username || slug
      router.push(localePath(`/lists/${identifier}`))
    } else {
      // For custom lists, use username/slug format
      router.push(localePath(`/lists/${username}/${slug}`))
    }
  }

  const openEditModal = (list) => {
    editingList.value = list
    formData.value = {
      name: list.name,
      description: list.description || '',
      is_public: list.is_public,
      type: list.type,
    }
  }

  const confirmDelete = (list) => {
    listToDelete.value = list
    showDeleteConfirm.value = true
  }

  const saveList = async () => {
    if (!formData.value.name) return

    formSubmitting.value = true

    try {
      if (editingList.value) {
        // Determine identifier to use (uuid, slug or id)
        let identifier
        if (editingList.value.type === 'custom') {
          // For custom lists, use uuid, slug or id (in order of preference)
          identifier = editingList.value.uuid || editingList.value.slug || editingList.value.id
        } else if (editingList.value.type === 'favorite') {
          identifier = 'favorites'
        } else {
          identifier = 'read-later'
        }

        // Verify we have a valid identifier
        if (!identifier) {
          console.error('No valid identifier found for list:', editingList.value)
          throw new Error('Cannot update list: invalid identifier')
        }

        // Update existing list
        await savedListsStore.updateList(identifier, formData.value)
      } else {
        // Create new list
        await savedListsStore.createList(formData.value)
      }

      // Clear and close form
      cancelForm()
    } catch (error) {
      console.error('Error saving list:', error)
    } finally {
      formSubmitting.value = false
    }
  }

  const deleteList = async () => {
    if (!listToDelete.value) return

    deleteSubmitting.value = true

    try {
      // Use UUID for custom lists
      await savedListsStore.deleteList(listToDelete.value.uuid || listToDelete.value.id)
      showDeleteConfirm.value = false
      listToDelete.value = null
    } catch (error) {
      console.error('Error deleting list:', error)
    } finally {
      deleteSubmitting.value = false
    }
  }

  const cancelForm = () => {
    showCreateForm.value = false
    editingList.value = null
    formData.value = {
      name: '',
      description: '',
      is_public: false,
      type: 'custom',
    }
  }

  // Lifecycle hooks
  onMounted(() => {
    if (authStore.isAuthenticated) {
      fetchLists()
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

  .lists-border {
    border-color: var(--color-border-default);
  }

  .lists-badge-bg {
    background-color: var(--color-bg-subtle);
  }

  .lists-divider {
    border-color: var(--color-border-subtle);
  }

  .lists-modal-bg {
    background-color: var(--color-bg-card);
  }

  .lists-input {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .lists-btn-border {
    border-color: var(--color-border-default);
  }

  .lists-hover:hover {
    background-color: var(--color-bg-hover);
  }
</style>
