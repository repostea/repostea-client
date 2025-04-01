<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <template v-else-if="user">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <div
            class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-4"
          >
            <div class="p-6">
              <div class="flex flex-col items-center mb-4">
                <div v-if="user.avatar" class="w-24 h-24 mb-3">
                  <img
                    :src="user.avatar"
                    class="rounded-full w-full h-full object-cover"
                    :alt="user.username"
                  />
                </div>
                <div
                  v-else
                  class="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl mb-3"
                >
                  <i class="fas fa-user-circle"></i>
                </div>
                <h1 class="text-xl font-bold">
                  {{ user.username }}
                </h1>
                <div class="text-text-muted dark:text-text-dark-muted text-sm">
                  {{ $t('user.joined') }}:
                  {{ formatDate(user.created_at) }}
                </div>
                <div class="text-primary font-bold mt-2">
                  {{ $t('user.karma') }}:
                  {{ formatNumber(user.karma) }}
                </div>
              </div>

              <div v-if="user.bio" class="mt-4">
                <h3 class="text-lg font-medium mb-2">
                  {{ $t('user.about_me') }}
                </h3>
                <p class="text-sm">{{ user.bio }}</p>
              </div>
              <div v-else class="mt-4 text-center text-text-muted dark:text-text-dark-muted italic">
                {{ $t('user.no_bio') }}
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div
            class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-6"
          >
            <div class="px-6 py-4 border-b border-border-color dark:border-neutral-700">
              <div class="flex items-center justify-between">
                <h2 class="font-medium text-lg">
                  <i class="fas fa-link mr-2"></i>{{ $t('user.published_links') }}
                </h2>
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  userLinks.length
                }}</span>
              </div>
            </div>

            <div v-if="loadingLinks" class="p-6 text-center">
              <div
                class="spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"
              ></div>
            </div>

            <div
              v-else-if="userLinks.length === 0"
              class="p-6 text-center text-text-muted dark:text-text-dark-muted"
            >
              <p>{{ $t('links.no_links') }}</p>
            </div>

            <div v-else>
              <LinkCard v-for="link in userLinks" :key="link.id" :link="link" />
            </div>
          </div>

          <div
            class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700"
          >
            <div class="px-6 py-4 border-b border-border-color dark:border-neutral-700">
              <div class="flex items-center justify-between">
                <h2 class="font-medium text-lg">
                  <i class="fas fa-comments mr-2"></i>{{ $t('user.user_comments') }}
                </h2>
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  userComments.length
                }}</span>
              </div>
            </div>

            <div v-if="loadingComments" class="p-6 text-center">
              <div
                class="spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"
              ></div>
            </div>

            <div
              v-else-if="userComments.length === 0"
              class="p-6 text-center text-text-muted dark:text-text-dark-muted"
            >
              <p>{{ $t('comments.no_comments') }}</p>
            </div>

            <div v-else class="divide-y divide-border-color dark:divide-neutral-700">
              <div v-for="comment in userComments" :key="comment.id" class="p-4">
                <div class="flex items-start mb-2">
                  <div class="text-sm font-medium text-primary mr-2">
                    <NuxtLink :to="`/links/${comment.link.id}`" class="hover:underline">
                      {{ comment.link.title }}
                    </NuxtLink>
                  </div>
                  <div class="text-xs text-text-muted dark:text-text-dark-muted ml-auto">
                    {{ formatDate(comment.created_at) }}
                  </div>
                </div>
                <p class="text-sm">{{ comment.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div
      v-else-if="!loading"
      class="bg-white dark:bg-card-dark p-6 rounded-lg shadow-sm border border-border-color dark:border-neutral-700 text-center"
    >
      <i class="fas fa-exclamation-triangle text-3xl text-danger mb-3"></i>
      <h2 class="text-xl font-bold mb-2">{{ $t('errors.404.title') }}</h2>
      <p>{{ $t('errors.404.message') }}</p>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import LinkCard from '@/components/links/LinkCard.vue'

  const route = useRoute()
  const { $api } = useNuxtApp()

  const user = ref(null)
  const userLinks = ref([])
  const userComments = ref([])
  const loading = ref(true)
  const loadingLinks = ref(true)
  const loadingComments = ref(true)

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  function formatNumber(num) {
    if (!num) return '0.0'
    return Number(num).toFixed(1)
  }

  async function fetchUserData() {
    loading.value = true
    const username = route.params.username

    try {
      const response = await $api.users.getUser(username)
      user.value = response.data.data
    } catch (error) {
      console.error('Error fetching user:', error)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchUserLinks() {
    if (!user.value) return

    loadingLinks.value = true
    const username = route.params.username

    try {
      const response = await $api.users.getUserLinks(username, {
        status: 'published',
        per_page: 5,
      })
      userLinks.value = response.data.data
    } catch (error) {
      console.error('Error fetching user links:', error)
      userLinks.value = []
    } finally {
      loadingLinks.value = false
    }
  }

  async function fetchUserComments() {
    if (!user.value) return

    loadingComments.value = true
    const username = route.params.username

    try {
      const response = await $api.users.getUserComments(username, {
        per_page: 10,
      })
      userComments.value = response.data.data
    } catch (error) {
      console.error('Error fetching user comments:', error)
      userComments.value = []
    } finally {
      loadingComments.value = false
    }
  }

  onMounted(async () => {
    await fetchUserData()
    if (user.value) {
      fetchUserLinks()
      fetchUserComments()
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
</style>
