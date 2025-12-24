<template>
  <div
    class="user-info-card card-bg rounded-lg shadow-sm overflow-hidden mb-6"
  >
    <div class="bg-primary h-16 relative"/>
    <div class="px-4 pt-0 pb-4 text-center">
      <div
        class="user-info-avatar w-20 h-20 rounded-full mx-auto -mt-10 overflow-hidden flex items-center justify-center z-10 relative"
      >
        <Icon v-if="!user.avatar" name="fa6-solid:user" class="text-gray-400 text-2xl" aria-hidden="true" />
        <NuxtImg v-else :src="user.avatar" :alt="`${user.display_name || user.username}`" width="80" height="80" class="w-full h-full object-cover" loading="lazy" preset="avatar" />
      </div>
      <h3 class="font-medium text-lg mt-2">
        <ClientOnly fallback="...">
          {{ user.username || '...' }}
        </ClientOnly>
      </h3>
      <!-- ActivityPub Handle (own profile from settings, others from API) -->
      <p
        v-if="displayFederationHandle"
        class="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center justify-center gap-1"
        :title="t('profile.fediverse_handle')"
      >
        <Icon name="fa6-solid:globe" class="text-primary text-[10px]" aria-hidden="true" />
        {{ displayFederationHandle }}
      </p>
      <!-- Follow from Fediverse button (only for other users with federation) -->
      <button
        v-if="!isOwnProfile && user.federation?.handle"
        class="mt-2 px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors inline-flex items-center gap-1"
        @click="showFollowModal = true"
      >
        <Icon name="fa6-solid:rss" class="text-[10px]" aria-hidden="true" />
        {{ t('profile.follow_fediverse') }}
      </button>
      <p v-if="user.bio" class="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
        {{ user.bio }}
      </p>
      <div class="flex justify-center text-sm text-gray-500 dark:text-gray-400 mt-2">
        <div class="flex items-center">
          <Icon name="fa6-solid:trophy" class="text-yellow-500 mr-1" aria-hidden="true" />
          <span>{{ user.karma_points || 0 }}</span>
        </div>
      </div>
      <ClientOnly>
        <template #fallback>
          <div class="h-4 mt-1"/>
        </template>
        <div class="flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 mt-1 opacity-70">
          <Icon name="fa6-solid:calendar-days" class="mr-1 text-[10px]" aria-hidden="true" />
          {{ formatDate(user.created_at) }}
        </div>
      </ClientOnly>

      <!-- Mini Achievements -->
      <MiniAchievementsList
        v-if="userAchievements && userAchievements.length > 0"
        :achievements="userAchievements"
        :user-achievements="userAchievements"
        :username="user.username"
      />
    </div>

    <!-- Follow from Fediverse Modal -->
    <Teleport to="body">
      <div
        v-if="showFollowModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showFollowModal = false"
      >
        <div class="fixed inset-0 bg-black/50" aria-hidden="true"/>
        <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <button
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="showFollowModal = false"
          >
            <Icon name="fa6-solid:xmark" class="text-xl" />
          </button>

          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="fa6-solid:globe" class="text-primary" />
            {{ t('profile.follow_from_fediverse') }}
          </h3>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ t('profile.follow_fediverse_description') }}
          </p>

          <!-- Handle to copy -->
          <div class="flex items-center gap-2 mb-4">
            <code class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-mono overflow-x-auto">
              {{ user.federation?.handle }}
            </code>
            <button
              class="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
              :title="t('common.copy')"
              @click="copyHandle"
            >
              <Icon :name="copied ? 'fa6-solid:check' : 'fa6-solid:copy'" />
            </button>
          </div>

          <!-- Platform links -->
          <div class="space-y-2">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ t('profile.or_search_on') }}</p>
            <div class="flex flex-wrap gap-2">
              <a
                :href="`https://mastodon.social/search?q=${encodeURIComponent(user.federation?.handle)}`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-[#6364FF]/10 hover:bg-[#6364FF]/20 text-[#6364FF] rounded-full text-sm transition-colors"
              >
                <Icon name="simple-icons:mastodon" class="text-sm" />
                Mastodon
              </a>
              <a
                :href="`https://kbin.earth/search?search[q]=${encodeURIComponent(user.federation?.handle)}&search[type]=0`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full text-sm transition-colors"
              >
                <Icon name="fa6-solid:k" class="text-sm" />
                Kbin
              </a>
              <a
                :href="`https://fedia.io/search?search[q]=${encodeURIComponent(user.federation?.handle)}&search[type]=0`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-sm transition-colors"
              >
                <Icon name="fa6-solid:m" class="text-sm" />
                Mbin
              </a>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useI18n } from '#i18n'
  import MiniAchievementsList from '~/components/profile/MiniAchievementsList.vue'
  import { useActivityPub } from '~/composables/useActivityPub'

  const { t } = useI18n()
  const { fetchUserSettings, userHandle } = useActivityPub()

  const props = defineProps({
    user: {
      type: Object,
      required: true,
    },
    userAchievements: {
      type: Array,
      default: () => [],
    },
    isOwnProfile: {
      type: Boolean,
      default: false,
    },
  })

  const federationHandle = ref(null)
  const showFollowModal = ref(false)
  const copied = ref(false)

  // Display handle: own profile from settings, others from API
  const displayFederationHandle = computed(() => {
    if (props.isOwnProfile && federationHandle.value) {
      return federationHandle.value
    }
    return props.user.federation?.handle || null
  })

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
    }).format(date)
  }

  async function copyHandle() {
    const handle = props.user.federation?.handle
    if (!handle) return

    try {
      await navigator.clipboard.writeText(handle)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = handle
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    }
  }

  // Fetch federation settings to get the handle
  onMounted(async () => {
    if (props.isOwnProfile) {
      await fetchUserSettings()
      federationHandle.value = userHandle.value
    }
  })

  // Update handle when userHandle changes
  watch(userHandle, (newHandle) => {
    if (props.isOwnProfile) {
      federationHandle.value = newHandle
    }
  })
</script>

<style scoped>
  .user-info-card {
    border: 1px solid var(--color-border-default);
  }

  .user-info-avatar {
    background-color: var(--color-bg-hover);
    border: 4px solid var(--color-bg-card);
  }
</style>
