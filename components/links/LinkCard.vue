<template>
  <div class="link-card hover:translate-y-[-2px] transition-all duration-200">
    <div class="card-body flex items-start">
      <VoteBadge
        :votes="link.votes"
        :type="link.type"
        :canVote="canVote"
        :canDownvote="canDownvote"
        :isLoading="isLoading"
        :userHasVoted="link.user_has_voted"
        @vote="vote"
      />
      <div class="flex-grow flex p-4">
        <div class="flex-grow mr-3">
          <div class="mb-2">
            <span
              class="inline-block text-xs font-semibold px-2 py-1 rounded-full"
              :class="getSourceClass(link.source)"
              >{{ link.source }}</span
            >
          </div>
          <h3 class="card-title">
            <NuxtLink
              :to="link.url ? link.url : `/links/${link.id}`"
              :target="link.url ? '_blank' : ''"
            >
              {{ link.title }}
            </NuxtLink>
          </h3>
          <div
            class="card-subtitle text-sm text-text-muted dark:text-text-dark-muted mb-2 flex items-center"
          >
            <span v-if="link.url" class="flex items-center">
              <i class="fas fa-external-link-alt mr-1"></i>
              {{ getDomain(link.url) }}
            </span>
            <span v-else class="flex items-center">
              <i class="fas fa-file-alt mr-1"></i>
              {{ $t('links.internal_link') }}
            </span>
          </div>
          <p class="card-text text-sm text-text dark:text-text-dark mb-3">
            {{ truncate(link.description, 150) }}
          </p>

          <div class="mb-2 flex flex-wrap">
            <NuxtLink v-for="tag in link.tags" :key="tag.id" :to="`/tags/${tag.name}`" class="tag">
              {{ tag.name }}
            </NuxtLink>
          </div>
        </div>

        <div
          v-if="(link.image || showPlaceholder) && link.type !== 'external'"
          class="link-thumbnail hidden sm:block"
        >
          <img
            :src="link.image ? link.image : `https://picsum.photos/seed/link${link.id}/125/90`"
            class="object-cover rounded w-[125px] h-[90px]"
            :alt="link.title"
          />
        </div>
      </div>
    </div>

    <div class="card-footer rounded-b-lg">
      <div class="flex justify-between items-center text-xs">
        <div class="flex items-center space-x-3">
          <span
            class="flex items-center"
            :title="formatDate(link.promoted_at || link.created_at, 'full')"
          >
            <i class="fas fa-clock mr-1"></i>{{ formatDate(link.promoted_at || link.created_at) }}
          </span>
          <template v-if="link.type === 'external'">
            <a
              :href="link.original_external_url"
              target="_blank"
              rel="noopener"
              class="flex items-center text-blue-500 hover:underline"
            >
              <i class="fas fa-comment mr-1"></i>
              {{
                $t('links.view_comments_on', {
                  source: link.source,
                })
              }}
            </a>
          </template>
          <template v-else-if="link.comments_count > 0">
            <NuxtLink
              :to="`/links/${link.id}#comments`"
              class="flex items-center hover:text-primary"
            >
              <i class="fas fa-comment mr-1"></i>{{ link.comments_count }}
              {{ $t('common.comments') }}
            </NuxtLink>
          </template>
          <template v-else>
            <span class="flex items-center text-gray-400">
              <i class="fas fa-comment mr-1"></i> 0
              {{ $t('common.comments') }}
            </span>
          </template>
        </div>

        <div class="flex items-center space-x-3">
          <span v-if="link.clicks" class="flex items-center" :title="$t('links.visits')">
            <i class="fas fa-eye mr-1"></i>{{ link.clicks }}
          </span>
          <template v-if="link.url">
            <span class="flex items-center">
              <a
                :href="link.original_external_url"
                target="_blank"
                rel="noopener"
                class="ml-1 text-gray-400"
              >
                <i class="fas fa-newspaper mr-1"></i>
                {{ $t('links.original_source') }}
              </a>
            </span>
          </template>
          <span class="flex items-center" :title="$t('links.karma')">
            <i class="fas fa-bolt mr-1"></i>{{ formatNumber(link.karma) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useLinksStore } from '~/stores/links'
  import VoteBadge from '~/components/links/VoteBadge.vue'

  const props = defineProps({
    link: {
      type: Object,
      required: true,
    },
    showPlaceholder: {
      type: Boolean,
      default: true,
    },
  })

  const authStore = useAuthStore()
  const linksStore = useLinksStore()
  const isLoading = ref(false)
  const { $api } = useNuxtApp()

  const canVote = computed(() => {
    return authStore.isAuthenticated && !props.link.user_has_voted
  })

  const canDownvote = computed(() => {
    return canVote.value && authStore.userKarma >= 8
  })

  function getDomain(url) {
    try {
      const domain = new URL(url).hostname
      return domain.replace(/^www\./, '')
    } catch (e) {
      return url
    }
  }

  function truncate(text, length) {
    if (!text) return ''
    return text.length > length ? text.substring(0, length) + '...' : text
  }

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
    } else {
      return date.toLocaleString()
    }
  }

  function getSourceClass(source) {
    switch (source?.toLowerCase()) {
      case 'meneame':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-700'
      case 'reddit':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700'
      case 'slashdot':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
    }
  }

  async function vote(value) {
    if (!canVote.value || (value === -1 && !canDownvote.value)) return
    isLoading.value = true
    try {
      await linksStore.voteLink(props.link.id, value)
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      isLoading.value = false
    }
  }
</script>
