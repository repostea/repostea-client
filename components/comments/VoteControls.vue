<template>
  <div class="vote-controls flex items-center">
    <!-- VARIANT: inline (ultra compact - just arrows and number) -->
    <template v-if="variant === 'inline'">
      <div class="vote-inline flex items-center gap-0.5">
        <button
          class="vote-inline-btn p-1 rounded transition-colors touch-manipulation"
          :class="
            localUserVote > 0
              ? 'text-green-500 dark:text-green-400'
              : 'text-text-muted dark:text-text-dark-muted hover:text-green-500'
          "
          :title="t('vote.upvote')"
          :aria-label="t('vote.upvote')"
          @click="handleVoteButtonClick(1)"
        >
          <Icon name="fa6-solid:arrow-up" class="text-sm" aria-hidden="true" />
        </button>
        <span
          v-if="showCount"
          class="vote-inline-count text-xs font-medium min-w-[1.25rem] text-center tabular-nums"
          :class="{
            'text-green-500 dark:text-green-400 font-bold': localUserVote > 0,
            'text-red-500 dark:text-red-400 font-bold': localUserVote < 0,
            'text-text-muted dark:text-text-dark-muted': localUserVote === null,
          }"
        >
          {{ localVotesCount }}
        </span>
        <button
          class="vote-inline-btn p-1 rounded transition-colors touch-manipulation"
          :class="
            localUserVote < 0
              ? 'text-red-500 dark:text-red-400'
              : 'text-text-muted dark:text-text-dark-muted hover:text-red-500'
          "
          :title="t('vote.downvote')"
          :aria-label="t('vote.downvote')"
          @click="handleVoteButtonClick(-1)"
        >
          <Icon name="fa6-solid:arrow-down" class="text-sm" aria-hidden="true" />
        </button>
      </div>
    </template>

    <!-- VARIANT: bar (compact bar with subtle container) -->
    <template v-else-if="variant === 'bar'">
      <div class="vote-bar flex items-center vote-bar-bg rounded-full px-1 py-0.5 gap-0.5">
        <!-- Positive vote type chips (left side) -->
        <template v-if="hasPositiveVoteTypes">
          <div class="vote-bar-chips flex items-center gap-0.5">
            <div
              v-for="(count, type) in positiveVoteTypesFiltered"
              :key="type"
              class="vote-bar-chip flex items-center gap-0.5 px-0.5 py-0.5 rounded text-2xs cursor-default"
              :class="getVoteTypeIconColor(type)"
              :title="t(`vote.types.${type}`)"
            >
              <Icon :name="getVoteTypeIcon(type)" class="text-2xs" aria-hidden="true" />
              <span class="vote-bar-chip-label">{{ t(`vote.types.${type}`) }}</span>
              <span class="font-semibold">{{ count }}</span>
            </div>
          </div>
          <span class="vote-bar-divider w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5" />
        </template>

        <!-- Vote buttons -->
        <button
          class="vote-bar-btn p-1.5 rounded-full transition-colors touch-manipulation"
          :class="
            localUserVote > 0
              ? 'text-green-500 dark:text-green-400 bg-green-500/10'
              : 'text-text-muted dark:text-text-dark-muted hover:text-green-500 hover:bg-green-500/10'
          "
          :title="t('vote.upvote')"
          :aria-label="t('vote.upvote')"
          @click="handleVoteButtonClick(1)"
        >
          <Icon name="fa6-solid:arrow-up" class="text-xs" aria-hidden="true" />
        </button>
        <span
          v-if="showCount"
          class="vote-bar-count text-xs font-semibold min-w-[1.5rem] text-center tabular-nums"
          :class="{
            'text-green-500 dark:text-green-400': localUserVote > 0,
            'text-red-500 dark:text-red-400': localUserVote < 0,
            'text-text-secondary dark:text-text-dark-muted': localUserVote === null,
          }"
        >
          {{ localVotesCount }}
        </span>
        <button
          class="vote-bar-btn p-1.5 rounded-full transition-colors touch-manipulation"
          :class="
            localUserVote < 0
              ? 'text-red-500 dark:text-red-400 bg-red-500/10'
              : 'text-text-muted dark:text-text-dark-muted hover:text-red-500 hover:bg-red-500/10'
          "
          :title="t('vote.downvote')"
          :aria-label="t('vote.downvote')"
          @click="handleVoteButtonClick(-1)"
        >
          <Icon name="fa6-solid:arrow-down" class="text-xs" aria-hidden="true" />
        </button>

        <!-- Negative vote type chips (right side) -->
        <template v-if="hasNegativeVoteTypes">
          <span class="vote-bar-divider w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5" />
          <div class="vote-bar-chips flex items-center gap-0.5">
            <div
              v-for="(count, type) in negativeVoteTypesFiltered"
              :key="type"
              class="vote-bar-chip flex items-center gap-0.5 px-0.5 py-0.5 rounded text-2xs cursor-default"
              :class="getVoteTypeIconColor(type)"
              :title="t(`vote.types.${type}`)"
            >
              <Icon :name="getVoteTypeIcon(type)" class="text-2xs" aria-hidden="true" />
              <span class="vote-bar-chip-label">{{ t(`vote.types.${type}`) }}</span>
              <span class="font-semibold">{{ count }}</span>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- VARIANT: default (original large mobile-friendly version) -->
    <template v-else>
      <div
        class="vote-buttons-container flex items-center border vote-border rounded-md overflow-hidden"
        :class="isMobile ? 'h-11' : 'h-[22px]'"
      >
        <button
          class="vote-button vote-up-button flex items-center justify-center vote-btn-bg transition-colors touch-manipulation"
          :class="[
            {
              'text-green-500 dark:text-green-400': localUserVote > 0,
              'vote-btn-inactive': localUserVote <= 0,
            },
            isMobile ? 'w-11 h-11' : 'w-[22px] h-[22px]',
          ]"
          :title="t('vote.upvote')"
          :aria-label="t('vote.upvote')"
          @click="handleVoteButtonClick(1)"
        >
          <Icon name="fa6-solid:arrow-up" aria-hidden="true" />
        </button>

        <div
          v-if="showCount"
          class="vote-count-display text-center font-medium flex items-center justify-center"
          :class="isMobile ? 'px-2 min-w-[40px] h-11' : 'px-1 min-w-[30px]'"
        >
          <span
            class="vote-count-value"
            :class="[
              {
                'text-green-500 dark:text-green-400': localUserVote > 0,
                'text-red-500 dark:text-red-400': localUserVote < 0,
                'text-gray-500 dark:text-gray-400': localUserVote === null,
              },
              localUserVote !== null ? 'font-bold' : '',
              isMobile ? 'text-sm' : 'text-xs',
            ]"
          >
            {{ localVotesCount }}
          </span>
        </div>

        <button
          class="vote-button vote-down-button flex items-center justify-center vote-btn-bg transition-colors touch-manipulation"
          :class="[
            {
              'text-red-500 dark:text-red-400': localUserVote < 0,
              'vote-btn-inactive': localUserVote >= 0,
            },
            isMobile ? 'w-11 h-11' : 'w-[22px] h-[22px]',
          ]"
          :title="t('vote.downvote')"
          :aria-label="t('vote.downvote')"
          @click="handleVoteButtonClick(-1)"
        >
          <Icon name="fa6-solid:arrow-down" aria-hidden="true" />
        </button>
      </div>
    </template>

    <!-- Vote type indicator (shown for all variants when user has voted) -->
    <div
      v-if="localUserVote !== null && localUserVoteType && variant === 'default'"
      class="vote-type-indicator ml-2"
    >
      <span
        class="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 inline-flex shadow-sm"
        :class="getVoteTypeClass(localUserVote, localUserVoteType)"
      >
        <Icon :name="getVoteTypeIcon(localUserVoteType)" aria-hidden="true" />
        {{ t(`vote.types.${localUserVoteType}`) }}
      </span>
    </div>

    <Teleport to="body">
      <div
        v-if="voteTypeModalVisible"
        class="vote-type-modal-backdrop fixed inset-0 bg-black bg-opacity-50 z-50"
        :class="isMobile ? 'flex items-end' : 'flex items-center justify-center'"
        @click="closeModal"
      >
        <div
          class="vote-type-modal-content vote-modal-bg shadow-xl"
          :class="[
            isMobile
              ? 'w-full rounded-t-xl max-h-[85vh] p-6'
              : 'rounded-lg max-w-md mx-auto p-4 w-[90%] md:w-[400px]',
          ]"
          @click.stop
        >
          <div class="flex justify-between items-center mb-3 border-b vote-border pb-2">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {{ voteDirection > 0 ? t('vote.positive_vote') : t('vote.negative_vote') }}
            </h3>
            <button
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              :aria-label="t('common.close')"
              @click="closeModal"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {{ t('vote.select_reason') }}
            <span class="text-xs italic block mt-1">{{ t('vote.reason_help_text') }}</span>
          </p>

          <div
            v-if="voteDirection === 1"
            class="grid gap-3 mb-4"
            :class="isMobile ? 'grid-cols-1' : 'grid-cols-2'"
          >
            <button
              v-for="type in positiveVoteTypes"
              :key="type.value"
              class="vote-type-button rounded-lg flex items-center justify-center gap-3 border vote-border hover:border-green-400 dark:hover:border-green-500 transition-all touch-manipulation"
              :class="[
                {
                  'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-500':
                    localUserVoteType === type.value && localUserVote > 0,
                },
                isMobile ? 'px-4 py-4 flex-row text-left' : 'px-3 py-3 flex-col',
              ]"
              @click="vote(1, type.value)"
            >
              <Icon
                :name="type.icon"
                :class="[type.color, isMobile ? 'text-lg' : 'text-xl']"
                aria-hidden="true"
              />
              <span :class="isMobile ? 'text-base font-medium' : 'text-sm'">{{
                t(`vote.types.${type.value}`)
              }}</span>
            </button>
          </div>

          <div
            v-if="voteDirection === -1"
            class="grid gap-3 mb-4"
            :class="isMobile ? 'grid-cols-1' : 'grid-cols-2'"
          >
            <button
              v-for="type in negativeVoteTypes"
              :key="type.value"
              class="vote-type-button rounded-lg flex items-center justify-center gap-3 border vote-border hover:border-red-400 dark:hover:border-red-500 transition-all touch-manipulation"
              :class="[
                {
                  'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-500':
                    localUserVoteType === type.value && localUserVote < 0,
                },
                isMobile ? 'px-4 py-4 flex-row text-left' : 'px-3 py-3 flex-col',
              ]"
              @click="vote(-1, type.value)"
            >
              <Icon
                :name="type.icon"
                :class="[type.color, isMobile ? 'text-lg' : 'text-xl']"
                aria-hidden="true"
              />
              <span :class="isMobile ? 'text-base font-medium' : 'text-sm'">{{
                t(`vote.types.${type.value}`)
              }}</span>
            </button>
          </div>

          <div
            class="pt-4 border-t vote-border"
            :class="isMobile ? 'flex flex-col gap-3' : 'flex justify-between'"
          >
            <div
              class="text-gray-500 dark:text-gray-400 flex items-center"
              :class="isMobile ? 'text-sm' : 'text-xs'"
            >
              {{ t('vote.will_appear_in_summary') }}
            </div>
            <button
              class="rounded-md border vote-border vote-modal-cancel-btn transition-colors touch-manipulation"
              :class="isMobile ? 'px-6 py-3 text-base w-full' : 'px-4 py-2'"
              @click="closeModal"
            >
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useCommentsStore } from '~/stores/comments'
  import { useI18n } from '#i18n'

  import { useNotification } from '~/composables/useNotification'
  import { useMobileDetection } from '~/composables/useMobileDetection'

  const { t } = useI18n()
  const { success, error, warning, info } = useNotification()

  const props = defineProps({
    itemId: {
      type: [Number, String],
      required: true,
    },
    votesCount: {
      type: Number,
      default: 0,
    },
    userVote: {
      type: Number,
      default: null,
    },
    userVoteType: {
      type: String,
      default: null,
    },
    itemType: {
      type: String,
      default: 'comment',
      validator: (value) => ['comment', 'post', 'reply', 'agora'].includes(value),
    },
    showCount: {
      type: Boolean,
      default: true,
    },
    minKarmaToDownvote: {
      type: Number,
      default: 8,
    },
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'inline', 'bar'].includes(value),
    },
    voteTypeSummary: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['voted'])
  const authStore = useAuthStore()
  const commentsStore = useCommentsStore()
  const { isMobile } = useMobileDetection()
  const isVoting = ref(false)
  const voteTypeModalVisible = ref(false)
  const voteDirection = ref(0)

  const localUserVote = ref(props.userVote)
  const localUserVoteType = ref(props.userVoteType)
  const localVotesCount = ref(props.votesCount)

  watch(
    () => props.userVote,
    (newValue) => {
      localUserVote.value = newValue
    }
  )

  watch(
    () => props.userVoteType,
    (newValue) => {
      localUserVoteType.value = newValue
    }
  )

  watch(
    () => props.votesCount,
    (newValue) => {
      localVotesCount.value = newValue
    }
  )

  // Positive vote type keys
  const positiveTypeKeys = ['didactic', 'interesting', 'elaborate', 'funny']
  // Negative vote type keys
  const negativeTypeKeys = ['incomplete', 'irrelevant', 'false', 'outofplace']

  // Filter positive vote types from summary
  const positiveVoteTypesFiltered = computed(() => {
    if (!props.voteTypeSummary) return {}
    const result = {}
    for (const key of positiveTypeKeys) {
      if (props.voteTypeSummary[key] && props.voteTypeSummary[key] !== 0) {
        result[key] = props.voteTypeSummary[key]
      }
    }
    return result
  })

  // Filter negative vote types from summary
  const negativeVoteTypesFiltered = computed(() => {
    if (!props.voteTypeSummary) return {}
    const result = {}
    for (const key of negativeTypeKeys) {
      if (props.voteTypeSummary[key] && props.voteTypeSummary[key] !== 0) {
        result[key] = props.voteTypeSummary[key]
      }
    }
    return result
  })

  // Check if there are any positive/negative vote types
  const hasPositiveVoteTypes = computed(
    () => Object.keys(positiveVoteTypesFiltered.value).length > 0
  )
  const hasNegativeVoteTypes = computed(
    () => Object.keys(negativeVoteTypesFiltered.value).length > 0
  )

  const positiveVoteTypes = [
    {
      value: 'didactic',
      icon: 'fa6-solid:graduation-cap',
      color: 'text-yellow-400',
      description: 'Educativo',
    },
    {
      value: 'interesting',
      icon: 'fa6-solid:brain',
      color: 'text-purple-400',
      description: 'Interesante',
    },
    {
      value: 'elaborate',
      icon: 'fa6-solid:book',
      color: 'text-blue-400',
      description: 'Detallado',
    },
    {
      value: 'funny',
      icon: 'fa6-solid:face-laugh',
      color: 'text-green-400',
      description: 'Divertido',
    },
  ]

  const negativeVoteTypes = [
    {
      value: 'incomplete',
      icon: 'fa6-solid:scissors',
      color: 'text-orange-400',
      description: 'Incompleto',
    },
    {
      value: 'irrelevant',
      icon: 'fa6-solid:ban',
      color: 'text-gray-400',
      description: 'Irrelevante',
    },
    {
      value: 'false',
      icon: 'fa6-solid:circle-xmark',
      color: 'text-red-400',
      description: 'Incorrecto',
    },
    {
      value: 'outofplace',
      icon: 'fa6-solid:arrow-up-right-from-square',
      color: 'text-pink-400',
      description: 'Fuera de lugar',
    },
  ]

  function handleVoteButtonClick(direction) {
    if (!authStore.isAuthenticated) {
      info(t('comments.vote_login_required'))
      return
    }
    showVoteTypeModal(direction)
  }

  function showVoteTypeModal(direction) {
    voteDirection.value = direction
    voteTypeModalVisible.value = true

    const scrollY = window.scrollY

    if (import.meta.client) {
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.overflow = 'hidden'
      document.body.style.width = '100%'
    }
  }

  function closeModal() {
    voteTypeModalVisible.value = false

    if (import.meta.client) {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.overflow = ''
      document.body.style.width = ''

      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
  }

  function getVoteTypeIcon(type) {
    const allTypes = [...positiveVoteTypes, ...negativeVoteTypes]
    const foundType = allTypes.find((t) => t.value === type)
    return foundType ? foundType.icon : 'fa6-solid:circle'
  }

  function getVoteTypeClass(vote, type) {
    const allTypes = [...positiveVoteTypes, ...negativeVoteTypes]
    const foundType = allTypes.find((t) => t.value === type)

    if (foundType) {
      const typeValue = foundType.value

      switch (typeValue) {
        case 'didactic':
          return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
        case 'interesting':
          return 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
        case 'elaborate':
          return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
        case 'funny':
          return 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300'
        case 'false':
          return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
        case 'incomplete':
          return 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'
        case 'irrelevant':
          return 'bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300'
        case 'outofplace':
          return 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300'
        default:
          return vote > 0
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }
    } else {
      return vote > 0
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

  function getVoteTypeIconColor(type) {
    switch (type) {
      case 'didactic':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'interesting':
        return 'text-purple-600 dark:text-purple-400'
      case 'elaborate':
        return 'text-blue-600 dark:text-blue-400'
      case 'funny':
        return 'text-green-600 dark:text-green-400'
      case 'false':
        return 'text-red-600 dark:text-red-400'
      case 'incomplete':
        return 'text-orange-600 dark:text-orange-400'
      case 'irrelevant':
        return 'text-gray-600 dark:text-gray-400'
      case 'outofplace':
        return 'text-pink-600 dark:text-pink-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  async function vote(value, voteType = null) {
    if (isVoting.value) return

    isVoting.value = true
    closeModal()

    try {
      if (value !== 0) {
        const oldValue = localUserVote.value || 0
        const oldType = localUserVoteType.value

        // If already voted with same type, toggle (remove vote)
        if (oldValue === value && oldType === voteType) {
          // Call unvote instead of voting again
          vote(0)
          return
        }

        // Send vote to server and wait for response
        if (props.itemType === 'comment') {
          try {
            const response = await commentsStore.voteComment(props.itemId, value, voteType)

            // Update with server data
            if (response && response.stats) {
              localVotesCount.value = response.stats.votes_count || 0
              localUserVote.value = response.user_vote
              localUserVoteType.value = response.user_vote_type
            }

            // Emit event after receiving server response
            emit('voted', {
              itemId: props.itemId,
              itemType: props.itemType,
              value: value,
              voteType: voteType,
              previousVoteValue: oldValue,
              previousVoteType: oldType,
              skipRefresh: false,
            })

            // Show success feedback
            if (authStore.user?.is_guest) {
              success(t('comments.vote_success_anonymous'))
            } else {
              success(t('comments.vote_success'))
            }
          } catch (err) {
            // Show error feedback (skip if interceptor already showed it)
            if (!err._interceptorWillNotify) {
              const errorMessage = err.response?.data?.message
              if (err.response?.status === 401) {
                warning(t('comments.vote_login_required'))
              } else if (err.response?.status === 429) {
                warning(t('comments.vote_rate_limit'))
              } else if (errorMessage && errorMessage.includes('already voted')) {
                info(t('comments.vote_already_voted'))
              } else {
                error(errorMessage || t('comments.vote_error'))
              }
            }
          }
        } else if (props.itemType === 'agora') {
          try {
            const { $api } = useNuxtApp()
            const response = await $api.agora.voteMessage(props.itemId, value, voteType)

            // Update with server data
            if (response && response.data) {
              localVotesCount.value = response.data.votes_count || 0
              localUserVote.value = response.data.user_vote
              localUserVoteType.value = response.data.user_vote_type
            }

            // Emit event after receiving server response
            emit('voted', {
              itemId: props.itemId,
              itemType: props.itemType,
              value: value,
              voteType: voteType,
              previousVoteValue: oldValue,
              previousVoteType: oldType,
              skipRefresh: false,
            })

            // Show success feedback
            success(t('agora.vote_success'))
          } catch (err) {
            // Show error feedback (skip if interceptor already showed it)
            if (!err._interceptorWillNotify) {
              const errorMessage = err.response?.data?.message
              if (err.response?.status === 401) {
                warning(t('agora.vote_login_required'))
              } else if (err.response?.status === 429) {
                warning(t('agora.vote_rate_limit'))
              } else {
                error(errorMessage || t('agora.vote_error'))
              }
            }
          }
        }
      } else {
        const oldValue = localUserVote.value || 0
        const oldType = localUserVoteType.value

        // Send unvote to server and wait for response
        if (props.itemType === 'comment') {
          try {
            const response = await commentsStore.unvoteComment(props.itemId)

            // Update with server data
            if (response && response.stats) {
              localVotesCount.value = response.stats.votes_count || 0
            }
            localUserVote.value = null
            localUserVoteType.value = null

            // Emit event after receiving server response
            emit('voted', {
              itemId: props.itemId,
              itemType: props.itemType,
              value: value,
              voteType: null,
              previousVoteValue: oldValue,
              previousVoteType: oldType,
              skipRefresh: false,
            })
          } catch (error) {
            console.error(`Error unvoting on ${props.itemType}:`, error)
          }
        } else if (props.itemType === 'agora') {
          try {
            const { $api } = useNuxtApp()
            const response = await $api.agora.unvoteMessage(props.itemId)

            // Update with server data
            if (response && response.data) {
              localVotesCount.value = response.data.votes_count || 0
            }
            localUserVote.value = null
            localUserVoteType.value = null

            // Emit event after receiving server response
            emit('voted', {
              itemId: props.itemId,
              itemType: props.itemType,
              value: value,
              voteType: null,
              previousVoteValue: oldValue,
              previousVoteType: oldType,
              skipRefresh: false,
            })
          } catch (error) {
            console.error(`Error unvoting on ${props.itemType}:`, error)
          }
        }
      }
    } catch (error) {
      console.error(`Error voting on ${props.itemType}:`, error)
    } finally {
      isVoting.value = false
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      const handleEscape = (e) => {
        if (e.key === 'Escape' && voteTypeModalVisible.value) {
          closeModal()
        }
      }

      document.addEventListener('keydown', handleEscape)

      onBeforeUnmount(() => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      })
    }
  })
</script>

<style scoped>
  .vote-button {
    transition: all 0.2s ease;
  }

  .vote-button:hover {
    opacity: 0.9;
  }

  .vote-count-value {
    transition: all 0.2s ease;
  }

  .vote-buttons-container {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .vote-type-modal-backdrop {
    animation: fadeIn 0.2s ease;
    backdrop-filter: blur(2px);
  }

  .vote-type-modal-content {
    animation: slideUp 0.3s ease;
    overflow-y: auto;
  }

  @media (min-width: 768px) {
    .vote-type-modal-content {
      animation: scaleIn 0.2s ease;
      max-height: 90vh;
    }
  }

  .vote-type-button {
    transition: all 0.15s ease;
    background-color: var(--color-bg-subtle);
    min-height: 44px; /* Ensure touch target size */
  }

  .vote-type-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* Mobile-specific animations */
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .vote-type-indicator span {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    animation: fadeInRight 0.3s ease;
    height: 20px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes fadeInRight {
    from {
      transform: translateX(5px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .text-2xs {
    font-size: 0.65rem;
    line-height: 1rem;
  }

  .vote-border {
    border-color: var(--color-border-default);
  }

  .vote-btn-bg {
    background-color: var(--color-bg-subtle);
  }

  .vote-modal-bg {
    background-color: var(--color-bg-card);
  }

  .vote-btn-inactive {
    color: var(--color-text-muted);
  }

  .vote-btn-inactive:hover {
    background-color: var(--color-bg-hover);
  }

  .vote-modal-cancel-btn {
    color: var(--color-text-secondary);
  }

  .vote-modal-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  /* Inline variant styles */
  .vote-inline-btn {
    min-width: 28px;
    min-height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vote-inline-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .vote-inline-btn:active {
    transform: scale(0.95);
  }

  /* Bar variant styles */
  .vote-bar-bg {
    background-color: white;
    border: 1px solid var(--color-border-default);
  }

  :root.dark .vote-bar-bg {
    background-color: var(--color-bg-input);
  }

  .vote-bar-btn {
    min-width: 26px;
    min-height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vote-bar-btn:active {
    transform: scale(0.9);
  }

  /* Bar chip styles */
  .vote-bar-chip {
    font-size: 0.6rem;
    line-height: 1;
    transition: all 0.15s ease;
  }

  .vote-bar-chip:hover {
    background-color: var(--color-bg-hover);
  }

  .vote-bar-chip-label {
    max-width: 0;
    overflow: hidden;
    white-space: nowrap;
    opacity: 0;
    transition:
      max-width 0.2s ease,
      opacity 0.15s ease,
      margin 0.2s ease;
    margin-left: 0;
    margin-right: 0;
  }

  .vote-bar-chip:hover .vote-bar-chip-label {
    max-width: 70px;
    opacity: 1;
    margin-left: 0.125rem;
    margin-right: 0.125rem;
  }

  .text-2xs {
    font-size: 0.65rem;
    line-height: 1rem;
  }
</style>
