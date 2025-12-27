<template>
  <article
    ref="articleRef"
    class="link-card flex flex-col relative"
    :class="[{ 'visited-post': post.is_visited && !showFullText }, sealBorderClass]"
    :lang="post.language_code || undefined"
    :aria-labelledby="`post-title-${post.id || post.entryId}`"
  >
    <!-- Seal Badge - Positioned as background decoration in top-right corner -->
    <SealCornerBadge
      v-if="post.recommended_seals_count > 0 || post.advise_against_seals_count > 0"
      :recommended-count="post.recommended_seals_count || 0"
      :advise-against-count="post.advise_against_seals_count || 0"
      class="seal-background-badge"
      @click="showSealInfoModal = true"
    />

    <!-- Seal Info Modal (lazy loaded) -->
    <SealInfoModal v-model="showSealInfoModal" />
    <div class="card-body flex flex-col items-start flex-grow">
      <div class="card-body-inner w-full">
        <!-- Vote badge -->
        <div class="vote-section">
          <VoteBadge
            :votes="voteCount"
            :type="post.url ? 'external' : 'internal'"
            :is-loading="isLoading"
            :user-has-voted="Boolean(post.userVote)"
            :has-federation-badge="post.federation?.has_engagement"
            :voting-open="post.voting_open !== false"
            size="small"
            :aria-label="`${voteCount} ${t('posts.votes')} ${post.userVote ? t('posts.voted') : ''}`"
            @vote="vote"
          />
          <FederationBadge :federation="post.federation" />
        </div>

        <!-- Title and metadata -->
        <div class="content-section">
          <h3 :id="`post-title-${post.id || post.entryId}`" class="card-title break-words">
            <!-- NSFW Badge - Inline before title --><span
              v-if="post.is_nsfw"
              class="nsfw-badge mr-2"
              :title="t('posts.nsfw_badge', 'NSFW +18')"
              >{{ t('posts.nsfw_badge', 'NSFW +18') }}</span
            ><span v-if="isVideoContent()" class="inline-flex items-center mr-1" aria-hidden="true"
              ><Icon name="fa6-solid:video" class="text-red-500" /></span
            ><span
              v-else-if="isAudioContent()"
              class="inline-flex items-center mr-1"
              aria-hidden="true"
              ><Icon name="fa6-solid:headphones" class="text-green-500" /></span
            ><NuxtLink
              :to="getPostLinkPath()"
              :target="post.url && !isMediaContent() && !post.is_nsfw ? '_blank' : ''"
              :rel="post.url && !isMediaContent() && !post.is_nsfw ? 'noopener nofollow' : ''"
              :aria-label="
                post.title +
                (isVideoContent()
                  ? ` (${t('posts.video')})`
                  : isAudioContent()
                    ? ` (${t('posts.audio')})`
                    : '')
              "
              @mousedown="handleTitleClick"
              >{{ post.title }}</NuxtLink
            ><span v-if="post.is_visited" class="visited-badge-inline" :title="getVisitedTooltip()"
              ><Icon name="fa6-solid:circle-check" aria-hidden="true"
            /></span>
          </h3>

          <!-- Seal Badges - Removed, only show corner badge -->

          <div
            class="author-url-info flex flex-wrap items-center text-xs text-text-muted dark:text-text-dark-muted mt-0.5"
          >
            <div class="flex items-center">
              <AuthorInfo
                :user="post.user"
                :is-anonymous="post.is_anonymous"
                :author-name="post.author_name"
              />
            </div>

            <!-- Sub badge -->
            <template v-if="post.sub">
              <span class="text-xs opacity-70 ml-1">{{ t('posts.in') }}</span>
              <SubBadge :sub="post.sub" size="xs" class="ml-1" />
            </template>

            <span class="mx-1" aria-hidden="true">·</span>

            <div class="flex items-center">
              <span v-if="post.url" class="flex items-center truncate max-w-[200px]">
                {{
                  post.is_nsfw
                    ? t('posts.external_content', '[contenido externo]')
                    : getDomain(post.url)
                }}
              </span>
              <span v-else-if="isPollContent()" class="flex items-center">
                {{ t('links.poll') }}
              </span>
              <span v-else class="flex items-center">
                {{ t('links.internal_link') }}
              </span>
            </div>

            <!-- Language indicator -->
            <span v-if="post.language_code" class="mx-1" aria-hidden="true">·</span>
            <button
              v-if="post.language_code && isLanguageFilterAvailable"
              class="language-badge clickable"
              :title="`${t('common.language')}: ${getLanguageName(post.language_code)} - ${t('common.click_to_filter')}`"
              @click.stop.prevent="openLanguageFilter"
            >
              {{ post.language_code.toUpperCase() }}
            </button>
            <span
              v-else-if="post.language_code"
              class="language-badge"
              :title="`${t('common.language')}: ${getLanguageName(post.language_code)}`"
            >
              {{ post.language_code.toUpperCase() }}
            </span>
          </div>

          <!-- Seals information text -->
          <div
            v-if="post.recommended_seals_count > 0 || post.advise_against_seals_count > 0"
            class="seals-text-info text-xs mt-1"
          >
            <div
              v-if="post.recommended_seals_count > 0"
              class="seal-text-recommended flex items-start gap-1"
            >
              <Icon name="fa6-solid:award" class="seal-text-icon" aria-hidden="true" />
              {{ t('seals.people_recommend', post.recommended_seals_count) }}
            </div>
            <div
              v-if="post.advise_against_seals_count > 0"
              class="seal-text-advised-against flex items-start gap-1"
              :class="{ 'mt-0.5': post.recommended_seals_count > 0 }"
            >
              <Icon
                name="fa6-solid:triangle-exclamation"
                class="seal-text-icon"
                aria-hidden="true"
              />
              {{ t('seals.people_advise_against', post.advise_against_seals_count) }}
            </div>
          </div>

          <!-- CTA below seals -->
          <slot name="below-vote" />
        </div>
      </div>

      <slot name="content" />

      <slot name="cta" />
    </div>

    <slot name="footer" />
  </article>
