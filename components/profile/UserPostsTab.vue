<template>
  <PostsCompactList
    :posts="userPosts"
    :loading="loadingPosts"
    :username="username"
    :is-own-profile="false"
    :show-header="false"
    :show-add-button="false"
    :show-action-buttons="false"
    :show-status-filter="false"
    :show-refresh-button="false"
    :show-pagination="true"
    :empty-message="t('profile.no_posts')"
    :empty-sub-message="t('profile.user_has_no_posts')"
    @page-changed="changePage"
  />
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { useI18n } from '#i18n'
  import PostsCompactList from '~/components/common/PostsCompactList.vue'

  const props = defineProps({
    username: {
      type: String,
      required: true,
    },
  })

  const { t } = useI18n()
  const { $api } = useNuxtApp()

  const userPosts = ref({ data: [] })
  const loadingPosts = ref(true)

  async function loadUserPosts(page = 1) {
    if (!props.username) return

    loadingPosts.value = true
    try {
      const response = await $api.users.getUserPosts(props.username, {
        page: page,
        per_page: 10,
      })
      userPosts.value = response.data
    } catch (error) {
      console.error('Error al cargar posts:', error)
      userPosts.value = { data: [] }
    } finally {
      loadingPosts.value = false
    }
  }

  function changePage(page) {
    loadUserPosts(page)
  }

  watch(
    () => props.username,
    () => {
      if (props.username) {
        loadUserPosts(1)
      }
    },
    { immediate: true }
  )
</script>
