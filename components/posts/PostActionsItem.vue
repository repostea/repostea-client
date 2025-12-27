<template>
  <div ref="buttonContainer" class="relative">
    <FooterButton
      :icon="isProcessing ? 'fa6-solid:spinner' : 'fa6-solid:bookmark'"
      :label="showLabels ? t('saved_lists.save', 'Save') : undefined"
      :title="t('saved_lists.save_options', 'Save options')"
      :class="{ 'opacity-70 pointer-events-none': isProcessing, 'animate-spin-icon': isProcessing }"
      :disabled="isProcessing"
      @click="toggleDropdown"
    />
  </div>

  <!-- Teleport dropdown to body -->
  <Teleport to="body">
    <div
      v-if="showDropdown"
      ref="dropdownElement"
      :style="dropdownPosition"
      class="actions-dropdown fixed z-[5000] w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <div class="py-1">
        <button
          class="actions-item block w-full text-left px-4 py-2 text-sm"
          :class="{ 'opacity-70': isProcessing }"
          :disabled="isProcessing"
          @click="saveAs('favorite')"
        >
          <div class="flex items-center">
            <Icon
              :name="processingType === 'favorite' ? 'fa6-solid:spinner' : 'fa6-solid:star'"
              :class="['text-yellow-500 mr-2', { 'animate-spin': processingType === 'favorite' }]"
              aria-hidden="true"
            />
            <span>{{ t('saved_lists.favorite', 'Favorites') }}</span>
          </div>
        </button>

        <button
          class="actions-item block w-full text-left px-4 py-2 text-sm"
          :class="{ 'opacity-70': isProcessing }"
          :disabled="isProcessing"
          @click="saveAs('read_later')"
        >
          <div class="flex items-center">
            <Icon
              :name="
                processingType === 'read_later' ? 'fa6-solid:spinner' : 'fa6-solid:book-open-reader'
              "
              :class="['text-blue-500 mr-2', { 'animate-spin': processingType === 'read_later' }]"
              aria-hidden="true"
            />
            <span>{{ t('saved_lists.read_later', 'Read later') }}</span>
          </div>
        </button>
      </div>

      <div v-if="customLists.length > 0" class="py-1">
        <div class="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          {{ t('saved_lists.my_lists', 'My lists') }}
        </div>

        <div class="max-h-40 overflow-y-auto">
          <button
            v-for="list in customLists"
            :key="list.id"
            class="actions-item block w-full text-left px-4 py-2 text-sm"
            :class="{ 'opacity-70': isProcessingListId === list.id }"
            :disabled="isProcessingListId === list.id"
            @click="saveToList(list.id, list.name)"
          >
            <div class="flex items-center">
              <Icon
                :name="isProcessingListId === list.id ? 'fa6-solid:spinner' : 'fa6-solid:list-ul'"
                :class="['text-green-500 mr-2', { 'animate-spin': isProcessingListId === list.id }]"
                aria-hidden="true"
              />
              <span>{{ list.name }}</span>
            </div>
          </button>
        </div>
      </div>

      <div class="py-1">
        <button
          class="actions-item actions-item-create block w-full text-left px-4 py-2 text-sm"
          @click="showCreateForm = true"
        >
          <div class="flex items-center">
            <Icon name="fa6-solid:circle-plus" class="mr-2" aria-hidden="true" />
            <span>{{ t('saved_lists.create_new_list', 'Create new list') }}</span>
          </div>
        </button>
      </div>
    </div>
  </Teleport>

  <!-- Create list modal -->
  <Teleport to="body">
    <div v-if="showCreateForm" class="fixed inset-0 z-[9999] overflow-y-auto" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="showCreateForm = false" />

        <div class="actions-modal rounded-lg shadow-xl max-w-md w-full p-6 relative z-10">
          <h3 class="text-lg font-medium mb-4">
            {{ t('saved_lists.create_new_list', 'Create new list') }}
          </h3>

          <div class="mb-4">
            <label for="list-name" class="block text-sm font-medium mb-1">
              {{ t('saved_lists.name', 'Name') }} *
            </label>
            <input
              id="list-name"
              v-model="newList.name"
              type="text"
              class="actions-input w-full rounded-md px-3 py-2"
              required
            >
          </div>

          <div class="mb-4">
            <label for="list-description" class="block text-sm font-medium mb-1">
              {{ t('saved_lists.description', 'Description') }}
            </label>
            <textarea
              id="list-description"
              v-model="newList.description"
              rows="3"
              class="actions-input w-full rounded-md px-3 py-2"
            />
          </div>

          <div class="mb-4">
            <div class="flex items-center">
              <input
                id="is-public"
                v-model="newList.is_public"
                type="checkbox"
                class="w-6 h-6 rounded actions-checkbox text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
              >
              <label for="is-public" class="ml-2 text-sm">
                {{ t('saved_lists.is_public', 'Public list') }}
              </label>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ t('saved_lists.public_list_info', 'Public lists are visible to other users') }}
            </p>
          </div>

          <div class="flex justify-end space-x-3">
            <button class="actions-cancel-btn px-4 py-2 rounded-md" @click="showCreateForm = false">
              {{ t('common.cancel', 'Cancel') }}
            </button>
            <button
              class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md"
              :disabled="!newList.name || formSubmitting"
              @click="createNewList"
            >
              <span v-if="formSubmitting" class="flex items-center">
                <Icon name="fa6-solid:spinner" class="mr-2 animate-spin" aria-hidden="true" />
                {{ t('common.saving', 'Saving...') }}
              </span>
              <span v-else>
                {{ t('common.create', 'Create') }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Notification modal -->
  <Teleport to="body">
    <div v-if="notification.show" class="fixed inset-0 flex items-center justify-center z-[9999]">
      <div class="fixed inset-0 bg-black bg-opacity-60" />

      <div
        class="actions-notification rounded-lg shadow-xl p-5 mx-auto flex items-start max-w-lg w-full relative z-10"
      >
        <div class="flex-shrink-0 mr-4">
          <Icon
            :name="notification.isError ? 'fa6-solid:circle-exclamation' : 'fa6-solid:circle-check'"
            :class="['text-3xl', notification.isError ? 'text-red-500' : 'text-green-500']"
            aria-hidden="true"
          />
        </div>
        <div class="flex-grow">
          <h3 class="text-lg font-medium mb-2">{{ notification.title }}</h3>
          <p class="text-base text-gray-600 dark:text-gray-300 mb-3">{{ notification.message }}</p>

          <div class="actions-notification-card p-3 rounded-lg mb-2">
            <h4 class="font-medium mb-1">{{ t('saved_lists.access_title', 'How to access?') }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ notification.accessMessage }}
            </p>
          </div>

          <div v-if="notification.showAction" class="mt-3">
            <button
              class="text-sm text-primary hover:text-primary-dark hover:underline inline-flex items-center gap-1"
              @click="goToList(notification.type)"
            >
              {{ notification.actionText }}
              <Icon name="fa6-solid:arrow-right" class="text-xs" aria-hidden="true" />
            </button>
          </div>
        </div>
        <button
          class="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
          :aria-label="$t('common.close')"
          @click="notification.show = false"
        >
          <Icon name="fa6-solid:xmark" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useSavedListsStore } from '~/stores/savedLists'
  import { useI18n, useLocalePath } from '#i18n'
  import { useRouter } from 'vue-router'
  import FooterButton from '~/components/posts/postCard/FooterButton.vue'

  const localePath = useLocalePath()

  const props = defineProps({
    postId: {
      type: [Number, String],
      required: true,
    },
    showLabels: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['favorite-toggled', 'read-later-toggled', 'saved-to-list'])

  const { t } = useI18n()
  const authStore = useAuthStore()
  const savedListsStore = useSavedListsStore()
  const router = useRouter()

  const showDropdown = ref(false)
  const showCreateForm = ref(false)
  const formSubmitting = ref(false)
  const isProcessing = ref(false)
  const processingType = ref(null)
  const isProcessingListId = ref(null)
  const buttonContainer = ref(null)
  const newList = ref({
    name: '',
    description: '',
    is_public: false,
    type: 'custom',
  })

  const notification = ref({
    show: false,
    title: '',
    message: '',
    type: '',
    isError: false,
    showAction: false,
    accessMessage: '',
    actionText: '',
  })

  const customLists = computed(() => {
    return savedListsStore.customLists.length > 0 ? savedListsStore.customLists : []
  })

  const dropdownPosition = ref({})

  const updateDropdownPosition = () => {
    if (!buttonContainer.value || !import.meta.client) {
      dropdownPosition.value = {}
      return
    }

    const rect = buttonContainer.value.getBoundingClientRect()
    dropdownPosition.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.right - 192}px`, // 192px = w-48
    }
  }

  const toggleDropdown = async () => {
    if (!authStore.isAuthenticated || isProcessing.value) {
      if (!authStore.isAuthenticated) {
        await router.push(localePath('/auth/login'))
        return
      }
      return
    }

    // If opening, calculate position BEFORE showing
    if (!showDropdown.value) {
      updateDropdownPosition()
    }

    showDropdown.value = !showDropdown.value

    if (showDropdown.value) {
      if (savedListsStore.lists.length === 0) {
        isProcessing.value = true
        try {
          await savedListsStore.initialize()
        } catch (error) {
          console.error('Error al cargar las listas guardadas:', error)
        } finally {
          isProcessing.value = false
        }
      }
    }
  }

  const closeDropdown = () => {
    showDropdown.value = false
  }

  const saveAs = async (type) => {
    if (isProcessing.value) return

    isProcessing.value = true
    processingType.value = type

    try {
      if (type === 'favorite') {
        await savedListsStore.toggleFavorite(props.postId)

        showNotification({
          title: t('saved_lists.saved_success', 'Saved successfully'),
          message: t(
            'saved_lists.added_to_favorites',
            'The post has been added to your favorites for easy access later.'
          ),
          type: 'favorite',
          showAction: true,
          accessMessage: t(
            'saved_lists.access_favorites_info',
            'You can access your favorites at any time from the profile menu or directly in the "Saved > Favorites" section.'
          ),
          actionText: t('saved_lists.go_to_favorites', 'Go to favorites'),
        })

        emit('favorite-toggled', { postId: props.postId, active: true })
      } else if (type === 'read_later') {
        await savedListsStore.toggleReadLater(props.postId)

        showNotification({
          title: t('saved_lists.saved_success', 'Saved successfully'),
          message: t(
            'saved_lists.added_to_read_later',
            'The post has been saved to read later. It will be waiting for you when you have time to review it.'
          ),
          type: 'read_later',
          showAction: true,
          accessMessage: t(
            'saved_lists.access_read_later_info',
            'Access your reading list from the profile menu or in the "Saved > Read later" section.'
          ),
          actionText: t('saved_lists.go_to_read_later', 'Go to read later'),
        })

        emit('read-later-toggled', { postId: props.postId, active: true })
      }

      closeDropdown()
    } catch (error) {
      console.error(`Error al guardar como ${type}:`, error)
      showNotification({
        title: t('saved_lists.save_error', 'Error saving'),
        message: t(
          'saved_lists.try_again',
          'An error occurred while trying to save this post. Please try again in a few moments.'
        ),
        isError: true,
      })
    } finally {
      isProcessing.value = false
      processingType.value = null
    }
  }

  const saveToList = async (listId, listName) => {
    if (isProcessingListId.value) return

    isProcessingListId.value = listId

    try {
      await savedListsStore.addPostToList(listId, props.postId)

      showNotification({
        title: t('saved_lists.saved_success', 'Saved successfully'),
        message: t(
          'saved_lists.added_to_list',
          'The post has been successfully added to the list "{name}".',
          { name: listName }
        ),
        type: 'custom_list',
        listId,
        showAction: true,
        accessMessage: t(
          'saved_lists.access_list_info',
          'You can manage all your custom lists from your profile in the "Saved > My lists" section.'
        ),
        actionText: t('saved_lists.go_to_list', 'Go to list'),
      })

      emit('saved-to-list', {
        postId: props.postId,
        listId,
        added: true,
        listName,
      })

      closeDropdown()
    } catch (error) {
      console.error('Error al guardar en lista:', error)
      showNotification({
        title: t('saved_lists.save_error', 'Error saving'),
        message: t(
          'saved_lists.try_again',
          'An error occurred while trying to save this post. Please try again in a few moments.'
        ),
        isError: true,
      })
    } finally {
      isProcessingListId.value = null
    }
  }

  const createNewList = async () => {
    if (!newList.value.name) return

    formSubmitting.value = true

    try {
      const list = await savedListsStore.createList({
        name: newList.value.name,
        description: newList.value.description,
        is_public: newList.value.is_public,
        type: 'custom',
      })

      if (list && list.id) {
        await savedListsStore.addPostToList(list.id, props.postId)

        showNotification({
          title: t('saved_lists.saved_success', 'Saved successfully'),
          message: t(
            'saved_lists.added_to_new_list',
            'The new list "{name}" has been created and the post has been added successfully.',
            { name: list.name }
          ),
          type: 'custom_list',
          listId: list.id,
          showAction: true,
          accessMessage: t(
            'saved_lists.new_list_info',
            'You can add more content to this list at any time and manage it from your profile.'
          ),
          actionText: t('saved_lists.go_to_list', 'Go to list'),
        })

        emit('saved-to-list', {
          postId: props.postId,
          listId: list.id,
          added: true,
          listName: list.name,
          isNewList: true,
        })
      }

      newList.value = { name: '', description: '', is_public: false, type: 'custom' }
      showCreateForm.value = false
      closeDropdown()
    } catch (error) {
      console.error('Error al crear lista:', error)
      showNotification({
        title: t('saved_lists.save_error', 'Error saving'),
        message: t(
          'saved_lists.try_again',
          'An error occurred while trying to create the new list. Please try again in a few moments.'
        ),
        isError: true,
      })
    } finally {
      formSubmitting.value = false
    }
  }

  const showNotification = (options) => {
    notification.value = {
      show: true,
      title: options.title || '',
      message: options.message || '',
      type: options.type || '',
      listId: options.listId,
      isError: options.isError || false,
      showAction: options.showAction || false,
      accessMessage: options.accessMessage || '',
      actionText: options.actionText || '',
    }
  }

  const goToList = (type) => {
    let route = '/lists'

    if (type === 'favorite') {
      const favoritesList = savedListsStore.favoritesList
      if (favoritesList) {
        route = `/lists/${favoritesList.uuid || favoritesList.id}`
      }
    } else if (type === 'read_later') {
      const readLaterList = savedListsStore.readLaterList
      if (readLaterList) {
        route = `/lists/${readLaterList.uuid || readLaterList.id}`
      }
    } else if (type === 'custom_list' && notification.value.listId) {
      const list = savedListsStore.getListById(notification.value.listId)
      if (list && list.username && list.slug) {
        route = `/lists/${list.username}/${list.slug}`
      } else if (list && list.uuid) {
        route = `/lists/${list.uuid}`
      } else {
        route = `/lists/${notification.value.listId}`
      }
    }

    router.push(localePath(route))
    notification.value.show = false
  }

  const handleClickOutside = (event) => {
    if (!showDropdown.value) return

    // Check if click is outside both the button and the dropdown
    const clickedButton = buttonContainer.value && buttonContainer.value.contains(event.target)
    const clickedDropdown = event.target.closest('.z-\\[5000\\]')

    if (!clickedButton && !clickedDropdown) {
      closeDropdown()
    }
  }

  const handleScroll = () => {
    if (showDropdown.value) {
      updateDropdownPosition()
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      document.addEventListener('click', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true) // true = capture phase para capturar scroll en cualquier elemento
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.client) {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  })
</script>

<style scoped>
  .animate-spin-icon :deep(.footer-btn-icon) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .actions-dropdown {
    background-color: var(--color-bg-card);
  }

  .actions-dropdown > div {
    border-bottom: 1px solid var(--color-border-default);
  }

  .actions-dropdown > div:last-child {
    border-bottom: none;
  }

  .actions-item:hover {
    background-color: var(--color-bg-hover);
  }

  .actions-item-create {
    color: var(--color-primary);
  }

  .actions-modal {
    background-color: var(--color-bg-card);
  }

  .actions-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }

  .actions-cancel-btn {
    background-color: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .actions-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .actions-notification {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .actions-notification-card {
    background-color: var(--color-bg-subtle);
  }

  .actions-checkbox {
    border-color: var(--color-border-default);
  }
</style>
