<template>
  <div
    class="vote-stats card-bg rounded-lg shadow-sm p-4 border border-border-color"
  >
    <div v-if="!hasVoteData" class="text-center py-4 text-gray-500">
      {{ t('vote.stats.no_votes') }}
    </div>

    <div v-else class="grid grid-cols-1 gap-3">
      <div v-if="totalPositiveVotes > 0" class="positive-votes-container">
        <div class="grid grid-cols-1 gap-2 ml-2">
          <div
            v-for="type in filteredPositiveVoteTypes"
            :key="type.value"
            class="vote-type-stat flex items-center"
          >
            <div class="w-8 flex justify-center">
              <Icon :name="type.iconify" :class="type.iconColor" aria-hidden="true" />
            </div>
            <div class="ml-2 flex-grow">
              <div class="flex justify-between mb-1">
                <span class="text-xs font-medium">{{ type.label }}</span>
                <span class="text-xs text-gray-500">{{ getVoteTypeCount(type.value) }}</span>
              </div>
              <div class="w-full vote-stats-progress-bg rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full"
                  :class="type.barColor"
                  :style="{ width: `${getVoteTypePercentage(type.value)}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalNegativeVotes > 0" class="negative-votes-container">
        <div class="grid grid-cols-1 gap-2 ml-2">
          <div
            v-for="type in filteredNegativeVoteTypes"
            :key="type.value"
            class="vote-type-stat flex items-center"
          >
            <div class="w-8 flex justify-center">
              <Icon :name="type.iconify" :class="type.iconColor" aria-hidden="true" />
            </div>
            <div class="ml-2 flex-grow">
              <div class="flex justify-between mb-1">
                <span class="text-xs font-medium">{{ type.label }}</span>
                <span class="text-xs text-gray-500">{{ getVoteTypeCount(type.value) }}</span>
              </div>
              <div class="w-full vote-stats-progress-bg rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full"
                  :class="type.barColor"
                  :style="{ width: `${getVoteTypePercentage(type.value)}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="unclassifiedVotes > 0" class="unclassified-votes">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2 flex items-center">
          <Icon name="fa6-solid:thumbs-up" class="mr-2" aria-hidden="true" />
          {{ t('vote.stats.unclassified') }} ({{ unclassifiedVotes }})
        </h4>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from '#i18n'
  const { t } = useI18n()

  const props = defineProps({
    voteDetails: {
      type: Array,
      default: () => [],
    },
    voteStats: {
      type: Object,
      default: null,
    },
  })

  const positiveVoteTypes = [
    {
      value: 'didactic',
      get label() {
        return t('vote.types.didactic')
      },
      iconify: 'fa6-solid:graduation-cap',
      iconColor: 'text-yellow-500',
      barColor: 'bg-yellow-500',
    },
    {
      value: 'interesting',
      get label() {
        return t('vote.types.interesting')
      },
      iconify: 'fa6-solid:brain',
      iconColor: 'text-purple-500',
      barColor: 'bg-purple-500',
    },
    {
      value: 'elaborate',
      get label() {
        return t('vote.types.elaborate')
      },
      iconify: 'fa6-solid:book',
      iconColor: 'text-blue-500',
      barColor: 'bg-blue-500',
    },
    {
      value: 'funny',
      get label() {
        return t('vote.types.funny')
      },
      iconify: 'fa6-solid:face-laugh',
      iconColor: 'text-green-500',
      barColor: 'bg-green-500',
    },
  ]

  const negativeVoteTypes = [
    {
      value: 'incomplete',
      get label() {
        return t('vote.types.incomplete')
      },
      iconify: 'fa6-solid:scissors',
      iconColor: 'text-orange-500',
      barColor: 'bg-orange-500',
    },
    {
      value: 'irrelevant',
      get label() {
        return t('vote.types.irrelevant')
      },
      iconify: 'fa6-solid:ban',
      iconColor: 'text-gray-500',
      barColor: 'bg-gray-500',
    },
    {
      value: 'false',
      get label() {
        return t('vote.types.false')
      },
      iconify: 'fa6-solid:circle-xmark',
      iconColor: 'text-red-500',
      barColor: 'bg-red-500',
    },
    {
      value: 'outofplace',
      get label() {
        return t('vote.types.outofplace')
      },
      iconify: 'fa6-solid:arrow-up-right-from-square',
      iconColor: 'text-pink-500',
      barColor: 'bg-pink-500',
    },
  ]

  const hasVoteData = computed(() => {
    // Check if voteStats exists and contains data
    if (props.voteStats) {
      // If it has vote_types with non-zero values
      if (
        props.voteStats.vote_types &&
        Object.values(props.voteStats.vote_types).some((count) => count !== 0)
      ) {
        return true
      }

      // Si tiene vote_details con elementos
      if (props.voteStats.vote_details && props.voteStats.vote_details.length > 0) {
        return true
      }
    }

    // Verificar voteDetails como fallback
    if (props.voteDetails && Array.isArray(props.voteDetails) && props.voteDetails.length > 0) {
      return true
    }

    return false
  })

  const totalPositiveVotes = computed(() => {
    try {
      // Use vote_stats data if available
      if (props.voteStats && props.voteStats.vote_types) {
        let posCount = 0
        for (const type of positiveVoteTypes) {
          if (type && type.value) {
            const typeCount = props.voteStats.vote_types[type.value] || 0
            if (typeCount > 0) {
              posCount += typeCount
            }
          }
        }
        return posCount
      }

      // Fallback to counting from voteDetails
      if (Array.isArray(props.voteDetails)) {
        return props.voteDetails.filter((vote) => vote.value > 0).length
      }

      return 0
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error calculating positive votes:', error)
      }
      return 0
    }
  })

  const totalNegativeVotes = computed(() => {
    try {
      // Use vote_stats data if available
      if (props.voteStats && props.voteStats.vote_types) {
        let negCount = 0
        for (const type of negativeVoteTypes) {
          if (type && type.value) {
            const typeCount = props.voteStats.vote_types[type.value] || 0
            if (typeCount < 0) {
              negCount += Math.abs(typeCount)
            }
          }
        }
        return negCount
      }

      // Fallback to counting from voteDetails
      if (Array.isArray(props.voteDetails)) {
        return props.voteDetails.filter((vote) => vote.value < 0).length
      }

      return 0
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error calculating negative votes:', error)
      }
      return 0
    }
  })

  const totalVotes = computed(() => {
    return totalPositiveVotes.value + totalNegativeVotes.value
  })

  // Votes without classified type
  const filteredPositiveVoteTypes = computed(() => {
    return positiveVoteTypes.filter(
      (type) => type && type.value && getVoteTypeCount(type.value) > 0
    )
  })

  const filteredNegativeVoteTypes = computed(() => {
    return negativeVoteTypes.filter(
      (type) => type && type.value && getVoteTypeCount(type.value) > 0
    )
  })

  const unclassifiedVotes = computed(() => {
    try {
      if (props.voteStats && props.voteStats.vote_types) {
        // En vote_stats, el valor "unspecified" indica los votos sin clasificar
        return Math.abs(props.voteStats.vote_types?.unspecified || 0)
      }

      if (Array.isArray(props.voteDetails)) {
        return props.voteDetails.filter((vote) => !vote.type).length
      }

      return 0
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error calculating unclassified votes:', error)
      }
      return 0
    }
  })

  function getVoteTypeCount(type) {
    if (!type) return 0

    try {
      if (
        props.voteStats &&
        props.voteStats.vote_types &&
        props.voteStats.vote_types[type] !== undefined
      ) {
        const count = props.voteStats.vote_types[type]
        return Math.abs(count) // Siempre retornamos valor absoluto para mostrar
      }

      if (
        props.voteStats &&
        props.voteStats.vote_details &&
        Array.isArray(props.voteStats.vote_details)
      ) {
        return props.voteStats.vote_details.filter((vote) => vote.type === type).length
      }

      if (props.voteDetails && Array.isArray(props.voteDetails)) {
        return props.voteDetails.filter((vote) => vote.type === type).length
      }

      return 0
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error obteniendo conteo para tipo ${type}:`, error)
      }
      return 0
    }
  }

  function getVoteTypePercentage(type) {
    if (totalVotes.value === 0) return 0

    try {
      const typeCount = getVoteTypeCount(type)
      return Math.round((typeCount / totalVotes.value) * 100)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error calculating percentage for type ${type}:`, error)
      }
      return 0
    }
  }
</script>

<style scoped>
  .vote-stats-progress-bg {
    background-color: var(--color-border-default);
  }
</style>
