<template>
  <div
    v-if="isFlatMode && comment._parentNumber"
    class="reply-indicator text-xs text-text-muted dark:text-text-dark-muted mb-2 flex items-center"
  >
    <Icon name="fa6-solid:reply" class="mr-1" aria-hidden="true" />
    <span>
      {{ t('comments.in_reply_to') }}
      <a
        href="javascript:void(0)"
        class="text-primary hover:underline font-medium font-mono cursor-pointer"
        :title="`${t('comments.go_to_comment')} #${comment._parentNumber}`"
        @click.prevent="$emit('scroll-to-comment', comment._parentNumber)"
      >
        #{{ comment._parentNumber }}
      </a>
      <span v-if="comment._parentComment">
        <span class="mx-1">-</span>
        <template v-if="comment._parentComment.is_anonymous">
          <span class="text-gray-600 dark:text-gray-400">
            @{{ t('common.anonymous') }}
          </span>
        </template>
        <template v-else>
          <NuxtLink
            v-if="comment._parentComment.user"
            :to="localePath(`/u/${comment._parentComment.user.username}`)"
            class="text-primary hover:underline"
          >
            @{{ comment._parentComment.user.username }}
          </NuxtLink>
          <span v-else-if="comment._parentComment.author_name">
            @{{ comment._parentComment.author_name }}
          </span>
        </template>
      </span>
    </span>
  </div>
</template>

<script setup>
import { useI18n, useLocalePath } from '#i18n'

const { t } = useI18n()
const localePath = useLocalePath()

defineProps({
  comment: {
    type: Object,
    required: true,
  },
  isFlatMode: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['scroll-to-comment'])
</script>
