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
          <div class="comment-header flex items-center justify-between mb-2">
            <div class="flex items-center">
              <!-- Remote/Federated user -->
              <RemoteUserBadge
                v-if="commentComputed.is_remote && commentComputed.remote_user"
                :remote-user="commentComputed.remote_user"
              />
              <!-- Local user -->
              <AuthorInfo
                v-else
                :user="commentComputed.user"
                :created-at="commentComputed.created_at"
                :show-time="!nested"
                :is-anonymous="commentComputed.is_anonymous"
                :author-name="commentComputed.author_name"
              />

              <!-- Comment number -->
              <span
                v-if="commentComputed._commentNumber"
                :id="`comment-number-${commentComputed._commentNumber}`"
                class="ml-2 text-xs font-mono text-text-muted dark:text-text-dark-muted cursor-pointer hover:text-primary"
                :title="`${t('comments.comment_number')} ${commentComputed._commentNumber}`"
                @click="scrollToComment(commentComputed._commentNumber)"
              >
                #{{ commentComputed._commentNumber }}
              </span>

              <span
                v-if="commentComputed.user?.isAdmin"
                class="badge ml-2 px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
              >
                Admin
              </span>

              <span
                v-else-if="commentComputed.user?.isGlobalModerator"
                class="badge ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              >
                Mod
              </span>

              <span
                v-if="commentComputed.created_at"
                class="ml-2 text-xs text-text-muted dark:text-text-dark-muted"
              >
                <TimeAgo :datetime="commentComputed.created_at" />
              </span>
            </div>
          </div>

          <!-- Reply indicator for flat mode -->
          <div
            v-if="isFlatMode && commentComputed._parentNumber"
            class="reply-indicator text-xs text-text-muted dark:text-text-dark-muted mb-2 flex items-center"
          >
            <Icon name="fa6-solid:reply" class="mr-1" aria-hidden="true" />
            <span>
              {{ t('comments.in_reply_to') }}
              <a
                href="javascript:void(0)"
                class="text-primary hover:underline font-medium font-mono cursor-pointer"
                :title="`${t('comments.go_to_comment')} #${commentComputed._parentNumber}`"
                @click.prevent="scrollToComment(commentComputed._parentNumber)"
              >
                #{{ commentComputed._parentNumber }}
              </a>
              <span v-if="commentComputed._parentComment">
                <span class="mx-1">-</span>
                <template v-if="commentComputed._parentComment.is_anonymous">
                  <span class="text-gray-600 dark:text-gray-400">
                    @{{ t('common.anonymous') }}
                  </span>
                </template>
                <template v-else>
                  <NuxtLink
                    v-if="commentComputed._parentComment.user"
                    :to="localePath(`/u/${commentComputed._parentComment.user.username}`)"
                    class="text-primary hover:underline"
                  >
                    @{{ commentComputed._parentComment.user.username }}
                  </NuxtLink>
                  <span v-else-if="commentComputed._parentComment.author_name">
                    @{{ commentComputed._parentComment.author_name }}
                  </span>
                </template>
              </span>
            </span>
          </div>

          <div
            class="comment-content text-text dark:text-text-dark mb-2"
            data-testid="comment-content"
          >
            <!-- Editing mode -->
            <div v-if="isEditing" class="space-y-2">
              <CommentEditor
                ref="editEditor"
                :initial-content="editContent"
                :placeholder="t('comments.edit_placeholder')"
                :submit-label="t('common.save')"
                :is-submitting="isSavingEdit"
                :show-anonymous-toggle="false"
                :show-cancel="true"
                @submit="handleEditSubmit"
                @cancel="cancelEdit"
              />
            </div>
            <!-- Hidden comment message -->
            <div v-else-if="commentComputed.status === 'hidden'" class="italic text-gray-500 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-3 rounded flex items-center">
              <Icon name="fa6-solid:eye-slash" class="mr-2" aria-hidden="true" />
              {{ t('comments.moderated_message') }}
            </div>
            <!-- Deleted by author message -->
            <div v-else-if="commentComputed.status === 'deleted_by_author'" class="comment-deleted-box italic p-3 rounded flex items-center">
              <Icon name="fa6-solid:trash" class="mr-2" aria-hidden="true" />
              {{ t('comments.deleted_by_author_message') }}
            </div>
            <!-- Deleted user comment (but not federated comments) -->
            <div v-else-if="!commentComputed.user && !commentComputed.is_remote" class="comment-deleted-box italic p-3 rounded">
              [deleted]
            </div>
            <!-- Normal comment content (including federated) -->
            <div
              v-else
              class="prose dark:prose-invert prose-sm max-w-none"
              @click="handleContentClick"
              v-html="formatCommentContent(commentComputed.content || '')"
            />
            <!-- Embedded content (YouTube, Twitter, Instagram, etc.) -->
            <div v-if="commentEmbeds.length > 0" class="comment-embeds mt-2">
              <InlineEmbed
                v-for="(embed, idx) in commentEmbeds"
                :key="`embed-${commentComputed.id}-${idx}`"
                :url="embed.url"
                :provider="embed.provider"
              />
            </div>
            <!-- Edited indicator -->
            <div v-if="commentComputed.edited_at && !isEditing" class="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mt-2 px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 rounded-full">
              <Icon name="fa6-solid:pen-to-square" class="text-[10px]" aria-hidden="true" />
              {{ t('comments.edited') }}
            </div>
          </div>

          <!-- Post title link (only in listing mode) -->
          <div v-if="isListingMode && post?.title" class="mb-2 text-xs flex items-start gap-1">
            <Icon name="fa6-solid:file-lines" class="flex-shrink-0 text-primary dark:text-primary-light mt-0.5" aria-hidden="true" />
            <NuxtLink
              :to="getCommentPermalink()"
              class="text-primary dark:text-primary-light hover:opacity-80 transition-opacity no-underline italic font-medium"
            >
              {{ post.title }}
            </NuxtLink>
          </div>

          <!-- Footer unificado: votos + acciones + resumen de votos -->
          <div
            v-if="!isListingMode"
            class="comment-footer flex items-center flex-wrap gap-y-1.5 mt-1 mb-1"
          >
            <!-- Vote controls with integrated vote type chips -->
            <VoteControls
              :key="`vote-controls-${commentComputed.id || 'unknown'}-${voteRefreshKey}`"
              :item-id="commentComputed.id || `unknown-${Math.random().toString(36).substr(2, 9)}`"
              :votes-count="commentComputed.votes || 0"
              :user-vote="commentComputed.userVote"
              :user-vote-type="commentComputed.userVoteType"
              :vote-type-summary="voteTypeSummary"
              item-type="comment"
              variant="bar"
              @voted="onVoted"
            />

            <!-- Action buttons -->
            <div class="flex items-center gap-0.5 ml-2">
              <button
                class="reply-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors touch-manipulation p-1"
                :title="t('comments.reply')"
                :aria-label="t('comments.reply')"
                @click="replyTo"
              >
                <Icon name="fa6-solid:reply" class="text-sm" aria-hidden="true" />
              </button>

              <button
                class="permalink-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors touch-manipulation p-1"
                :title="t('common.permalink')"
                :aria-label="t('common.permalink')"
                @click="showPermalinkModal = true"
              >
                <Icon name="fa6-solid:link" class="text-sm" aria-hidden="true" />
              </button>

              <!-- Edit button (only for author, within 15 minutes) -->
              <button
                v-if="canEdit && !isEditing"
                class="edit-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation p-1"
                :title="t('comments.edit')"
                :aria-label="t('comments.edit')"
                @click="startEdit"
              >
                <Icon name="fa6-solid:pen-to-square" class="text-sm" aria-hidden="true" />
              </button>

              <!-- Delete button (only for author) -->
              <button
                v-if="isAuthor && commentComputed.status !== 'deleted_by_author' && !isEditing"
                class="delete-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation p-1"
                :title="t('comments.delete')"
                :aria-label="t('comments.delete')"
                @click="showDeleteConfirm = true"
              >
                <Icon name="fa6-solid:trash" class="text-sm" aria-hidden="true" />
              </button>
            </div>

            <!-- Collapse thread button for mobile -->
            <button
              v-if="
                isMobile &&
                commentComputed.children &&
                commentComputed.children.length > 0 &&
                !nested
              "
              class="collapse-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors touch-manipulation text-xs py-1 px-1 ml-1"
              :title="
                isThreadCollapsed ? t('comments.expand_thread') : t('comments.collapse_thread')
              "
              @click="isThreadCollapsed = !isThreadCollapsed"
            >
              <Icon
                :name="isThreadCollapsed ? 'fa6-solid:chevron-down' : 'fa6-solid:chevron-up'"
                class="mr-1 text-xs"
                aria-hidden="true"
              />
              {{ isThreadCollapsed ? t('comments.expand') : t('comments.collapse') }}
              <span class="ml-0.5 text-2xs">({{ commentComputed.children.length }})</span>
            </button>

          </div>

          <!-- Vote Stats Component -->
          <VoteStatsComponent
            v-if="showVoteStats"
            :vote-details="commentComputed.voteDetails || []"
            :vote-stats="commentComputed.vote_stats"
            class="mt-3"
          />

          <slot name="reply-form"/>
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
  <Teleport to="body">
    <div
      v-if="showPermalinkModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showPermalinkModal = false"
    >
      <div class="comment-modal rounded-lg shadow-lg max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">{{ t('common.permalink') }}</h3>
          <button
            class="modal-close-btn"
            :aria-label="t('common.close')"
            @click="showPermalinkModal = false"
          >
            <Icon name="fa6-solid:xmark" aria-hidden="true" />
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-sm modal-description">
            {{ t('common.permalink_description') }}
          </p>

          <div>
            <div class="modal-input-group flex items-center rounded-md overflow-hidden">
              <input
                v-model="permalinkUrl"
                type="text"
                readonly
                class="modal-input flex-grow py-2 px-3 focus:outline-none"
              >
              <button
                class="modal-copy-btn px-3 py-2 transition-colors"
                :aria-label="t('common.copy')"
                @click="copyPermalink"
              >
                <Icon name="fa6-solid:copy" aria-hidden="true" />
              </button>
            </div>
            <p v-if="permalinkCopied" class="text-green-500 text-sm mt-1">
              {{ t('common.copied_to_clipboard') }}
            </p>
          </div>

          <div class="flex justify-end mt-4">
            <button
              class="modal-btn-secondary px-4 py-2 rounded transition-colors"
              @click="showPermalinkModal = false"
            >
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Confirmation Modal -->
  <Teleport to="body">
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showDeleteConfirm = false"
    >
      <div class="comment-modal rounded-lg shadow-lg max-w-md w-full p-6 m-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-red-600 dark:text-red-400 flex items-center">
            <Icon name="fa6-solid:triangle-exclamation" class="mr-2" aria-hidden="true" />
            {{ t('comments.delete_confirm_title') }}
          </h3>
          <button
            class="modal-close-btn"
            :aria-label="t('common.close')"
            @click="showDeleteConfirm = false"
          >
            <Icon name="fa6-solid:xmark" aria-hidden="true" />
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-sm modal-description">
            {{ t('comments.delete_confirm_message') }}
          </p>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <p class="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
              <Icon name="fa6-solid:circle-info" class="mr-1 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('comments.delete_info') }}</span>
            </p>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button
              :disabled="isDeleting"
              class="modal-btn-secondary px-4 py-2 rounded transition-colors disabled:opacity-50"
              @click="showDeleteConfirm = false"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              :disabled="isDeleting"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              @click="deleteComment"
            >
              <Icon v-if="isDeleting" name="fa6-solid:spinner" class="mr-1 animate-spin" aria-hidden="true" />
              {{ t('comments.delete_confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

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
  import AuthorInfo from '~/components/common/AuthorInfo.vue'
  import CommentForm from '~/components/comments/CommentForm.vue'
  import VoteControls from '~/components/comments/VoteControls.vue'
  import VoteStatsComponent from '~/components/comments/VoteStatsComponent.vue'
  import TimeAgo from '~/components/ui/TimeAgo.vue'
  import ImageLightbox from '~/components/common/ImageLightbox.vue'
  import { useI18n, useLocalePath  } from '#i18n'
  
  import { useMobileDetection } from '~/composables/useMobileDetection'
  import { useNotification } from '~/composables/useNotification'
  import { marked } from 'marked'
  import { configureMarked, processLargeEmojis, extractEmbeds, replaceEmbedsWithPlaceholders } from '~/utils/markdown'
  import DOMPurify from 'dompurify'
  import InlineEmbed from '~/components/media/InlineEmbed.vue'
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
  const permalinkCopied = ref(false)

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
    return authStore.user && commentComputed.value.user && authStore.user.id === commentComputed.value.user.id
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
    return isAuthor.value && minutesSinceCreation.value <= 15 && commentComputed.value.status !== 'deleted_by_author'
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
        content: formData.content
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

  // Copy permalink to clipboard
  function copyPermalink() {
    if (import.meta.client) {
      navigator.clipboard
        .writeText(permalinkUrl.value)
        .then(() => {
          permalinkCopied.value = true
          setTimeout(() => {
            permalinkCopied.value = false
          }, 2000)
        })
        .catch((err) => {
          console.error('Error copying permalink:', err)
        })
    }
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

  const voteTypeSummary = computed(() => {
    try {
      const voteStats = commentComputed.value?.vote_stats || commentComputed.value?.voteStats
      if (voteStats?.vote_types) {
        return voteStats.vote_types
      }
    } catch (error) {
      console.error('Error computing voteTypeSummary:', error)
    }

    // Fallback if vote_types doesn't exist or there's an error
    return {}
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
    useEventListener(window, 'scroll', () => {
      if (activeTooltip.value) {
        calculateTooltipPosition(activeTooltip.value)
      }
    }, { passive: true })

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
      processedContent = processedContent.replace(/(?<![/\w])@([a-zA-Z0-9_-]+)/g, (match, username) => {
        const placeholder = `__MENTION_${mentions.length}__`
        mentions.push({ username })
        return placeholder
      })

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
      processedContent = processedContent.replace(
        /#(\d+)(?!\w)/g,
        (match, commentNumber) => {
          const placeholder = `__CITATION_${citations.length}__`
          citations.push({ commentNumber: parseInt(commentNumber), type: 'number' })
          return placeholder
        }
      )

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
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-comment-number', 'src', 'alt', 'loading', 'data-original-src'],
        FORBID_ATTR: [
          'onerror',
          'onload',
          'onmouseover',
          'onfocus',
          'onblur',
          'onchange',
          'onsubmit',
        ],
        FORBID_TAGS: [
          'script',
          'object',
          'embed',
          'iframe',
          'form',
          'input',
          'textarea',
          'button',
        ],
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

  .vote-type-chip {
    white-space: nowrap;
    font-size: 0.65rem;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .vote-type-chip.tooltip-active {
    opacity: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .vote-chip-tooltip {
    animation: tooltipFadeIn 0.15s ease-out;
  }

  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-100% - 4px));
    }
    to {
      opacity: 1;
      transform: translate(-50%, -100%);
    }
  }

  .vote-types-summary {
    justify-content: flex-end;
  }

  .text-2xs {
    font-size: 0.65rem;
    line-height: 1rem;
  }

  /* Hide vote type text by default, show on hover */
  .vote-type-label {
    max-width: 0;
    overflow: hidden;
    white-space: nowrap;
    opacity: 0;
    transition: max-width 0.2s ease, opacity 0.15s ease, margin 0.2s ease;
    margin-left: 0;
    margin-right: 0;
  }

  .vote-type-chip:hover .vote-type-label {
    max-width: 80px;
    opacity: 1;
    margin-left: 0.25rem;
    margin-right: 0.25rem;
  }

  .vote-type-count {
    margin-left: 0.125rem;
    transition: margin 0.2s ease;
  }

  .vote-type-chip:hover .vote-type-count {
    margin-left: 0;
  }

  @media (max-width: 640px) {
    .vote-type-chip {
      font-size: 0.6rem;
      padding: 1px 3px;
    }
  }

  /* Comment footer unified layout */
  .comment-footer {
    min-height: 28px;
  }

  .comment-footer-separator {
    font-size: 0.75rem;
    line-height: 1;
  }

  /* On very narrow screens, let items wrap naturally */
  @media (max-width: 400px) {
    .comment-footer .vote-types-summary {
      margin-left: 0;
      margin-top: 0.25rem;
      width: 100%;
    }
  }

  /* Markdown styles */
  .prose {
    max-width: 100%;
    font-size: 0.875rem; /* text-sm equivalent (14px) */
    line-height: 1.5rem;
  }

  .prose img {
    max-width: 100%;
    height: auto;
    margin: 0.5rem 0;
    border-radius: 0.25rem;
  }

  .prose h1 {
    font-size: 1.125rem; /* Reduced from 1.25rem */
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  .prose h2 {
    font-size: 1rem; /* Reduced from 1.125rem */
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  .prose h3 {
    font-size: 0.9375rem; /* Reduced from 1rem */
    font-weight: 600;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .prose p {
    margin-bottom: 0.5rem;
    font-size: 0.875rem; /* text-sm */
  }

  .prose ul,
  .prose ol {
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
    padding-left: 1.25rem;
  }

  .prose ul {
    list-style-type: disc;
  }

  .prose ol {
    list-style-type: decimal;
  }

  .prose blockquote {
    border-left: 3px solid var(--color-border-default);
    padding-left: 0.75rem;
    font-style: italic;
    margin: 0.5rem 0;
  }

  .prose code {
    font-family: monospace;
    background-color: var(--color-bg-hover);
    padding: 0.1rem 0.25rem;
    border-radius: 0.25rem;
  }

  .prose a {
    color: var(--color-text-link);
    text-decoration: underline;
  }

  .prose hr {
    margin: 1rem 0;
    border: 0;
    border-top: 1px solid var(--color-border-default);
  }

  .view-in-post-btn {
    @apply inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }

  .view-in-post-btn:hover {
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }

  .dark .view-in-post-btn {
    color: var(--color-primary-light);
    border-color: var(--color-primary-light);
  }

  .dark .view-in-post-btn:hover {
    background-color: rgba(var(--color-primary-rgb), 0.2);
  }

  /* Modal styles */
  .comment-modal {
    background-color: var(--color-bg-card);
    color: var(--color-text-primary);
  }

  .modal-close-btn {
    color: var(--color-text-muted);
    transition: color 0.2s ease;
  }

  .modal-close-btn:hover {
    color: var(--color-text-primary);
  }

  .modal-description {
    color: var(--color-text-secondary);
  }

  .modal-input-group {
    border: 1px solid var(--color-border-default);
  }

  .modal-input {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }

  .modal-copy-btn {
    background-color: var(--color-bg-active);
  }

  .modal-copy-btn:hover {
    background-color: var(--color-bg-elevated);
  }

  .modal-btn-secondary {
    background-color: var(--color-bg-active);
    color: var(--color-text-primary);
  }

  .modal-btn-secondary:hover {
    background-color: var(--color-bg-elevated);
  }

  /* Comment edit textarea */
  .comment-edit-textarea {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  /* Comment cancel button */
  .comment-cancel-btn {
    background-color: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .comment-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .comment-deleted-box {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-muted);
  }

  .comment-vote-tooltip {
    background-color: var(--color-bg-inverse, #1f2937);
  }

  .comment-vote-tooltip-arrow {
    border-top-color: var(--color-bg-inverse, #1f2937);
  }
</style>
