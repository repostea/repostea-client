<template>
  <div class="comment-card">
    <div class="comment-main">
      <div class="comment-body">
        <div class="comment-header">
          <NuxtLink
            v-if="comment.user"
            :to="localePath(`/u/${comment.user.username}`)"
            class="user-link"
          >
            <NuxtImg
              v-if="comment.user.avatar"
              :src="comment.user.avatar"
              :alt="comment.user.username"
              width="24"
              height="24"
              class="avatar"
              loading="lazy"
              format="webp"
              preset="avatar"
            />
            <div v-else class="avatar-placeholder">
              <Icon name="fa6-solid:user" aria-hidden="true" />
            </div>
            <span class="username">{{ comment.user.username }}</span>
          </NuxtLink>
          <span v-else class="user-deleted">{{ $t('common.deleted_user') }}</span>

          <span class="separator">·</span>

          <span class="comment-date">
            {{ formatDate(comment.created_at) }}
          </span>

          <span class="separator">·</span>

          <span class="post-prefix">{{ $t('comments.on_post') }}</span>
          <NuxtLink :to="localePath(`/posts/${comment.post?.slug}`)" class="post-link">
            {{ comment.post?.title }}
          </NuxtLink>
        </div>

        <div class="comment-content">
          <div class="prose-content" v-html="renderMarkdown(comment.content)" />
          <!-- Embedded content (YouTube, Twitter, Instagram, etc.) -->
          <div v-if="commentEmbeds.length > 0" class="comment-embeds mt-2">
            <InlineEmbed
              v-for="(embed, idx) in commentEmbeds"
              :key="`embed-${comment.id}-${idx}`"
              :url="embed.url"
              :provider="embed.provider"
            />
          </div>
        </div>

        <div class="comment-actions">
          <div class="vote-info">
            <Icon
              :name="getVoteIcon(comment.vote_type)"
              class="vote-icon"
              :class="getVoteClass(comment.vote_type)"
              aria-hidden="true"
            />
            <span :class="getVoteClass(comment.vote_type)" class="vote-count">
              {{ comment.vote_count || 0 }}
            </span>
            <span v-if="comment.vote_type" class="vote-type-label">
              {{ $t(`vote_types.${comment.vote_type}`) }}
            </span>
          </div>

          <NuxtLink
            :to="localePath(`/posts/${comment.post?.slug}#c-${comment.id.toString(16)}`)"
            class="view-context-btn"
          >
            <Icon name="fa6-solid:arrow-up-right-from-square" class="mr-1.5" aria-hidden="true" />
            {{ $t('comments.view_in_context') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { defineProps, computed } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import { extractEmbeds, replaceEmbedsWithPlaceholders } from '~/utils/markdown'
  import InlineEmbed from '~/components/media/InlineEmbed.vue'

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const localePath = useLocalePath()

  const props = defineProps({
    comment: {
      type: Object,
      required: true,
    },
  })

  // Extract embeds from comment content
  const commentEmbeds = computed(() => {
    return extractEmbeds(props.comment?.content || '')
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return t('time.seconds_ago', { count: diffInSeconds })
    if (diffInSeconds < 3600)
      return t('time.minutes_ago', { count: Math.floor(diffInSeconds / 60) })
    if (diffInSeconds < 86400)
      return t('time.hours_ago', { count: Math.floor(diffInSeconds / 3600) })
    if (diffInSeconds < 2592000)
      return t('time.days_ago', { count: Math.floor(diffInSeconds / 86400) })

    return date.toLocaleDateString(locale.value, { timeZone: timezone })
  }

  const renderMarkdown = (content) => {
    if (!content) return ''
    // Remove embed syntax before rendering - embeds are rendered separately
    const processedContent = replaceEmbedsWithPlaceholders(content)
    let html = marked(processedContent)
    // Clean up embed placeholders
    html = html.replace(/<!--EMBED_PLACEHOLDER_\d+-->/g, '')
    html = html.replace(/<p>\s*<\/p>/g, '')
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
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
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'loading'],
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'button'],
    })
  }

  const getVoteIcon = (voteType) => {
    if (!voteType) return 'fa6-solid:minus'

    const positiveTypes = ['didactic', 'interesting', 'elaborate', 'funny']
    return positiveTypes.includes(voteType) ? 'fa6-solid:arrow-up' : 'fa6-solid:arrow-down'
  }

  const getVoteClass = (voteType) => {
    if (!voteType) return 'text-gray-500'

    const positiveTypes = ['didactic', 'interesting', 'elaborate', 'funny']
    return positiveTypes.includes(voteType)
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
  }
