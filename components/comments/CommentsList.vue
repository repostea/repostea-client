<template>
  <div
    class="comments-list-container card-bg border-y md:border comments-list-border md:rounded-lg md:shadow-sm"
  >
    <div
      class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 p-2 md:p-4 border-b comments-list-border"
    >
      <h2 class="text-base font-bold flex items-center">
        <Icon name="fa6-solid:comments" class="mr-2" aria-hidden="true" />
        {{ t('comments.title') }} ({{ totalCommentsCount }})
      </h2>

      <div class="flex items-center gap-3">
        <!-- Write comment button - only show when comments are open -->
        <button
          v-if="commentsOpen"
          class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium flex items-center"
          @click="handleWriteCommentClick"
        >
          <Icon name="fa6-solid:comment" class="mr-2" aria-hidden="true" />
          {{ t('comments.write_comment') }}
        </button>
        <!-- Comments closed message with Agora suggestion -->
        <div v-else class="flex items-center gap-2">
          <span class="text-sm text-text-muted dark:text-text-dark-muted flex items-center">
            <Icon name="fa6-solid:lock" class="mr-2" aria-hidden="true" />
            {{ t('comments.closed') }}
          </span>
          <NuxtLink
            :to="localePath('/agora')"
            class="text-sm text-primary hover:text-primary-dark flex items-center"
          >
            <Icon name="fa6-solid:comments" class="mr-1" aria-hidden="true" />
            {{ t('comments.closed_suggestion') }}
          </NuxtLink>
        </div>

        <!-- Sort dropdown -->
        <div class="dropdown relative">
          <button
            class="px-3 py-1 text-sm border comments-list-border rounded flex items-center"
            @click="showSortDropdown = !showSortDropdown"
          >
            <Icon name="fa6-solid:sort" class="mr-1" aria-hidden="true" />
            {{ sortButtonText }}
            <Icon name="fa6-solid:chevron-down" class="ml-1 text-xs" aria-hidden="true" />
          </button>

          <div
            v-if="showSortDropdown"
            class="absolute right-0 mt-1 w-48 card-bg border comments-list-border rounded shadow-md z-10"
          >
            <button
              class="block w-full text-left px-4 py-2 text-sm hover:bg-primary/10"
              :class="{
                'comments-list-sort-active': commentSort === 'threads',
              }"
              @click="sortComments('threads')"
            >
              {{ t('comments.sort_threads') }}
            </button>
            <button
              class="block w-full text-left px-4 py-2 text-sm hover:bg-primary/10"
              :class="{
                'comments-list-sort-active': commentSort === 'votes',
              }"
              @click="sortComments('votes')"
            >
              {{ t('comments.sort_by_votes_threads') }}
            </button>
            <button
              class="block w-full text-left px-4 py-2 text-sm hover:bg-primary/10"
              :class="{
                'comments-list-sort-active': commentSort === 'oldest',
              }"
              @click="sortComments('oldest')"
            >
              {{ t('comments.sort_chronological') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Login prompt - show when trying to comment without authentication -->
    <div
      v-if="!authStore.isAuthenticated && !authStore.token && showLoginPrompt"
      class="p-3 md:p-6 comments-list-bg-subtle border-b comments-list-border"
    >
      <div class="text-center">
        <p class="text-text dark:text-text-dark mb-4">
          {{
            isGuestAccessEnabled
              ? t('comments.login_required')
              : t('comments.login_required_no_guest')
          }}
        </p>
        <div class="flex justify-center gap-3">
          <NuxtLink
            :to="localePath('/auth/login')"
            class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium"
          >
            {{ t('auth.login') }}
          </NuxtLink>
          <button
            v-if="isGuestAccessEnabled"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
            @click="handleGuestLogin"
          >
            {{ t('auth.continue_as_guest') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Comment form section - only show when expanded, authenticated, and comments are open -->
    <div
      v-if="commentsOpen && (authStore.isAuthenticated || authStore.token) && showCommentForm"
      class="p-2 md:p-4 border-b comments-list-border comment-form-container"
      data-testid="comment-form"
    >
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-medium text-text dark:text-text-dark">
          {{ t('comments.write_comment') }}
        </h3>
        <button
          class="text-text-muted hover:text-text dark:text-text-dark-muted dark:hover:text-text-dark text-sm"
          :title="t('common.cancel')"
          :aria-label="t('common.cancel')"
          @click="collapseCommentForm"
        >
          <Icon name="fa6-solid:xmark" aria-hidden="true" />
        </button>
      </div>

      <CommentForm
        id="main-comment-form"
        ref="commentForm"
        :placeholder="t('comments.write')"
        :submit-label="t('comments.comment')"
        :is-submitting="isSubmittingComment"
        :error="commentError"
        :post-id="linkId"
        :post-author="post?.user"
        :available-comments="comments"
        @submit="submitComment"
      />

      <div v-if="authStore.isAnonymous" class="mt-2">
        <div class="text-xs text-text-muted dark:text-text-dark-muted flex items-center">
          <Icon name="fa6-solid:circle-info" class="mr-1" aria-hidden="true" />
          <span v-if="authStore.user && authStore.user.display_name">
            {{ t('comments.posting_as') }}
            <strong>{{ authStore.user.display_name }}</strong>
          </span>
          <span v-else>
            {{ t('comments.anonymous_comment_info') }}
          </span>
        </div>
      </div>
    </div>

    <!-- New comments notification banner -->
    <div
      v-if="realtimePendingCount > 0"
      class="p-3 bg-primary/10 border-b border-primary/30 flex items-center justify-between cursor-pointer hover:bg-primary/20 transition-colors"
      @click="loadNewRealtimeComments"
    >
      <div class="flex items-center text-primary">
        <Icon name="fa6-solid:comment" class="mr-2 animate-bounce" aria-hidden="true" />
        <span class="font-medium">
          {{
            realtimePendingCount === 1
              ? t('comments.new_comment_available')
              : t('comments.new_comments_available', { count: realtimePendingCount })
          }}
        </span>
      </div>
      <button class="text-primary hover:text-primary-dark font-medium text-sm flex items-center">
        {{ t('comments.load_new') }}
        <Icon name="fa6-solid:arrow-down" class="ml-1" aria-hidden="true" />
      </button>
    </div>

    <div v-if="loading" class="p-3 md:p-6 flex justify-center">
      <div
        class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
      />
    </div>

    <div v-else-if="comments && comments.length > 0" class="p-2 md:p-6">
      <CommentItem
        v-for="comment in sortedComments"
        :key="comment.id"
        :comment="comment"
        :link-id="linkId"
        :post="post"
        :replying-to="replyingTo"
        :is-submitting-reply="isSubmittingReply"
        :reply-error="replyError"
        :is-flat-mode="isFlatMode"
        @voted="onCommentVoted"
        @reply="replyTo"
        @favourited="onFavourited"
        @unfavourited="onUnfavourited"
        @submit-reply="submitReply"
        @cancel-reply="cancelReply"
      >
        <template #reply-form>
          <div v-if="replyingTo === comment.id" class="mt-3 nested-reply-form">
            <CommentForm
              :placeholder="t('comments.write_reply')"
              :submit-label="t('comments.reply')"
              :is-submitting="isSubmittingReply"
              :error="replyError"
              :post-id="linkId"
              :post-author="post?.user"
              :available-comments="comments"
              @submit="(formData) => submitReply(comment.id, formData)"
            >
              <template #cancel-button>
                <button
                  type="button"
                  class="px-3 py-2 mr-2 border comments-list-border rounded text-sm"
                  @click="cancelReply"
                >
                  {{ t('common.cancel') }}
                </button>
              </template>
            </CommentForm>
          </div>
        </template>
      </CommentItem>
    </div>
    <div
      v-else-if="!loading"
      class="p-2 md:p-4 text-center text-text-muted dark:text-text-dark-muted"
    >
      <p>{{ t('comments.no_comments') }}</p>
    </div>

    <!-- Floating Comment Button - Show when there are many comments and user might not see the form -->
    <div v-if="commentsOpen && shouldShowFloatingButton" class="fixed bottom-6 right-6 z-30">
      <button
        class="bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
        :title="t('comments.scroll_to_comment_form')"
        :aria-label="t('comments.scroll_to_comment_form')"
        @click="scrollToCommentForm"
      >
        <Icon name="fa6-solid:comment" class="text-lg" aria-hidden="true" />
        <span class="hidden sm:inline font-medium">{{ t('comments.comment') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, nextTick, watch } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useCommentsStore } from '~/stores/comments'
  import { useSystemSettings } from '~/composables/useSystemSettings'
  import { useRealtimeComments } from '~/composables/useRealtimeComments'
  import CommentForm from '~/components/comments/CommentForm.vue'
  import CommentItem from '~/components/comments/CommentItem.vue'
  import { useLocalePath, useI18n } from '#i18n'

  const { t } = useI18n()
  const localePath = useLocalePath()

  const props = defineProps({
    linkId: {
      type: [Number, String],
      required: true,
    },
    entryId: {
      type: [Number, String],
      required: false,
      default: null,
    },
    initialComments: {
      type: Array,
      default: () => [],
    },
    post: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['comment-submitted', 'reply-submitted', 'comment-voted'])

  const authStore = useAuthStore()
  const commentsStore = useCommentsStore()
  const { isGuestAccessEnabled } = useSystemSettings()

  // Realtime comments - only initialize if we have a valid numeric post ID
  const postId = computed(() => {
    const id = props.linkId
    if (typeof id === 'number') return id
    if (typeof id === 'string' && /^\d+$/.test(id)) return parseInt(id, 10)
    return null
  })

  const {
    newComments: realtimeNewComments,
    pendingCount: realtimePendingCount,
    clearPending: clearRealtimePending,
    subscribe: subscribeToComments,
    markAsOwn: markCommentAsOwn,
  } = useRealtimeComments(postId.value)

  // Watch for postId changes to subscribe
  watch(
    postId,
    (newId) => {
      if (newId && newId > 0) {
        subscribeToComments(newId)
      }
    },
    { immediate: true }
  )

  const loading = ref(true)
  const comments = computed(() => commentsStore.comments)
  const commentSort = ref('threads')
  const showSortDropdown = ref(false)
  const replyingTo = ref(null)
  const isSubmittingComment = ref(false)
  const isSubmittingReply = ref(false)
  const commentError = ref('')
  const replyError = ref('')
  const commentForm = ref(null)
  const anonymousName = ref('')
  const anonymousNameSaved = ref(false)
  const showCommentForm = ref(false)
  const showLoginPrompt = ref(false)

  // Total comment count including replies and nested comments
  const totalCommentsCount = computed(() => {
    // If post has comment count, use it
    if (props.post && props.post.comments_count !== undefined) {
      return props.post.comments_count
    }

    // Otherwise, count manually including nested
    let count = 0

    // Recursive function to count all comments, including nested
    const countAllComments = (commentsList) => {
      if (!commentsList || !Array.isArray(commentsList)) {
        return
      }

      count += commentsList.length

      for (const comment of commentsList) {
        if (comment.children && comment.children.length > 0) {
          countAllComments(comment.children)
        }
      }
    }

    countAllComments(comments.value)
    return count
  })

  // Show floating button when there are enough comments
  const shouldShowFloatingButton = computed(() => {
    return totalCommentsCount.value >= 3 // Show when there are 3 or more comments
  })

  // Check if we're in flat mode (not tree mode)
  const isFlatMode = computed(() => {
    return commentSort.value === 'oldest'
  })

  // Check if comments are open for this post
  const commentsOpen = computed(() => {
    return props.post?.comments_open !== false
  })

  // Assign sequential numbers to all comments based on creation time
  function assignCommentNumbers(commentsList) {
    // Collect all comments (including nested) in a flat array
    const allComments = []

    const collectAll = (comments) => {
      for (const comment of comments) {
        allComments.push(comment)
        if (comment.children && comment.children.length > 0) {
          collectAll(comment.children)
        }
      }
    }

    collectAll(commentsList)

    // Sort by creation time (oldest first) to assign numbers
    allComments.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return aTime - bTime
    })

    // Create a map from comment ID to comment number
    const numberMap = new Map()
    allComments.forEach((comment, index) => {
      numberMap.set(comment.id, index + 1) // Start from 1
    })

    return numberMap
  }

  // Helper function to add comment numbers to tree structure
  function addNumbersToTree(commentsList, numberMap) {
    const addNumbers = (comments) => {
      return comments.map((comment) => {
        const commentWithNumber = {
          ...comment,
          _commentNumber: numberMap.get(comment.id) || 0,
          children:
            comment.children && comment.children.length > 0 ? addNumbers(comment.children) : [],
        }
        return commentWithNumber
      })
    }

    return addNumbers(commentsList)
  }

  // Helper function to flatten comment tree into a flat array
  function flattenComments(commentsList, numberMap) {
    const result = []
    const commentMap = new Map()

    // First pass: build a map of all comments
    const buildMap = (comments) => {
      for (const comment of comments) {
        commentMap.set(comment.id, comment)
        if (comment.children && comment.children.length > 0) {
          buildMap(comment.children)
        }
      }
    }

    buildMap(commentsList)

    // Second pass: flatten and attach parent info and numbers
    const flatten = (comments, parentComment = null) => {
      for (const comment of comments) {
        // Create a shallow copy without children to avoid rendering nested structure
        const flatComment = {
          ...comment,
          children: [],
          _parentComment: parentComment, // Store parent info for display
          _commentNumber: numberMap.get(comment.id) || 0,
          _parentNumber: parentComment ? numberMap.get(parentComment.id) || 0 : 0,
        }
        result.push(flatComment)

        // Recursively flatten children, passing this comment as parent
        if (comment.children && comment.children.length > 0) {
          flatten(comment.children, comment)
        }
      }
    }

    flatten(commentsList)
    return result
  }

  const sortedComments = computed(() => {
    if (!comments.value || !Array.isArray(comments.value)) {
      return []
    }

    // First, assign numbers to all comments based on creation time
    const numberMap = assignCommentNumbers(comments.value)

    // For flat sorting mode (oldest), flatten the tree first
    if (commentSort.value === 'oldest') {
      const flatComments = flattenComments(comments.value, numberMap)

      // Sort chronologically, oldest first
      return flatComments.sort((a, b) => {
        const aTimestamp = new Date(a.created_at).getTime()
        const bTimestamp = new Date(b.created_at).getTime()
        return aTimestamp - bTimestamp
      })
    }

    // For tree modes (threads or votes), keep the hierarchical structure
    const commentsWithNumbers = addNumbersToTree(comments.value, numberMap)

    return [...commentsWithNumbers].sort((a, b) => {
      if (commentSort.value === 'votes') {
        // Sort by votes (highest first)
        const aValue = a.votes || 0
        const bValue = b.votes || 0

        if (bValue !== aValue) {
          return bValue - aValue
        } else {
          // Tie-breaker: oldest first
          const aTimestamp = new Date(a.created_at).getTime()
          const bTimestamp = new Date(b.created_at).getTime()
          return aTimestamp - bTimestamp
        }
      } else if (commentSort.value === 'threads') {
        // Sort chronologically, oldest first (default tree mode)
        const aTimestamp = new Date(a.created_at).getTime()
        const bTimestamp = new Date(b.created_at).getTime()
        return aTimestamp - bTimestamp
      }

      return 0
    })
  })

  const sortButtonText = computed(() => {
    const sortLabel = t('comments.sort_label')
    switch (commentSort.value) {
      case 'threads':
        return `${sortLabel}: ${t('comments.sort_threads')}`
      case 'votes':
        return `${sortLabel}: ${t('comments.sort_by_votes_threads')}`
      case 'oldest':
        return `${sortLabel}: ${t('comments.sort_chronological')}`
      default:
        return t('common.sort')
    }
  })

  function sortComments(sort) {
    showSortDropdown.value = false
    commentSort.value = sort
  }

  function scrollToCommentForm() {
    // Expand the form if collapsed
    showCommentForm.value = true

    // Find the comment form
    nextTick(() => {
      const commentFormElement = document.querySelector('.comment-form-container')
      if (commentFormElement) {
        // Calculate header offset
        const headerHeight = 120
        const elementPosition = commentFormElement.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - headerHeight

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })

        // Focus on textarea after scroll
        setTimeout(() => {
          if (commentFormElement && typeof commentFormElement.querySelector === 'function') {
            const textarea = commentFormElement.querySelector('textarea')
            if (textarea) {
              textarea.focus()
            }
          }
        }, 500)
      }
    })
  }

  function collapseCommentForm() {
    showCommentForm.value = false
    commentError.value = ''
  }

  function handleWriteCommentClick() {
    if (authStore.isAuthenticated || authStore.token) {
      // User is authenticated, show comment form
      showCommentForm.value = true
      showLoginPrompt.value = false
    } else {
      // User is not authenticated, show login prompt
      showLoginPrompt.value = true
      showCommentForm.value = false
    }
  }

  async function handleGuestLogin() {
    try {
      await authStore.guestLogin()
      // After successful guest login, show comment form and hide login prompt
      showLoginPrompt.value = false
      showCommentForm.value = true
    } catch (error) {
      console.error('Error during guest login:', error)
    }
  }

  function onCommentVoted(data) {
    emit('comment-voted', data)
  }

  function onFavourited(data) {
    // Adapted to use Laravel API actions
    // In this case, favorite is equivalent to positive vote
    onCommentVoted({ commentId: data.id, value: 1 })
  }

  function onUnfavourited(data) {
    // Remove favorite equals remove vote
    onCommentVoted({ commentId: data.id, value: 0 })
  }

  function replyTo(commentId) {
    replyingTo.value = commentId
    replyError.value = ''

    nextTick(() => {
      const hexId = commentId.toString(16)
      const commentElement = document.getElementById(`c-${hexId}`)
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  function cancelReply() {
    replyingTo.value = null
    replyError.value = ''
  }

  function scrollToLastComment() {
    nextTick(() => {
      if (comments.value.length > 0) {
        let newestComment = null
        let newestTimestamp = 0

        const findNewestInComments = (commentsList) => {
          commentsList.forEach((comment) => {
            const timestamp = new Date(comment.created_at).getTime()
            if (timestamp > newestTimestamp) {
              newestTimestamp = timestamp
              newestComment = comment
            }
            if (comment.children && comment.children.length > 0) {
              findNewestInComments(comment.children)
            }
          })
        }

        findNewestInComments(comments.value)

        if (newestComment) {
          const hexId =
            newestComment.hex_id || (newestComment.id ? newestComment.id.toString(16) : null)
          if (hexId) {
            const element = document.getElementById(`c-${hexId}`)

            if (element) {
              const headerHeight = 120
              const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
              const offsetPosition = elementPosition - headerHeight

              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
              })

              element.classList.add('new-comment-highlight')
              setTimeout(() => {
                element.classList.remove('new-comment-highlight')
              }, 3000)
            }
          }
        }
      }
    })
  }

  async function scrollToSpecificCommentWithRetries(commentId) {
    const delays = [100, 200, 350, 500, 750]

    const findCommentInData = (commentsList, targetId) => {
      for (const comment of commentsList) {
        if (comment.id === targetId || comment.id == targetId) {
          return comment
        }
        if (comment.children && comment.children.length > 0) {
          const found = findCommentInData(comment.children, targetId)
          if (found) return found
        }
      }
      return null
    }

    for (let attempt = 0; attempt < delays.length; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]))

      const targetComment = findCommentInData(comments.value, commentId)
      if (targetComment) {
        const hexId =
          targetComment.hex_id || (targetComment.id ? targetComment.id.toString(16) : null)

        if (hexId) {
          const element = document.getElementById(`c-${hexId}`)
          if (element) {
            const headerHeight = 120
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - headerHeight

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            })

            element.classList.add('new-comment-highlight')
            setTimeout(() => {
              element.classList.remove('new-comment-highlight')
            }, 3000)

            return
          }
        }
      } else {
        // If comment not found in data, try to find DOM element directly by converting ID
        const hexId = commentId.toString(16)
        const element = document.getElementById(`c-${hexId}`)
        if (element) {
          const headerHeight = 120
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
          const offsetPosition = elementPosition - headerHeight

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          })

          element.classList.add('new-comment-highlight')
          setTimeout(() => {
            element.classList.remove('new-comment-highlight')
          }, 3000)

          return
        }
      }
    }

    scrollToNewestCommentWithRetries()
  }

  async function scrollToNewestCommentWithRetries() {
    const delays = [100, 200, 350, 500, 750]

    for (let attempt = 0; attempt < delays.length; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]))

      // Find the newest comment based on timestamp, not DOM order
      let newestComment = null
      let newestTimestamp = 0

      const findNewestInComments = (commentsList) => {
        commentsList.forEach((comment) => {
          const timestamp = new Date(comment.created_at).getTime()
          if (timestamp > newestTimestamp) {
            newestTimestamp = timestamp
            newestComment = comment
          }
          // Check children recursively
          if (comment.children && comment.children.length > 0) {
            findNewestInComments(comment.children)
          }
        })
      }

      findNewestInComments(comments.value)

      if (newestComment) {
        const hexId =
          newestComment.hex_id || (newestComment.id ? newestComment.id.toString(16) : null)
        if (hexId) {
          const element = document.getElementById(`c-${hexId}`)
          if (element) {
            const headerHeight = 120
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - headerHeight

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            })

            element.classList.add('new-comment-highlight')
            setTimeout(() => {
              element.classList.remove('new-comment-highlight')
            }, 3000)

            return
          }
        }
      }
    }
  }

  // Improved function to scroll to a comment with retries
  async function scrollToNewComment(commentId, maxRetries = 4) {
    if (!commentId) return false

    // Strategy 1: Try immediate scroll (in case element is already there)
    let element = document.getElementById(`comment-${commentId}`)
    if (element) {
      return performScroll(element, commentId, 'immediate')
    }

    // Strategy 2: Wait for Vue's rendering cycle using requestAnimationFrame
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    element = document.getElementById(`comment-${commentId}`)
    if (element) {
      return performScroll(element, commentId, 'after-animation-frame')
    }

    // Strategy 3: Quick retries with shorter delays
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Early fallback check: if comment ID is very different from existing IDs, go to fallback sooner
      if (attempt === 1) {
        const allCommentElements = document.querySelectorAll('[id^="comment-"]')
        const existingIds =
          allCommentElements.length > 0
            ? Array.from(allCommentElements).map((el) => parseInt(el.id.replace('comment-', '')))
            : []
        const newId = parseInt(commentId)

        if (existingIds.length > 0) {
          const maxExistingId = Math.max(...existingIds)
          const minExistingId = Math.min(...existingIds)

          // If new ID is way outside the range of existing IDs, likely won't appear
          if (newId > maxExistingId * 10 || newId < minExistingId / 10) {
            break
          }
        }
      }

      element = document.getElementById(`comment-${commentId}`)

      if (element) {
        return performScroll(element, commentId, `retry-attempt-${attempt}`)
      }

      // Shorter, fixed delays: 100ms, 200ms, 300ms, 400ms
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt))
      }
    }

    // Strategy 4: Fallback strategies
    return attemptFallbackScroll(commentId)
  }

  // Helper function to perform the actual scroll
  function performScroll(element, commentId, _strategy) {
    try {
      const headerHeight = 120
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - headerHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })

      // Add temporary highlight
      element.classList.add('new-comment-highlight')
      setTimeout(() => {
        element.classList.remove('new-comment-highlight')
      }, 3000)

      return true
    } catch (error) {
      console.error(`Error scrolling to comment ${commentId}:`, error)
      return false
    }
  }

  // Fallback scroll strategies when main element is not found
  async function attemptFallbackScroll(_commentId) {
    // Fallback 1: Find the newest comment that actually exists in DOM
    if (comments.value.length > 0) {
      // Sort comments by creation time, newest first
      const sortedComments = [...comments.value].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Try to find the newest comment that actually has a DOM element
      for (const comment of sortedComments.slice(0, 5)) {
        // Check top 5 newest
        const element = document.getElementById(`comment-${comment.id}`)
        if (element) {
          return performScroll(element, comment.id, 'fallback-newest-available')
        }
      }
    }

    // Fallback 2: Scroll to the last comment element in DOM
    const allCommentElements = document.querySelectorAll('[id^="comment-"]')
    if (allCommentElements.length > 0) {
      const lastElement = allCommentElements[allCommentElements.length - 1]
      return performScroll(lastElement, lastElement.id.replace('comment-', ''), 'fallback-last-dom')
    }

    // Fallback 3: Scroll to bottom of comments section
    const commentsSection = document.querySelector('.comment-item, [data-testid="comment-item"]')
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'end' })
      return true
    }

    return false
  }

  async function fetchComments() {
    loading.value = true
    try {
      const id = props.entryId || props.linkId
      await commentsStore.fetchComments(id)
    } catch (error) {
      console.error(t('comments.error_loading'), error)
    } finally {
      loading.value = false
    }
  }

  // Load new realtime comments into the list
  function loadNewRealtimeComments() {
    if (realtimeNewComments.value.length === 0) return

    // Store references before clearing
    const commentsToAdd = [...realtimeNewComments.value]
    const lastCommentId = commentsToAdd[commentsToAdd.length - 1]?.id

    // Add each new comment to the store
    commentsToAdd.forEach((comment) => {
      // Transform to match the expected format
      const formattedComment = {
        id: comment.id,
        content: comment.content,
        parent_id: comment.parent_id,
        user: comment.user,
        created_at: comment.created_at,
        votes_count: comment.votes_count || 0,
        children: [],
        _isNew: true, // Flag for animation
      }

      // Add to store (it will handle the tree structure)
      commentsStore.addComment(formattedComment)
    })

    // Clear the pending realtime comments
    clearRealtimePending()

    // Scroll to the last new comment after a short delay
    if (lastCommentId) {
      nextTick(() => {
        setTimeout(() => {
          const element = document.getElementById(`comment-${lastCommentId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      })
    }
  }
  async function submitComment(formData) {
    if (isSubmittingComment.value) return

    isSubmittingComment.value = true
    commentError.value = ''

    try {
      // If user is not authenticated at all, do anonymous login first
      if (!authStore.isAuthenticated && !authStore.token) {
        await authStore.guestLogin()
      }
      const id = props.entryId || props.linkId
      // Add anonymous user name for anonymous users
      const commentData = {
        content: formData.content,
      }

      if (authStore.isAnonymous) {
        // For authenticated anonymous users, the backend handles the name
        commentData.isAnonymous = true
      }

      const newComment = await commentsStore.createComment(id, commentData)

      // Mark comment as own to prevent "new comment" notification for self
      if (newComment?.id) {
        markCommentAsOwn(newComment.id)
      }

      if (commentForm.value && typeof commentForm.value.reset === 'function') {
        commentForm.value.reset()
      }

      // DO NOT call fetchComments() here - the store already added the comment
      // Calling fetchComments() will replace our local comment (with hex_id)
      // with the API version (which might not have hex_id yet)
      await nextTick()

      // Wait for DOM to fully update
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

      scrollToSpecificCommentWithRetries(newComment.id)

      emit('comment-submitted', newComment)
    } catch (error) {
      console.error(t('comments.error_submitting'), error)
      commentError.value = error.response?.data?.message || t('comments.error_submitting')
    } finally {
      isSubmittingComment.value = false
    }
  }
  async function submitReply(parentId, formData) {
    if (isSubmittingReply.value) return

    isSubmittingReply.value = true
    replyError.value = ''

    try {
      // If user is not authenticated at all, do anonymous login first
      if (!authStore.isAuthenticated && !authStore.token) {
        await authStore.guestLogin()
      }
      const id = props.entryId || props.linkId
      // Add parent ID and anonymous user name for anonymous users
      const replyData = {
        content: formData.content,
        parentId: parentId,
      }

      if (authStore.isAnonymous) {
        // For authenticated anonymous users, the backend handles the name
        replyData.isAnonymous = true
      }

      const newReply = await commentsStore.createComment(id, replyData)

      // Mark reply as own to prevent "new comment" notification for self
      if (newReply?.id) {
        markCommentAsOwn(newReply.id)
      }

      replyingTo.value = null

      // DO NOT call fetchComments() here - the store already added the reply
      // Calling fetchComments() will replace our local reply (with hex_id)
      // with the API version (which might not have hex_id yet)
      await nextTick()

      // Wait for DOM to fully update
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

      // Scroll to the new reply comment
      scrollToSpecificCommentWithRetries(newReply.id)

      emit('reply-submitted', { parentId, reply: newReply })
    } catch (error) {
      console.error(t('comments.error_submitting_reply'), error)
      replyError.value = error.response?.data?.message || t('comments.error_submitting_reply')
    } finally {
      isSubmittingReply.value = false
    }
  }

  // Initialize default sorting on load
  onMounted(() => {
    if (props.initialComments && props.initialComments.length > 0) {
      commentsStore.comments = props.initialComments
      loading.value = false
    } else {
      fetchComments()
    }

    // Load saved anonymous name from localStorage
    if (process.client) {
      const savedName = localStorage.getItem('anonymousName')
      if (savedName) {
        anonymousName.value = savedName
        anonymousNameSaved.value = true
      }

      window.addEventListener('click', (event) => {
        if (showSortDropdown.value && !event.target.closest('.dropdown')) {
          showSortDropdown.value = false
        }
      })
    }
  })
</script>

<style scoped>
  .comments-list-border {
    border-color: var(--color-border-default);
  }

  .comments-list-bg-subtle {
    background-color: var(--color-bg-subtle);
  }

  .comments-list-sort-active {
    background-color: var(--color-bg-subtle);
  }

  /* Animation for new comments */
  :deep(.new-comment-highlight) {
    animation: newCommentPulse 3s ease-out;
  }

  @keyframes newCommentPulse {
    0% {
      background-color: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.5);
      border-width: 2px;
    }
    50% {
      background-color: rgba(34, 197, 94, 0.05);
      border-color: rgba(34, 197, 94, 0.3);
    }
    100% {
      background-color: transparent;
      border-color: rgba(156, 163, 175, 0.3);
      border-width: 1px;
    }
  }
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

  .highlight-comment {
    animation: highlight 2s ease-in-out;
  }

  @keyframes highlight {
    0% {
      background-color: rgba(var(--color-primary-rgb), 0.2);
    }
    100% {
      background-color: transparent;
    }
  }
</style>
