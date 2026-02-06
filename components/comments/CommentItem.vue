<template>
  <div>
    <!-- Comment Container -->
    <div
      :id="`c-${commentComputed.hex_id || (commentComputed.id ? commentComputed.id.toString(16) : 'unknown')}`"
      :class="[
        'comment-container',
        { 'top-level-comment': !nested },
        { 'nested-comment': nested },
        { 'has-replies': commentComputed.children && commentComputed.children.length > 0 },
      ]"
      :data-comment-number="commentComputed._commentNumber || ''"
    >
      <div class="comment-content" :class="paddingSize">
        <div class="flex flex-col">
          <!-- Header -->
          <CommentHeader
            :comment="commentComputed"
            :nested="nested"
            @scroll-to-comment="scrollToComment"
          />

          <!-- Reply indicator for flat mode -->
          <ReplyIndicator
            :comment="commentComputed"
            :is-flat-mode="isFlatMode"
            @scroll-to-comment="scrollToComment"
          />

          <!-- Content display -->
          <CommentContentDisplay
            :comment="commentComputed"
            :is-editing="isEditing"
            :edit-content="editContent"
            :is-saving-edit="isSavingEdit"
            :formatted-content="formatCommentContent(commentComputed.content || '')"
            :embeds="commentEmbeds"
            @edit-submit="handleEditSubmit"
            @edit-cancel="cancelEdit"
            @content-click="handleContentClick"
          />

          <!-- Post title link (only in listing mode) -->
          <div v-if="isListingMode && post?.title" class="mb-2 text-xs flex items-start gap-1">
            <Icon
              name="fa6-solid:file-lines"
              class="flex-shrink-0 text-primary dark:text-primary-light mt-0.5"
              aria-hidden="true"
            />
            <NuxtLink
              :to="getCommentPermalink()"
              class="text-primary dark:text-primary-light hover:opacity-80 transition-opacity no-underline italic font-medium"
            >
              {{ post.title }}
            </NuxtLink>
          </div>

          <!-- Footer -->
          <CommentFooter
            v-if="!isListingMode"
            :comment="commentComputed"
            :vote-refresh-key="voteRefreshKey"
            :can-edit="canEdit"
            :is-editing="isEditing"
            :is-author="isAuthor"
            :is-mobile="isMobile"
            :nested="nested"
            :is-thread-collapsed="isThreadCollapsed"
            @voted="onVoted"
            @reply="replyTo"
            @show-permalink="showPermalinkModal = true"
            @start-edit="startEdit"
            @show-delete="showDeleteConfirm = true"
            @toggle-collapse="isThreadCollapsed = !isThreadCollapsed"
          />

          <!-- Vote Stats Component -->
          <VoteStatsComponent
            v-if="showVoteStats"
            :vote-details="commentComputed.voteDetails || []"
            :vote-stats="commentComputed.vote_stats"
            class="mt-3"
          />

          <slot name="reply-form" />
        </div>
      </div>
    </div>

    <!-- Nested Comments - Outside the parent container -->
    <div
      v-if="
        commentComputed.children &&
        commentComputed.children.length > 0 &&
        !nested &&
        !isThreadCollapsed &&
        !isFlatMode
      "
      class="replies-container"
      :class="commentNestingMargin"
    >
      <div class="replies-list">
        <div v-for="reply in commentComputed.children" :key="reply?.id || 'reply-unknown'">
          <CommentItem
            :comment="reply"
            :link-id="linkId"
            :post="post"
            :replying-to="replyingTo"
            :is-submitting-reply="isSubmittingReply"
            :reply-error="replyError"
            :nested="true"
            @voted="onNestedVoted"
            @reply="onNestedReply"
            @submit-reply="onNestedSubmitReply"
            @cancel-reply="onNestedCancelReply"
          >
            <template #reply-form>
              <div
                v-if="replyingTo === reply.id"
                class="mt-3 nested-reply-form"
                :data-reply-form="reply.id"
              >
                <CommentForm
                  :placeholder="t('comments.write_reply')"
                  :submit-label="t('comments.reply')"
                  :is-submitting="isSubmittingReply"
                  :error="replyError"
                  :post-id="linkId"
                  @submit="(formData) => $emit('submit-reply', reply.id, formData)"
                >
                  <template #cancel-button>
                    <button
                      type="button"
                      class="comment-cancel-btn px-3 py-2 mr-2 rounded text-sm"
                      @click="$emit('cancel-reply')"
                    >
                      {{ t('common.cancel') }}
                    </button>
                  </template>
                </CommentForm>
              </div>
            </template>
          </CommentItem>
        </div>
      </div>
    </div>

    <!-- Nested comments for already nested items (keep them inline) -->
    <div
      v-if="commentComputed.children && commentComputed.children.length > 0 && nested"
      class="nested-replies"
      :class="isMobile ? 'ml-2 mt-3' : 'ml-12 mt-4'"
    >
      <div v-for="reply in commentComputed.children" :key="reply?.id || 'reply-unknown'">
        <CommentItem
          :comment="reply"
          :link-id="linkId"
          :replying-to="replyingTo"
          :is-submitting-reply="isSubmittingReply"
          :reply-error="replyError"
          :nested="true"
          @voted="onNestedVoted"
          @reply="onNestedReply"
          @submit-reply="onNestedSubmitReply"
          @cancel-reply="onNestedCancelReply"
        >
          <template #reply-form>
            <div
              v-if="replyingTo === reply.id"
              class="mt-3 nested-reply-form"
              :data-reply-form="reply.id"
            >
              <CommentForm
                :placeholder="t('comments.write_reply')"
                :submit-label="t('comments.reply')"
                :is-submitting="isSubmittingReply"
                :error="replyError"
                :post-id="linkId"
                @submit="(formData) => $emit('submit-reply', reply.id, formData)"
              >
                <template #cancel-button>
                  <button
                    type="button"
                    class="comment-cancel-btn rounded text-sm touch-manipulation transition-colors"
                    :class="isMobile ? 'px-4 py-3 mr-2 min-h-[44px]' : 'px-3 py-2 mr-2'"
                    @click="$emit('cancel-reply')"
                  >
                    {{ t('common.cancel') }}
                  </button>
                </template>
              </CommentForm>
            </div>
          </template>
        </CommentItem>
      </div>
    </div>
  </div>

  <!-- Permalink Modal -->
  <CommentPermalinkModal v-model="showPermalinkModal" :permalink-url="permalinkUrl" />

  <!-- Delete Confirmation Modal -->
  <CommentDeleteModal
    v-model="showDeleteConfirm"
    :is-deleting="isDeleting"
    @confirm="deleteComment"
  />

  <!-- Image Lightbox -->
  <ImageLightbox
    :is-open="showLightbox"
    :image-src="lightboxImageSrc"
    :image-alt="lightboxImageAlt"
    @close="showLightbox = false"
  />