</script>

<style scoped>
  .comment-card {
    @apply rounded-lg mb-3 transition-shadow hover:shadow-md;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .comment-main {
    @apply p-4;
  }

  .comment-body {
    @apply flex flex-col;
  }

  .comment-header {
    @apply flex items-center flex-wrap gap-2 mb-3 text-sm;
    color: var(--color-text-muted);
  }

  .dark .comment-header {
    color: var(--color-text-muted-dark);
  }

  .user-link {
    @apply flex items-center gap-2 no-underline transition-colors;
    color: var(--color-text);
  }

  .user-link:hover {
    color: var(--color-primary);
  }

  .dark .user-link {
    color: var(--color-text-dark);
  }

  .dark .user-link:hover {
    color: var(--color-primary-light);
  }

  .avatar {
    @apply w-6 h-6 rounded-full object-cover;
  }

  .avatar-placeholder {
    @apply w-6 h-6 rounded-full flex items-center justify-center text-xs;
    background-color: var(--color-bg-elevated);
  }

  .username {
    @apply font-medium;
  }

  .user-deleted {
    @apply text-gray-500 dark:text-gray-400 italic;
  }

  .separator {
    @apply text-gray-400 dark:text-gray-600;
  }

  .comment-date {
    @apply text-xs;
  }

  .post-prefix {
    @apply text-xs;
  }

  .post-link {
    @apply text-xs font-medium transition-colors;
    color: var(--color-primary);
  }

  .post-link:hover {
    @apply underline;
  }

  .dark .post-link {
    color: var(--color-primary-light);
  }

  .comment-content {
    @apply mb-3;
  }

  .prose-content {
    @apply max-w-none leading-relaxed text-sm;
    color: var(--color-text);
  }

  .dark .prose-content {
    color: var(--color-text-dark);
  }

  .prose-content :deep(p) {
    @apply mb-2;
  }

  .prose-content :deep(p:last-child) {
    @apply mb-0;
  }

  .prose-content :deep(a) {
    @apply underline;
    color: var(--color-primary);
  }

  .prose-content :deep(a:hover) {
    color: var(--color-primary-dark);
  }

  .dark .prose-content :deep(a) {
    color: var(--color-primary-light);
  }

  .prose-content :deep(code) {
    @apply px-1 py-0.5 rounded text-xs font-mono;
    background-color: var(--color-bg-hover);
  }

  .prose-content :deep(pre) {
    @apply p-2 rounded overflow-x-auto text-xs;
    background-color: var(--color-bg-hover);
  }

  .prose-content :deep(pre code) {
    @apply bg-transparent p-0;
  }

  .prose-content :deep(blockquote) {
    @apply border-l-4 pl-3 italic my-2;
    border-color: var(--color-border-strong);
  }

  .prose-content :deep(ul),
  .prose-content :deep(ol) {
    @apply ml-4 mb-2;
  }

  .prose-content :deep(li) {
    @apply mb-1;
  }

  .comment-actions {
    @apply flex items-center justify-between text-sm pt-2;
    border-top: 1px solid var(--color-border-default);
  }

  .vote-info {
    @apply flex items-center gap-1.5;
  }

  .vote-icon {
    @apply text-base;
  }

  .vote-count {
    @apply font-medium text-sm;
  }

  .vote-type-label {
    @apply text-xs opacity-75 ml-1;
  }

  .view-context-btn {
    @apply flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors no-underline;
    color: var(--color-primary);
  }

  .view-context-btn:hover {
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }

  .dark .view-context-btn {
    color: var(--color-primary-light);
  }

  .dark .view-context-btn:hover {
    background-color: rgba(var(--color-primary-rgb), 0.2);
  }
</style>
