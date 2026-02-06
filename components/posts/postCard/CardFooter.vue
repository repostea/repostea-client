<template>
  <div class="card-footer rounded-b-lg">
    <NuxtLink
      v-if="!hideComments"
      :to="localePath(`/posts/${postSlug || postId}`)"
      class="comments-engagement-link group block w-full py-3 mb-3 transition-all duration-200"
      :aria-label="`${commentsCount || 0} ${t('common.comments')}`"
      :style="[
        commentLevelStyle,
        {
          marginLeft: '-1rem',
          marginRight: '-1rem',
          marginTop: '-0.5rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          width: 'calc(100% + 2rem)',
        },
      ]"
    >
      <div class="flex items-center gap-2 float-left">
        <span class="comment-count text-sm" :class="{ 'realtime-update': commentsAnimating }">{{
          commentsCount || 0
        }}</span>
        <span class="comment-label text-sm">{{
          commentsCount === 1 ? t('common.comment') : t('common.comments')
        }}</span>
        <span v-if="newCommentsCount > 0" class="new-comments-badge text-xs font-medium">
          {{ newCommentsCount }}
          {{ newCommentsCount === 1 ? t('posts.new_singular') : t('posts.new_plural') }}
        </span>
      </div>
      <div class="flex items-center gap-2 float-right">
        <span class="cta-message text-sm font-medium">
          {{ getCommentsCTA(commentsCount) }}
        </span>
        <Icon
          name="fa6-solid:arrow-right"
          class="text-sm opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
          aria-hidden="true"
        />
      </div>
      <div class="clear-both" />
    </NuxtLink>

    <div class="flex flex-wrap justify-between items-center text-xs gap-3 pr-0">
      <div class="flex items-center gap-3">
        <div class="relative">
          <button
            ref="dateButtonRef"
            type="button"
            class="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
            @click="toggleDatePopover"
          >
            <Icon name="fa6-solid:clock" class="mr-1" aria-hidden="true" />
            {{ formatDate(primaryDate) }}
            <span v-if="showPublishedIndicator" class="date-secondary ml-1"
              >({{ t('posts.pub_short') }} {{ publishedDateFormatted }})</span
            >
          </button>
          <Teleport to="body">
            <div
              v-if="showDatePopover"
              ref="datePopoverContentRef"
              class="date-popover fixed z-[9999] rounded-lg shadow-lg p-3 min-w-[200px] text-xs"
              :style="popoverStyle"
            >
              <div v-if="publishedAt" class="mb-2">
                <div class="font-medium popover-label">{{ t('posts.published_label') }}</div>
                <div class="popover-value">{{ formatDateFull(publishedAt) }}</div>
              </div>
              <div
                v-if="frontpageAt"
                :class="{ 'mb-2': !publishedAt && !frontpageAt && createdAt }"
              >
                <div class="font-medium popover-label">{{ t('posts.frontpage_label') }}</div>
                <div class="popover-value">{{ formatDateFull(frontpageAt) }}</div>
              </div>
              <div v-if="!publishedAt && !frontpageAt && createdAt">
                <div class="font-medium popover-label">{{ t('posts.created_label') }}</div>
                <div class="popover-value">{{ formatDateFull(createdAt) }}</div>
              </div>
            </div>
          </Teleport>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-1 -mr-3 ml-auto">
        <FooterButton
          v-if="views"
          icon="fa6-solid:eye"
          :title="t('posts.views_tooltip')"
          :label="String(views)"
          :class="{ 'realtime-update': viewsAnimating }"
          @click="showViewsModal = true"
        />

        <!-- Seal Buttons - validation happens on click -->
        <SealButton
          content-type="post"
          :content-id="postId"
          :recommended-count="recommendedSealsCount"
          :advise-against-count="adviseAgainstSealsCount"
          :user-has-recommended="userHasRecommended"
          :user-has-advise-against="userHasAdviseAgainst"
          :is-own-content="isOwnPost"
          @updated="handleSealsUpdated"
        />

        <span
          v-if="sourceName && isExternalImport && sourceUrl"
          class="flex items-center mb-1 sm:mb-0"
          ><Icon name="fa6-solid:globe" class="mr-1" aria-hidden="true" /> {{ t('posts.seen_on') }}
          <a
            :href="sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-1"
            :aria-label="`${t('posts.seen_on')} ${sourceName}`"
          >
            {{ sourceName }}
          </a>
        </span>

        <FooterButton
          v-if="postUuid"
          icon="fa6-solid:link"
          :title="t('common.permalink')"
          class="permalink-btn"
          @click="openPermalinkModal"
        />

        <!-- ReportButton - validation happens on click -->
        <ReportButton
          :post-id="postId"
          :post-slug="postSlug"
          :post-uuid="postUuid"
          :reports-count="reportsCount"
          :reports="reports"
          :is-own-post="isOwnPost"
        />

        <slot name="actions" />
      </div>
    </div>

    <!-- Permalink Modal -->
    <Teleport to="body">
      <div
        v-if="showPermalinkModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
        role="dialog"
        aria-labelledby="permalink-modal-title"
        aria-modal="true"
        @click.self="closePermalinkModal"
      >
        <div
          class="modal-content rounded-lg shadow-lg max-w-md w-full p-6"
          @keydown.esc="closePermalinkModal"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 id="permalink-modal-title" class="text-lg font-medium">
              {{ t('common.permalink') }}
            </h3>
            <button
              class="modal-close-btn"
              :aria-label="t('common.close')"
              @click="closePermalinkModal"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>

          <div class="space-y-4">
            <p class="text-sm modal-description">
              {{ t('common.permalink_description') }}
            </p>

            <div>
              <label for="permalink-url" class="sr-only">{{ t('common.permalink') }}</label>
              <div class="modal-input-group flex items-center rounded-md overflow-hidden">
                <input
                  id="permalink-url"
                  ref="permalinkInput"
                  v-model="permalinkUrl"
                  type="text"
                  readonly
                  class="modal-input flex-grow py-2 px-3 focus:outline-none"
                />
                <button
                  class="modal-copy-btn px-3 py-2 transition-colors"
                  aria-label="Copy to clipboard"
                  @click="copyPermalink"
                >
                  <Icon name="fa6-solid:copy" aria-hidden="true" />
                </button>
              </div>
              <p v-if="permalinkCopied" class="text-green-500 text-sm mt-1" role="status">
                {{ t('common.copied_to_clipboard') }}
              </p>
            </div>

            <div class="flex justify-end mt-4">
              <button
                class="modal-btn-secondary px-4 py-2 rounded transition-colors"
                @click="closePermalinkModal"
              >
                {{ t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Views Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showViewsModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="showViewsModal = false"
        >
          <div
            class="card-bg rounded-lg shadow-xl max-w-sm w-full p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="views-modal-title"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-start justify-between mb-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10">
                  <Icon
                    name="fa6-solid:chart-simple"
                    class="text-lg text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h3 id="views-modal-title" class="text-lg font-bold text-text dark:text-text-dark">
                  {{ t('posts.views_title') }}
                </h3>
              </div>
              <button
                class="text-text-muted hover:text-text dark:text-text-dark-muted dark:hover:text-text-dark transition-colors"
                :aria-label="t('common.close')"
                @click="showViewsModal = false"
              >
                <Icon name="fa6-solid:xmark" aria-hidden="true" />
              </button>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-3 mb-5">
              <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="text-2xl font-bold text-text dark:text-text-dark tabular-nums">
                  {{ views.toLocaleString() }}
                </div>
                <div class="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                  {{ t('posts.unique_views') }}
                </div>
              </div>
              <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="text-2xl font-bold text-text dark:text-text-dark tabular-nums">
                  {{ totalViews.toLocaleString() }}
                </div>
                <div class="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                  {{ t('posts.total_views') }}
                </div>
              </div>
              <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="text-2xl font-bold text-text dark:text-text-dark tabular-nums">
                  {{ impressions.toLocaleString() }}
                </div>
                <div class="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                  {{ t('posts.impressions') }}
                </div>
              </div>
            </div>

            <!-- Info -->
            <div
              class="text-xs text-text-muted dark:text-text-dark-muted space-y-1.5 border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              <p>
                <Icon name="fa6-solid:user" class="inline mr-1.5" aria-hidden="true" />{{
                  t('posts.views_logged_info')
                }}
              </p>
              <p>
                <Icon name="fa6-solid:eye" class="inline mr-1.5" aria-hidden="true" />{{
                  t('posts.total_views_info')
                }}
              </p>
              <p>
                <Icon name="fa6-solid:list" class="inline mr-1.5" aria-hidden="true" />{{
                  t('posts.impressions_info')
                }}
              </p>
            </div>

            <!-- Close Button -->
            <button
              class="w-full mt-5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium"
              @click="showViewsModal = false"
            >
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useLocalePath, useI18n } from '#i18n'

  import ReportButton from '~/components/posts/ReportButton.vue'
  import FooterButton from '~/components/posts/postCard/FooterButton.vue'

  const props = defineProps({
    postId: {
      type: [Number, String],
      required: true,
    },
    postSlug: {
      type: String,
      default: '',
    },
    postUuid: {
      type: String,
      default: '',
    },
    userId: {
      type: [Number, String],
      default: null,
    },
    createdAt: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: String,
      default: '',
    },
    frontpageAt: {
      type: String,
      default: '',
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    recommendedSealsCount: {
      type: Number,
      default: 0,
    },
    adviseAgainstSealsCount: {
      type: Number,
      default: 0,
    },
    userHasRecommended: {
      type: Boolean,
      default: false,
    },
    userHasAdviseAgainst: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
    reports: {
      type: Array,
      default: () => [],
    },
    sourceName: {
      type: String,
      default: '',
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    isExternalImport: {
      type: Boolean,
      default: false,
    },
    hideComments: {
      type: Boolean,
      default: false,
    },
    isVisited: {
      type: Boolean,
      default: false,
    },
    newCommentsCount: {
      type: Number,
      default: 0,
    },
    sub: {
      type: Object,
      default: null,
    },
    isOwnPost: {
      type: Boolean,
      default: false,
    },
    federation: {
      type: Object,
      default: () => ({
        likes_count: 0,
        shares_count: 0,
        replies_count: 0,
        has_engagement: false,
      }),
    },
  })

  // isOwnPost is now passed as a prop from the backend (via can_edit)
  // This ensures SSR and client render the same content
  const isOwnPost = computed(() => {
    return props.isOwnPost === true
  })

  // Dynamic comment level colors - replaces 14 CSS classes with one
  const commentLevelStyle = computed(() => {
    const count = props.commentsCount || 0

    // Color scale: Green (0) -> Primary (1-15) -> Orange (16-60) -> Red (61-200) -> Gold (200+)
    if (count === 0) {
      return {
        '--comment-bg': 'rgba(16, 185, 129, 0.1)',
        '--comment-text': 'var(--color-engagement-cold-strong)',
      }
    } else if (count <= 15) {
      const intensity = 0.05 + (count / 15) * 0.1
      return {
        '--comment-bg': `rgba(var(--color-primary-rgb), ${intensity})`,
        '--comment-text': 'var(--color-primary-dark)',
      }
    } else if (count <= 60) {
      const intensity = 0.1 + ((count - 15) / 45) * 0.1
      return {
        '--comment-bg': `rgba(251, 146, 60, ${intensity})`,
        '--comment-text': 'var(--color-engagement-hot-strong)',
      }
    } else if (count <= 200) {
      const intensity = 0.12 + ((count - 60) / 140) * 0.1
      return {
        '--comment-bg': `rgba(239, 68, 68, ${intensity})`,
        '--comment-text': 'var(--color-engagement-hot-strong)',
      }
    } else {
      return {
        '--comment-bg': 'rgba(234, 179, 8, 0.25)',
        '--comment-text': 'var(--color-engagement-hot-strong)',
      }
    }
  })

  const emit = defineEmits(['seals-updated'])

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const localePath = useLocalePath()
  const showPermalinkModal = ref(false)
  const showViewsModal = ref(false)
  const showDatePopover = ref(false)
  const dateButtonRef = ref(null)
  const datePopoverContentRef = ref(null)
  const popoverPosition = ref({ top: 0, left: 0 })

  const popoverStyle = computed(() => ({
    top: `${popoverPosition.value.top}px`,
    left: `${popoverPosition.value.left}px`,
  }))

  function toggleDatePopover() {
    if (!showDatePopover.value && dateButtonRef.value) {
      const rect = dateButtonRef.value.getBoundingClientRect()
      popoverPosition.value = {
        top: rect.bottom + 4,
        left: rect.left,
      }
    }
    showDatePopover.value = !showDatePopover.value
  }

  function closeDatePopover() {
    showDatePopover.value = false
  }

  // Close date popover when clicking outside
  function handleClickOutsideDatePopover(event) {
    if (!showDatePopover.value) return
    const clickedButton = dateButtonRef.value?.contains(event.target)
    const clickedPopover = datePopoverContentRef.value?.contains(event.target)
    if (!clickedButton && !clickedPopover) {
      showDatePopover.value = false
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      document.addEventListener('click', handleClickOutsideDatePopover)
      window.addEventListener('scroll', closeDatePopover, true)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      document.removeEventListener('click', handleClickOutsideDatePopover)
      window.removeEventListener('scroll', closeDatePopover, true)
    }
  })
  const permalinkUrl = ref('')
  const permalinkCopied = ref(false)
  const permalinkInput = ref(null)
  const previousFocus = ref(null)

  // Realtime animation states
  const commentsAnimating = ref(false)
  const viewsAnimating = ref(false)

  // Watch for realtime changes
  watch(
    () => props.commentsCount,
    (newVal, oldVal) => {
      if (newVal !== oldVal && oldVal !== undefined) {
        commentsAnimating.value = true
        setTimeout(() => {
          commentsAnimating.value = false
        }, 600)
      }
    }
  )

  watch(
    () => props.views,
    (newVal, oldVal) => {
      if (newVal !== oldVal && oldVal !== undefined) {
        viewsAnimating.value = true
        setTimeout(() => {
          viewsAnimating.value = false
        }, 600)
      }
    }
  )

  const handleSealsUpdated = (counts) => {
    emit('seals-updated', counts)
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.round(diffMs / 1000)
    const diffMin = Math.round(diffSec / 60)
    const diffHour = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHour / 24)

    if (diffSec < 60) return t('common.time.just_now')
    if (diffMin < 60) return t('common.time.minutes_ago', { count: diffMin })
    if (diffHour < 24) return t('common.time.hours_ago', { count: diffHour })
    if (diffDay < 30) return t('common.time.days_ago', { count: diffDay })

    return date.toLocaleDateString(locale.value, { timeZone: timezone })
  }

  function formatDateFull(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString(locale.value, {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  // Smart date display computed properties - used in template

  const primaryDate = computed(() => {
    if (props.frontpageAt) return props.frontpageAt
    return props.publishedAt || props.createdAt
  })

  const showPublishedIndicator = computed(() => {
    if (!props.frontpageAt || !props.publishedAt) return false
    const frontpage = new Date(props.frontpageAt)
    const published = new Date(props.publishedAt)
    const diffHours = (frontpage - published) / (1000 * 60 * 60)
    return diffHours > 24
  })

  const publishedDateFormatted = computed(() => {
    if (!props.publishedAt) return ''
    return formatDate(props.publishedAt)
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fullDateTooltip = computed(() => {
    const parts = []
    if (props.publishedAt) {
      parts.push(`${t('posts.published_label')}: ${formatDateFull(props.publishedAt)}`)
    }
    if (props.frontpageAt) {
      parts.push(`${t('posts.frontpage_label')}: ${formatDateFull(props.frontpageAt)}`)
    }
    return parts.join('\n')
  })

  function openPermalinkModal() {
    if (import.meta.client) {
      previousFocus.value = document.activeElement
      showPermalinkModal.value = true

      // Focus the input after the modal is shown
      setTimeout(() => {
        if (permalinkInput.value) {
          permalinkInput.value.focus()
          permalinkInput.value.select()
        }
      }, 50)
    }
  }

  function closePermalinkModal() {
    showPermalinkModal.value = false

    // Return focus to the element that had focus before the modal was opened
    if (import.meta.client && previousFocus.value) {
      setTimeout(() => {
        previousFocus.value.focus()
      }, 50)
    }
  }

  function copyPermalink() {
    if (import.meta.client) {
      navigator.clipboard
        .writeText(permalinkUrl.value)
        .then(() => {
          permalinkCopied.value = true
          setTimeout(() => {
            permalinkCopied.value = false
          }, 2000)
        })
        .catch((err) => {
          console.error('Error al copiar permalink:', err)
        })
    }
  }

  function getCommentsCTA(count) {
    if (count === 0) {
      return t('posts.level_0') // 0
    } else if (count === 1) {
      return t('posts.level_1') // 1
    } else if (count <= 2) {
      return t('posts.level_2') // 2
    } else if (count <= 4) {
      return t('posts.level_3') // 3-4
    } else if (count <= 6) {
      return t('posts.level_4') // 5-6
    } else if (count <= 10) {
      return t('posts.level_5') // 7-10
    } else if (count <= 15) {
      return t('posts.level_6') // 11-15
    } else if (count <= 25) {
      return t('posts.level_7') // 16-25
    } else if (count <= 40) {
      return t('posts.level_8') // 26-40
    } else if (count <= 60) {
      return t('posts.level_9') // 41-60
    } else if (count <= 100) {
      return t('posts.level_10') // 61-100
    } else if (count <= 200) {
      return t('posts.level_11') // 101-200
    } else if (count <= 500) {
      return t('posts.level_12') // 201-500
    } else {
      return t('posts.level_13') // 500+
    }
  }

  onMounted(() => {
    if (props.postUuid && import.meta.client) {
      const baseUrl = window.location.origin
      permalinkUrl.value = `${baseUrl}${localePath(`/p/${props.postUuid}`)}`
    }
  })
</script>

<style scoped>
  .card-footer {
    background-color: var(--color-card-footer-bg);
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border-default);
    border-top: 0;
    border-bottom-right-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease;
    /* Consistent text color for all footer elements */
    color: var(--color-text-secondary);
  }

  /* Footer metadata row - all items use secondary color */
  .card-footer > div.flex {
    color: var(--color-text-secondary);
  }

  /* Date button and all footer buttons */
  .card-footer button {
    color: var(--color-text-secondary);
  }

  .card-footer button:hover {
    color: var(--color-primary);
  }

  /* Views and other span elements */
  .card-footer > div.flex span {
    color: var(--color-text-secondary);
  }

  /* Links in footer (except comments link) */
  .card-footer a:not(.comments-engagement-link) {
    color: var(--color-text-secondary);
  }

  .card-footer a:not(.comments-engagement-link):hover {
    color: var(--color-primary);
  }

  /* Icons inherit color from parent */
  .card-footer :deep(.iconify) {
    color: inherit;
  }

  /* Permalink icon slightly larger */
  .permalink-btn :deep(.footer-btn-icon) {
    font-size: 0.875rem;
    width: 0.875rem;
    height: 0.875rem;
  }

  /* Comments engagement link styling - dynamic background via JS */
  .comments-engagement-link {
    display: block;
    text-decoration: none;
    color: inherit;
    background-color: var(--comment-bg, rgba(var(--color-primary-rgb), 0.08));
  }

  .comments-engagement-link:hover {
    filter: brightness(1.05);
  }

  .comment-count {
    font-weight: 700;
    color: var(--comment-text, var(--color-primary-dark));
  }

  .comment-label {
    font-weight: 500;
    color: var(--comment-text, var(--color-primary-dark));
  }

  .cta-message {
    font-weight: 500;
    color: var(--comment-text, var(--color-primary-dark));
  }

  .new-comments-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    background-color: rgba(var(--color-primary-rgb), 0.15);
    color: var(--color-primary-dark);
    font-weight: 600;
    margin-left: 0.25rem;
  }

  .dark .new-comments-badge {
    background-color: rgba(var(--color-primary-rgb), 0.2);
    color: var(--color-primary-light);
  }

  /* Date popover styles */
  .date-secondary {
    color: var(--color-text-muted);
  }

  .date-popover {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .popover-label {
    color: var(--color-text-primary);
  }

  .popover-value {
    color: var(--color-text-secondary);
  }

  /* Modal styles */
  .modal-content {
    background-color: var(--color-bg-card);
    color: var(--color-text-primary);
  }

  .modal-close-btn {
    color: var(--color-text-muted);
  }

  .modal-close-btn:hover {
    color: var(--color-text-primary);
  }

  .modal-description {
    color: var(--color-text-secondary);
  }

  .modal-input-group {
    border: 1px solid var(--color-border-default);
  }

  .modal-input {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }

  .modal-copy-btn {
    background-color: var(--color-bg-active);
  }

  .modal-copy-btn:hover {
    background-color: var(--color-bg-elevated);
  }

  .modal-btn-secondary {
    background-color: var(--color-bg-active);
    color: var(--color-text-primary);
  }

  .modal-btn-secondary:hover {
    background-color: var(--color-bg-elevated);
  }

  .modal-info-box {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }

  /* Modal transitions */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-active > div,
  .modal-leave-active > div {
    transition: transform 0.2s ease;
  }

  .modal-enter-from > div,
  .modal-leave-to > div {
    transform: scale(0.95);
  }

  .card-bg {
    background-color: var(--color-bg-card);
  }

  /* Realtime update animation */
  .realtime-update {
    animation: realtimePulse 0.6s ease-out;
  }

  @keyframes realtimePulse {
    0% {
      transform: scale(1);
    }
    30% {
      transform: scale(1.2);
      color: var(--color-success, #22c55e);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
