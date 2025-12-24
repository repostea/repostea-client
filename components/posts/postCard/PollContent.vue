<template>
  <div class="poll-content flex justify-center">
    <div class="poll-card w-full">
      <div
        v-if="content"
        class="mb-3 text-sm prose dark:prose-invert max-w-none prose-p:my-2"
        v-html="renderedContent"
      />

      <div v-if="loading" class="flex justify-center py-8">
        <div
          class="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"
        />
      </div>

      <template v-else>
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div class="flex items-start">
            <Icon name="fa6-solid:circle-exclamation" class="text-red-500 mt-0.5 mr-2" aria-hidden="true" />
            <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
          </div>
        </div>

      <div class="poll-options max-w-lg mx-auto">
        <!-- Voting interface -->
        <div v-if="!showResults" class="space-y-3">
          <div
            v-for="(option, index) in pollResults.options"
            :key="option.id"
            class="poll-option-card group"
          >
            <button
              v-if="!pollExpired && !userHasVoted"
              class="poll-option-button w-full text-left"
              :class="{ 'poll-option-selected': userVotes.includes(option.id) }"
              @click="vote(option.id)"
            >
              <div class="flex items-center">
                <div class="poll-radio mr-4 flex-shrink-0">
                  <div class="poll-radio-inner" :class="{ 'poll-radio-checked': userVotes.includes(option.id) }">
                    <Icon name="fa6-solid:check" :class="userVotes.includes(option.id) ? 'text-white' : 'text-white'" class="text-xs" aria-hidden="true" />
                  </div>
                </div>
                <div class="flex-grow">
                  <span class="font-medium text-xs text-gray-900 dark:text-gray-100">
                    <span class="text-gray-700 dark:text-gray-300">{{ getOptionLetter(index) }})</span>
                    {{ option.text }}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Results view - Pie Chart -->
        <div v-if="showResults" class="py-3">
          <!-- Title -->
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ t('polls.results_title') }}</h3>

          <div class="flex flex-col gap-4 items-center">
            <!-- Pie chart SVG -->
            <div class="flex-shrink-0">
              <svg viewBox="0 0 200 200" class="w-40 h-40 lg:w-48 lg:h-48" role="img" :aria-label="t('polls.chart_aria_label')">
                <circle cx="100" cy="100" r="90" fill="transparent" />
                <!-- Pie slices -->
                <g v-for="(segment, index) in pieChartSegments" :key="'slice-' + index" class="transform -rotate-90 origin-center">
                  <path
                    :d="describePieSlice(100, 100, 80, segment.startAngle, segment.startAngle + segment.angle)"
                    :fill="segment.color"
                    stroke="#ffffff"
                    stroke-width="2"
                    class="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  />
                </g>
                <!-- Percentage labels -->
                <g v-for="(segment, index) in pieChartSegments" :key="'label-' + index">
                  <text
                    v-if="segment.percentage >= 8"
                    :x="getLabelPosition(segment).x"
                    :y="getLabelPosition(segment).y"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="text-xs font-bold fill-white pointer-events-none"
                    style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5)"
                  >
                    {{ segment.percentage }}%
                  </text>
                </g>
              </svg>
            </div>

            <!-- Legend -->
            <div class="w-full space-y-1.5">
              <div
                v-for="(segment, index) in pieChartSegments"
                :key="segment.id"
                class="border poll-border rounded-md overflow-hidden"
              >
                <div class="flex items-center">
                  <div class="flex-1 p-2 poll-legend-bg flex items-center gap-1.5">
                    <div
                      class="w-10 h-7 rounded flex items-center justify-center flex-shrink-0"
                      :style="{ backgroundColor: segment.color }"
                    >
                      <span class="text-xs font-bold text-white" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5)">
                        {{ segment.percentage }}%
                      </span>
                    </div>
                    <span class="font-medium text-xs text-gray-900 dark:text-gray-100 leading-tight">
                      <span class="font-bold text-gray-700 dark:text-gray-300">{{ getOptionLetter(index) }})</span>
                      {{ segment.text }}
                    </span>
                  </div>
                  <div class="px-2.5 py-2 poll-stats-bg border-l poll-border flex-shrink-0">
                    <div class="text-xs text-gray-700 dark:text-gray-300 font-bold">{{ segment.votes }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Time remaining - always visible and discrete -->
        <div v-if="timeLeft && !pollExpired" class="mt-5 mb-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <Icon name="fa6-solid:hourglass-half" class="mr-1.5" aria-hidden="true" />
          <span>{{ t('polls.time_left') }}: {{ timeLeft }}</span>
        </div>

        <div v-if="pollExpired" class="mt-5 mb-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <Icon name="fa6-solid:clock" class="mr-1.5" aria-hidden="true" />
          <span>{{ t('polls.expired') }}</span>
        </div>

        <div v-if="showResults" class="mt-6 pt-4 border-t poll-border">
          <div class="flex items-center text-gray-600 dark:text-gray-400 text-sm">
            <Icon name="fa6-solid:users" class="mr-2" aria-hidden="true" />
            <span class="font-medium">{{ t('polls.total_votes', { count: pollResults.total_votes }) }}</span>
          </div>
          <!-- Multiple options allowed indicator -->
          <div v-if="pollResults.allow_multiple_options" class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Icon name="fa6-solid:layer-group" class="mr-1.5" aria-hidden="true" />
            {{ t('polls.multiple_options_allowed') }}
          </div>
          <!-- User vote indicator below total votes -->
          <div v-if="userVotes.length > 0" class="mt-2 text-xs text-green-600 dark:text-green-400 font-medium flex items-center">
            <Icon name="fa6-solid:check" class="mr-1" aria-hidden="true" />
            <template v-if="userVotes.length === 1">
              {{ t('polls.you_voted_option', { option: getUserVotedLetters() }) }}
            </template>
            <template v-else>
              {{ t('polls.you_voted_options', { options: getUserVotedLetters() }) }}
            </template>
          </div>
        </div>

        <div class="mt-6 mb-8 flex flex-wrap gap-3 justify-center">
          <button
            v-if="!pollExpired && !userHasVoted && !showResults && userVotes.length > 0"
            class="poll-button poll-button-primary"
            @click="submitVote"
          >
            <Icon name="fa6-solid:circle-check" class="mr-2" aria-hidden="true" />
            {{ t('polls.submit_vote') }}
          </button>

          <button
            v-if="!showResults && (userHasVoted || pollExpired)"
            class="poll-button poll-button-secondary"
            @click="showResults = true"
          >
            <Icon name="fa6-solid:chart-bar" class="mr-2" aria-hidden="true" />
            {{ t('polls.show_results') }}
          </button>

          <button
            v-if="showResults && !pollExpired && !userHasVoted"
            class="poll-button poll-button-secondary"
            @click="showResults = false"
          >
            <Icon name="fa6-solid:arrow-left" class="mr-2" aria-hidden="true" />
            {{ t('polls.back_to_vote') }}
          </button>

          <button
            v-if="showResults && !pollExpired && userHasVoted"
            class="text-xs text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light hover:underline transition-colors flex items-center"
            @click="removeVote"
          >
            <Icon name="fa6-solid:rotate-left" class="mr-1.5 text-xs" aria-hidden="true" />
            {{ t('polls.remove_vote') }}
          </button>
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { marked } from 'marked'
  import { configureMarked, RESTRICTED_SANITIZE_CONFIG } from '~/utils/markdown'
  import DOMPurify from 'dompurify'
  import { useI18n } from '#i18n'
  import { useNuxtApp } from '#app'
  import { useAuthStore } from '~/stores/auth'

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
  })

  const { t } = useI18n()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()


  const loading = ref(true)
  const error = ref(null)
  const pollResults = ref({
    success: false,
    total_votes: 0,
    options: [],
    expired: false,
    expires_at: null,
    allow_multiple_options: false,
  })
  const userVotes = ref([])
  const userHasVoted = ref(false)
  const showResults = ref(false)
  const timeLeft = ref('')
  let timeInterval = null

  const renderedContent = computed(() => {
    if (!props.content) return ''
    configureMarked()
    const rawHtml = marked.parse(props.content)
    // Only sanitize on client side (DOMPurify requires DOM)
    // Use restricted config: no images/GIFs allowed in descriptions
    if (import.meta.client) {
      return DOMPurify.sanitize(rawHtml, RESTRICTED_SANITIZE_CONFIG)
    }
    // During SSR, return unsanitized (safe because it's only rendered server-side)
    return rawHtml
  })

  const pollExpired = computed(() => {
    return pollResults.value.expired
  })

  // Calculate pie chart segments
  const pieChartSegments = computed(() => {
    if (!pollResults.value.options || pollResults.value.options.length === 0) {
      return []
    }

    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ]

    let currentAngle = 0
    return pollResults.value.options.map((option, index) => {
      const percentage = option.percentage || 0
      const angle = (percentage / 100) * 360
      const startAngle = currentAngle
      currentAngle += angle

      return {
        ...option,
        color: colors[index % colors.length],
        startAngle,
        angle,
        isUserVote: userVotes.value.includes(option.id)
      }
    })
  })

  // Function to convert index to letter (0 -> A, 1 -> B, etc.)
  function getOptionLetter(index) {
    return String.fromCharCode(65 + index) // 65 is ASCII for 'A'
  }

  // Function to get letters of voted options
  function getUserVotedLetters() {
    const letters = pollResults.value.options
      .map((option, index) => userVotes.value.includes(option.id) ? getOptionLetter(index) : null)
      .filter(letter => letter !== null)

    if (letters.length === 1) {
      return letters[0]
    } else if (letters.length === 2) {
      return letters.join(' y ')
    } else if (letters.length > 2) {
      return letters.slice(0, -1).join(', ') + ' y ' + letters[letters.length - 1]
    }
    return ''
  }

  // Function to create SVG path for pie slice
  function describePieSlice(x, y, radius, startAngle, endAngle) {
    // Special case: if angle is 360 degrees (full circle), draw a circle instead of arc
    const angle = endAngle - startAngle
    if (angle >= 359.99) {
      // Return a circle path instead of arc
      return `M ${x} ${y} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`
    }

    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = angle <= 180 ? '0' : '1'

    return [
      'M', x, y,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ')
  }

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  // Calculate label position for percentage text in pie chart
  function getLabelPosition(segment) {
    const centerX = 100
    const centerY = 100
    const radius = 50 // Position labels at 50% of the radius (closer to center)

    // Calculate the middle angle of the segment
    const middleAngle = segment.startAngle + (segment.angle / 2) - 90 // -90 to adjust for rotation
    const angleInRadians = (middleAngle * Math.PI) / 180.0

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  function updateTimeLeft() {
    if (!pollResults.value.expires_at || pollResults.value.expired) {
      timeLeft.value = ''
      return
    }

    const now = new Date()
    const expiresAt = new Date(pollResults.value.expires_at)
    const diff = expiresAt - now

    if (diff <= 0) {
      timeLeft.value = ''
      pollResults.value.expired = true
      if (timeInterval) {
        clearInterval(timeInterval)
        timeInterval = null
      }
      return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) {
      timeLeft.value = `${days} ${t('polls.days')}, ${hours} ${t('polls.hours')}`
    } else if (hours > 0) {
      timeLeft.value = `${hours} ${t('polls.hours')}, ${minutes} ${t('polls.minutes')}`
    } else if (minutes > 0) {
      timeLeft.value = `${minutes} ${t('polls.minutes')}, ${seconds} ${t('polls.seconds')}`
    } else if (seconds > 0) {
      timeLeft.value = `${seconds} ${t('polls.seconds')}`
    } else {
      timeLeft.value = t('polls.less_than_minute')
    }
  }

  onMounted(async () => {
    await loadPollResults()
    if (pollResults.value.expires_at && !pollResults.value.expired) {
      updateTimeLeft()
      timeInterval = setInterval(updateTimeLeft, 1000)
    }
  })

  onUnmounted(() => {
    if (timeInterval) {
      clearInterval(timeInterval)
      timeInterval = null
    }
  })

  async function loadPollResults() {
    loading.value = true
    error.value = null

    try {
      // Always fetch from API to get user vote status and real-time results
      if ($api && $api.polls) {
        const response = await $api.polls.getResults(props.post.id)
        pollResults.value = response.data

        // Set user votes from API response
        userHasVoted.value = response.data.user_has_voted || false
        if (response.data.user_votes && response.data.user_votes.length > 0) {
          userVotes.value = response.data.user_votes
        }

        // If user has voted or poll is expired, show results by default
        if (userHasVoted.value || pollResults.value.expired) {
          showResults.value = true
        }
      }
    } catch (err) {
      console.error('Error loading poll results:', err)
      error.value = t('polls.load_error')
    } finally {
      loading.value = false
    }
  }

  function vote(optionId) {
    // If multiple options are not allowed, clear previous votes
    if (!pollResults.value.allow_multiple_options) {
      userVotes.value = []
    }

    // Toggle vote
    const index = userVotes.value.indexOf(optionId)
    if (index === -1) {
      userVotes.value.push(optionId)
    } else {
      userVotes.value.splice(index, 1)
    }
  }

  async function submitVote() {
    if (userVotes.value.length === 0) return

    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      error.value = t('polls.login_required')
      return
    }

    loading.value = true
    error.value = null

    try {
      // Submit votes one by one
      for (const optionId of userVotes.value) {
        await $api.polls.vote(props.post.id, optionId)
      }

      // Reload poll results
      await loadPollResults()
      showResults.value = true
    } catch (err) {
      console.error('Error submitting vote:', err)
      error.value = err.response?.data?.message || t('polls.vote_error')
    } finally {
      loading.value = false
    }
  }

  async function removeVote() {
    if (!authStore.isAuthenticated) {
      error.value = t('polls.login_required')
      return
    }

    loading.value = true
    error.value = null

    try {
      // Remove all votes for this poll
      await $api.polls.removeVote(props.post.id)

      // Reload poll results
      await loadPollResults()
      userHasVoted.value = false
      showResults.value = false
    } catch (err) {
      console.error('Error removing vote:', err)
      error.value = err.response?.data?.message || t('polls.remove_vote_error')
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
.poll-option-card {
  @apply relative overflow-hidden rounded-lg transition-all duration-200;
  border: 1px solid var(--color-border-default);
}

.poll-border {
  border-color: var(--color-border-default);
}

.poll-legend-bg {
  background-color: var(--color-bg-card);
}

.poll-stats-bg {
  background-color: var(--color-bg-subtle);
}

.poll-option-button {
  @apply p-4 transition-all duration-200 hover:border-primary;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
}

.poll-option-button:hover {
  background-color: var(--color-bg-hover);
}

.poll-option-selected {
  border-color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

:global(.dark) .poll-option-selected {
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.poll-radio {
  @apply w-6 h-6 rounded-full border-2 transition-all duration-200;
  @apply flex items-center justify-center;
  border-color: var(--color-border-strong);
}

.poll-option-button:hover .poll-radio {
  @apply border-primary dark:border-primary scale-110;
}

.poll-radio-inner {
  @apply w-full h-full rounded-full flex items-center justify-center transition-all duration-200;
}

.poll-radio-checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  transform: scale(1);
}

.poll-option-result {
  @apply p-4 transition-all duration-200;
}

.poll-option-user-voted {
  background-color: rgba(var(--color-primary-rgb), 0.05);
  border-color: rgba(var(--color-primary-rgb), 0.5);
}

.dark .poll-option-user-voted {
  background-color: rgba(var(--color-primary-rgb), 0.1);
}

.poll-progress-bar-container {
  @apply relative h-6 rounded-full overflow-hidden;
  background-color: var(--color-bg-subtle);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.poll-progress-bar {
  @apply relative h-full transition-all duration-1000 ease-out;
  background: linear-gradient(135deg,
    var(--color-primary) 0%,
    var(--color-primary-dark) 100%);
  border-radius: 9999px;
  position: relative;
  overflow: hidden;
}

.poll-progress-bar-voted {
  background: linear-gradient(135deg,
    #10b981 0%,
    #059669 100%);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.poll-progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.poll-button {
  @apply px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200;
  @apply flex items-center justify-center;
  @apply focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-gray-900;
  @apply shadow-sm hover:shadow-md;
}

.poll-button-primary {
  background-color: var(--color-primary);
  color: var(--color-btn-primary-text);
}

.poll-button-primary:hover {
  background-color: var(--color-primary-dark);
}

.poll-button-primary:focus {
  --tw-ring-color: var(--color-primary);
}

.poll-button-danger {
  @apply bg-red-500 hover:bg-red-600 text-white;
  @apply focus:ring-red-500;
}

.poll-button-secondary {
  @apply text-gray-700 dark:text-gray-200;
  @apply focus:ring-gray-500;
  background-color: var(--color-bg-subtle);
  border: 1px solid var(--color-border-default);
}

.poll-button-secondary:hover {
  background-color: var(--color-bg-hover);
}

.poll-option-card:hover {
  @apply shadow-md transform scale-[1.01];
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.poll-option-card {
  animation: slideIn 0.3s ease-out;
}

.poll-option-card:nth-child(2) {
  animation-delay: 0.05s;
}

.poll-option-card:nth-child(3) {
  animation-delay: 0.1s;
}

.poll-option-card:nth-child(4) {
  animation-delay: 0.15s;
}

.poll-option-card:nth-child(5) {
  animation-delay: 0.2s;
}
</style>