</template>

<script setup>
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { useEventListener } from '@vueuse/core'
  import { useAuthStore } from '~/stores/auth'
  import CommentForm from '~/components/comments/CommentForm.vue'
  import VoteStatsComponent from '~/components/comments/VoteStatsComponent.vue'
  import ImageLightbox from '~/components/common/ImageLightbox.vue'
  import { useI18n, useLocalePath } from '#i18n'

  import { useMobileDetection } from '~/composables/useMobileDetection'
  import { useNotification } from '~/composables/useNotification'
  import { marked } from 'marked'
  import {
    configureMarked,
    processLargeEmojis,
    extractEmbeds,
    replaceEmbedsWithPlaceholders,
  } from '~/utils/markdown'
  import DOMPurify from 'dompurify'

  // Child components (auto-imported by Nuxt, but explicit for clarity)
  import CommentHeader from '~/components/comments/CommentHeader.vue'
  import CommentFooter from '~/components/comments/CommentFooter.vue'
  import CommentContentDisplay from '~/components/comments/CommentContentDisplay.vue'
  import ReplyIndicator from '~/components/comments/ReplyIndicator.vue'
  import CommentPermalinkModal from '~/components/comments/CommentPermalinkModal.vue'
  import CommentDeleteModal from '~/components/comments/CommentDeleteModal.vue'
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { isMobile, commentNestingMargin, paddingSize } = useMobileDetection()
  const { error: showError } = useNotification()
  const authStore = useAuthStore()

  const props = defineProps({
    comment: {
      type: Object,
      required: true,
    },
    linkId: {
      type: [Number, String],
      required: false,
      default: null,
    },
    post: {
      type: Object,
      default: null,
    },
    isSubmittingReply: {
      type: Boolean,
      default: false,
    },
    replyError: {
      type: String,
      default: '',
    },
    replyingTo: {
      type: [Number, String, null],
      default: null,
    },
    nested: {
      type: Boolean,
      default: false,
    },
    isFlatMode: {
      type: Boolean,
      default: false,
    },
    isListingMode: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits([
    'voted',
    'reply',
    'favourited',
    'unfavourited',
    'submit-reply',
    'cancel-reply',
  ])

  const voteRefreshKey = ref(0)

  // Vote stats functionality
  const showVoteStats = ref(false)
  const isThreadCollapsed = ref(false)
  const activeTooltip = ref(null)

  // Permalink functionality
  const showPermalinkModal = ref(false)
  const permalinkUrl = ref('')

  // Edit/Delete functionality
  const isEditing = ref(false)
  const editContent = ref('')
  const editEditor = ref(null)
  const showDeleteConfirm = ref(false)
  const isDeleting = ref(false)
  const isSavingEdit = ref(false)

  // Lightbox state
  const showLightbox = ref(false)
  const lightboxImageSrc = ref('')
  const lightboxImageAlt = ref('')

  // Extract embeds from comment content
  const commentEmbeds = computed(() => {
    return extractEmbeds(commentComputed.value?.content || '')
  })

  // Handle clicks on images in content to open lightbox
  // Also handles NSFW image reveal (since inline onclick is stripped by DOMPurify)
  function handleContentClick(event) {
    const target = event.target

    // Check if clicking on NSFW container or its children
    const nsfwContainer = target.closest('.nsfw-image-container')
    if (nsfwContainer) {
      // If not revealed yet, reveal it (toggle class)
      if (!nsfwContainer.classList.contains('nsfw-revealed')) {
        event.preventDefault()
        nsfwContainer.classList.add('nsfw-revealed')
        return
      }
      // If already revealed and clicking on image, open lightbox
      if (target.tagName === 'IMG') {
        event.preventDefault()
        lightboxImageSrc.value = target.dataset.originalSrc || target.src
        lightboxImageAlt.value = target.alt || ''
        showLightbox.value = true
      }
      return
    }

    // Regular image click - open lightbox
    if (target.tagName === 'IMG') {
      event.preventDefault()
      lightboxImageSrc.value = target.dataset.originalSrc || target.src
      lightboxImageAlt.value = target.alt || ''
      showLightbox.value = true
    }
  }

  // Check if current user is the author
  const isAuthor = computed(() => {
    return (
      authStore.user &&
      commentComputed.value.user &&
      authStore.user.id === commentComputed.value.user.id
    )
  })

  // Calculate minutes since comment was created
  const minutesSinceCreation = computed(() => {
    if (!commentComputed.value.created_at) return 999
    const createdAt = new Date(commentComputed.value.created_at)
    const now = new Date()
    return Math.floor((now - createdAt) / (1000 * 60))
  })

  // Check if user can edit (within 15 minutes)
  const canEdit = computed(() => {
    return (
      isAuthor.value &&
      minutesSinceCreation.value <= 15 &&
      commentComputed.value.status !== 'deleted_by_author'
    )
  })

  // Start editing
  function startEdit() {
    isEditing.value = true
    editContent.value = commentComputed.value.content || ''
  }

  // Cancel editing
  function cancelEdit() {
    isEditing.value = false
    editContent.value = ''
  }

  // Save edit (called from CommentEditor)
  async function handleEditSubmit(formData) {
    if (!formData.content.trim()) return

    isSavingEdit.value = true
    try {
      const { $api } = useNuxtApp()
      await $api.comments.updateComment(commentComputed.value.id, {
        content: formData.content,
      })

      // Update the comment in the store
      commentComputed.value.content = formData.content
      commentComputed.value.edited_at = new Date().toISOString()

      isEditing.value = false
    } catch (err) {
      if (!err._interceptorWillNotify) {
        showError(err.response?.data?.message || t('comments.error_editing'))
      }
    } finally {
      isSavingEdit.value = false
    }
  }

  // Delete comment
  async function deleteComment() {
    isDeleting.value = true
    try {
      const { $api } = useNuxtApp()
      await $api.comments.deleteComment(commentComputed.value.id)

      // Update the comment status locally
      commentComputed.value.status = 'deleted_by_author'
      commentComputed.value.content = '[deleted]'

      showDeleteConfirm.value = false
    } catch (err) {
      if (!err._interceptorWillNotify) {
        showError(err.response?.data?.message || t('comments.error_deleting'))
      }
    } finally {
      isDeleting.value = false
    }
  }

  // Get comment permalink
  function getCommentPermalink() {
    const commentId = props.comment.id || props.comment.commentId
    const hexId = props.comment.hex_id || (commentId ? commentId.toString(16) : 'unknown')

    // Use the post's permalink instead of slug
    let postPermalink = ''
    if (props.post?.permalink) {
      postPermalink = localePath(props.post.permalink)
    } else if (props.post?.uuid) {
      postPermalink = localePath(`/p/${props.post.uuid}`)
    } else {
      // Fallback to slug if no permalink available
      postPermalink = props.post?.slug ? localePath(`/posts/${props.post.slug}`) : ''
    }

    return `${postPermalink}#c-${hexId}`
  }

  // Set up permalink URL when component is mounted
  onMounted(() => {
    if (import.meta.client) {
      const baseUrl = window.location.origin
      const commentId = props.comment.id || props.comment.commentId
      const hexId = props.comment.hex_id || (commentId ? commentId.toString(16) : 'unknown')

      // Use the post's permalink instead of current URL
      let postPermalink = ''
      if (props.post?.permalink) {
        postPermalink = props.post.permalink
      } else if (props.post?.uuid) {
        postPermalink = `/p/${props.post.uuid}`
      } else {
        // Fallback to current path if no post data available
        postPermalink = window.location.pathname
      }

      permalinkUrl.value = `${baseUrl}${postPermalink}#c-${hexId}`
    }
  })

  // Create a computed property for the comment data that directly uses props
  const commentComputed = computed(() => {
    // Ensure we always return an object with the necessary properties
    if (!props.comment) {
      return {
        id: null,
        content: '',
        created_at: new Date().toISOString(),
        user: null,
        votes: 0,
        children: [],
        isAnonymous: false,
        authorName: null,
      }
    }

    return props.comment
  })

  async function onVoted(data) {
    if (!data) {
      console.error('Invalid vote data')
      return
    }

    try {
      // VoteControls already handles the API call and updates the store
      const commentId = props.comment?.id

      if (commentId === data.itemId) {
        // Force refresh of the component to pick up updated vote stats from store
        voteRefreshKey.value++
      }

      // Propagate event up to parent
      emit('voted', data)
    } catch (error) {
      console.error(t('comments.error_voting'), error)
    }
  }

  function replyTo() {
    const commentId = props.comment.id
    emit('reply', commentId)

    // Scroll to form on mobile for better UX
    if (isMobile.value) {
      nextTick(() => {
        const formElement = document.querySelector(`[data-reply-form="${commentId}"]`)
        if (formElement) {
          formElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        }
      })
    }
  }

  // Scroll to a comment by its number
  function scrollToComment(commentNumber) {
    // Try to find the element with this comment number
    const element = document.querySelector(`[id^="c-"][data-comment-number="${commentNumber}"]`)

    if (element) {
      const headerHeight = 120
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - headerHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })

      // Add highlight animation
      element.classList.add('new-comment-highlight')
      setTimeout(() => {
        element.classList.remove('new-comment-highlight')
      }, 3000)
    }
  }

  // Close tooltip when clicking outside (mobile)
  if (import.meta.client) {
    useEventListener(document, 'click', (e) => {
      if (isMobile.value && activeTooltip.value && !e.target.closest('.vote-type-chip')) {
        activeTooltip.value = null
      }

      // Handle comment number link clicks
      const commentLink = e.target.closest('.comment-number-link')
      if (commentLink) {
        e.preventDefault()
        const commentNumber = parseInt(commentLink.getAttribute('data-comment-number'))
        if (commentNumber) {
          scrollToComment(commentNumber)
        }
      }
    })

    // Update tooltip position on scroll
    useEventListener(
      window,
      'scroll',
      () => {
        if (activeTooltip.value) {
          calculateTooltipPosition(activeTooltip.value)
        }
      },
      { passive: true }
    )

    // Update tooltip position on resize
    useEventListener(window, 'resize', () => {
      if (activeTooltip.value) {
        calculateTooltipPosition(activeTooltip.value)
      }
    })
  }

  // Functions to handle nested comment events
  function onNestedReply(commentId) {
    emit('reply', commentId)
  }

  function onNestedSubmitReply(commentId, formData) {
    emit('submit-reply', commentId, formData)
  }

  function onNestedCancelReply() {
    emit('cancel-reply')
  }

  function onNestedVoted(data) {
    emit('voted', data)
  }

  /**
   * Format comment content to render user mentions, comment citations, and Markdown as HTML
   */
  function formatCommentContent(content) {
    if (!content) return ''

    try {
      // First, remove embed syntax - embeds are rendered separately as Vue components
      let processedContent = replaceEmbedsWithPlaceholders(content)

      // Replace user mentions and comment citations with placeholders
      // to prevent Markdown parser from processing them
      const mentions = []
      const citations = []

      // Replace @username with a placeholder
      // Uses negative lookbehind to exclude @ preceded by / (inside URLs like mastodon.social/@user)
      processedContent = processedContent.replace(
        /(?<![/\w])@([a-zA-Z0-9_-]+)/g,
        (match, username) => {
          const placeholder = `__MENTION_${mentions.length}__`
          mentions.push({ username })
          return placeholder
        }
      )

      // Replace #c-3f2 (@username) or #c-3f2 (@username: "preview") with a placeholder
      // First try the new format without preview: #c-3f2 (@username)
      processedContent = processedContent.replace(
        /#c-([0-9a-fA-F]+)\s+\(@([^)]+)\)/g,
        (match, commentIdHex, username) => {
          const placeholder = `__CITATION_${citations.length}__`
          citations.push({ commentIdHex, username, preview: null, type: 'hex' })
          return placeholder
        }
      )

      // Then try the old format with preview: #c-3f2 (username: "preview")
      processedContent = processedContent.replace(
        /#c-([0-9a-fA-F]+)\s+\(([^:]+):\s+"([^"]+)"\)/g,
        (match, commentIdHex, username, preview) => {
          const placeholder = `__CITATION_${citations.length}__`
          citations.push({ commentIdHex, username, preview, type: 'hex' })
          return placeholder
        }
      )

      // Replace #1, #2, etc. (comment numbers) with placeholders
      processedContent = processedContent.replace(/#(\d+)(?!\w)/g, (match, commentNumber) => {
        const placeholder = `__CITATION_${citations.length}__`
        citations.push({ commentNumber: parseInt(commentNumber), type: 'number' })
        return placeholder
      })

      // Process large emoji syntax (::emoji:: and :::emoji:::)
      processedContent = processLargeEmojis(processedContent)

      // Parse the content as Markdown with optimized image renderer
      configureMarked()
      let formattedContent = marked.parse(processedContent)

      // Sanitize the HTML to prevent XSS attacks
      formattedContent = DOMPurify.sanitize(formattedContent, {
        // Note: span is needed for NSFW image blur containers
        ALLOWED_TAGS: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'p',
          'br',
          'strong',
          'em',
          'u',
          'del',
          'a',
          'ul',
          'ol',
          'li',
          'blockquote',
          'pre',
          'code',
          'hr',
          'img',
          'span',
        ],
        ALLOWED_ATTR: [
          'href',
          'target',
          'rel',
          'class',
          'data-comment-number',
          'src',
          'alt',
          'loading',
          'data-original-src',
        ],
        FORBID_ATTR: [
          'onerror',
          'onload',
          'onmouseover',
          'onfocus',
          'onblur',
          'onchange',
          'onsubmit',
        ],
        FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'button'],
      })

      // Replace the mention placeholders with the actual HTML (account for markdown processing)
      mentions.forEach((mention, index) => {
        const placeholder = `__MENTION_${index}__`
        const strongPlaceholder = `<strong>MENTION_${index}</strong>`
        const userPath = localePath(`/u/${mention.username}`)
        const html = `<a href="${userPath}" class="text-primary hover:underline">@${mention.username}</a>`
        formattedContent = formattedContent.replace(placeholder, html)
        formattedContent = formattedContent.replace(strongPlaceholder, html)
      })

      // Replace the citation placeholders with the actual HTML (account for markdown processing)
      citations.forEach((citation, index) => {
        const placeholder = `__CITATION_${index}__`
        const strongPlaceholder = `<strong>CITATION_${index}</strong>`

        let html = ''
        if (citation.type === 'number') {
          // Comment number format: #1, #2, etc.
          // Use a link that will trigger scrollToComment via click handler
          html = `<a href="#comment-${citation.commentNumber}" class="text-primary hover:underline font-mono comment-number-link" data-comment-number="${citation.commentNumber}">#${citation.commentNumber}</a>`
        } else if (citation.type === 'hex') {
          // Hexadecimal format: #c-3f2
          if (citation.preview) {
            html = `<a href="#c-${citation.commentIdHex}" class="text-primary hover:underline">#c-${citation.commentIdHex}</a> <span class="text-gray-500">(${citation.username}: "${citation.preview}")</span>`
          } else {
            html = `<a href="#c-${citation.commentIdHex}" class="text-primary hover:underline">#c-${citation.commentIdHex}</a> <span class="text-gray-500">(@${citation.username})</span>`
          }
        }

        formattedContent = formattedContent.replace(placeholder, html)
        formattedContent = formattedContent.replace(strongPlaceholder, html)
      })

      // Remove embed placeholders (embeds are rendered as separate Vue components)
      formattedContent = formattedContent.replace(/<!--EMBED_PLACEHOLDER_\d+-->/g, '')
      // Also clean up any paragraph tags that only contained an embed
      formattedContent = formattedContent.replace(/<p>\s*<\/p>/g, '')

      return formattedContent
    } catch (error) {
      console.error(t('comments.error_formatting'), error)
      return content || ''
    }
  }
