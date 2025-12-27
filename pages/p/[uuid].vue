<template>
  <div class="flex justify-center items-center py-12">
    <div
      class="spinner w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
    />
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useLocalePath } from '#i18n'
  import { useSeoMeta, useRuntimeConfig, useHead } from '#imports'

  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const runtimeConfig = useRuntimeConfig()

  const uuid = route.params.uuid

  // SSR: Fetch post data for SEO meta tags
  const { data: post } = await useFetch(
    `${runtimeConfig.public.apiBaseUrl}/v1/posts/permalink/${uuid}`,
    {
      key: `permalink-${uuid}`,
    }
  )

  // Setup SEO meta tags during SSR (crawlers will see these)
  if (post.value) {
    const postData = post.value.data || post.value

    // Build absolute URLs
    const siteBaseUrl = runtimeConfig.public.siteUrl
    const canonicalUrl = postData.slug
      ? `${siteBaseUrl}/posts/${postData.slug}`
      : `${siteBaseUrl}/p/${uuid}`

    let ogImageUrl = postData.thumbnail_url
    if (ogImageUrl && !ogImageUrl.startsWith('http')) {
      ogImageUrl = `${siteBaseUrl}${ogImageUrl}`
    } else if (!ogImageUrl) {
      ogImageUrl = `${siteBaseUrl}/logo-wolf.png`
    }

    // Description from excerpt or content
    let description = postData.excerpt || ''
    if (!description && postData.content) {
      description = postData.content.replace(/<[^>]*>/g, '').substring(0, 160)
    }

    useSeoMeta({
      title: postData.title,
      description: description,
      ogTitle: postData.title,
      ogDescription: description,
      ogImage: ogImageUrl,
      ogUrl: canonicalUrl,
      ogType: 'article',
      twitterCard: 'summary_large_image',
      twitterTitle: postData.title,
      twitterDescription: description,
      twitterImage: ogImageUrl,
    })

    // Canonical URL pointing to the real post URL
    useHead({
      link: [{ rel: 'canonical', href: canonicalUrl }],
    })
  }

  // Client-side: redirect users to the pretty URL
  onMounted(() => {
    if (post.value) {
      const postData = post.value.data || post.value
      if (postData.slug) {
        const targetUrl = localePath(`/posts/${postData.slug}`) + (route.hash || '')
        router.replace(targetUrl)
        return
      }
    }
    // Post not found or no slug - redirect home
    router.replace(localePath('/'))
  })
</script>

<style scoped>
  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