</template>

<script setup>
  import { ref, computed, defineAsyncComponent, onMounted, onBeforeUnmount } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { usePostsStore } from '~/stores/posts'
  import { useNotification } from '~/composables/useNotification'
  import VoteBadge from '~/components/posts/VoteBadge.vue'
  import FederationBadge from '~/components/federation/FederationBadge.vue'
  import AuthorInfo from '~/components/common/AuthorInfo.vue'
  import { useLocalePath, useI18n } from '#i18n'

  // Lazy load seal info modal
  const SealInfoModal = defineAsyncComponent(() => import('~/components/seals/SealInfoModal.vue'))

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
    showPlaceholder: {
      type: Boolean,
      default: true,
    },
    showFullText: {
      type: Boolean,
      default: false,
    },
    hideComments: {
      type: Boolean,
      default: false,
    },
    hideSealBorder: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['vote', 'seals-updated'])

  const _handleSealsUpdated = (counts) => {
    // Update local post data
    props.post.recommended_seals_count = counts.recommended
    props.post.advise_against_seals_count = counts.advise_against
    emit('seals-updated', counts)
  }

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const localePath = useLocalePath()
  const route = useRoute()
  const authStore = useAuthStore()
  const postsStore = usePostsStore()
  const { success, warning, error } = useNotification()
  const { registerView, shouldTrackOnClick } = useViewTracking()
  const { trackImpression, untrackImpression } = useImpressionTracking()
  const isLoading = ref(false)
  const articleRef = ref(null)
  const showSealInfoModal = ref(false)

  // Track impressions when post becomes visible
  onMounted(() => {
    if (articleRef.value) {
      trackImpression(articleRef.value, props.post.id || props.post.entryId)
    }
  })

  onBeforeUnmount(() => {
    if (articleRef.value) {
      untrackImpression(articleRef.value)
    }
  })

  // Compute border class based on seal balance
  const sealBorderClass = computed(() => {
    if (props.hideSealBorder) return ''

    const recommended = props.post.recommended_seals_count || 0
    const adviseAgainst = props.post.advise_against_seals_count || 0

    if (recommended === 0 && adviseAgainst === 0) return ''

    const diff = recommended - adviseAgainst
    // Only show green border when recommended (no red border for advise against)
    if (diff > 0) return 'seal-border-recommended'
    return ''
  })

  // Check if language filter is available in current page
  const isLanguageFilterAvailable = computed(() => {
    // Only show clickable language badge in home and pending pages
    const path = route.path
    return path === '/' || path.includes('/pending') || path === localePath('/')
  })

  const voteCount = computed(() => {
    if (typeof props.post.vote_count === 'number') return props.post.vote_count
    if (typeof props.post.votes === 'number') return props.post.votes
    return 0
  })

  function getDomain(url) {
    try {
      const domain = new URL(url).hostname
      return domain.replace(/^www\./, '')
    } catch {
      return url
    }
  }

  function getVisitedTooltip() {
    if (!props.post.is_visited || !props.post.last_visited_at) {
      return t('posts.visited')
    }

    const visitDate = new Date(props.post.last_visited_at)
    const now = new Date()
    const diffMs = now - visitDate
    const diffSec = Math.round(diffMs / 1000)
    const diffMin = Math.round(diffSec / 60)
    const diffHour = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHour / 24)

    let timeAgo = ''
    if (diffSec < 60) {
      timeAgo = t('common.time.just_now')
    } else if (diffMin < 60) {
      timeAgo = t('common.time.minutes_ago', { count: diffMin })
    } else if (diffHour < 24) {
      timeAgo = t('common.time.hours_ago', { count: diffHour })
    } else if (diffDay < 30) {
      timeAgo = t('common.time.days_ago', { count: diffDay })
    } else {
      timeAgo = visitDate.toLocaleDateString(locale.value, { timeZone: timezone })
    }

    return `${t('posts.visited')} ${timeAgo}`
  }

  function getLanguageName(code) {
    // Import language data from language-data.js
    import('~/utils/language-data').then((module) => {
      const lang = module.default.find((l) => l.code === code)
      return lang ? lang.native : code.toUpperCase()
    })

    // Fallback for common languages
    const languages = {
      es: 'Español',
      en: 'English',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ca: 'Català',
      eu: 'Euskara',
      gl: 'Galego',
      ru: 'Русский',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
      ar: 'العربية',
      hi: 'हिन्दी',
      tr: 'Türkçe',
    }
    return languages[code] || code.toUpperCase()
  }

  function openLanguageFilter() {
    // Emit a custom event to open language filter
    if (import.meta.client) {
      window.dispatchEvent(
        new CustomEvent('open-language-filter', {
          detail: { languageCode: props.post.language_code },
        })
      )
    }
  }

  function isVideoContent() {
    return props.post.content_type === 'video'
  }

  function isAudioContent() {
    return props.post.content_type === 'audio'
  }

  function isPollContent() {
    return props.post.content_type === 'poll'
  }

  function isMediaContent() {
    return isVideoContent() || isAudioContent()
  }

  function getPostLinkPath() {
    // NSFW posts should always go to the post page first
    if (props.post.is_nsfw) {
      return localePath(`/posts/${props.post.slug || props.post.id || props.post.entryId}`)
    }

    if (isMediaContent()) {
      return localePath(`/posts/${props.post.slug || props.post.id || props.post.entryId}`)
    }

    return props.post.url
      ? props.post.url
      : localePath(`/posts/${props.post.slug || props.post.id || props.post.entryId}`)
  }

  function handleTitleClick() {
    if (shouldTrackOnClick(props.post)) {
      registerView(props.post.id || props.post.entryId)
    }
  }

  async function vote(value) {
    isLoading.value = true

    try {
      await postsStore.votePost(props.post.id, value)
      emit('vote', value)

      // Register view when voting (user interacted with the post)
      registerView(props.post.id || props.post.entryId)

      // Show success feedback
      if (authStore.user?.is_guest) {
        success(t('posts.vote_success_anonymous'), { priority: 'low' })
      } else {
        success(t('posts.vote_success'), { priority: 'low' })
      }
    } catch (err) {
      // Show error feedback with specific messages (skip if interceptor already showed it)
      if (err._interceptorWillNotify) {
        // API interceptor already showed the error notification
      } else if (err.response?.status === 401) {
        warning(t('posts.vote_login_required'))
      } else if (err.response?.status === 429) {
        warning(t('posts.vote_rate_limit'))
      } else if (err.response?.data?.message) {
        error(err.response.data.message)
      } else {
        error(t('posts.vote_error'))
      }
    } finally {
      isLoading.value = false
    }
  }
