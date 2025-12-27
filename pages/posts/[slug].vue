<template>
  <div>
    <!-- Draft Banner -->
    <div
      v-if="post && post.status === 'draft' && isAuthor"
      class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-start">
          <Icon
            name="fa6-solid:triangle-exclamation"
            class="text-yellow-600 dark:text-yellow-400 mt-1 mr-3"
            aria-hidden="true"
          />
          <div>
            <h3 class="font-bold text-yellow-800 dark:text-yellow-200">
              {{ t('posts.draft_mode') }}
            </h3>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {{ t('posts.draft_only_you_can_see') }}
            </p>
          </div>
        </div>
        <button
          :disabled="publishing"
          class="flex-shrink-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center"
          @click="publishDraft"
        >
          <Icon name="fa6-solid:spinner" class="mr-2 flex-shrink-0" aria-hidden="true" /><Icon
            name="fa6-solid:paper-plane"
            class="mr-2 flex-shrink-0"
            aria-hidden="true"
          />
          <span>{{ publishing ? t('posts.publishing') : t('posts.publish_now') }}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <button
            class="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
            @click="goBack"
          >
            <Icon name="fa6-solid:arrow-left" class="flex-shrink-0" aria-hidden="true" />
            <span class="ml-2 hidden sm:inline">{{ t('common.back_to_posts') }}</span>
          </button>
          <SimpleRegistrationCTA />
        </div>

        <div v-if="loading" class="flex justify-center items-center py-12">
          <LoadingSpinner size="xl" display="centered" :show-text="true" />
        </div>

        <template v-else-if="post">
          <!-- Continuation Chain -->
          <PostContinuationChain v-if="post.id" :post-id="post.id" :chain="continuationChain" />

          <PostCard
            :post="post"
            :show-full-text="true"
            :hide-comments="true"
            :hide-seal-border="true"
          >
            <template #below-vote>
              <CompactRegistrationCTA :author-name="post.user?.username || post.author_name" />
            </template>
            <template #cta>
              <RegistrationCTA :author-name="post.user?.username || post.author_name" />
            </template>
          </PostCard>

          <div id="comments" class="comments-section mt-6">
            <CommentsList
              v-if="post"
              :link-id="post.id || post.entryId"
              :initial-comments="[]"
              :post="post"
              @comment-submitted="onCommentSubmitted"
              @reply-submitted="onReplySubmitted"
              @comment-voted="onCommentVoted"
            />
          </div>

          <LargeRegistrationCTA
            :author-name="post.user?.username || post.author_name"
            class="mt-6"
          />
        </template>

        <div
          v-else-if="!loading"
          class="post-card-bg p-6 rounded-lg shadow-sm border post-border text-center"
        >
          <Icon
            name="fa6-solid:triangle-exclamation"
            class="text-3xl text-danger mb-3"
            aria-hidden="true"
          />
          <h2 class="text-xl font-bold mb-2">
            {{ t('errors.404.title') }}
          </h2>
          <p>{{ t('errors.404.message') }}</p>
        </div>
      </div>
      <div class="lg:col-span-1">
        <AuthorCard
          v-if="post"
          :user="post.user"
          :is-anonymous="post.is_anonymous"
          class="lg:mt-11"
        />

        <div ref="sidebarRef">
          <PostRelationshipsButton
            v-if="post && shouldLoadSidebar"
            :post-id="post.id"
            :relationships-count="post.relationships_count || 0"
            :post-title="post.title"
            :post-author-id="post.user?.id"
            :always-expanded="true"
            class="mb-6"
          />
          <div
            v-if="post && shouldLoadSidebar"
            class="post-card-bg rounded-lg shadow-sm border post-border"
          >
            <div class="px-4 py-3 border-b post-border">
              <h3 class="font-medium inline-flex items-center">
                <Icon name="fa6-solid:share-nodes" class="mr-2 flex-shrink-0" aria-hidden="true" />
                <span>{{ t('links.show.share') }}</span>
              </h3>
            </div>
            <div class="p-4">
              <div class="flex justify-around">
                <button
                  class="p-2 rounded-full post-share-btn text-primary"
                  :aria-label="t('links.show.share_on', { platform: 'Twitter' })"
                  @click="shareOnSocialMedia('twitter')"
                >
                  <Icon name="fa6-brands:twitter" aria-hidden="true" />
                </button>
                <button
                  class="p-2 rounded-full post-share-btn text-primary"
                  :aria-label="t('links.show.share_on', { platform: 'Facebook' })"
                  @click="shareOnSocialMedia('facebook')"
                >
                  <Icon name="fa6-brands:facebook-f" aria-hidden="true" />
                </button>
                <button
                  class="p-2 rounded-full post-share-btn text-primary"
                  :aria-label="t('links.show.share_on', { platform: 'WhatsApp' })"
                  @click="shareOnSocialMedia('whatsapp')"
                >
                  <Icon name="fa6-brands:whatsapp" aria-hidden="true" />
                </button>
                <button
                  class="p-2 rounded-full post-share-btn text-primary"
                  :aria-label="t('common.copy_link')"
                  @click="copyToClipboard()"
                >
                  <Icon name="fa6-solid:link" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showShareModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="post-card-bg rounded-lg shadow-lg max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">{{ t('links.show.share') }}</h3>
          <button
            class="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            :aria-label="t('common.close')"
            @click="showShareModal = false"
          >
            <Icon name="fa6-solid:xmark" aria-hidden="true" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="flex space-x-4 justify-center mb-4">
            <button
              class="w-12 h-12 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition-colors"
              :aria-label="t('links.show.share_on', { platform: 'Twitter' })"
              @click="shareOnSocialMedia('twitter')"
            >
              <Icon name="fa6-brands:twitter" aria-hidden="true" />
            </button>
            <button
              class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
              :aria-label="t('links.show.share_on', { platform: 'Facebook' })"
              @click="shareOnSocialMedia('facebook')"
            >
              <Icon name="fa6-brands:facebook-f" aria-hidden="true" />
            </button>
            <button
              class="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
              :aria-label="t('links.show.share_on', { platform: 'WhatsApp' })"
              @click="shareOnSocialMedia('whatsapp')"
            >
              <Icon name="fa6-brands:whatsapp" aria-hidden="true" />
            </button>
          </div>

          <div>
            <div class="flex items-center border post-modal-border rounded-md overflow-hidden">
              <input
                v-model="shareUrl"
                type="text"
                readonly
                :aria-label="t('common.share_link')"
                class="flex-grow py-2 px-3 post-modal-input focus:outline-none"
              >
              <button
                class="px-3 py-2 post-modal-copy-btn transition-colors"
                :aria-label="t('common.copy_link')"
                @click="copyToClipboard()"
              >
                <Icon name="fa6-solid:copy" aria-hidden="true" />
              </button>
            </div>
            <p v-if="copied" class="text-green-500 text-sm mt-1">¡Enlace copiado!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch, watchEffect, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useHead, useSeoMeta } from '#imports' // Added for JSON-LD
  import { usePostsStore } from '~/stores/posts'
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath, useI18n } from '#i18n'
  import AuthorCard from '~/components/posts/AuthorCard.vue'
  import CommentsList from '~/components/comments/CommentsList.vue'
  import PostCard from '~/components/posts/PostCard.vue'
  import PostRelationshipsButton from '~/components/posts/PostRelationshipsButton.vue'
  import PostContinuationChain from '~/components/posts/PostContinuationChain.vue'
  import RegistrationCTA from '~/components/common/RegistrationCTA.vue'
  import CompactRegistrationCTA from '~/components/common/CompactRegistrationCTA.vue'
  import LargeRegistrationCTA from '~/components/common/LargeRegistrationCTA.vue'
  import SimpleRegistrationCTA from '~/components/common/SimpleRegistrationCTA.vue'
  import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

  const { t, locale } = useI18n()

  // Easter egg dialects - canonical should point to Spanish version
  const dialectLocales = ['ast', 'ara', 'mur', 'and', 'can', 'ext', 'cnt']
  const isDialect = computed(() => dialectLocales.includes(locale.value))

  const route = useRoute()
  const router = useRouter()
  const postsStore = usePostsStore()
  const authStore = useAuthStore()
  const localePath = useLocalePath()

  const showShareModal = ref(false)
  const shareUrl = ref('')
  const copied = ref(false)
  const viewRegistered = ref(false)

  // Reset viewRegistered on client when component is mounted
  // This ensures view is registered on each page load
  if (import.meta.client) {
    viewRegistered.value = false
  }
  const publishing = ref(false)
  const continuationChain = ref([])
  const sidebarRef = ref(null)
  const shouldLoadSidebar = ref(false)

  // Fetch post data during SSR
  const { data: post, pending: loading } = await useAsyncData(
    `post-${route.params.slug}`,
    async () => {
      const slug = route.params.slug
      const isNumeric = /^\d+$/.test(slug)

      try {
        if (isNumeric) {
          await postsStore.fetchPost(slug)
        } else {
          await postsStore.fetchPostBySlug(slug)
        }
        return postsStore.currentPost
      } catch (error) {
        console.error('Error loading post:', error)
        return null
      }
    },
    {
      server: true, // Enable SSR
      lazy: false, // Wait for data before rendering
    }
  )

  // Check if current user is the author
  const isAuthor = computed(() => {
    if (!post.value || !authStore.isAuthenticated) return false
    return post.value.user?.id === authStore.user?.id
  })

  // Helper function to generate description from HTML content
  function generateDescription(htmlString) {
    if (!htmlString) return ''
    const plainText = htmlString.replace(/<[^>]*>?/gm, '')
    return plainText.substring(0, 155) + (plainText.length > 155 ? '...' : '')
  }

  function goBack() {
    if (import.meta.client) {
      try {
        if (post.value) {
          localStorage.setItem('lastViewedPostId', post.value.id || post.value.entryId)
        }
        localStorage.setItem('returningToList', 'true')
        router.push(localePath('/'))
      } catch (e) {
        console.error('Error al guardar estado:', e)
        router.back()
      }
    } else {
      router.back()
    }
  }

  // Watch for hash changes to handle comment navigation
  watch(
    () => route.hash,
    (newHash) => {
      if (newHash && newHash.startsWith('#c-')) {
        nextTick(() => {
          scrollToComment(newHash.substring(1))
        })
      }
    }
  )

  function onCommentSubmitted(_comment) {
    if (post.value) {
      post.value.numComments = (post.value.numComments || 0) + 1
    }
  }

  function onReplySubmitted(_data) {
    if (post.value) {
      post.value.numComments = (post.value.numComments || 0) + 1
    }
  }

  function onCommentVoted(_data) {
    // Actualizar estado local si es necesario
  }

  function shareOnSocialMedia(platform) {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(post.value?.title || '')

    let shareUrl

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${title} ${url}`
        break
      default:
        return
    }

    window.open(shareUrl, '_blank')
  }

  function copyToClipboard() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        copied.value = true
        setTimeout(() => {
          copied.value = false
        }, 2000)
      })
      .catch((err) => {
        console.error('Error al copiar enlace:', err)
      })
  }

  function scrollToComment(commentId) {
    const commentElement = document.getElementById(commentId)
    if (commentElement) {
      // Calculate the header height to offset the scroll
      const headerHeight = 120
      const elementPosition = commentElement.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - headerHeight

      // Scroll to the comment with offset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })

      // Add highlight effect after a small delay to ensure scroll completes
      setTimeout(() => {
        commentElement.classList.add('highlight-comment')

        // Also add a pulsing animation for extra visibility
        commentElement.style.animation = 'none'
        setTimeout(() => {
          commentElement.style.animation = ''
        }, 10)

        // Keep the highlight permanent - don't remove it
      }, 800)
    }
  }

  // Handle numeric slug redirect on client
  watch(
    () => post.value,
    (newPost) => {
      if (newPost && import.meta.client) {
        const slug = route.params.slug
        const isNumeric = /^\d+$/.test(slug)

        if (isNumeric && newPost.slug) {
          router.replace(localePath(`/posts/${newPost.slug}`))
        }
      }
    },
    { immediate: true }
  )

  async function fetchContinuationChain() {
    if (!post.value) return

    try {
      const { $api } = useNuxtApp()
      const response = await $api.posts.getContinuationChain(post.value.id)
      continuationChain.value = response.data?.data || response.data || []
    } catch {
      // Silently fail - continuation chain is not critical
      continuationChain.value = []
    }
  }

  async function publishDraft() {
    if (!post.value || publishing.value) return

    publishing.value = true
    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBaseUrl}/posts/${post.value.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
        body: {
          status: 'published',
        },
      })

      // Update post status from response
      if (response && response.data) {
        post.value.status = response.data.status

        // Show success notification
        if (import.meta.client) {
          const event = new CustomEvent('show-notification', {
            detail: {
              message: t('posts.published_successfully'),
              type: 'success',
            },
          })
          window.dispatchEvent(event)
        }

        // Refresh post data
        await fetchPost()
      }
    } catch (error) {
      console.error('Error publishing draft:', error)

      // Show error notification
      if (import.meta.client) {
        const event = new CustomEvent('show-notification', {
          detail: {
            message: t('posts.publish_error'),
            type: 'error',
          },
        })
        window.dispatchEvent(event)
      }
    } finally {
      publishing.value = false
    }
  }

  // Setup SEO meta tags - must be at component setup level for SSR
  // This computed will run during SSR and update on client if post changes
  const setupSeoMeta = computed(() => {
    if (!post.value) return null

    const newPost = post.value
    const runtimeConfig = useRuntimeConfig()

    let descriptionText = ''
    if (newPost.excerpt) {
      descriptionText = newPost.excerpt
    } else if (newPost.content) {
      descriptionText = generateDescription(newPost.content)
    }

    let ogImageUrl = newPost.thumbnail_url
    const siteBaseUrl = runtimeConfig.public.siteUrl

    // Ensure absolute URL for image
    if (ogImageUrl && !ogImageUrl.startsWith('http')) {
      ogImageUrl = `${siteBaseUrl}${ogImageUrl}`
    } else if (!ogImageUrl) {
      ogImageUrl = `${siteBaseUrl}/logo-wolf.png`
    }

    // For dialects, canonical URL should point to Spanish version
    let canonicalPath = route.fullPath
    if (isDialect.value) {
      canonicalPath = canonicalPath.replace(new RegExp(`^/${locale.value}/`), '/es/')
    }
    const postUrl = `${siteBaseUrl}${canonicalPath}`

    // Generate keywords from tags
    const keywords =
      newPost.tags && newPost.tags.length > 0
        ? newPost.tags.map((tag) => tag.name).join(', ')
        : `${runtimeConfig.public.appName}, comunidad, debate`

    const seoMetaConfig = {
      title: newPost.title,
      description: descriptionText,
      keywords: keywords,
      ogTitle: newPost.title,
      ogDescription: descriptionText,
      ogImage: ogImageUrl,
      ogUrl: postUrl,
      ogType: 'article',
      ogImageWidth: newPost.thumbnail_url ? '1200' : '512',
      ogImageHeight: newPost.thumbnail_url ? '630' : '512',
      twitterCard: ogImageUrl ? 'summary_large_image' : 'summary',
      twitterTitle: newPost.title,
      twitterDescription: descriptionText,
      twitterImage: ogImageUrl,
      twitterSite: runtimeConfig.public.twitterHandle || undefined,
      'article:published_time': newPost.created_at
        ? new Date(newPost.created_at).toISOString()
        : '',
    }

    // Only add author meta tag if post is not anonymous
    if (!newPost.is_anonymous && newPost.user?.name) {
      seoMetaConfig['article:author'] = newPost.user.name
    }

    // Prevent indexing of NSFW content
    if (newPost.is_nsfw) {
      seoMetaConfig.robots = 'noindex, nofollow'
    }

    return seoMetaConfig
  })

  // Apply SEO meta tags - this will work during SSR
  watchEffect(() => {
    if (setupSeoMeta.value) {
      useSeoMeta(setupSeoMeta.value)
    }
  })

  // JSON-LD Article Structured Data - also needs to run during SSR
  watchEffect(() => {
    if (!post.value) return

    const newPost = post.value
    const runtimeConfig = useRuntimeConfig()

    let descriptionText = ''
    if (newPost.excerpt) {
      descriptionText = newPost.excerpt
    } else if (newPost.content) {
      descriptionText = generateDescription(newPost.content)
    }

    let ogImageUrl = newPost.thumbnail_url
    const siteBaseUrl = runtimeConfig.public.siteUrl

    if (ogImageUrl && !ogImageUrl.startsWith('http')) {
      ogImageUrl = `${siteBaseUrl}${ogImageUrl}`
    } else if (!ogImageUrl) {
      ogImageUrl = `${siteBaseUrl}/logo-wolf.png`
    }

    // For dialects, canonical URL should point to Spanish version
    let canonicalPath = route.fullPath
    if (isDialect.value) {
      canonicalPath = canonicalPath.replace(new RegExp(`^/${locale.value}/`), '/es/')
    }
    const postUrl = `${siteBaseUrl}${canonicalPath}`

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': postUrl,
      },
      headline: newPost.title,
      description: descriptionText,
      image: ogImageUrl,
      datePublished: newPost.created_at
        ? new Date(newPost.created_at).toISOString()
        : new Date().toISOString(),
      dateModified: newPost.updated_at
        ? new Date(newPost.updated_at).toISOString()
        : newPost.created_at
          ? new Date(newPost.created_at).toISOString()
          : new Date().toISOString(),
      publisher: {
        '@type': 'Organization',
        name: runtimeConfig.public.appName,
        logo: {
          '@type': 'ImageObject',
          url: `${siteBaseUrl}/logo-wolf.png`,
        },
      },
      url: postUrl,
    }

    // Only add author information if post is not anonymous
    if (!newPost.is_anonymous && newPost.user) {
      articleSchema.author = {
        '@type': 'Person',
        name: newPost.user.name || `${runtimeConfig.public.appName} Community`,
      }

      // Only add URL if username exists
      if (newPost.user.username) {
        articleSchema.author.url = `${siteBaseUrl}/u/${newPost.user.username}`
      }
    }

    useHead({
      link: [
        {
          rel: 'canonical',
          href: postUrl,
        },
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(articleSchema),
          tagPosition: 'bodyClose',
        },
      ],
    })
  })

  onMounted(async () => {
    // Fetch continuation chain on client
    if (post.value) {
      await fetchContinuationChain()
    }

    if (import.meta.client && post.value && !viewRegistered.value) {
      try {
        const { $api } = useNuxtApp()
        const { getSessionId, getScreenResolution, getReferer } = useSession()
        const postId = post.value.id || post.value.entryId

        // Prepare tracking data
        const trackingData = {
          referer: getReferer(),
          screen_resolution: getScreenResolution(),
          session_id: getSessionId(),
          // UTM parameters from query string
          utm_source: route.query.utm_source,
          utm_medium: route.query.utm_medium,
          utm_campaign: route.query.utm_campaign,
          utm_term: route.query.utm_term,
          utm_content: route.query.utm_content,
        }

        const response = await $api.posts.registerView(postId, trackingData)

        viewRegistered.value = true

        if (response.data && response.data.views) {
          post.value.views = response.data.views
        } else {
          post.value.views = (post.value.views || 0) + 1
        }
      } catch {
        // Silently fail - view registration is not critical for user experience
        viewRegistered.value = false
      }
    }

    // Check if there's a comment hash in the URL and scroll to it
    if (import.meta.client && window.location.hash) {
      const hash = window.location.hash
      if (hash.startsWith('#c-')) {
        const commentId = hash.substring(1)

        let attempts = 0
        const maxAttempts = 20
        const delays = [300, 300, 500, 500, 700, 700, 1000, 1000]

        const checkForComment = async () => {
          while (attempts < maxAttempts) {
            attempts++
            const delay = delays[Math.min(attempts - 1, delays.length - 1)] || 1000

            await new Promise((resolve) => setTimeout(resolve, delay))

            const commentElement = document.getElementById(commentId)

            if (commentElement) {
              scrollToComment(commentId)
              return
            }
          }
        }

        checkForComment()
      }
    }

    if (import.meta.client && post.value) {
      shareUrl.value = window.location.href
    }
  })

  onMounted(() => {
    if (!import.meta.client) return

    const isDesktop = window.innerWidth >= 1024

    if (isDesktop) {
      shouldLoadSidebar.value = true
    } else {
      if (sidebarRef.value) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                shouldLoadSidebar.value = true
                observer.disconnect()
              }
            })
          },
          {
            rootMargin: '200px',
            threshold: 0.01,
          }
        )
        observer.observe(sidebarRef.value)
      }
    }
  })
</script>

<style scoped>
  /* Highlight for linked comments - more visible border and background */
  :deep(.highlight-comment) {
    border-color: rgba(59, 130, 246, 0.7) !important;
    border-width: 2px !important;
    background-color: rgba(59, 130, 246, 0.08) !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
    transition: all 0.3s ease-in-out;
  }

  /* Small indicator on the side - more prominent */
  :deep(.highlight-comment) {
    position: relative;
  }

  :deep(.highlight-comment::after) {
    content: '';
    position: absolute;
    left: -1px;
    top: 10px;
    bottom: 10px;
    width: 4px;
    background: linear-gradient(to bottom, rgb(59, 130, 246), rgb(37, 99, 235));
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  }

  /* Pulse animation for extra visibility */
  @keyframes commentPulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
    }
  }

  :deep(.highlight-comment) {
    animation: commentPulse 2s ease-in-out 2;
  }

  .post-card-bg {
    background-color: var(--color-bg-card);
  }

  .post-border {
    border-color: var(--color-border-default);
  }

  .post-share-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .post-modal-border {
    border-color: var(--color-border-default);
  }

  .post-modal-input {
    background-color: var(--color-bg-subtle);
  }

  .post-modal-copy-btn {
    background-color: var(--color-bg-subtle);
  }

  .post-modal-copy-btn:hover {
    background-color: var(--color-bg-hover);
  }
</style>
