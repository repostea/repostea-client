<template>
  <div
    class="flex flex-col items-center justify-center w-20 px-2 vote-badge"
    :class="{ 'has-federation': hasFederationBadge, 'py-3': !hasFederationBadge, 'py-2': hasFederationBadge }"
  >
    <div
      class="text-xl font-bold leading-none tabular-nums min-w-[56px] text-center"
      :class="{ 'vote-pulse': justVoted, 'realtime-pulse': realtimeUpdate }"
    >
      {{ paddedVotes }}
    </div>
    <div class="text-[11px] font-medium vote-badge-text" :class="hasFederationBadge ? 'mb-1' : 'mb-2'">{{ $t('posts.votes') }}</div>

    <button
      class="bg-gradient-to-b vote-button hover:from-primary-light hover:to-primary-dark text-xs font-bold px-3 py-1 shadow-md transition-all"
      :class="{ voted: userHasVoted }"
      style="color: var(--color-btn-primary-text)"
      :disabled="isLoading"
      :aria-label="userHasVoted ? $t('posts.voted') : $t('posts.vote')"
      @click.stop="handleVoteClick"
    >
      <span v-if="isLoading" class="spinner" aria-hidden="true"/>
      <span v-else>{{ userHasVoted ? $t('posts.voted') : $t('posts.vote') }}</span>
    </button>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'

  const props = defineProps({
    votes: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: 'internal',
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    userHasVoted: {
      type: Boolean,
      default: false,
    },
    hasFederationBadge: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['vote'])
  const justVoted = ref(false)
  const realtimeUpdate = ref(false)
  const previousVotes = ref(props.votes)

  const paddedVotes = computed(() => {
    return props.votes || 0
  })

  function handleVoteClick() {
    emit('vote', props.userHasVoted ? 0 : 1)
  }

  // Watch for loading state changes (user voted)
  watch(
    () => props.isLoading,
    (newVal, oldVal) => {
      if (oldVal === true && newVal === false) {
        justVoted.value = true
        previousVotes.value = props.votes
        setTimeout(() => {
          justVoted.value = false
        }, 800)
      }
    }
  )

  // Watch for realtime vote changes (from WebSocket)
  watch(
    () => props.votes,
    (newVal, oldVal) => {
      // Only animate if not currently loading (user voting) and value actually changed
      if (!props.isLoading && !justVoted.value && newVal !== oldVal && oldVal !== undefined) {
        previousVotes.value = oldVal
        realtimeUpdate.value = true
        setTimeout(() => {
          realtimeUpdate.value = false
        }, 600)
      }
    }
  )
</script>

<style scoped>
  .vote-badge {
    background-color: rgba(var(--color-primary-rgb), 0.15);
    color: var(--color-primary);
    border: 1px solid rgba(var(--color-primary-rgb), 0.4);
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(var(--color-primary-rgb), 0.1);
    transition: all 0.3s ease;
  }

  .vote-badge:hover {
    box-shadow: 0 6px 8px -1px rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-2px);
  }

  .vote-badge.has-federation {
    border-radius: 0.5rem 0.5rem 0 0;
    border-bottom: none;
  }

  .vote-badge-text {
    color: var(--color-primary);
    font-weight: 600;
  }

  .vote-button {
    background-image: linear-gradient(
      to bottom,
      var(--color-primary-light),
      var(--color-primary-dark)
    );
    min-width: 48px; /* Fixed minimum width */
    white-space: nowrap; /* Prevent text from breaking into multiple lines */
    position: relative;
    border-radius: 0.375rem;
    transform-origin: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .vote-button:hover:not(:disabled) {
    background-image: linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark));
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(var(--color-primary-rgb), 0.4);
  }

  .vote-button.voted {
    background-image: linear-gradient(
      to bottom,
      var(--color-primary-dark),
      var(--color-primary-dark)
    );
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.2),
      inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .vote-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Pulse animation for vote counter */
  .vote-pulse {
    animation: pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1);
    text-shadow: 0 0 8px rgba(var(--color-primary-rgb), 0.6);
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.25);
      color: var(--color-primary-dark);
    }
  }

  /* Animation for real-time updates (more subtle) */
  .realtime-pulse {
    animation: realtimePulse 0.6s ease-out;
  }

  @keyframes realtimePulse {
    0% {
      transform: scale(1);
      color: inherit;
    }
    30% {
      transform: scale(1.15);
      color: var(--color-success, #22c55e);
    }
    100% {
      transform: scale(1);
      color: inherit;
    }
  }

  /* Style for centered spinner */
  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid color-mix(in srgb, var(--color-btn-primary-text) 30%, transparent);
    border-radius: 50%;
    border-top-color: var(--color-btn-primary-text);
    animation: spin 1s ease-in-out infinite;
    vertical-align: middle;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
