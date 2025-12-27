import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export function useVote(minKarmaToDownvote = 8) {
  const authStore = useAuthStore()
  const isVoting = ref(false)

  // Check if user can vote (allow guest votes)
  const canVote = computed(() => true)

  // For downvotes, check minimum karma (only for authenticated users)
  const canDownvote = computed(() => {
    if (authStore.isAuthenticated) {
      return authStore.userKarma >= minKarmaToDownvote
    }
    return false // Guest users cannot give negative votes
  })

  // Positive vote types
  const positiveVoteTypes = [
    { value: 'didactic', iconify: 'fa6-solid:graduation-cap', iconColor: 'text-yellow-500' },
    { value: 'interesting', iconify: 'fa6-solid:brain', iconColor: 'text-purple-500' },
    { value: 'elaborate', iconify: 'fa6-solid:book', iconColor: 'text-blue-500' },
    { value: 'funny', iconify: 'fa6-solid:face-laugh', iconColor: 'text-green-500' },
  ]

  // Negative vote types
  const negativeVoteTypes = [
    { value: 'incomplete', iconify: 'fa6-solid:scissors', iconColor: 'text-orange-500' },
    { value: 'irrelevant', iconify: 'fa6-solid:ban', iconColor: 'text-gray-500' },
    { value: 'false', iconify: 'fa6-solid:circle-xmark', iconColor: 'text-red-500' },
    {
      value: 'outofplace',
      iconify: 'fa6-solid:arrow-up-right-from-square',
      iconColor: 'text-pink-500',
    },
  ]

  // Get vote type icon (Iconify format)
  function getVoteTypeIconify(type: string) {
    const allTypes = [...positiveVoteTypes, ...negativeVoteTypes]
    const foundType = allTypes.find((t) => t.value === type)
    return foundType ? foundType.iconify : ''
  }

  // Get vote type icon color
  function getVoteTypeIconColor(type: string) {
    const allTypes = [...positiveVoteTypes, ...negativeVoteTypes]
    const foundType = allTypes.find((t) => t.value === type)
    return foundType ? foundType.iconColor : ''
  }

  // Get CSS class for vote type indicator
  function getVoteTypeClass(vote: number) {
    if (vote > 0) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

  return {
    isVoting,
    canVote,
    canDownvote,
    positiveVoteTypes,
    negativeVoteTypes,
    getVoteTypeIconify,
    getVoteTypeIconColor,
    getVoteTypeClass,
  }
}
