<template>
  <div
    class="bg-white dark:bg-card-bg-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-6 overflow-hidden"
  >
    <div class="p-6">
      <div class="flex">
        <div class="vote-box p-1 bg-gray-50 dark:bg-neutral-800 rounded-lg mr-4">
          <button
            class="vote-btn"
            :class="{
              'opacity-50 cursor-not-allowed': !canVote || isVoting || comment.user_has_voted,
            }"
            :disabled="!canVote || isVoting || comment.user_has_voted"
            @click="vote(1)"
          >
            <i class="fas fa-arrow-up"></i>
          </button>
          <div class="vote-count">{{ comment?.votes || 0 }}</div>
          <button
            class="vote-btn vote-down"
            :class="{
              'opacity-50 cursor-not-allowed': !canDownvote || isVoting || comment.user_has_voted,
            }"
            :disabled="!canDownvote || isVoting || comment.user_has_voted"
            @click="vote(-1)"
          >
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>

        <div class="flex-grow">
          <div
            class="flex flex-wrap items-center text-sm text-text-muted dark:text-text-dark-muted mb-4 gap-3"
          >
            <span class="flex items-center">
              <i class="fas fa-user mr-1"></i>
              <NuxtLink
                :to="`/users/${comment.user?.username}`"
                class="hover:text-primary transition-colors"
              >
                {{ comment.user?.username }}
              </NuxtLink>
            </span>

            <span class="flex items-center" :title="formatDate(comment.created_at, 'full')">
              <i class="fas fa-clock mr-1"></i>
              {{ formatDate(comment.created_at) }}
            </span>
          </div>

          <div class="comment-content text-lg mb-4 text-text dark:text-text-dark">
            <p>{{ comment.content }}</p>
          </div>

          <div class="flex justify-between items-center">
            <button
              v-if="authStore.isAuthenticated"
              @click="replyTo"
              class="text-sm text-primary hover:underline"
            >
              <i class="fas fa-reply mr-1"></i>
              {{ $t('comments.reply') }}
            </button>

            <span class="text-xs text-text-muted dark:text-text-dark-muted">
              <i class="fas fa-bolt mr-1"></i>
              {{ formatNumber(comment?.karma || 0) }}
            </span>
          </div>

          <slot name="reply-form"></slot>


          <div
            v-if="comment.replies && comment.replies.length > 0"
            class="mt-3 ml-6 pl-3 border-l-2 border-border-color dark:border-neutral-700"
          >
            <div
              v-for="reply in comment.replies"
              :key="reply.id"
              :id="`comment-${reply.id}`"
              class="py-2"
            >
              <div class="flex">
                <div class="flex flex-col items-center mr-3">
                  <button
                    @click="voteReply(reply, 1)"
                    class="text-primary hover:text-primary-light text-xs"
                    :class="{
                      'opacity-50 cursor-not-allowed': !authStore.isAuthenticated || isVotingReply,
                    }"
                    :disabled="!authStore.isAuthenticated || isVotingReply"
                  >
                    <i class="fas fa-arrow-up"></i>
                  </button>
                  <div class="text-xs font-bold">
                    {{ reply?.votes || 0 }}
                  </div>
                </div>

                <div class="flex-grow">
                  <div class="flex justify-between items-center mb-1">
                    <NuxtLink
                      :to="`/users/${reply.user?.username}`"
                      class="font-medium text-primary text-sm"
                    >
                      {{ reply.user?.username }}
                    </NuxtLink>
                    <span class="text-xs text-text-muted dark:text-text-dark-muted">
                      {{ formatDate(reply.created_at) }}
                    </span>
                  </div>

                  <div class="text-sm text-text dark:text-text-dark">
                    {{ reply.content }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'

  const props = defineProps({
    comment: {
      type: Object,
      required: true,
    },
    linkId: {
      type: [Number, String],
      required: true,
    },
  })

  const emit = defineEmits(['voted', 'reply'])
  const authStore = useAuthStore()
  const isVoting = ref(false)
  const isVotingReply = ref(false)

  const canVote = computed(() => authStore.isAuthenticated && !props.comment.user_has_voted)
  const canDownvote = computed(() => canVote.value && authStore.userKarma >= 8)

  function formatNumber(num) {
    return Number(num).toFixed(1)
  }

  function formatDate(dateString, format = 'relative') {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.round(diffMs / 1000)
    const diffMin = Math.round(diffSec / 60)
    const diffHour = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHour / 24)
    if (format === 'relative') {
      if (diffSec < 60) return 'just now'
      if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
      if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`
      if (diffDay < 30) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`
      return date.toLocaleDateString()
    } else if (format === 'date') {
      return date.toLocaleDateString()
    } else {
      return date.toLocaleString()
    }
  }

  async function vote(value) {
    if (!canVote.value || (value === -1 && !canDownvote.value) || isVoting.value) return
    isVoting.value = true
    try {
      emit('voted', {
        commentId: props.comment.id,
        value,
      })
    } catch (error) {
      console.error('Error voting on comment:', error)
    } finally {
      isVoting.value = false
    }
  }

  function voteReply(reply, value) {
    if (!authStore.isAuthenticated || isVotingReply.value) return
    isVotingReply.value = true
    try {
      emit('voted', {
        commentId: reply.id,
        value,
      })
    } catch (error) {
      console.error('Error voting on reply:', error)
    } finally {
      isVotingReply.value = false
    }
  }

  function replyTo() {
    emit('reply', props.comment.id)
  }
</script>
