<template>
  <div v-if="commentsHidden" class="card-bg rounded-lg p-8 text-center">
    <div class="text-gray-400 dark:text-gray-500 text-4xl mb-3">
      <Icon name="fa6-solid:lock" aria-hidden="true" />
    </div>
    <h3 class="text-lg font-medium mb-2">{{ t('profile.comments_hidden') }}</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      {{ t('profile.comments_hidden_description') }}
    </p>
    <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
      {{ t('profile.comments_hidden_note') }}
    </p>
  </div>
  <CommentsCompactList
    v-else
    :comments="userComments"
    :loading="loadingComments"
    :username="username"
    :is-own-profile="false"
    :show-header="false"
    :show-action-buttons="false"
    :show-edit-button="false"
    :show-delete-button="false"
    :show-refresh-button="false"
    :show-pagination="true"
    :empty-message="t('profile.no_comments')"
    :empty-sub-message="t('profile.user_has_no_comments')"
    @page-changed="changePage"
  />
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { useI18n } from '#i18n'
  import CommentsCompactList from '~/components/common/CommentsCompactList.vue'

  const props = defineProps({
    username: {
      type: String,
      required: true,
    },
  })

  const { t } = useI18n()
  const { $api } = useNuxtApp()

  const userComments = ref({ data: [] })
  const loadingComments = ref(true)
  const commentsHidden = ref(false)

  async function loadUserComments(page = 1) {
    if (!props.username) return

    loadingComments.value = true
    commentsHidden.value = false
    try {
      const response = await $api.users.getUserComments(props.username, {
        page: page,
        per_page: 10,
      })
      userComments.value = response.data
    } catch (error) {
      console.error('Error al cargar comentarios:', error)
      // Check if comments are hidden (403 Forbidden)
      if (error.response?.status === 403) {
        commentsHidden.value = true
      }
      userComments.value = { data: [] }
    } finally {
      loadingComments.value = false
    }
  }

  function changePage(page) {
    loadUserComments(page)
  }

  watch(
    () => props.username,
    () => {
      if (props.username) {
        loadUserComments(1)
      }
    },
    { immediate: true }
  )
</script>
