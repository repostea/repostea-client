<template>
  <ClientOnly>
    <template #fallback>
      <div class="container mx-auto p-6 flex justify-center">
        <div
          class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
    </template>
    <div v-if="loading" class="container mx-auto p-6 flex justify-center">
      <div
        class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
      />
    </div>

    <!-- Página especial para usuarios eliminados -->
    <div v-else-if="isDeletedUser" class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="card-bg rounded-lg shadow-sm border user-border p-8 text-center">
          <div class="mb-6">
            <div
              class="w-16 h-16 mx-auto mb-4 user-avatar-placeholder rounded-full flex items-center justify-center"
            >
              <Icon
                name="fa6-solid:user-slash"
                class="text-2xl text-gray-500 dark:text-gray-400"
                aria-hidden="true"
              />
            </div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {{ userData?.display_name || t('profile.deleted_user') }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('profile.deleted_user_description') }}
            </p>
          </div>

          <div class="user-info-box rounded-lg p-6 mb-6">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('profile.deleted_user_content_remains') }}
            </p>
          </div>

          <div class="text-sm text-gray-500 dark:text-gray-500">
            <p>{{ t('profile.posts') }}: {{ userData?.posts_count || 0 }}</p>
            <p>{{ t('profile.comments') }}: {{ userData?.comments_count || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Página especial para usuarios efímeros -->
    <div v-else-if="isAnonymousUser" class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="card-bg rounded-lg shadow-sm border user-border p-8 text-center">
          <div class="mb-6">
            <div
              class="w-16 h-16 mx-auto mb-4 user-avatar-placeholder rounded-full flex items-center justify-center"
            >
              <Icon
                name="fa6-solid:user-secret"
                class="text-2xl text-gray-500 dark:text-gray-400"
                aria-hidden="true"
              />
            </div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {{ t('profile.anonymous_user') }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('profile.anonymous_user_description') }}
            </p>
          </div>

          <div class="user-info-box rounded-lg p-6 mb-6">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-3">
              {{ t('profile.anonymous_features_title') }}
            </h3>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li class="inline-flex items-center">
                <Icon
                  name="fa6-solid:check"
                  class="text-green-500 mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{{ t('profile.anonymous_feature_1') }}</span>
              </li>
              <li class="inline-flex items-center">
                <Icon
                  name="fa6-solid:check"
                  class="text-green-500 mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{{ t('profile.anonymous_feature_2') }}</span>
              </li>
              <li class="inline-flex items-center">
                <Icon
                  name="fa6-solid:xmark"
                  class="text-red-500 mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{{ t('profile.anonymous_limitation_1') }}</span>
              </li>
              <li class="inline-flex items-center">
                <Icon
                  name="fa6-solid:xmark"
                  class="text-red-500 mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{{ t('profile.anonymous_limitation_2') }}</span>
              </li>
            </ul>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <NuxtLink
              :to="localePath('/register')"
              class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
              ><Icon name="fa6-solid:user-plus" class="mr-2 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('auth.register') }}</span>
            </NuxtLink>
            <NuxtLink
              :to="localePath('/login')"
              class="inline-flex items-center px-4 py-2 user-secondary-btn rounded-md transition-colors"
              ><Icon
                name="fa6-solid:right-to-bracket"
                class="mr-2 flex-shrink-0"
                aria-hidden="true"
              />
              <span>{{ t('auth.login') }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="userData" class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1">
          <UserInfoCard
            :user="userData"
            :user-achievements="getAchievementsForMiniList()"
            :is-own-profile="false"
          />
          <UserStatsCard
            v-if="userData?.karma_points !== null && userData?.current_level !== null"
            :karma="userData?.karma_points || 0"
            :posts="userData?.posts_count || 0"
            :comments="userData?.comments_count || 0"
            :votes="userData?.votes_count || 0"
            :level="levelInfo"
            :progress-percentage="progressPercentage"
            :next-level-points="nextLevelPoints"
            :has-karma-for-level="userData?.current_level?.has_karma_for_level ?? true"
          />
        </div>

        <div class="lg:col-span-3">
          <div class="mb-6 border-b user-border overflow-x-auto md:overflow-x-visible">
            <nav class="flex -mb-px">
              <button
                class="py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm inline-flex items-center whitespace-nowrap"
                :class="
                  activeTab === 'achievements'
                    ? 'border-primary text-primary dark:border-primary dark:text-primary-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                "
                @click="activeTab = 'achievements'"
              >
                <Icon
                  name="fa6-solid:trophy"
                  class="mr-1 sm:mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{{ t('achievements.title') }}</span>
              </button>
              <button
                class="ml-2 sm:ml-4 md:ml-8 py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm inline-flex items-center whitespace-nowrap"
                :class="
                  activeTab === 'posts'
                    ? 'border-primary text-primary dark:border-primary dark:text-primary-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                "
                @click="activeTab = 'posts'"
              >
                <Icon
                  name="fa6-solid:newspaper"
                  class="mr-1 sm:mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{{ t('profile.posts') }}</span>
              </button>
              <button
                class="ml-2 sm:ml-4 md:ml-8 py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm inline-flex items-center whitespace-nowrap"
                :class="
                  activeTab === 'comments'
                    ? 'border-primary text-primary dark:border-primary dark:text-primary-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                "
                @click="activeTab = 'comments'"
              >
                <Icon
                  name="fa6-solid:comments"
                  class="mr-1 sm:mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{{ t('profile.comments') }}</span>
              </button>
            </nav>
          </div>

          <!-- Posts Tab -->
          <div v-if="activeTab === 'posts'">
            <UserPostsTab :username="userData.username" />
          </div>

          <!-- Comments Tab -->
          <div v-if="activeTab === 'comments'">
            <UserCommentsTab :username="userData.username" />
          </div>

          <!-- Achievements Tab -->
          <div v-if="activeTab === 'achievements'" class="space-y-6">
            <div v-if="userAchievements && userAchievements.items">
              <div class="card-bg rounded-lg p-6">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-medium">{{ t('achievements.title') }}</h3>
                </div>

                <AchievementsList
                  :achievements="getAchievementsForMiniList()"
                  :user-achievements="getAchievementsForMiniList()"
                />
              </div>
            </div>
            <div v-else class="card-bg rounded-lg p-8 text-center">
              <div class="text-gray-400 dark:text-gray-500 text-4xl mb-3">
                <Icon name="fa6-solid:lock" aria-hidden="true" />
              </div>
              <h3 class="text-lg font-medium mb-2">{{ t('profile.achievements_hidden') }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('profile.achievements_hidden_description') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!loading" class="container mx-auto p-6">
      <div class="card-bg rounded-lg shadow-sm border user-border p-8 text-center">
        <div class="text-red-500 text-4xl mb-3">
          <Icon name="fa6-solid:circle-exclamation" aria-hidden="true" />
        </div>
        <h2 class="text-xl font-bold mb-2">{{ t('errors.user_not_found') }}</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ t('errors.user_not_found_message') }}
        </p>
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          ><Icon name="fa6-solid:house" class="mr-2 flex-shrink-0" aria-hidden="true" />
          <span>{{ t('common.go_home') }}</span>
        </NuxtLink>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { useSeoMeta } from '#imports' // Nuxt 3 auto-imports
  import { useRuntimeConfig } from '#app' // To get siteUrl
  import { useI18n, useLocalePath } from '#i18n'
  import UserInfoCard from '~/components/profile/UserInfoCard.vue'
  import UserStatsCard from '~/components/profile/UserStatsCard.vue'
  import AchievementsList from '~/components/profile/AchievementsList.vue'
  import UserPostsTab from '~/components/profile/UserPostsTab.vue'
  import UserCommentsTab from '~/components/profile/UserCommentsTab.vue'

  const route = useRoute()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const loading = ref(true)
  const userData = ref(null)
  const activeTab = ref('achievements')

  const userAchievements = ref(null)

  const isAnonymousUser = computed(() => {
    return route.params.username === 'anonymous'
  })

  const isDeletedUser = computed(() => {
    return userData.value?.is_deleted === true
  })

  const levelInfo = computed(() => {
    // Use current_level from userData (API response)
    // Backend already translates the name according to user's locale
    if (userData.value?.current_level) {
      return {
        level: userData.value.current_level.name, // Already translated by backend
        min: userData.value.current_level.required_karma || 0,
        max: userData.value.current_level.next_level
          ? userData.value.current_level.next_level.required_karma
          : (userData.value.current_level.required_karma || 0) + 1000,
      }
    }
    return { level: 'Novato', min: 0, max: 50 }
  })

  const nextLevelPoints = computed(() => {
    if (userData.value?.current_level?.next_level) {
      return userData.value.current_level.next_level.required_karma
    }
    // If there's no next level (maximum level), show current karma + 1
    return (userData.value?.karma_points || 0) + 1
  })

  const progressPercentage = computed(() => {
    if (userData.value?.current_level?.next_level) {
      const currentLevelMin = userData.value.current_level.required_karma
      const nextLevelMin = userData.value.current_level.next_level.required_karma
      const range = nextLevelMin - currentLevelMin
      const progress = (userData.value?.karma_points || 0) - currentLevelMin
      return Math.min(Math.max((progress / range) * 100, 0), 100)
    }
    // If at maximum level, show 100%
    return 100
  })

  // Removed watcher - now achievements tab is always visible even when hidden

  onMounted(async () => {
    if (!authStore.initialized) {
      await authStore.initialize()
    }

    const username = route.params.username

    // Skip API call for ephemeral users
    if (username === 'anonymous') {
      loading.value = false
      return
    }

    try {
      loading.value = true
      const response = await $api.users.getUserByUsername(username, {
        requireAuth: false,
      })

      userData.value = response.data.data
      if (response.data.achievements) {
        userAchievements.value = response.data.achievements
      } else {
        // Explicitly set to null if achievements are hidden
        userAchievements.value = null
      }

      // No need to fetch karma data separately - API now includes current_level

      // SEO Meta Tags Implementation
      if (userData.value) {
        const runtimeConfig = useRuntimeConfig()
        const siteBaseUrl = runtimeConfig.public.siteUrl || 'http://localhost:3000' // Fallback, ensure this is configured
        const profileUrl = `${siteBaseUrl}${route.fullPath}`

        let descriptionText = ''
        if (userData.value.bio) {
          const plainTextBio = userData.value.bio.replace(/<[^>]*>?/gm, '') // Basic strip tags
          descriptionText =
            plainTextBio.substring(0, 155) + (plainTextBio.length > 155 ? '...' : '')
        } else {
          descriptionText = `View the profile of ${userData.value.username} on ${runtimeConfig.public.appName}. Discover their contributions, posts, and comments.`
        }

        let ogImageUrl = userData.value.avatar
        if (!ogImageUrl) {
          ogImageUrl = `${siteBaseUrl}/logo-wolf.png`
        } else if (!ogImageUrl.startsWith('http')) {
          ogImageUrl = siteBaseUrl + (ogImageUrl.startsWith('/') ? '' : '/') + ogImageUrl
        }

        // Generate keywords from user info
        const keywords = `${userData.value.username}, ${runtimeConfig.public.appName}, perfil, usuario, ${userData.value.karma || 0} karma`

        useSeoMeta({
          title: `${userData.value.name || userData.value.username}'s Profile | ${runtimeConfig.public.appName}`,
          description: descriptionText,
          keywords: keywords,
          ogTitle: `${userData.value.name || userData.value.username}'s Profile | ${runtimeConfig.public.appName}`,
          ogDescription: descriptionText,
          ogImage: ogImageUrl,
          ogUrl: profileUrl,
          ogType: 'profile',
          ogSiteName: runtimeConfig.public.appName,
          ogImageWidth: '200',
          ogImageHeight: '200',
          'profile:username': userData.value.username,
          twitterCard: ogImageUrl.includes('default-avatar.png')
            ? 'summary'
            : 'summary_large_image',
          twitterTitle: `${userData.value.name || userData.value.username}'s Profile | ${runtimeConfig.public.appName}`,
          twitterDescription: descriptionText,
          twitterImage: ogImageUrl,
          twitterSite: runtimeConfig.public.twitterHandle || undefined,
        })

        // Set canonical URL
        useHead({
          link: [
            {
              rel: 'canonical',
              href: profileUrl,
            },
          ],
        })

        // Add Person structured data
        const personSchema = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': profileUrl,
          url: profileUrl,
          name: userData.value.name || userData.value.username,
          alternateName: userData.value.username,
          description: descriptionText,
          image: ogImageUrl,
        }

        // Add additional properties if available
        if (userData.value.created_at) {
          personSchema.memberOf = {
            '@type': 'Organization',
            '@id': `${siteBaseUrl}/#organization`,
            name: runtimeConfig.public.appName,
          }
        }

        useHead({
          script: [
            {
              type: 'application/ld+json',
              children: JSON.stringify(personSchema),
              tagPosition: 'bodyClose',
            },
          ],
        })
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error)
      userData.value = null
    } finally {
      loading.value = false
    }
  })

  function getAchievementsForMiniList() {
    if (!userAchievements.value || !userAchievements.value.items) {
      return []
    }

    let allAchievements = []
    Object.entries(userAchievements.value.items).forEach(([type, categoryAchievements]) => {
      categoryAchievements.forEach((achievement) => {
        achievement.type = type
      })
      allAchievements = [...allAchievements, ...categoryAchievements]
    })

    // Only show unlocked achievements
    const unlocked = allAchievements.filter((a) => a.unlocked_at || a.unlocked)

    return unlocked
  }
</script>

<style scoped>
  .user-border {
    border-color: var(--color-border-default);
  }

  .user-avatar-placeholder {
    background-color: var(--color-bg-subtle);
  }

  .user-info-box {
    background-color: var(--color-bg-subtle);
  }

  .user-secondary-btn {
    border: 1px solid var(--color-border-default);
    color: var(--color-text-secondary);
  }

  .user-secondary-btn:hover {
    background-color: var(--color-bg-hover);
  }
</style>
