<template>
  <div
    :id="`agora-${message.id}`"
    class="agora-message-card mb-2 md:mb-3"
    :class="{
      'agora-root-message': !message.parent_id,
      'agora-reply-message ml-1 md:ml-4 pl-2 border-l border-gray-200 dark:border-gray-700':
        message.parent_id,
    }"
  >
    <!-- Header with AuthorInfo and badges -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center flex-wrap gap-2">
        <AuthorInfo
          :user="message.user"
          :is-anonymous="message.is_anonymous"
          :author-name="message.is_anonymous ? t('agora.anonymous_user') : null"
        />

        <!-- Time -->
        <span v-if="message.created_at" class="text-xs text-text-muted dark:text-text-dark-muted">
          <TimeAgo :datetime="message.created_at" />
        </span>

        <!-- Expiry indicator (top-level messages only) -->
        <span
          v-if="!message.parent_id && message.expires_at"
          class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1"
        >
          <span class="text-gray-300 dark:text-gray-600">·</span>
          <Icon name="fa6-solid:hourglass-half" class="text-2xs" aria-hidden="true" />
          {{ t('agora.expires_in', { time: formatExpiryTime() })
          }}{{ message.expiry_mode === 'from_last' ? ' ' + t('agora.from_last_reply') : '' }}
        </span>

        <!-- Edited indicator -->
        <span
          v-if="message.edited_at"
          class="text-xs text-gray-500 dark:text-gray-400 flex items-center"
        >
          <Icon name="fa6-solid:pen-to-square" class="mr-1" aria-hidden="true" />
          {{ t('comments.edited') }}
        </span>
      </div>

      <!-- Edit/Delete buttons -->
      <div v-if="canEdit || canDelete" class="flex items-center space-x-2">
        <button
          v-if="canEdit && !isEditing"
          class="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 flex items-center justify-center"
          :title="t('agora.edit')"
          :aria-label="t('agora.edit')"
          @click="toggleEdit"
        >
          <Icon name="fa6-solid:pen-to-square" class="text-sm" aria-hidden="true" />
        </button>
        <button
          v-if="canDelete"
          class="text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1 flex items-center justify-center"
          :title="t('agora.delete')"
          :aria-label="t('agora.delete')"
          @click="confirmDelete"
        >
          <Icon name="fa6-solid:trash" class="text-sm" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="!isEditing" class="mb-3">
      <div
        ref="contentRef"
        class="prose dark:prose-invert prose-sm max-w-none agora-content-with-images"
        @click="handleContentClick"
        v-html="formatMessageContent(message.content)"
      />
      <!-- Embedded content (YouTube, Twitter, Instagram, etc.) -->
      <div v-if="messageEmbeds.length > 0" class="message-embeds mt-2">
        <InlineEmbed
          v-for="(embed, idx) in messageEmbeds"
          :key="`embed-${message.id}-${idx}`"
          :url="embed.url"
          :provider="embed.provider"
        />
      </div>
    </div>
    <!-- Edit mode -->
    <div v-else class="mb-3">
      <CommentEditor
        ref="editEditor"
        :initial-content="editContent"
        :placeholder="t('agora.write_message')"
        :is-submitting="isSavingEdit"
        :show-anonymous-toggle="false"
        :hide-submit-button="true"
        @input="editContent = $event"
      />

      <!-- Options section -->
      <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <!-- Expiry settings for top-level messages -->
        <div v-if="isTopLevelMessage">
          <div class="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Icon name="fa6-solid:hourglass-half" class="text-xs" aria-hidden="true" />
            <span>{{ t('agora.expiry_label') }}</span>
            <!-- Duration dropdown -->
            <div class="relative inline-block">
              <button
                class="inline-flex items-center gap-0.5 font-medium text-primary hover:text-primary-dark underline decoration-dotted underline-offset-2"
                type="button"
                @click.stop="showEditDurationDropdown = !showEditDurationDropdown"
              >
                {{ getExpiryLabel(editExpiresInHours) }}
                <Icon name="fa6-solid:chevron-down" class="text-[10px]" />
              </button>
              <div
                v-if="showEditDurationDropdown"
                class="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]"
              >
                <button
                  v-for="option in expiryOptions"
                  :key="option.value"
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  :class="
                    editExpiresInHours === option.value
                      ? 'text-primary font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  "
                  type="button"
                  @click.stop="selectEditExpiry(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <span>{{ t('agora.expiry_mode_label').toLowerCase() }}</span>
            <!-- Mode dropdown -->
            <div class="relative inline-block">
              <button
                class="inline-flex items-center gap-0.5 font-medium text-primary hover:text-primary-dark underline decoration-dotted underline-offset-2"
                type="button"
                @click.stop="showEditModeDropdown = !showEditModeDropdown"
              >
                {{
                  editExpiryMode === 'from_last'
                    ? t('agora.expiry_mode_from_last').toLowerCase()
                    : t('agora.expiry_mode_from_first').toLowerCase()
                }}
                <Icon name="fa6-solid:chevron-down" class="text-[10px]" />
              </button>
              <div
                v-if="showEditModeDropdown"
                class="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
              >
                <button
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  :class="
                    editExpiryMode === 'from_last'
                      ? 'text-primary font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  "
                  type="button"
                  @click.stop="selectEditMode('from_last')"
                >
                  {{ t('agora.expiry_mode_from_last') }}
                </button>
                <button
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  :class="
                    editExpiryMode === 'from_first'
                      ? 'text-primary font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  "
                  type="button"
                  @click.stop="selectEditMode('from_first')"
                >
                  {{ t('agora.expiry_mode_from_first') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Anonymous toggle -->
        <label v-if="isTopLevelMessage" class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="editIsAnonymous"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span class="text-sm text-gray-600 dark:text-gray-400">{{
            t('agora.publish_anonymous')
          }}</span>
        </label>

        <!-- Action buttons -->
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            :disabled="isSavingEdit"
            class="px-4 py-2 text-sm rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="cancelEdit"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="isSavingEdit || !editContent.trim()"
            class="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            @click="saveEdit"
          >
            <span
              v-if="isSavingEdit"
              class="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
            />
            {{ t('agora.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Lightbox (uses Teleport, can be anywhere) -->
    <ImageLightbox
      :is-open="showLightbox"
      :image-src="lightboxImageSrc"
      :image-alt="lightboxImageAlt"
      @close="closeLightbox"
    />

    <!-- Unified footer: votes + actions -->
    <div class="agora-footer flex items-center flex-wrap gap-y-1.5 mt-1 mb-1">
      <!-- Vote controls with integrated vote type chips -->
      <VoteControls
        :item-id="message.id"
        :votes-count="message.votes_count || 0"
        :user-vote="message.user_vote"
        :user-vote-type="message.user_vote_type"
        :vote-type-summary="voteTypeSummary"
        item-type="agora"
        variant="bar"
        @voted="onVoted"
      />

      <!-- Action buttons -->
      <div class="flex items-center gap-0.5 ml-2">
        <button
          v-if="!hideReplyButton"
          class="flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors touch-manipulation p-1"
          :title="t('agora.reply')"
          :aria-label="t('agora.reply')"
          @click="toggleReplyForm"
        >
          <Icon name="fa6-solid:reply" class="text-sm" aria-hidden="true" />
        </button>

        <button
          class="flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors touch-manipulation p-1"
          :title="t('common.permalink')"
          :aria-label="t('common.permalink')"
          @click="copyPermalink"
        >
          <Icon name="fa6-solid:link" class="text-sm" aria-hidden="true" />
        </button>
      </div>

      <!-- Toggle for detail view -->
      <button
        v-if="totalRepliesCount > 0 && showRepliesToggle && isDetailView"
        class="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors ml-2"
        :aria-expanded="showReplies"
        :aria-label="showReplies ? t('agora.hide_replies') : t('agora.show_replies')"
        @click="toggleReplies"
      >
        <Icon
          :name="showReplies ? 'fa6-solid:chevron-up' : 'fa6-solid:chevron-down'"
          aria-hidden="true"
        />
        <span>
          {{ showReplies ? t('agora.hide_replies') : t('agora.show_replies') }}
          ({{ totalRepliesCount }})
        </span>
      </button>

      <!-- Toggle for list view (expand/collapse full replies) -->
      <button
        v-if="totalRepliesCount > 0 && !isDetailView && showFullReplies"
        class="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors ml-2"
        @click="toggleReplies"
      >
        <Icon name="fa6-solid:chevron-up" aria-hidden="true" />
        <span>{{ t('agora.collapse_replies') }}</span>
      </button>

      <!-- Reply count indicator (list view, when there are replies) -->
      <NuxtLink
        v-if="!isDetailView && totalRepliesCount > 0"
        :to="localePath(`/agora/${message.id}`)"
        class="flex items-center gap-1 text-xs text-primary dark:text-primary-light hover:underline ml-auto"
        :title="t('agora.view_all_replies', { count: totalRepliesCount })"
      >
        <Icon name="fa6-solid:comments" class="text-xs" aria-hidden="true" />
        <span class="font-medium">{{ totalRepliesCount }}</span>
      </NuxtLink>
    </div>

    <!-- Reply form - Desktop inline -->
    <div v-if="showReplyForm && !isMobile" class="mt-4 agora-reply-form rounded-lg p-4">
      <div class="flex items-start justify-between mb-3">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <Icon name="fa6-solid:reply" class="mr-2" aria-hidden="true" />
          {{ t('agora.replying_to') }}:
          <span class="font-medium">
            {{ message.is_anonymous ? t('agora.anonymous_user') : '@' + message.user?.username }}
          </span>
        </div>
        <button
          class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          @click="cancelReplyForm"
        >
          <Icon name="fa6-solid:xmark" aria-hidden="true" />
        </button>
      </div>

      <CommentEditor
        ref="replyEditor"
        :placeholder="t('agora.write_message')"
        :submit-label="t('agora.reply')"
        :rows="3"
        :is-submitting="isSubmittingReply"
        @submit="submitReply"
      >
        <template #cancel-button>
          <button
            type="button"
            class="px-3 py-1.5 agora-cancel-btn rounded transition-colors text-sm"
            @click="cancelReplyForm"
          >
            {{ t('common.cancel') }}
          </button>
        </template>
      </CommentEditor>

      <div class="flex items-center mt-2">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="replyAnonymous"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ t('agora.publish_anonymous') }}
          </span>
        </label>
      </div>
    </div>

    <!-- Reply form - Mobile modal -->
    <Teleport to="body">
      <div v-if="showReplyForm && isMobile" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="cancelReplyForm" />

        <!-- Modal content (bottom sheet) -->
        <div
          class="absolute bottom-0 left-0 right-0 agora-mobile-modal rounded-t-2xl p-4 pb-6 animate-slide-up max-h-[90vh] overflow-y-auto"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <Icon name="fa6-solid:reply" class="mr-2" aria-hidden="true" />
              {{ t('agora.replying_to') }}:
              <span class="font-medium">
                {{
                  message.is_anonymous ? t('agora.anonymous_user') : '@' + message.user?.username
                }}
              </span>
            </div>
            <button
              class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2"
              @click="cancelReplyForm"
            >
              <Icon name="fa6-solid:xmark" class="text-xl" aria-hidden="true" />
            </button>
          </div>

          <!-- Editor -->
          <CommentEditor
            ref="replyEditor"
            :placeholder="t('agora.write_message')"
            :submit-label="t('agora.reply')"
            :rows="4"
            :is-submitting="isSubmittingReply"
            @submit="submitReply"
          >
            <template #cancel-button>
              <button
                type="button"
                class="px-3 py-1.5 agora-cancel-btn rounded transition-colors text-sm"
                @click="cancelReplyForm"
              >
                {{ t('common.cancel') }}
              </button>
            </template>
          </CommentEditor>

          <!-- Anonymous checkbox -->
          <div class="flex items-center mt-3">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="replyAnonymous"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ t('agora.publish_anonymous') }}
              </span>
            </label>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reply Preview (list view only) - Compact flat view -->
    <div
      v-if="!isDetailView && message.replies && message.replies.length > 0 && !showFullReplies"
      class="mt-3 ml-2 pl-3 border-l-2 border-primary/30"
    >
      <!-- Compact flat replies with nesting indication -->
      <div>
        <div
          v-for="reply in flatRepliesPreview"
          :key="reply.id"
          class="agora-reply-compact flex items-start gap-1.5 text-xs"
          :style="{ paddingLeft: reply._depth * 16 + 'px' }"
        >
          <!-- Nesting indicator -->
          <span v-if="reply._depth > 0" class="text-gray-300 dark:text-gray-600 mt-1 flex-shrink-0"
            >↳</span
          >
          <!-- Avatar -->
          <NuxtImg
            v-if="!reply.is_anonymous && reply.user?.avatar"
            :src="reply.user.avatar"
            :alt="reply.user.username"
            width="18"
            height="18"
            loading="lazy"
            class="w-4.5 h-4.5 rounded-full flex-shrink-0 mt-0.5"
          />
          <div
            v-else
            class="w-4.5 h-4.5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <Icon name="fa6-solid:user" class="text-2xs text-gray-400" aria-hidden="true" />
          </div>
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1">
              <span class="font-medium text-gray-700 dark:text-gray-300">
                {{ reply.is_anonymous ? t('agora.anonymous_user') : reply.user?.username }}
              </span>
              <span v-if="reply.created_at" class="text-gray-300 dark:text-gray-600">·</span>
              <TimeAgo
                v-if="reply.created_at"
                :datetime="reply.created_at"
                class="text-2xs text-gray-400 dark:text-gray-500"
              />
            </div>
            <div class="text-gray-500 dark:text-gray-400 leading-snug flex items-center gap-1.5">
              <img
                v-if="getReplyImageUrl(reply.content)"
                :src="getReplyImageUrl(reply.content)"
                alt=""
                class="w-5 h-5 rounded object-cover flex-shrink-0"
                loading="lazy"
              />
              <span>{{ truncateContent(reply.content, 80) }}</span>
            </div>
          </div>
        </div>
        <!-- More indicator -->
        <div v-if="totalRepliesCount > 10" class="text-xs text-gray-400 dark:text-gray-500 pt-1">
          +{{ totalRepliesCount - 10 }} {{ t('agora.more_replies') }}…
        </div>
      </div>

      <!-- View thread link -->
      <NuxtLink
        :to="localePath(`/agora/${message.id}`)"
        class="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark font-medium hover:underline transition-colors"
      >
        <Icon name="fa6-solid:comments" class="text-xs" aria-hidden="true" />
        {{ t('agora.view_thread') }}
        <Icon name="fa6-solid:arrow-right" class="text-2xs" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- Full Replies (detail view or expanded) -->
    <div
      v-if="(isDetailView || showFullReplies) && message.replies && message.replies.length > 0"
      class="mt-4 space-y-3"
    >
      <AgoraMessageCard
        v-for="reply in message.replies"
        :key="reply.id"
        :message="reply"
        :hide-reply-button="false"
        :show-replies-toggle="true"
        :is-detail-view="isDetailView"
        @reply="$emit('reply', $event)"
        @deleted="$emit('deleted')"
        @updated="$emit('updated')"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="t('agora.delete')"
      :message="t('agora.confirm_delete')"
      :confirm-text="t('agora.delete')"
      :cancel-text="t('agora.cancel')"
      type="danger"
      @confirm="handleDeleteConfirm"
    />

    <!-- Expiry Reduction Confirmation Dialog -->
    <ConfirmDialog
      v-model="showExpiryReduceConfirm"
      :title="t('agora.expiry_reduce_title')"
      :message="t('agora.expiry_reduce_message')"
      :confirm-text="t('agora.expiry_reduce_confirm')"
      :cancel-text="t('agora.cancel')"
      type="warning"
      @confirm="handleExpiryReduceConfirm"
      @cancel="cancelExpiryReduceConfirm"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  import { useNuxtApp } from '#app'
  import { useAuthStore } from '~/stores/auth'
  import { useNotification } from '~/composables/useNotification'
  import AuthorInfo from '~/components/common/AuthorInfo.vue'
  import VoteControls from '~/components/comments/VoteControls.vue'
  import CommentEditor from '~/components/comments/CommentEditor.vue'
  import TimeAgo from '~/components/ui/TimeAgo.vue'
  import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
  import ImageLightbox from '~/components/common/ImageLightbox.vue'
  import { marked } from 'marked'
  import {
    configureMarked,
    processLargeEmojis,
    extractEmbeds,
    replaceEmbedsWithPlaceholders,
  } from '~/utils/markdown'
  import DOMPurify from 'dompurify'
  import InlineEmbed from '~/components/media/InlineEmbed.vue'

  const props = defineProps({
    message: {
      type: Object,
      required: true,
    },
    hideReplyButton: {
      type: Boolean,
      default: false,
    },
    showRepliesToggle: {
      type: Boolean,
      default: true,
    },
    isDetailView: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['reply', 'deleted', 'updated'])

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()
  const { success, error } = useNotification()

  const isEditing = ref(false)
  const isSavingEdit = ref(false)
  const editContent = ref(props.message.content)
  const editExpiresInHours = ref(props.message.expires_in_hours)
  const editExpiryMode = ref(props.message.expiry_mode)
  const editIsAnonymous = ref(props.message.is_anonymous || false)
  const showEditDurationDropdown = ref(false)
  const showEditModeDropdown = ref(false)
  const editEditor = ref(null)
  const showReplies = ref(true)
  const showFullReplies = ref(false)
  const showReplyForm = ref(false)
  const replyEditor = ref(null)
  const replyAnonymous = ref(false)
  const isSubmittingReply = ref(false)
  const showDeleteConfirm = ref(false)
  const showExpiryReduceConfirm = ref(false)
  const pendingEditFormData = ref(null)
  const isMobile = ref(false)

  // Lightbox state
  const contentRef = ref(null)
  const showLightbox = ref(false)
  const lightboxImageSrc = ref('')
  const lightboxImageAlt = ref('')

  // Extract embeds from message content
  const messageEmbeds = computed(() => {
    return extractEmbeds(props.message?.content || '')
  })

  // Mobile detection
  function checkMobile() {
    isMobile.value = window.innerWidth < 768
  }

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

  function closeLightbox() {
    showLightbox.value = false
    lightboxImageSrc.value = ''
    lightboxImageAlt.value = ''
  }

  // Close edit dropdowns when clicking outside
  function handleEditDropdownClickOutside(event) {
    if (!event.target.closest('.relative.inline-block')) {
      showEditDurationDropdown.value = false
      showEditModeDropdown.value = false
    }
  }

  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    document.addEventListener('click', handleEditDropdownClickOutside)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    document.removeEventListener('click', handleEditDropdownClickOutside)
  })

  const canEdit = computed(() => {
    return authStore.user && authStore.user.id === props.message.user?.id
  })

  const canDelete = computed(() => {
    return (
      authStore.user && (authStore.user.id === props.message.user?.id || authStore.user.isAdmin)
    )
  })

  // Check if this is a top-level message (can edit expiry)
  const isTopLevelMessage = computed(() => !props.message.parent_id)

  // Expiry options for edit dropdown
  const expiryOptions = computed(() => [
    { value: 1, label: t('agora.expiry_1_hour') },
    { value: 24, label: t('agora.expiry_1_day') },
    { value: 168, label: t('agora.expiry_1_week') },
    { value: 720, label: t('agora.expiry_1_month') },
    { value: 8760, label: t('agora.expiry_1_year') },
    { value: 876000, label: t('agora.expiry_1_century') },
  ])

  // Get label for expiry hours
  function getExpiryLabel(hours) {
    const option = expiryOptions.value.find((o) => o.value === hours)
    return option ? option.label.toLowerCase() : ''
  }

  // Select expiry duration in edit mode
  function selectEditExpiry(value) {
    editExpiresInHours.value = value
    showEditDurationDropdown.value = false
  }

  // Select expiry mode in edit mode
  function selectEditMode(mode) {
    editExpiryMode.value = mode
    showEditModeDropdown.value = false
  }

  // Vote type badges

  const voteTypeSummary = computed(() => {
    return props.message.vote_type_summary || {}
  })

  // Recursively count all nested replies (fallback if API doesn't provide total)
  function countAllReplies(msg) {
    if (!msg || !msg.replies) return 0
    let count = msg.replies.length
    for (const reply of msg.replies) {
      count += countAllReplies(reply)
    }
    return count
  }

  // Use API total_replies_count if available, otherwise calculate from loaded replies
  const totalRepliesCount = computed(() => {
    // Prefer the server-calculated total if available
    if (props.message.total_replies_count !== undefined && props.message.total_replies_count > 0) {
      return props.message.total_replies_count
    }
    // Fallback to counting loaded replies (works in detail view)
    return countAllReplies(props.message)
  })

  // Flatten replies for compact preview (max 10, with nesting info)
  function flattenReplies(replies, depth = 0, result = []) {
    if (!replies || result.length >= 10) return result
    for (const reply of replies) {
      if (result.length >= 10) break
      result.push({ ...reply, _depth: depth })
      if (reply.replies && reply.replies.length > 0) {
        flattenReplies(reply.replies, depth + 1, result)
      }
    }
    return result
  }

  const flatRepliesPreview = computed(() => {
    return flattenReplies(props.message.replies)
  })

  // Extract image URL from markdown content if present
  function getReplyImageUrl(content) {
    if (!content) return null
    const imageMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/)
    return imageMatch ? imageMatch[1] : null
  }

  // Truncate content to first 1-2 sentences (max 100 chars)
  // Returns { text, image } where image is the first image URL if content contains one
  function truncateContent(content, maxLen = 100) {
    if (!content) return ''

    // Check for markdown images: ![alt](url)
    const imageMatch = content.match(/!\[([^\]]*)\]\(([^)]+)\)/)
    if (imageMatch) {
      // Remove image markdown from content to get text
      const textWithoutImage = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim()
      if (!textWithoutImage) {
        // Content is only an image - return special marker
        return '📷'
      }
      // There's text alongside the image
      content = textWithoutImage
    }

    // Split by sentence endings
    const sentences = content.split(/(?<=[.!?])\s+/)
    let result = sentences[0] || content
    if (sentences.length > 1 && result.length < 60) {
      result += ' ' + sentences[1]
    }
    if (result.length > maxLen) {
      result = result.substring(0, maxLen).trim() + '…'
    }
    return result
  }

  function formatExpiryTime() {
    if (!props.message.expires_at) return ''
    const expiryDate = new Date(props.message.expires_at)
    const now = new Date()
    const diffMs = expiryDate - now

    if (diffMs <= 0) return t('agora.expired')

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    // Round to nearest friendly unit
    if (diffDays >= 350) {
      // ~1 year or more
      const years = Math.round(diffDays / 365)
      return years === 1 ? t('agora.expiry_1_year') : `${years} ${t('agora.years')}`
    }
    if (diffDays >= 25) {
      // ~1 month or more
      const months = Math.round(diffDays / 30)
      return months === 1 ? t('agora.expiry_1_month') : `${months} ${t('agora.months')}`
    }
    if (diffDays >= 6) {
      // ~1 week or more
      const weeks = Math.round(diffDays / 7)
      return weeks === 1 ? t('agora.expiry_1_week') : `${weeks} ${t('agora.weeks')}`
    }
    if (diffDays >= 1) {
      return diffDays === 1 ? t('agora.expiry_1_day') : `${diffDays} ${t('agora.days')}`
    }
    return diffHours === 1 ? t('agora.expiry_1_hour') : `${diffHours} ${t('agora.hours')}`
  }

  function toggleEdit() {
    isEditing.value = !isEditing.value
    if (isEditing.value) {
      editContent.value = props.message.content
      editExpiresInHours.value = props.message.expires_in_hours
      editExpiryMode.value = props.message.expiry_mode
      editIsAnonymous.value = props.message.is_anonymous || false
    }
  }

  function cancelEdit() {
    isEditing.value = false
    showEditDurationDropdown.value = false
    showEditModeDropdown.value = false
    editContent.value = props.message.content
    editIsAnonymous.value = props.message.is_anonymous || false
  }

  // Wrapper function to call handleEditSubmit with current edit state
  function saveEdit() {
    handleEditSubmit({ content: editContent.value })
  }

  // Check if expiry reduction is drastic (reduced by 75% or more)
  function isExpiryReductionDrastic() {
    if (!isTopLevelMessage.value) return false
    const originalHours = props.message.expires_in_hours
    const newHours = editExpiresInHours.value
    if (!originalHours || !newHours) return false
    // Consider drastic if new duration is 25% or less of original
    return newHours < originalHours * 0.25
  }

  async function handleEditSubmit(formData) {
    // Check if expiry reduction is drastic and needs confirmation
    if (isTopLevelMessage.value && isExpiryReductionDrastic() && !pendingEditFormData.value) {
      pendingEditFormData.value = formData
      showExpiryReduceConfirm.value = true
      return
    }

    // Use pending data if coming from confirmation, otherwise use formData
    const dataToSubmit = pendingEditFormData.value || formData
    pendingEditFormData.value = null

    isSavingEdit.value = true
    try {
      const updateData = {
        content: dataToSubmit.content,
      }

      // Include expiry settings and anonymous for top-level messages
      if (isTopLevelMessage.value) {
        updateData.expires_in_hours = editExpiresInHours.value
        updateData.expiry_mode = editExpiryMode.value
        updateData.is_anonymous = editIsAnonymous.value
      }

      const response = await $api.agora.updateMessage(props.message.id, updateData)

      // Update local message data
      props.message.content = dataToSubmit.content
      if (isTopLevelMessage.value && response.data) {
        props.message.expires_in_hours = response.data.expires_in_hours
        props.message.expiry_mode = response.data.expiry_mode
        props.message.expires_at = response.data.expires_at
        props.message.is_anonymous = response.data.is_anonymous
      }

      isEditing.value = false
      showEditDurationDropdown.value = false
      showEditModeDropdown.value = false
      success(t('agora.message_updated'))
      emit('updated')
    } catch (err) {
      // Show error feedback (skip if interceptor already showed it)
      if (!err._interceptorWillNotify) {
        const errorMessage = err.response?.data?.message || t('agora.error_updating')
        error(errorMessage)
      }
    } finally {
      isSavingEdit.value = false
    }
  }

  function handleExpiryReduceConfirm() {
    showExpiryReduceConfirm.value = false
    if (pendingEditFormData.value) {
      handleEditSubmit(pendingEditFormData.value)
    }
  }

  function cancelExpiryReduceConfirm() {
    showExpiryReduceConfirm.value = false
    pendingEditFormData.value = null
  }

  function confirmDelete() {
    showDeleteConfirm.value = true
  }

  async function handleDeleteConfirm() {
    try {
      await $api.agora.deleteMessage(props.message.id)
      success(t('agora.message_deleted'))
      emit('deleted')
    } catch (err) {
      if (!err._interceptorWillNotify) {
        error(t('agora.error_deleting'))
      }
    }
  }

  function onVoted(_data) {
    // The voted event from VoteControls already updates local state
    // We just need to refresh the message to get updated vote counts
    // The data object contains: itemId, itemType, value, voteType, previousVoteValue, previousVoteType
    emit('updated')
  }

  function toggleReplies() {
    if (props.isDetailView) {
      showReplies.value = !showReplies.value
    } else {
      showFullReplies.value = !showFullReplies.value
    }
  }

  async function copyPermalink() {
    const baseUrl = window.location.origin
    const permalink = props.message.parent_id
      ? `${baseUrl}${localePath(`/agora/${props.message.parent_id || props.message.id}`)}#agora-${props.message.id}`
      : `${baseUrl}${localePath(`/agora/${props.message.id}`)}`

    try {
      await navigator.clipboard.writeText(permalink)
      success(t('common.permalink_copied'))
    } catch (err) {
      console.error('Error copying permalink:', err)
      error(t('common.copy_failed'))
    }
  }

  function toggleReplyForm() {
    if (!authStore.user) {
      error(t('errors.login_required'))
      return
    }
    showReplyForm.value = !showReplyForm.value
  }

  function cancelReplyForm() {
    showReplyForm.value = false
    replyAnonymous.value = false
    if (replyEditor.value) {
      replyEditor.value.reset()
    }
  }

  async function submitReply(formData) {
    if (!formData.content || !formData.content.trim()) {
      error(t('agora.empty_message'))
      return
    }

    isSubmittingReply.value = true

    try {
      await $api.agora.createMessage({
        content: formData.content,
        parent_id: props.message.id,
        is_anonymous: replyAnonymous.value,
      })

      showReplyForm.value = false
      replyAnonymous.value = false

      if (replyEditor.value) {
        replyEditor.value.reset()
      }

      // Emit event to refresh messages
      emit('updated')
    } catch (err) {
      // Show error feedback (skip if interceptor already showed it)
      if (!err._interceptorWillNotify) {
        error(t('agora.error_publishing'))
      }
    } finally {
      isSubmittingReply.value = false
    }
  }

  /**
   * Format message content to render user mentions and Markdown as HTML
   */
  function formatMessageContent(content) {
    if (!content) return ''

    try {
      // First, remove embed syntax - embeds are rendered separately as Vue components
      let processedContent = replaceEmbedsWithPlaceholders(content)

      // Replace @username with a placeholder to prevent Markdown parser from processing them
      // Uses negative lookbehind to exclude @ preceded by / (inside URLs like mastodon.social/@user)
      const mentions = []
      processedContent = processedContent.replace(
        /(?<![/\w])@([a-zA-Z0-9_-]+)/g,
        (match, username) => {
          const placeholder = `__MENTION_${mentions.length}__`
          mentions.push({ username })
          return placeholder
        }
      )

      // Process large emoji syntax (::emoji:: and :::emoji:::)
      processedContent = processLargeEmojis(processedContent)

      // Parse the content as Markdown
      configureMarked()
      let formattedContent = marked.parse(processedContent)

      // Sanitize the HTML to prevent XSS attacks
      // Note: span is needed for NSFW image blur containers
      formattedContent = DOMPurify.sanitize(formattedContent, {
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

      // Replace the mention placeholders with the actual HTML
      mentions.forEach((mention, index) => {
        const placeholder = `__MENTION_${index}__`
        const strongPlaceholder = `<strong>MENTION_${index}</strong>`
        const userPath = localePath(`/u/${mention.username}`)
        const html = `<a href="${userPath}" class="text-primary hover:underline">@${mention.username}</a>`
        formattedContent = formattedContent.replace(placeholder, html)
        formattedContent = formattedContent.replace(strongPlaceholder, html)
      })

      // Remove embed placeholders (embeds are rendered as separate Vue components)
      formattedContent = formattedContent.replace(/<!--EMBED_PLACEHOLDER_\d+-->/g, '')
      // Also clean up any paragraph tags that only contained an embed
      formattedContent = formattedContent.replace(/<p>\s*<\/p>/g, '')

      return formattedContent
    } catch (err) {
      console.error('Error formatting message:', err)
      return content || ''
    }
  }
</script>

<style scoped>
  .agora-message-card {
    transition: all 0.2s ease;
  }

  .agora-reply-border {
    border-color: var(--color-border-strong);
  }

  .agora-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }

  .agora-cancel-btn {
    border: 1px solid var(--color-border-default);
  }

  .agora-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .agora-reply-form {
    background-color: var(--color-bg-subtle);
  }

  /* Reply preview - compact */
  .agora-replies-preview {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }

  .agora-reply-compact {
    min-height: 1.5rem;
    line-height: 1.4;
    padding: 0.375rem 0;
  }

  .agora-reply-compact:first-child {
    padding-top: 0;
  }

  .agora-reply-compact:last-child {
    padding-bottom: 0;
  }

  .w-4\.5 {
    width: 1.125rem;
  }

  .h-4\.5 {
    height: 1.125rem;
  }

  .text-2xs {
    font-size: 0.65rem;
  }

  /* Mobile modal */
  .agora-mobile-modal {
    background-color: var(--color-bg-card);
    border-top: 1px solid var(--color-border-default);
  }

  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }

  /* Image styles for content with lightbox support */
  .agora-content-with-images :deep(img) {
    max-width: 100%;
    max-height: 300px;
    width: auto;
    height: auto;
    border-radius: 0.5rem;
    cursor: zoom-in;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    object-fit: contain;
  }

  .agora-content-with-images :deep(img:hover) {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
</style>