</script>

<style scoped>
  /* Base comment container styles */
  .comment-container {
    transition: all 0.2s ease;
  }

  /* All comments with clear borders */
  .comment-container {
    @apply rounded-lg overflow-hidden;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    box-shadow: none;
  }

  /* Top level comments spacing */
  .top-level-comment {
    @apply mb-6;
  }

  .top-level-comment.has-replies {
    @apply mb-2;
  }

  /* Nested comments spacing */
  .nested-comment {
    @apply mb-3;
  }

  /* Comment content padding - removed as it's now dynamic */

  /* Replies container with responsive indentation */
  .replies-container {
    @apply mb-6;
    @apply relative;
  }

  /* Very subtle connecting line from parent to replies */
  .replies-container::before {
    content: '';
    @apply absolute top-0 bottom-0;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(156, 163, 175, 0.15) 20%,
      rgba(156, 163, 175, 0.15) 80%,
      transparent 100%
    );
    left: -24px;
    top: -8px;
  }

  .replies-list {
    @apply space-y-3;
  }

  /* Nested replies (replies to replies) */
  .nested-replies {
    @apply space-y-3;
    @apply relative;
  }

  .nested-replies::before {
    content: '';
    @apply absolute top-0 bottom-0;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(156, 163, 175, 0.15) 20%,
      rgba(156, 163, 175, 0.15) 80%,
      transparent 100%
    );
    left: -16px;
  }

  @media (min-width: 768px) {
    .nested-replies::before {
      left: -24px;
    }
  }

  /* Hover effect for all comments */
  .comment-container:hover {
    border-color: var(--color-border-strong);
  }

  /* Image styles */
  .comment-image img,
  .reply-image img {
    transition: transform 0.2s ease;
  }

  .comment-image img:hover,
  .reply-image img:hover {
    transform: scale(1.02);
  }

  /* Comment cancel button (used in nested reply forms) */
  .comment-cancel-btn {
    background-color: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .comment-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }
</style>
