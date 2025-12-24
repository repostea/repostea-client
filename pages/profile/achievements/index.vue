<template>
  <ProfileLayout active-tab="achievements">
    <div
      class="bg-white dark:bg-card-dark rounded-lg shadow-sm border achievements-border overflow-hidden"
    >
      <div class="px-6 py-4 border-b achievements-border">
        <h2 class="text-lg font-medium">{{ t('achievements.title') }}</h2>
      </div>
      <div class="p-6">
        <div v-if="userAchievements && userAchievements.length > 0">
          <AchievementsList :achievements="userAchievements" :user-achievements="userAchievements" />
        </div>
        <div v-else class="text-center py-12">
          <div class="text-primary text-4xl mb-3">
            <Icon name="fa6-solid:trophy" aria-hidden="true" />
          </div>
          <h3 class="text-lg font-medium mb-2">{{ t('achievements.none_yet') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('achievements.how_to_earn') }}
          </p>
        </div>
      </div>
    </div>
  </ProfileLayout>
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n } from '#i18n'
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'
  import AchievementsList from '~/components/profile/AchievementsList.vue'

  definePageMeta({
    middleware: ['auth'],
  })

  const authStore = useAuthStore()
  const { t } = useI18n()

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

  onMounted(async () => {
    if (authStore.shouldRefreshUser) {
      await authStore.fetchUser()
    }
  })
</script>

<style scoped>
  .achievements-border {
    border-color: var(--color-border-default);
  }
</style>
