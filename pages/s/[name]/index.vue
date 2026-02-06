<template>
  <div class="container mx-auto p-2 sm:p-4">
    <!-- Beta Warning Banner -->
    <div
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6"
    >
      <div class="flex items-start gap-3">
        <Icon
          name="fa6-solid:triangle-exclamation"
          class="text-yellow-600 dark:text-yellow-400 text-lg mt-0.5"
          aria-hidden="true"
        />
        <div>
          <h3 class="font-semibold text-yellow-900 dark:text-yellow-200 text-sm mb-1">
            {{ $t('subs.beta_warning.title') }}
          </h3>
          <p class="text-yellow-800 dark:text-yellow-300 text-xs">
            {{ $t('subs.beta_warning.description') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="py-8 text-center">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"
      />
      <p class="mt-2 text-gray-500 dark:text-gray-400">{{ $t('common.loading') }}</p>
    </div>

    <!-- Error state / Sub not found -->
    <div v-else-if="error" class="py-8">
      <div
        class="max-w-2xl mx-auto sub-view-card-bg rounded-lg shadow-sm border sub-view-border p-8 text-center"
      >
        <Icon
          name="fa6-solid:folder-open"
          class="text-6xl text-gray-400 dark:text-gray-600 mb-4"
          aria-hidden="true"
        />
        <h2 class="text-2xl font-bold mb-3 text-text dark:text-text-dark">
          {{ $t('subs.sub_not_found_title') }}
        </h2>
        <p class="text-text-muted dark:text-text-dark-muted mb-6">
          {{ $t('subs.sub_not_found_description') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink
            :to="localePath('/s/create')"
            class="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium inline-flex items-center justify-center"
          >
            <Icon name="fa6-solid:plus" class="mr-2" aria-hidden="true" />
            {{ $t('subs.create_this_sub') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/s')"
            class="px-6 py-3 sub-view-secondary-btn text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium inline-flex items-center justify-center"
          >
            <Icon name="fa6-solid:compass" class="mr-2" aria-hidden="true" />
            {{ $t('subs.explore_subs') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Sub details -->
    <div v-else-if="sub" class="space-y-3 sm:space-y-6">
      <!-- Sub header -->
      <div class="sub-view-card-bg rounded-lg shadow-sm border sub-view-border">
        <div class="p-3 sm:p-6">
          <div class="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
            <SubIcon
              :sub="sub"
              size="xl"
              class="!w-10 !h-10 sm:!w-16 sm:!h-16 !text-xl sm:!text-2xl !rounded-xl"
            />
            <div class="flex-1 min-w-0">
              <h1 class="text-lg sm:text-2xl font-bold break-words">s/{{ sub.name }}</h1>
              <p class="text-xs sm:text-base text-gray-600 dark:text-gray-400 break-words">
                {{ sub.display_name }}
              </p>
            </div>
            <div v-if="!sub.is_member" class="flex-shrink-0">
              <!-- Solicitud pendiente -->
              <div
                v-if="requestPending"
                class="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md"
              >
                <Icon name="fa6-solid:clock" class="text-sm" aria-hidden="true" />
                {{ $t('subs.request_pending_status') }}
              </div>
              <!-- Botón para sub privado (abre modal) -->
              <button
                v-else-if="sub.is_private"
                class="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-primary text-white rounded-md hover:bg-primary-dark transition-colors whitespace-nowrap flex items-center gap-2"
                @click="showJoinRequestModal = true"
              >
                <Icon name="fa6-solid:lock" class="text-sm" aria-hidden="true" />
                {{ $t('subs.request_join') }}
              </button>
              <!-- Botón normal para sub público -->
              <button
                v-else
                class="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-primary text-white rounded-md hover:bg-primary-dark transition-colors whitespace-nowrap"
                @click="joinSub"
              >
                {{ $t('subs.join') }}
              </button>
            </div>
          </div>

          <p class="mb-2 sm:mb-3 text-xs sm:text-base">{{ sub.description }}</p>

          <div
            class="flex flex-wrap items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400"
          >
            <div class="flex flex-wrap gap-2 sm:gap-4">
              <div class="flex items-center">
                <Icon name="fa6-solid:users" class="mr-1.5 sm:mr-2" aria-hidden="true" />
                <span>{{
                  (sub.members_count || 0).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
                }}</span>
              </div>
              <div class="flex items-center">
                <Icon name="fa6-solid:file-lines" class="mr-1.5 sm:mr-2" aria-hidden="true" />
                <span>{{
                  (sub.posts_count || 0).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
                }}</span>
              </div>
              <div class="flex items-center text-gray-500 dark:text-gray-500">
                <Icon name="fa6-solid:calendar-days" class="mr-1.5 sm:mr-2" aria-hidden="true" />
                <span class="hidden sm:inline">{{ formatDate(sub.created_at) }}</span>
                <span class="sm:hidden">{{ formatDateShort(sub.created_at) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="sub.is_member"
                class="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:underline transition-colors whitespace-nowrap"
                @click="leaveSub"
              >
                {{ $t('subs.leave') }}
              </button>
              <NuxtLink
                v-if="sub.is_moderator"
                :to="localePath(`/s/${sub.name}/settings`)"
                class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors inline-flex items-center gap-1"
              >
                <Icon name="fa6-solid:gear" class="text-[10px]" aria-hidden="true" />
                {{ $t('subs.settings') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Orphaned Sub Banner - Claim Ownership -->
      <div
        v-if="sub.is_orphaned && sub.can_claim"
        class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
      >
        <div class="flex items-start gap-3">
          <Icon
            name="fa6-solid:crown"
            class="text-orange-600 dark:text-orange-400 text-lg mt-0.5"
            aria-hidden="true"
          />
          <div class="flex-1">
            <h3 class="font-semibold text-orange-900 dark:text-orange-200 text-sm mb-1">
              {{ $t('subs.orphaned_sub') }}
            </h3>
            <p class="text-orange-800 dark:text-orange-300 text-xs mb-3">
              {{ $t('subs.orphaned_sub_description') }}
            </p>
            <button
              :disabled="claimingOwnership"
              class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              @click="claimOwnership"
            >
              <Icon
                v-if="claimingOwnership"
                name="fa6-solid:spinner"
                class="animate-spin"
                aria-hidden="true"
              />
              <Icon v-else name="fa6-solid:hand" aria-hidden="true" />
              {{
                sub.has_claim_priority ? $t('subs.claim_as_moderator') : $t('subs.claim_as_member')
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- Orphaned Sub Info - User cannot claim (moderators have priority) -->
      <div
        v-else-if="sub.is_orphaned && !sub.can_claim && sub.is_member"
        class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
      >
        <div class="flex items-start gap-3">
          <Icon
            name="fa6-solid:circle-info"
            class="text-gray-500 dark:text-gray-400 text-lg mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-1">
              {{ $t('subs.orphaned_sub') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-xs">
              {{ $t('subs.waiting_for_moderators') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Sub content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        <!-- Main content (posts) -->
        <div class="lg:col-span-2">
          <div class="controls-container mb-4">
            <div class="controls-wrapper">
              <div class="left-controls">
                <FilterControls @filter-changed="handleFilterChanged" />
                <ContentLanguageSelector />
              </div>
              <LayoutSelector />
            </div>
          </div>
          <PostList
            :posts="posts"
            :meta="postsMeta"
            :loading="loading"
            :current-page="postsPage"
            :show-pagination="true"
            :layout="layout"
            @page-changed="postsPage = $event"
          />
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-3 sm:space-y-6">
          <!-- About the sub -->
          <div class="sub-view-card-bg rounded-lg shadow-sm border sub-view-border">
            <div class="p-3 sm:p-4">
              <h3 class="font-bold text-sm sm:text-base mb-2 sm:mb-3">{{ $t('subs.about') }}</h3>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                {{ sub.description }}
              </p>

              <div
                v-if="sub.creator?.username && !sub.hide_owner"
                class="flex justify-between mb-2 text-xs sm:text-sm"
              >
                <span class="font-medium">{{ $t('subs.owner') }}</span>
                <NuxtLink
                  :to="localePath(`/u/${sub.creator.username}`)"
                  class="text-primary hover:underline"
                >
                  {{ sub.creator.username }}
                </NuxtLink>
              </div>

              <div
                class="flex justify-between text-xs sm:text-sm"
                :class="{ 'mt-2': !sub.creator?.username || sub.hide_owner }"
              >
                <span class="font-medium">{{ $t('subs.created_at') }}</span>
                <span class="text-gray-600 dark:text-gray-400">{{
                  formatDateShort(sub.created_at)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Fediverse -->
          <div
            v-if="sub.federation_enabled && sub.fediverse_handle"
            class="sub-view-card-bg rounded-lg shadow-sm border sub-view-border"
          >
            <div class="p-3 sm:p-4">
              <h3 class="font-bold text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                <Icon name="fa6-solid:globe" class="text-primary" aria-hidden="true" />
                {{ $t('subs.fediverse') }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {{ $t('subs.fediverse_follow_description') }}
              </p>
              <code
                class="text-xs sm:text-sm text-primary bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block break-all"
              >
                {{ sub.fediverse_handle }}
              </code>
            </div>
          </div>

          <!-- Moderators -->
          <div
            v-if="sub.public_moderators?.length > 0 && !sub.hide_moderators"
            class="sub-view-card-bg rounded-lg shadow-sm border sub-view-border"
          >
            <div class="p-3 sm:p-4">
              <h3 class="font-bold text-sm sm:text-base mb-2 sm:mb-3">
                {{ $t('subs.moderators') }}
              </h3>
              <div class="space-y-2">
                <NuxtLink
                  v-for="mod in sub.public_moderators"
                  :key="mod.id"
                  :to="localePath(`/u/${mod.username}`)"
                  class="flex items-center gap-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1 transition-colors"
                >
                  <img
                    v-if="mod.avatar"
                    :src="mod.avatar"
                    :alt="mod.username"
                    class="w-6 h-6 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
                  >
                    <Icon name="fa6-solid:user" class="text-primary text-xs" aria-hidden="true" />
                  </div>
                  <span class="text-primary hover:underline">{{ mod.username }}</span>
                  <span
                    v-if="mod.pivot?.is_owner"
                    class="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded"
                  >
                    {{ $t('subs.owner') }}
                  </span>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Sub rules -->
          <div
            v-if="rules.length > 0"
            class="sub-view-card-bg rounded-lg shadow-sm border sub-view-border"
          >
            <div class="p-3 sm:p-4">
              <h3 class="font-bold text-sm sm:text-base mb-2 sm:mb-3">{{ $t('subs.rules') }}</h3>
              <div class="space-y-2 sm:space-y-3">
                <div v-for="rule in rules" :key="rule.id" class="text-xs sm:text-sm">
                  <h4 class="font-medium">{{ rule.title }}</h4>
                  <p v-if="rule.description" class="text-gray-600 dark:text-gray-400">
                    {{ rule.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Create post button -->
          <div v-if="sub" class="sub-view-card-bg rounded-lg shadow-sm border sub-view-border">
            <div class="p-3 sm:p-4">
              <NuxtLink
                :to="localePath(`/submit?sub=${sub.name}`)"
                class="block w-full px-3 py-2 sm:px-4 text-sm sm:text-base bg-primary text-white text-center rounded-md hover:bg-primary-dark transition-colors"
              >
                {{ $t('posts.create_post') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal para solicitar unirse a sub privado -->
  <Teleport to="body">
    <div
      v-if="showJoinRequestModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showJoinRequestModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div
          class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <h3 class="text-lg font-bold flex items-center gap-2">
            <Icon name="fa6-solid:lock" class="text-primary" aria-hidden="true" />
            {{ $t('subs.request_join_title') }}
          </h3>
          <button
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            @click="showJoinRequestModal = false"
          >
            <Icon name="fa6-solid:xmark" aria-hidden="true" />
          </button>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ $t('subs.request_join_description', { name: sub?.name }) }}
          </p>
          <label class="block text-sm font-medium mb-2">
            {{ $t('subs.request_message_label') }}
            <span class="text-gray-400 font-normal">({{ $t('common.optional') }})</span>
          </label>
          <textarea
            v-model="joinRequestMessage"
            :placeholder="$t('subs.request_message_placeholder')"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm resize-none"
            rows="3"
            maxlength="500"
          />
          <p class="text-xs text-gray-500 mt-1 text-right">{{ joinRequestMessage.length }}/500</p>
        </div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            @click="showJoinRequestModal = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            :disabled="submittingRequest"
            class="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
            @click="submitJoinRequest"
          >
            <Icon
              v-if="submittingRequest"
              name="fa6-solid:spinner"
              class="animate-spin"
              aria-hidden="true"
            />
            {{ $t('subs.send_request') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Leave Sub Confirmation Dialog -->
  <ConfirmDialog
    v-model="showLeaveConfirm"
    :title="$t('subs.leave')"
    :message="leaveConfirmMessage"
    :confirm-text="$t('subs.leave')"
    :cancel-text="$t('common.cancel')"
    :type="sub?.is_owner ? 'danger' : 'warning'"
    @confirm="confirmLeaveSub"
  />
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { useSubsStore } from '~/stores/subs'
  import { useUserPreferencesStore } from '~/stores/userPreferences'
  import { useSeoMeta } from '#imports'
  import { useRuntimeConfig } from '#app'
  import { useNotification } from '~/composables/useNotification'
  import PostList from '~/components/posts/PostList.vue'
  import FilterControls from '~/components/posts/FilterControls.vue'
  import LayoutSelector from '~/components/posts/LayoutSelector.vue'
  import ContentLanguageSelector from '~/components/common/ContentLanguageSelector.vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const authStore = useAuthStore()
  const subsStore = useSubsStore()
  const userPreferencesStore = useUserPreferencesStore()
  const runtimeConfig = useRuntimeConfig()
  const { info, success, error: showError } = useNotification()

  // State
  const postsPage = ref(1)
  const postsPerPage = ref(10)
  const sort = ref('new')
  const direction = ref('desc')
  const layout = computed(() => userPreferencesStore.layout)

  // Join request state
  const showJoinRequestModal = ref(false)
  const joinRequestMessage = ref('')
  const submittingRequest = ref(false)
  const requestPending = ref(false)
  const claimingOwnership = ref(false)
  const showLeaveConfirm = ref(false)

  // Computed
  const sub = computed(() => subsStore.currentSub)
  const rules = computed(() => subsStore.subRules)
  const posts = computed(() => subsStore.subPosts)
  const loading = computed(() => subsStore.loading)
  const error = computed(() => subsStore.error)
  const postsMeta = computed(() => subsStore.postsMeta)

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const subName = computed(() => route.params.name)

  const leaveConfirmMessage = computed(() => {
    const name = sub.value?.display_name || sub.value?.name
    if (sub.value?.is_owner) {
      return t('subs.confirm_leave_owner', { name })
    }
    return t('subs.confirm_leave', { name })
  })

  // Load data on mount (client-side with auth)
  onMounted(() => {
    fetchSub()
  })

  // Watch for changes in route params
  watch(
    () => route.params.name,
    (newName, oldName) => {
      if (oldName !== undefined && newName !== oldName) {
        fetchSub()
      }
    }
  )

  // Watch for sub changes to update SEO meta tags
  watch(
    sub,
    (newSubValue) => {
      if (newSubValue && newSubValue.name) {
        const siteBaseUrl = runtimeConfig.public.siteUrl || 'http://localhost:3000' // Fallback
        const subPageUrl = `${siteBaseUrl}${route.fullPath}`

        let descriptionText = ''
        if (newSubValue.description) {
          const plainText = String(newSubValue.description).replace(/<[^>]*>?/gm, '') // Basic strip
          descriptionText = plainText.substring(0, 120) // Shorter to allow for stats
          descriptionText += `... Discover more in the s/${newSubValue.name} community on ${runtimeConfig.public.appName}. ${newSubValue.members_count || 0} members, ${newSubValue.posts_count || 0} posts.`
        } else {
          descriptionText = `Join the s/${newSubValue.name} community on ${runtimeConfig.public.appName}. ${newSubValue.members_count || 0} members, ${newSubValue.posts_count || 0} posts.`
        }
        descriptionText =
          descriptionText.substring(0, 155) + (descriptionText.length > 155 ? '...' : '')

        const ogImageUrl = `${siteBaseUrl}/logo-wolf.png`

        // Generate keywords from sub info
        const keywords = `${newSubValue.name}, ${runtimeConfig.public.appName}, comunidad, sub, ${newSubValue.title || newSubValue.name}`

        useSeoMeta({
          title: `s/${newSubValue.name} - ${newSubValue.title || newSubValue.name} | ${runtimeConfig.public.appName}`,
          description: descriptionText,
          keywords: keywords,
          ogTitle: `s/${newSubValue.name} - ${newSubValue.title || newSubValue.name} | ${runtimeConfig.public.appName}`,
          ogDescription: descriptionText,
          ogImage: ogImageUrl,
          ogUrl: subPageUrl,
          ogType: 'website',
          ogSiteName: runtimeConfig.public.appName,
          twitterCard: 'summary',
          twitterTitle: `s/${newSubValue.name} - ${newSubValue.title || newSubValue.name} | ${runtimeConfig.public.appName}`,
          twitterDescription: descriptionText,
          twitterImage: ogImageUrl,
          twitterSite: runtimeConfig.public.twitterHandle || undefined,
        })

        // Set canonical URL
        useHead({
          link: [
            {
              rel: 'canonical',
              href: subPageUrl,
            },
          ],
        })

        // Add CollectionPage structured data
        useHead({
          script: [
            {
              type: 'application/ld+json',
              children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                '@id': subPageUrl,
                url: subPageUrl,
                name: `s/${newSubValue.name} - ${newSubValue.title || newSubValue.name}`,
                description: descriptionText,
                isPartOf: {
                  '@id': `${siteBaseUrl}/#website`,
                },
                inLanguage: 'es-ES',
              }),
              tagPosition: 'bodyClose',
            },
          ],
        })
      }
    },
    { immediate: true }
  )

  // Watch for changes in posts page or sort
  watch(
    [postsPage, sort],
    () => {
      if (sub.value) {
        fetchPosts()
      }
    },
    { deep: true }
  )

  // Methods
  function handleFilterChanged(_filters) {
    // Handle filter changes if needed
    // For now, we can just reset to first page
    postsPage.value = 1
  }

  async function fetchSub() {
    // Don't fetch if subName is undefined (happens when navigating away from the page)
    if (!subName.value) return

    // Clear previous sub data
    subsStore.clearCurrentSub()

    try {
      await subsStore.fetchSub(subName.value)

      if (sub.value) {
        // Fetch rules and posts
        await Promise.all([subsStore.fetchSubRules(sub.value.id), fetchPosts()])
      }
    } catch (err) {
      console.error('Error fetching sub:', err)
    }
  }

  async function fetchPosts() {
    if (!sub.value) return

    const params = {
      page: postsPage.value,
      per_page: postsPerPage.value,
      sort: sort.value,
      direction: direction.value,
    }

    try {
      await subsStore.fetchSubPosts(sub.value.id, params)
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  async function joinSub() {
    if (!isAuthenticated.value) {
      // Show authentication message to anonymous users
      info(t('subs.join_login_required'))
      return
    }

    if (!sub.value) return

    try {
      const response = await subsStore.joinSub(sub.value.id)
      // Check if this was a request (for private subs)
      if (response?.request_pending) {
        requestPending.value = true
        info(t('subs.request_sent_success'))
      }
    } catch (err) {
      console.error('Error joining sub:', err)
    }
  }

  async function submitJoinRequest() {
    if (!isAuthenticated.value) {
      info(t('subs.join_login_required'))
      return
    }

    if (!sub.value) return

    submittingRequest.value = true
    try {
      const { $api } = useNuxtApp()
      const response = await $api.post(`/subs/${sub.value.id}/join`, {
        message: joinRequestMessage.value,
      })

      if (response.data?.request_pending) {
        requestPending.value = true
        showJoinRequestModal.value = false
        joinRequestMessage.value = ''
        info(t('subs.request_sent_success'))
      }
    } catch (err) {
      console.error('Error submitting join request:', err)
      // Check if already has pending request
      if (err.response?.data?.request_pending) {
        requestPending.value = true
        showJoinRequestModal.value = false
      }
    } finally {
      submittingRequest.value = false
    }
  }

  function leaveSub() {
    if (!sub.value) return
    showLeaveConfirm.value = true
  }

  async function confirmLeaveSub() {
    if (!sub.value) return

    try {
      await subsStore.leaveSub(sub.value.id)
    } catch (err) {
      console.error('Error leaving sub:', err)
    }
  }

  async function claimOwnership() {
    if (!sub.value) return

    claimingOwnership.value = true
    try {
      const { $api } = useNuxtApp()
      await $api.subs.claimOwnership(sub.value.id)
      success(t('subs.claim_success'))
      await fetchSub() // Refresh sub data
    } catch (err) {
      console.error('Error claiming ownership:', err)
      showError(err.response?.data?.message || t('subs.claim_error'))
    } finally {
      claimingOwnership.value = false
    }
  }

  function formatDate(dateString) {
    if (!dateString) return ''

    const date = new Date(dateString)
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  function formatDateShort(dateString) {
    if (!dateString) return ''

    const date = new Date(dateString)
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
    }).format(date)
  }
</script>

<style scoped>
  .sub-view-card-bg {
    background-color: var(--color-bg-card);
  }

  /* Controls layout and styling */
  .controls-container {
    @apply rounded-md p-1 border;
    background-color: rgba(var(--color-bg-card-rgb, 255, 255, 255), 0.7);
    border-color: var(--color-border-default);
  }

  .controls-wrapper {
    @apply flex flex-col sm:flex-row items-center justify-between gap-1;
  }

  .left-controls {
    @apply flex flex-col sm:flex-row items-center gap-1;
  }

  .sub-view-border {
    border-color: var(--color-border-default);
  }

  .sub-view-secondary-btn {
    background-color: var(--color-bg-subtle);
  }

  .sub-view-secondary-btn:hover {
    background-color: var(--color-bg-active);
  }

  .sub-view-icon-bg {
    background-color: var(--color-bg-subtle);
  }
</style>
