<template>
  <div class="comment-footer flex items-center flex-wrap gap-y-1.5 mt-1 mb-1">
    <!-- Vote controls with integrated vote type chips -->
    <VoteControls
      :key="`vote-controls-${comment.id || 'unknown'}-${voteRefreshKey}`"
      :item-id="comment.id || `unknown-${Math.random().toString(36).substr(2, 9)}`"
      :votes-count="comment.votes || 0"
      :user-vote="comment.userVote"
      :user-vote-type="comment.userVoteType"
      :vote-type-summary="voteTypeSummary"
      item-type="comment"
      variant="bar"
      @voted="$emit('voted', $event)"
    />

    <!-- Action buttons -->
    <div class="flex items-center gap-0.5 ml-2">
      <button
        class="reply-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors touch-manipulation p-1"
        :title="t('comments.reply')"
        :aria-label="t('comments.reply')"
        @click="$emit('reply')"
      >
        <Icon name="fa6-solid:reply" class="text-sm" aria-hidden="true" />
      </button>

      <button
        class="permalink-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors touch-manipulation p-1"
        :title="t('common.permalink')"
        :aria-label="t('common.permalink')"
        @click="$emit('show-permalink')"
      >
        <Icon name="fa6-solid:link" class="text-sm" aria-hidden="true" />
      </button>

      <!-- Edit button (only for author, within 15 minutes) -->
      <button
        v-if="canEdit && !isEditing"
        class="edit-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation p-1"
        :title="t('comments.edit')"
        :aria-label="t('comments.edit')"
        @click="$emit('start-edit')"
      >
        <Icon name="fa6-solid:pen-to-square" class="text-sm" aria-hidden="true" />
      </button>

      <!-- Delete button (only for author) -->
      <button
        v-if="isAuthor && comment.status !== 'deleted_by_author' && !isEditing"
        class="delete-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation p-1"
        :title="t('comments.delete')"
        :aria-label="t('comments.delete')"
        @click="$emit('show-delete')"
      >
        <Icon name="fa6-solid:trash" class="text-sm" aria-hidden="true" />
      </button>
    </div>

    <!-- Collapse thread button for mobile -->
    <button
      v-if="isMobile && hasChildren && !nested"
      class="collapse-button flex items-center text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors touch-manipulation text-xs py-1 px-1 ml-1"
      :title="isThreadCollapsed ? t('comments.expand_thread') : t('comments.collapse_thread')"
      @click="$emit('toggle-collapse')"
    >
      <Icon
        :name="isThreadCollapsed ? 'fa6-solid:chevron-down' : 'fa6-solid:chevron-up'"
        class="mr-1 text-xs"
        aria-hidden="true"
      />
      {{ isThreadCollapsed ? t('comments.expand') : t('comments.collapse') }}
      <span class="ml-0.5 text-2xs">({{ childrenCount }})</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VoteControls from '~/components/comments/VoteControls.vue'
import { useI18n } from '#i18n'

const { t } = useI18n()

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  voteRefreshKey: {
    type: Number,
    default: 0,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  isAuthor: {
    type: Boolean,
    default: false,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  nested: {
    type: Boolean,
    default: false,
  },
  isThreadCollapsed: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'voted',
  'reply',
  'show-permalink',
  'start-edit',
  'show-delete',
  'toggle-collapse',
])

const voteTypeSummary = computed(() => {
  try {
    const voteStats = props.comment?.vote_stats || props.comment?.voteStats
    if (voteStats?.vote_types) {
      return voteStats.vote_types
    }
  } catch (error) {
    console.error('Error computing voteTypeSummary:', error)
  }
  return {}
})

const hasChildren = computed(() => {
  return props.comment.children && props.comment.children.length > 0
})

const childrenCount = computed(() => {
  return props.comment.children?.length || 0
})
</script>

<style scoped>
.comment-footer {
  min-height: 28px;
}

.text-2xs {
  font-size: 0.65rem;
  line-height: 1rem;
}

/* On very narrow screens, let items wrap naturally */
@media (max-width: 400px) {
  .comment-footer .vote-types-summary {
    margin-left: 0;
    margin-top: 0.25rem;
    width: 100%;
  }
}
</style>
