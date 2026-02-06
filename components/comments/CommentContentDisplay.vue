<template>
  <div class="comment-content text-text dark:text-text-dark mb-2" data-testid="comment-content">
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
        @submit="$emit('edit-submit', $event)"
        @cancel="$emit('edit-cancel')"
      />
    </div>
    <!-- Hidden comment message -->
    <div
      v-else-if="comment.status === 'hidden'"
      class="italic text-gray-500 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-3 rounded flex items-center"
    >
      <Icon name="fa6-solid:eye-slash" class="mr-2" aria-hidden="true" />
      {{ t('comments.moderated_message') }}
    </div>
    <!-- Deleted by author message -->
    <div
      v-else-if="comment.status === 'deleted_by_author'"
      class="comment-deleted-box italic p-3 rounded flex items-center"
    >
      <Icon name="fa6-solid:trash" class="mr-2" aria-hidden="true" />
      {{ t('comments.deleted_by_author_message') }}
    </div>
    <!-- Deleted user comment (but not federated comments) -->
    <div
      v-else-if="!comment.user && !comment.is_remote"
      class="comment-deleted-box italic p-3 rounded"
    >
      [deleted]
    </div>
    <!-- Normal comment content (including federated) -->
    <div
      v-else
      class="prose dark:prose-invert prose-sm max-w-none"
      @click="$emit('content-click', $event)"
      v-html="formattedContent"
    />
    <!-- Embedded content (YouTube, Twitter, Instagram, etc.) -->
    <div v-if="embeds.length > 0" class="comment-embeds mt-2">
      <InlineEmbed
        v-for="(embed, idx) in embeds"
        :key="`embed-${comment.id}-${idx}`"
        :url="embed.url"
        :provider="embed.provider"
      />
    </div>
    <!-- Edited indicator -->
    <div
      v-if="comment.edited_at && !isEditing"
      class="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mt-2 px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 rounded-full"
    >
      <Icon name="fa6-solid:pen-to-square" class="text-[10px]" aria-hidden="true" />
      {{ t('comments.edited') }}
    </div>
  </div>
</template>

<script setup>
  import CommentEditor from '~/components/comments/CommentEditor.vue'
  import InlineEmbed from '~/components/media/InlineEmbed.vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    comment: {
      type: Object,
      required: true,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
    editContent: {
      type: String,
      default: '',
    },
    isSavingEdit: {
      type: Boolean,
      default: false,
    },
    formattedContent: {
      type: String,
      default: '',
    },
    embeds: {
      type: Array,
      default: () => [],
    },
  })

  defineEmits(['edit-submit', 'edit-cancel', 'content-click'])
</script>

<style scoped>
  .comment-deleted-box {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-muted);
  }

  /* Markdown styles */
  .prose {
    max-width: 100%;
    font-size: 0.875rem;
    line-height: 1.5rem;
  }

  .prose img {
    max-width: 100%;
    height: auto;
    margin: 0.5rem 0;
    border-radius: 0.25rem;
  }

  .prose h1 {
    font-size: 1.125rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  .prose h2 {
    font-size: 1rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  .prose h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .prose p {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
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
</style>
