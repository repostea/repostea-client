<template>
  <div
    class="bg-white dark:bg-card-bg-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-6 overflow-hidden"
  >
    <div class="p-6">
      <div class="flex">
        <div class="vote-box p-1 bg-gray-50 dark:bg-neutral-800 rounded-lg mr-4">
          <button
            class="vote-btn"
            :class="{
              'opacity-50 cursor-not-allowed': !canVote || isVoting || link.user_has_voted,
            }"
            :disabled="!canVote || isVoting || link.user_has_voted"
            @click="vote(1)"
          >
            <i class="fas fa-arrow-up"></i>
          </button>
          <div class="vote-count">{{ link.votes }}</div>
          <button
            class="vote-btn vote-down"
            :class="{
              'opacity-50 cursor-not-allowed': !canDownvote || isVoting || link.user_has_voted,
            }"
            :disabled="!canDownvote || isVoting || link.user_has_voted"
            @click="vote(-1)"
          >
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>

        <div class="flex-grow">
          <h1 class="text-xl md:text-2xl font-bold mb-3 text-text dark:text-text-dark">
            {{ link.title }}
          </h1>

          <div
            class="flex flex-wrap items-center text-sm text-text-muted dark:text-text-dark-muted mb-4 gap-3"
          >
            <span v-if="link.url" class="flex items-center">
              <i class="fas fa-external-link-alt mr-1"></i>
              <a :href="link.url" target="_blank" class="hover:text-primary transition-colors">
                {{ getDomain(link.url) }}
              </a>
            </span>

            <span class="flex items-center">
              <i class="fas fa-user mr-1"></i>
              <NuxtLink
                :to="`/users/${link.user.username}`"
                class="hover:text-primary transition-colors"
              >
                {{ link.user.username }}
              </NuxtLink>
            </span>

            <span
              class="flex items-center"
              :title="formatDate(link.promoted_at || link.created_at, 'full')"
            >
              <i class="fas fa-clock mr-1"></i>
              {{ formatDate(link.promoted_at || link.created_at) }}
            </span>
          </div>

          <div class="mb-5 flex flex-wrap">
            <NuxtLink v-for="tag in link.tags" :key="tag.id" :to="`/tags/${tag.name}`" class="tag">
              {{ tag.name }}
            </NuxtLink>
          </div>

          <div class="link-description text-lg mb-6 text-text dark:text-text-dark">
            <p>{{ link.description }}</p>
          </div>

          <div v-if="link.url" class="mb-6">
            <a :href="link.url" target="_blank" class="btn btn-primary inline-flex items-center">
              <i class="fas fa-external-link-alt mr-2"></i>
              {{ $t('links.show.visit_original') }}
            </a>
          </div>

          <div
            v-if="link.content"
            class="bg-gray-50 dark:bg-neutral-800 p-5 rounded-lg border border-gray-200 dark:border-neutral-700 mb-4"
          >
            <div
              v-html="formattedContent"
              class="prose prose-blue max-w-none dark:prose-invert"
            ></div>
          </div>

          <div v-if="link.image" class="mb-4">
            <img :src="link.image" :alt="link.title" class="max-w-full rounded-lg shadow-sm" />
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-gray-50 dark:bg-neutral-800 px-5 py-4 border-t border-gray-200 dark:border-neutral-700 flex justify-between text-sm text-text-muted dark:text-text-dark-muted"
    >
      <div class="flex items-center gap-4">
        <span class="flex items-center"
          ><i class="fas fa-eye mr-1"></i>{{ link.clicks }} {{ $t('links.visits') }}</span
        >
        <span class="flex items-center"
          ><i class="fas fa-bolt mr-1"></i>{{ formatNumber(link.karma) }}
          {{ $t('links.karma') }}</span
        >
      </div>
      <div class="flex space-x-3">
        <button
          class="hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700"
          @click="shareLink('twitter')"
        >
          <i class="fab fa-twitter"></i>
        </button>
        <button
          class="hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700"
          @click="shareLink('facebook')"
        >
          <i class="fab fa-facebook-f"></i>
        </button>
        <button
          class="hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700"
          @click="shareLink('whatsapp')"
        >
          <i class="fab fa-whatsapp"></i>
        </button>
        <button
          class="hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700"
          @click="copyLink"
        >
          <i class="fas fa-link"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useLinksStore } from '@/stores/links'

  const props = defineProps({
    link: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['voted'])
  const authStore = useAuthStore()
  const linksStore = useLinksStore()
  const isVoting = ref(false)

  const canVote = computed(() => authStore.isAuthenticated && !props.link.user_has_voted)
  const canDownvote = computed(() => canVote.value && authStore.userKarma >= 8)

  const formattedContent = computed(() => {
    if (!props.link.content) return ''
    return props.link.content.replace(/\n/g, '<br>')
  })

  function getDomain(url) {
    try {
      const domain = new URL(url).hostname
      return domain.replace(/^www\./, '')
    } catch (e) {
      return url
    }
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
    } else if (format === 'date') {
      return date.toLocaleDateString()
    } else {
      return date.toLocaleString()
    }
  }

  async function vote(value) {
    if (!canVote.value || (value === -1 && !canDownvote.value) || isVoting.value) return
    isVoting.value = true
    try {
      await linksStore.voteLink(props.link.id, value)
      emit('voted', {
        linkId: props.link.id,
        value,
      })
    } catch (error) {
      console.error('Error voting on link:', error)
    } finally {
      isVoting.value = false
    }
  }

  function shareLink(platform) {
    const url = window.location.href
    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(props.link.title)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(props.link.title + ' - ' + url)}`
        break
    }
    if (shareUrl) {
      window.open(shareUrl, '_blank')
    }
  }

  function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => alert('Link copied to clipboard!'))
      .catch((err) => console.error('Failed to copy link: ', err))
  }
</script>
