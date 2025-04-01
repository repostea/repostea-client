<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div
            class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
          ></div>
        </div>

        <template v-else-if="link">
          <LinkDetail :link="link" @voted="onLinkVoted" />

          <div
            class="bg-white dark:bg-card-dark border border-border-color dark:border-neutral-700 rounded-lg shadow-sm"
          >
            <div
              class="flex justify-between items-center p-4 border-b border-border-color dark:border-neutral-700"
            >
              <h2 class="text-lg font-bold">
                <i class="fas fa-comments mr-2"></i>
                {{ $t('comments.title') }} ({{ (link.comments || []).length }})
              </h2>

              <div class="dropdown relative">
                <button
                  @click="showSortDropdown = !showSortDropdown"
                  class="px-3 py-1 text-sm border border-border-color dark:border-neutral-700 rounded flex items-center"
                >
                  <i class="fas fa-sort mr-1"></i>
                  {{ $t('common.sort') }}
                  <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>

                <div
                  v-if="showSortDropdown"
                  class="absolute right-0 mt-1 w-40 bg-white dark:bg-card-dark border border-border-color dark:border-neutral-700 rounded shadow-md z-10"
                >
                  <button
                    @click="sortComments('karma')"
                    class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800"
                    :class="{
                      'bg-gray-100 dark:bg-neutral-800': commentSort === 'karma',
                    }"
                  >
                    {{ $t('comments.sort_best') }}
                  </button>
                  <button
                    @click="sortComments('created_at')"
                    class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800"
                    :class="{
                      'bg-gray-100 dark:bg-neutral-800': commentSort === 'created_at',
                    }"
                  >
                    {{ $t('comments.sort_newest') }}
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="authStore.isAuthenticated"
              class="p-4 border-b border-border-color dark:border-neutral-700"
            >
              <CommentForm
                :placeholder="$t('comments.write')"
                :submit-label="$t('comments.comment')"
                :is-submitting="isSubmittingComment"
                :error="commentError"
                @submit="submitComment"
              />
            </div>

            <div
              v-else
              class="p-4 text-center text-text-muted dark:text-text-dark-muted border-b border-border-color dark:border-neutral-700"
            >
              <p>
                {{ $t('comments.login_to_comment') }}
                <NuxtLink :to="$localePath('/auth/login')" class="text-primary hover:underline">{{
                  $t('auth.login')
                }}</NuxtLink>
                {{ $t('common.or') }}
                <NuxtLink
                  :to="$localePath('/auth/register')"
                  class="text-primary hover:underline"
                  >{{ $t('auth.register') }}</NuxtLink
                >
              </p>
            </div>

            <div
              v-if="link.comments && link.comments.length > 0"
              class="divide-y divide-border-color dark:divide-neutral-700"
            >
              <CommentItem
                v-for="comment in sortedComments"
                :key="comment.id"
                :comment="comment"
                :link-id="link.id"
                @voted="onCommentVoted"
                @reply="replyTo"
              >
                <template v-slot:reply-form>
                  <div v-if="replyingTo === comment.id" class="mt-3">
                    <CommentForm
                      :placeholder="$t('comments.write_reply')"
                      :submit-label="$t('comments.reply')"
                      :is-submitting="isSubmittingReply"
                      :error="replyError"
                      @submit="(formData) => submitReply(comment.id, formData)"
                    >
                      <template v-slot:cancel-button>
                        <button
                          type="button"
                          @click="replyingTo = null"
                          class="px-3 py-2 mr-2 border border-border-color dark:border-neutral-700 rounded text-sm"
                        >
                          {{ $t('common.cancel') }}
                        </button>
                      </template>
                    </CommentForm>
                  </div>
                </template>
              </CommentItem>
            </div>
            <div v-else class="p-4 text-center text-text-muted dark:text-text-dark-muted">
              <p>{{ $t('comments.no_comments') }}</p>
            </div>
          </div>
        </template>
        <div
          v-else-if="!loading"
          class="bg-white dark:bg-card-dark p-6 rounded-lg shadow-sm border border-border-color dark:border-neutral-700 text-center"
        >
          <i class="fas fa-exclamation-triangle text-3xl text-danger mb-3"></i>
          <h2 class="text-xl font-bold mb-2">
            {{ $t('errors.404.title') }}
          </h2>
          <p>{{ $t('errors.404.message') }}</p>
        </div>
      </div>

      <div class="lg:col-span-1">
        <AuthorCard v-if="link" :user="link.user" />
        <RelatedLinks v-if="link" :linkId="link.id" :tagIds="link.tags.map((tag) => tag.id)" />

        <div
          v-if="link"
          class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700"
        >
          <div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
            <h3 class="font-medium">
              <i class="fas fa-share-alt mr-2"></i>{{ $t('links.show.share') }}
            </h3>
          </div>
          <div class="p-4">
            <div class="flex justify-around">
              <button
                @click="shareLink('twitter')"
                class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-primary"
              >
                <i class="fab fa-twitter fa-lg"></i>
              </button>
              <button
                @click="shareLink('facebook')"
                class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-primary"
              >
                <i class="fab fa-facebook-f fa-lg"></i>
              </button>
              <button
                @click="shareLink('whatsapp')"
                class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-primary"
              >
                <i class="fab fa-whatsapp fa-lg"></i>
              </button>
              <button
                @click="copyLink()"
                class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-primary"
              >
                <i class="fas fa-link fa-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useLinksStore } from '@/stores/links'
  import AuthorCard from '@/components/links/AuthorCard.vue'
  import RelatedLinks from '@/components/links/RelatedLinks.vue'
  import LinkDetail from '@/components/links/LinkDetail.vue'
  import CommentForm from '@/components/comments/CommentForm.vue'
  import CommentItem from '@/components/comments/CommentItem.vue'

  const route = useRoute()
  const authStore = useAuthStore()
  const linksStore = useLinksStore()
  const { $api } = useNuxtApp()

  const loading = ref(true)
  const link = ref(null)
  const commentSort = ref('karma')
  const showSortDropdown = ref(false)
  const replyingTo = ref(null)
  const isSubmittingComment = ref(false)
  const isSubmittingReply = ref(false)
  const commentError = ref('')
  const replyError = ref('')

  const sortedComments = computed(() => {
    if (!link.value?.comments) return []

    return [...link.value.comments].sort((a, b) => {
      if (commentSort.value === 'karma') {
        return b.karma - a.karma
      } else {
        return new Date(b.created_at) - new Date(a.created_at)
      }
    })
  })

  function sortComments(sort) {
    showSortDropdown = false
    commentSort.value = sort
  }

  function onLinkVoted(data) {
    console.log('Link voted:', data)
  }

  function onCommentVoted(data) {
    console.log('Comment voted:', data)
  }

  function replyTo(commentId) {
    replyingTo.value = commentId
  }

  async function submitComment(formData) {
    if (!authStore.isAuthenticated || isSubmittingComment.value) return

    isSubmittingComment.value = true
    commentError.value = ''

    try {
      const response = await $api.comments.createComment(link.value.id, {
        content: formData.content,
      })

      link.value.comments.unshift(response.data.data)
    } catch (error) {
      console.error('Error submitting comment:', error)
      commentError.value = error.response?.data?.message || 'Error submitting comment'
    } finally {
      isSubmittingComment.value = false
    }
  }

  async function submitReply(parentId, formData) {
    if (!authStore.isAuthenticated || isSubmittingReply.value) return

    isSubmittingReply.value = true
    replyError.value = ''

    try {
      const response = await $api.comments.createComment(link.value.id, {
        content: formData.content,
        parent_id: parentId,
      })

      const parentComment = link.value.comments.find((c) => c.id === parentId)
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = []
        }
        parentComment.replies.push(response.data.data)
      }

      replyingTo.value = null
    } catch (error) {
      console.error('Error submitting reply:', error)
      replyError.value = error.response?.data?.message || 'Error submitting reply'
    } finally {
      isSubmittingReply.value = false
    }
  }

  function shareLink(platform) {
    const url = window.location.href
    let shareUrl = ''

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(link.value.title)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(link.value.title + ' - ' + url)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank')
    }
  }

  function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        alert('Link copied to clipboard')
      })
      .catch((err) => {
        console.error('Failed to copy link:', err)
      })
  }

  onMounted(async () => {
    try {
      const linkId = route.params.id
      const response = await $api.links.getLink(linkId)
      link.value = response.data.data
    } catch (error) {
      console.error('Error fetching link:', error)
    } finally {
      loading.value = false
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
