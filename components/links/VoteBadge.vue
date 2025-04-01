<template>
  <div
    class="flex flex-col items-center justify-center w-20 px-2 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-sm"
  >
    <div class="text-xl font-bold leading-none tabular-nums min-w-[56px] text-center">
      {{ paddedVotes }}
    </div>
    <div class="text-[11px] font-medium text-blue-500 dark:text-blue-300 mb-">votos</div>

    <button
      v-if="type !== 'external'"
      class="bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-bold px-3 py-1 shadow transition-all"
      :disabled="!canVote || isLoading || userHasVoted"
      @click.stop="$emit('vote', 1)"
    >
      votar
    </button>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    votes: Number,
    type: String,
    canVote: Boolean,
    canDownvote: Boolean,
    isLoading: Boolean,
    userHasVoted: Boolean,
  })

  defineEmits(['vote'])

  const paddedVotes = computed(() => {
    return props.votes
  })
</script>
