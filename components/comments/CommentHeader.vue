<template>
  <div class="comment-header flex items-center justify-between mb-2">
    <div class="flex items-center">
      <!-- Remote/Federated user -->
      <RemoteUserBadge
        v-if="comment.is_remote && comment.remote_user"
        :remote-user="comment.remote_user"
      />
      <!-- Local user -->
      <AuthorInfo
        v-else
        :user="comment.user"
        :created-at="comment.created_at"
        :show-time="!nested"
        :is-anonymous="comment.is_anonymous"
        :author-name="comment.author_name"
      />

      <!-- Comment number -->
      <span
        v-if="comment._commentNumber"
        :id="`comment-number-${comment._commentNumber}`"
        class="ml-2 text-xs font-mono text-text-muted dark:text-text-dark-muted cursor-pointer hover:text-primary"
        :title="`${t('comments.comment_number')} ${comment._commentNumber}`"
        @click="$emit('scroll-to-comment', comment._commentNumber)"
      >
        #{{ comment._commentNumber }}
      </span>

      <span
        v-if="comment.user?.isAdmin"
        class="badge ml-2 px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
      >
        Admin
      </span>

      <span
        v-else-if="comment.user?.isGlobalModerator"
        class="badge ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
      >
        Mod
      </span>

      <span
        v-if="comment.created_at"
        class="ml-2 text-xs text-text-muted dark:text-text-dark-muted"
      >
        <TimeAgo :datetime="comment.created_at" />
      </span>
    </div>
  </div>
</template>

<script setup>
import AuthorInfo from '~/components/common/AuthorInfo.vue'
import TimeAgo from '~/components/ui/TimeAgo.vue'
import { useI18n } from '#i18n'

const { t } = useI18n()

defineProps({
  comment: {
    type: Object,
    required: true,
  },
  nested: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['scroll-to-comment'])
</script>
