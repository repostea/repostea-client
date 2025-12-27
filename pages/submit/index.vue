<template>
  <div class="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="card-bg rounded-lg shadow-sm border submit-border">
          <div class="px-3 sm:px-6 py-3 sm:py-4 border-b submit-border">
            <h1 class="text-xl font-medium inline-flex items-center">
              <Icon name="fa6-solid:circle-plus" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('submit.title') }}</span>
            </h1>
          </div>
          <PostFormWizard
            :edit-mode="!!editPostId"
            :post-id="editPostId"
            @submit="onPostSubmitted"
            @cancel="goToHome"
          />
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="card-bg rounded-lg shadow-sm border submit-border">
          <div class="px-6 py-4 border-b submit-border">
            <h3 class="font-medium inline-flex items-center">
              <Icon name="fa6-solid:lightbulb" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('submit.tips_title') }}</span>
            </h3>
          </div>
          <div class="p-4">
            <ul class="space-y-3 list-inside list-disc text-sm">
              <li>{{ t('submit.tips.descriptive_title') }}</li>
              <li>{{ t('submit.tips.no_caps') }}</li>
              <li>{{ t('submit.tips.clear_description') }}</li>
              <li>{{ t('submit.tips.relevant_tags') }}</li>
              <li>{{ t('submit.tips.own_content') }}</li>
              <li>{{ t('submit.tips.mark_nsfw') }}</li>
            </ul>
          </div>
        </div>

        <div class="card-bg rounded-lg shadow-sm border submit-border mt-4">
          <div class="px-6 py-4 border-b submit-border">
            <h3 class="font-medium inline-flex items-center">
              <Icon name="fa6-solid:film" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('submit.media_tips_title') }}</span>
            </h3>
          </div>
          <div class="p-4">
            <ul class="space-y-3 list-inside list-disc text-sm">
              <li>{{ t('submit.media_tips.video_platforms') }}</li>
              <li>{{ t('submit.media_tips.audio_platforms') }}</li>
              <li>{{ t('submit.media_tips.no_storage') }}</li>
              <li>{{ t('submit.media_tips.detailed_description') }}</li>
              <li>{{ t('submit.media_tips.community_guidelines') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useRouter, useRoute } from 'vue-router'
  import { useLocalePath, useI18n } from '#i18n'
  import PostFormWizard from '~/components/posts/PostFormWizard.vue'
  import { useAuthStore } from '~/stores/auth'
  import { useSystemSettings } from '~/composables/useSystemSettings'
  import { onMounted, computed } from 'vue'

  const { t } = useI18n()
  const router = useRouter()
  const route = useRoute()
  const localePath = useLocalePath()

  // Get edit post ID from URL query parameter
  const editPostId = computed(() => {
    const editParam = route.query.edit
    return editParam ? parseInt(editParam, 10) : null
  })
  const authStore = useAuthStore()
  const { settings } = useSystemSettings()

  onMounted(async () => {
    if (!authStore.initialized) {
      await authStore.initialize()
    }
    if (!authStore.isAuthenticated) {
      // Redirect to login page which includes anonymous posting option
      router.push(
        localePath('/auth/login') + '?redirect=' + encodeURIComponent(localePath('/submit'))
      )
      return
    }

    // Check if email verification is required and user hasn't verified
    if (
      settings.value.email_verification === 'required' &&
      !authStore.user?.is_guest &&
      !authStore.user?.email_verified_at
    ) {
      router.push(localePath('/auth/verify-email'))
    }
  })

  function goToHome() {
    router.push(localePath('/'))
  }

  async function onPostSubmitted(post) {
    // Invalidate cache to show the new post immediately in pending list
    const { usePostsStore } = await import('~/stores/posts')
    const postsStore = usePostsStore()
    postsStore._clearCache()

    // Redirect to the post detail page
    router.push(localePath(`/posts/${post.slug || post.id}`))
  }
</script>

<style scoped>
  .submit-border {
    border-color: var(--color-border-default);
  }
</style>