</script>

<style scoped>
  .link-card {
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }

  /* Float layout for text to wrap around votes (same on mobile and desktop) */
  .card-body-inner {
    padding: 0 0 0.25rem 0;
  }

  .card-body-inner::after {
    content: '';
    display: table;
    clear: both;
  }

  .vote-section {
    float: left;
    margin-right: 0.375rem;
  }

  .content-section {
    /* No display/overflow to allow text to wrap around floated vote-section */
  }

  @media (min-width: 768px) {
    .card-body-inner {
      padding: 0 0 0.5rem 0;
    }

    .vote-section {
      margin-right: 0.5rem;
    }
  }

  .tag {
    display: inline-block;
    background-color: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
    border-radius: 9999px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    margin-right: 0.5rem;
    margin-bottom: 0.25rem;
    text-decoration: none;
    transition-property: background-color, border-color, color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
    border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  }

  .tag:hover {
    background-color: var(--color-primary);
    color: var(--color-btn-primary-text);
    border-color: var(--color-primary);
  }

  .card-body {
    background-color: var(--color-card-bg);
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    border: 1px solid var(--color-border);
    border-left: none;
    border-right: none;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease;
  }

  @media (min-width: 768px) {
    .card-body {
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
      border-left: 1px solid var(--color-border);
      border-right: 1px solid var(--color-border);
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
  }

  .dark .card-body {
    background-color: var(--color-card-bg-dark);
    border-color: var(--color-border-dark);
  }

  .card-title {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: var(--color-text);
    line-height: 1.4;
  }

  @media (min-width: 768px) {
    .card-title {
      font-size: 1.125rem;
    }
  }

  .dark .card-title {
    color: var(--color-text-dark);
  }

  .card-title a {
    transition-property: color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  .card-title a:hover {
    color: var(--color-primary);
  }

  .author-url-info {
    font-size: 0.75rem;
  }

  .card-body {
    padding-bottom: 0;
  }

  /* Comments Engagement Footer */
  .comments-engagement-footer {
    border-bottom-left-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
    padding: 0.5rem 0.25rem;
    border: 1px solid;
    border-top: 0;
    border-left: none;
    border-right: none;
    transition: all 0.2s ease;
  }

  @media (min-width: 768px) {
    .comments-engagement-footer {
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
      padding: 0.875rem 1rem;
      border-left: 1px solid;
      border-right: 1px solid;
    }
  }

  /* No comments state - Green invitation */
  .comments-engagement-footer.no-comments {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.06) 0%, rgba(5, 150, 105, 0.03) 100%);
    border-color: rgba(16, 185, 129, 0.2);
  }

  .dark .comments-engagement-footer.no-comments {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%);
    border-color: rgba(16, 185, 129, 0.25);
  }

  /* Few comments (1-2) - Theme color light */
  .comments-engagement-footer.few-comments {
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.05) 0%,
      rgba(var(--color-primary-rgb), 0.02) 100%
    );
    border-color: rgba(var(--color-primary-rgb), 0.15);
  }

  .dark .comments-engagement-footer.few-comments {
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.07) 0%,
      rgba(var(--color-primary-rgb), 0.03) 100%
    );
    border-color: rgba(var(--color-primary-rgb), 0.2);
  }

  /* Active discussion (3-9) - Theme color medium */
  .comments-engagement-footer.active-discussion {
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.08) 0%,
      rgba(var(--color-primary-rgb), 0.04) 100%
    );
    border-color: rgba(var(--color-primary-rgb), 0.25);
  }

  .dark .comments-engagement-footer.active-discussion {
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.12) 0%,
      rgba(var(--color-primary-rgb), 0.06) 100%
    );
    border-color: rgba(var(--color-primary-rgb), 0.3);
  }

  /* Hot discussion (10+) - Theme color strong with fire gradient */
  .comments-engagement-footer.hot-discussion {
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.12) 0%,
      rgba(251, 146, 60, 0.08) 50%,
      rgba(239, 68, 68, 0.08) 100%
    );
    border-color: rgba(var(--color-primary-rgb), 0.35);
  }

  .dark .comments-engagement-footer.hot-discussion {
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.18) 0%,
      rgba(251, 146, 60, 0.12) 50%,
      rgba(239, 68, 68, 0.12) 100%
    );
    border-color: rgba(var(--color-primary-rgb), 0.4);
  }

  .comments-engagement-footer:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .cta-footer-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .cta-content-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cta-icon-count {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .cta-icon {
    font-size: 1.125rem;
    transition: transform 0.2s ease;
  }

  .no-comments .cta-icon {
    color: var(--color-engagement-cold);
  }

  .few-comments .cta-icon,
  .active-discussion .cta-icon {
    color: var(--color-primary);
  }

  .hot-discussion .cta-icon {
    color: var(--color-engagement-hot);
  }

  .comment-count {
    font-size: 1rem;
    font-weight: 700;
  }

  .no-comments .comment-count {
    color: var(--color-engagement-cold-text);
  }

  .few-comments .comment-count,
  .active-discussion .comment-count {
    color: var(--color-primary-dark);
  }

  .hot-discussion .comment-count {
    color: var(--color-engagement-hot-text);
  }

  .cta-message {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .no-comments .cta-message {
    color: var(--color-engagement-cold-strong);
  }

  .few-comments .cta-message,
  .active-discussion .cta-message {
    color: var(--color-primary-dark);
  }

  .hot-discussion .cta-message {
    color: var(--color-engagement-hot-strong);
    font-weight: 600;
  }

  .cta-arrow {
    font-size: 0.875rem;
    opacity: 0.5;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .comments-engagement-footer:hover .cta-arrow {
    opacity: 1;
    transform: translateX(4px);
  }

  .comments-engagement-footer:hover .cta-icon {
    transform: scale(1.15);
  }

  /* Visited post styling */
  .visited-post .card-title a {
    color: var(--color-visited) !important;
    transition: color 0.2s ease;
  }

  .visited-post:hover .card-title a {
    color: var(--color-visited-hover) !important;
  }

  .visited-badge-inline {
    color: var(--color-visited);
    font-size: 0.75rem;
    margin-left: 0.375rem;
    opacity: 0.7;
    display: inline-flex;
    align-items: center;
  }

  /* NSFW badge styling - Discrete */
  .nsfw-badge {
    @apply text-xs font-medium transition-all inline-flex items-center;
    background-color: var(--color-badge-nsfw-bg);
    border: 1px solid var(--color-badge-nsfw-border);
    padding: 1px 5px;
    border-radius: 3px;
    color: var(--color-badge-nsfw-text);
    font-size: 0.65rem;
  }

  /* Language badge styling */
  .language-badge {
    @apply text-xs transition-all;
    background: none;
    border: none;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  /* Only clickable badges have cursor pointer and hover effects */
  .language-badge.clickable {
    @apply cursor-pointer;
  }

  .language-badge.clickable:hover {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
    opacity: 1;
  }

  .dark .language-badge.clickable:hover {
    background-color: rgba(var(--color-primary-rgb), 0.2);
    color: var(--color-primary-light);
  }

  /* Seal border styles */
  .link-card {
    position: relative;
  }

  .seal-border-recommended .card-body {
    border-left: 4px solid var(--color-seal-recommended);
  }

  .seal-border-problematic .card-body {
    border-left: 4px solid var(--color-seal-advise-against);
  }

  .seal-border-neutral .card-body {
    border-left: 4px solid var(--color-seal-neutral);
  }

  /* Seal background badge - decorative, positioned in top-right */
  .seal-background-badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    opacity: 0.5;
    z-index: 1;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .seal-background-badge:hover {
    opacity: 0.8;
  }

  /* Seals text info styles */
  .seals-text-info {
    opacity: 0.8;
  }

  .seal-text-icon {
    font-size: 0.75rem;
  }

  .seal-text-recommended {
    color: var(--color-seal-recommended);
    font-weight: 500;
  }

  .seal-text-advised-against {
    color: var(--color-seal-advise-against);
    font-weight: 500;
  }
</style>
