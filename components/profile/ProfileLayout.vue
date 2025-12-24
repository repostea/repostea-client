<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col lg:grid lg:grid-cols-4 gap-6">
      <div class="w-full lg:col-span-1">
        <ProfileNavigationMenu :active-tab="activeTab" />
      </div>

      <div class="w-full lg:col-span-3">
        <slot
          :user-data="userData"
          :user-achievements="userAchievements"
          :level-info="levelInfo"
          :progress-percentage="progressPercentage"
          :next-level-points="nextLevelPoints"
        />
      </div>
    </div>

    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="card-bg rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 class="text-lg font-medium mb-4 text-red-600 dark:text-red-400">
          {{ t('settings.confirm_delete') }}
        </h3>
        <p class="mb-6 text-text-muted dark:text-text-dark-muted">
          {{ t('settings.delete_warning') }}
        </p>
        <div class="flex justify-end space-x-3">
          <button
            class="profile-cancel-btn px-4 py-2 rounded-md text-text dark:text-text-dark"
            @click="showDeleteConfirmation = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            :disabled="deleteLoading"
            @click="deleteAccount"
          >
            <span
              v-if="deleteLoading"
              class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
            />
            {{ t('settings.confirm_delete_button') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useKarmaStore } from '~/stores/karma'
  import { useI18n } from '#i18n'

  import ProfileNavigationMenu from '~/components/profile/ProfileNavigationMenu.vue'

  defineProps({
    activeTab: {
      type: String,
      required: true,
    },
  })

  const emit = defineEmits(['delete-account'])

  const authStore = useAuthStore()
  const karmaStore = useKarmaStore()
  const { t } = useI18n()

  const deleteLoading = ref(false)
  const showDeleteConfirmation = ref(false)

  const userData = computed(() => authStore.user || {})

  const userAchievements = computed(() => {
    if (!userData.value || !userData.value.achievements || !userData.value.achievements.items) {
      return []
    }

    let allAchievements = []
    Object.entries(userData.value.achievements.items).forEach(([type, categoryAchievements]) => {
      categoryAchievements.forEach((achievement) => {
        achievement.type = type
      })
      allAchievements = [...allAchievements, ...categoryAchievements]
    })

    // Only show unlocked achievements
    const unlocked = allAchievements.filter((a) => a.unlocked_at || a.unlocked)

    return unlocked
  })

  const levelInfo = computed(() => {
    // Use current_level from userData (same as public profile)
    if (userData.value?.current_level) {
      return {
        level: userData.value.current_level.name,
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
    // If no next level (max level), show current karma + 1
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
    // If at max level, show 100%
    return 100
  })

  async function fetchUserKarmaData() {
    try {
      if (
        userData.value?.id &&
        (!karmaStore.karmaData ||
          !karmaStore.lastFetchTime ||
          Date.now() - karmaStore.lastFetchTime > 5 * 60 * 1000)
      ) {
        await karmaStore.fetchUserKarma(userData.value.id)
      }
    } catch (error) {
      console.error('Error cargando datos de karma:', error)
    }
  }

  function deleteAccount() {
    deleteLoading.value = true
    try {
      emit('delete-account')
    } finally {
      deleteLoading.value = false
      showDeleteConfirmation.value = false
    }
  }

  onMounted(async () => {
    await fetchUserKarmaData()
  })
</script>

<style scoped>
  .profile-cancel-btn {
    border: 1px solid var(--color-border-default);
  }
</style>
