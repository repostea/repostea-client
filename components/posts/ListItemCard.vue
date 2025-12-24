<template>
  <article ref="articleRef" class="list-item-card" :aria-labelledby="`post-title-${post.id || post.entryId}`">
    <div
      class="list-item-content flex items-center py-2 px-3 transition-colors"
    >
      <!-- Vote badge compacto -->
      <div class="vote-section mr-3">
        <button
          class="vote-button flex flex-col items-center justify-center p-1 rounded"
          :class="{ 'text-primary': post.userVote }"
          :disabled="isLoading"
          :aria-label="`${post.votes} ${t('posts.votes')} ${post.userVote ? t('posts.voted') : t('posts.vote')}`"
          @click.stop="vote"
        >
          <span class="text-sm font-bold">{{ post.votes || 0 }}</span>
          <Icon :name="isLoading ? 'fa6-solid:spinner' : 'fa6-solid:arrow-up'" :class="['text-xs', {'animate-spin': isLoading}]" aria-hidden="true" />
        </button>
      </div>

      <!-- Title and metadata -->
      <div class="flex-grow min-w-0">
        <h3 :id="`post-title-${post.id || post.entryId}`" class="text-sm font-medium truncate">
          <span v-if="isVideoContent()" class="mr-1" aria-hidden="true">
            <Icon name="fa6-solid:video" class="text-red-500 text-xs" />
          </span>
          <span v-else-if="isAudioContent()" class="mr-1" aria-hidden="true">
            <Icon name="fa6-solid:headphones" class="text-green-500 text-xs" />
          </span>
          <span v-else-if="isPollContent()" class="mr-1" aria-hidden="true">
            <Icon name="fa6-solid:square-poll-vertical" class="text-purple-500 text-xs" />
          </span>

          <span v-if="post.is_nsfw" class="nsfw-badge mr-1">
            {{ t('posts.nsfw_badge', 'NSFW +18') }}
          </span>

          <NuxtLink
            :to="getPostLinkPath()"
            :target="post.url && !isMediaContent() && !post.is_nsfw ? '_blank' : ''"
            class="hover:text-primary transition-colors"
            :aria-label="
              post.title +
              (isVideoContent()
                ? ` (${t('posts.video')})`
                : isAudioContent()
                  ? ` (${t('posts.audio')})`
                  : '')
            "
            @click="handleTitleClick"
          >
            {{ post.title }}
          </NuxtLink>
        </h3>

        <!-- Desktop: Single line metadata -->
        <div class="hidden md:flex items-center text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
          <AuthorInfo
            :user="post.user"
            :is-anonymous="post.is_guest"
            :author-name="post.author_name"
          />

          <span class="mx-1">·</span>

          <span v-if="post.url" class="truncate max-w-[200px]">
            {{ post.is_nsfw ? t('posts.external_content', '[contenido externo]') : getDomain(post.url) }}
          </span>
          <span v-else>
            {{ t('links.internal_link') }}
          </span>

          <span class="mx-1">·</span>

          <span :title="formatDateFull(post.created_at)">
            {{ formatDate(post.created_at) }}
          </span>

          <span v-if="post.numComments > 0" class="ml-2 inline-flex items-center"><Icon name="fa6-solid:comment" class="text-xs mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ post.numComments }}</span>
          </span>
        </div>

        <!-- Mobile: Multi-line metadata -->
        <div class="md:hidden text-xs text-text-muted dark:text-text-dark-muted mt-0.5 space-y-0.5">
          <div class="flex items-center">
            <AuthorInfo
              :user="post.user"
              :is-anonymous="post.is_guest"
              :author-name="post.author_name"
            />
          </div>

          <div v-if="post.url" class="truncate">
            {{ post.is_nsfw ? t('posts.external_content', '[contenido externo]') : getDomain(post.url) }}
          </div>
          <div v-else>
            {{ t('links.internal_link') }}
          </div>

          <div class="flex items-center gap-2">
            <span :title="formatDateFull(post.created_at)">
              {{ formatDate(post.created_at) }}
            </span>

            <span v-if="post.numComments > 0" class="inline-flex items-center">
              <Icon name="fa6-solid:comment" class="text-xs mr-1 flex-shrink-0" aria-hidden="true" />
              <span>{{ post.numComments }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Quick actions (hidden in list view - available inside post detail) -->
    </div>
  </article>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { usePostsStore } from '~/stores/posts'
  import { useLocalePath, useI18n  } from '#i18n'

  import AuthorInfo from '~/components/common/AuthorInfo.vue'

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['vote'])

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const localePath = useLocalePath()
  const authStore = useAuthStore()
  const postsStore = usePostsStore()
  const { registerView, shouldTrackOnClick } = useViewTracking()
  const { trackImpression, untrackImpression } = useImpressionTracking()
  const isLoading = ref(false)
  const articleRef = ref(null)

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

  function getDomain(url) {
    try {
      const domain = new URL(url).hostname
      return domain.replace(/^www\./, '')
    } catch {
      return url
    }
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
    return date.toLocaleString(locale.value, { timeZone: timezone })
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

    if (
      isMediaContent() ||
      props.post.content_type === 'text' ||
      props.post.content_type === 'poll'
    ) {
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

  async function vote() {
    if (!authStore.isAuthenticated) {
      // Redirect to login if not authenticated
      return
    }

    isLoading.value = true
    try {
      await postsStore.votePost(props.post.id || props.post.entryId, props.post.userVote ? 0 : 1)
      emit('vote', props.post.userVote ? 0 : 1)

      // Register view when voting (user interacted with the post)
      registerView(props.post.id || props.post.entryId)
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      isLoading.value = false
    }
  }
</script>

<style scoped>
  .list-item-card {
    background-color: var(--color-bg-card);
    border-bottom: 1px solid var(--color-border-default);
  }

  .list-item-card:hover {
    background-color: var(--color-bg-hover);
  }

  .list-item-content:hover {
    background-color: var(--color-bg-hover);
  }

  .vote-button:hover {
    background-color: var(--color-bg-hover);
  }

  .vote-section {
    min-width: 40px;
  }

  .nsfw-badge {
    @apply text-xs font-medium transition-all inline-flex items-center;
    background-color: var(--color-badge-nsfw-bg);
    border: 1px solid var(--color-badge-nsfw-border);
    padding: 1px 5px;
    border-radius: 3px;
    color: var(--color-badge-nsfw-text);
    font-size: 0.65rem;
  }
</style>
