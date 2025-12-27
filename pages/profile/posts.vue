<template>
  <ProfileLayout active-tab="posts">
    <PostsCompactList
      :posts="{ data: userPosts }"
      :loading="loading"
      :username="authStore.user?.username"
      :is-own-profile="true"
      :show-header="true"
      :header-title="t('profile.my_posts')"
      :show-add-button="true"
      :show-action-buttons="true"
      :show-edit-button="true"
      :show-delete-button="true"
      :show-status-filter="true"
      :show-refresh-button="true"
      :show-pagination="false"
      :empty-message="t('profile.no_posts_yet')"
      :empty-sub-message="t('profile.share_something')"
      :success-message="successMessage"
      :error-message="errorMessage"
      @refresh="fetchUserPosts"
      @edit="editPost"
      @delete="deletePost"
      @status-changed="handleStatusChange"
    />
  </ProfileLayout>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n } from '#i18n'
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'
  import PostsCompactList from '~/components/common/PostsCompactList.vue'

  definePageMeta({
    middleware: ['auth'],
  })

  const authStore = useAuthStore()
  const { t } = useI18n()
  const { $api } = useNuxtApp()

  const loading = ref(false)
  const userPosts = ref([])
  const successMessage = ref('')
  const errorMessage = ref('')

  async function fetchUserPosts() {
    if (!authStore.user?.id) return

    loading.value = true
    try {
      const response = await $api.posts.getPosts({ user_id: authStore.user.id, per_page: 50 })
      userPosts.value = response.data.data || []
    } catch (error) {
      errorMessage.value = t('profile.error_loading_posts')
      console.error('Error loading posts:', error)
    } finally {
      loading.value = false
    }
  }

  async function editPost(updatedPost) {
    // Update post in local array without reloading the entire list
    const index = userPosts.value.findIndex((p) => p.id === updatedPost.id)
    if (index !== -1) {
      // Keep additional properties the post might have
      userPosts.value[index] = { ...userPosts.value[index], ...updatedPost }
    }

    successMessage.value = t('posts.update_success')

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }

  async function deletePost(postId) {
    // Confirmation is handled by DeletePostModal component
    loading.value = true
    try {
      await $api.posts.deletePost(postId)
      await fetchUserPosts()
      successMessage.value = t('posts.delete_success')

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      // Show the server's error message if available, otherwise show generic error
      if (error.response?.data?.message) {
        errorMessage.value = error.response.data.message
      } else {
        errorMessage.value = t('posts.delete_error')
      }
      console.error('Error deleting post:', error)
    } finally {
      loading.value = false
    }
  }

  async function handleStatusChange(postId, newStatus) {
    // Update post in local array without reloading the entire list
    const index = userPosts.value.findIndex((p) => p.id === postId)
    if (index !== -1) {
      userPosts.value[index] = { ...userPosts.value[index], status: newStatus }
    }

    successMessage.value =
      newStatus === 'published' ? t('posts.published_successfully') : t('posts.draft_saved')

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }

  onMounted(async () => {
    if (!authStore.user || authStore.shouldRefreshUser) {
      await authStore.fetchUser()
    }
    await fetchUserPosts()
  })
</script>
