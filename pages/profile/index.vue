<template>
  <ProfileLayout
    v-slot="{ userData, userAchievements, levelInfo, progressPercentage, nextLevelPoints }"
    active-tab="overview"
  >
    <!-- Email Verification Banner -->
    <ClientOnly>
      <div
        v-if="userData && userData.email_verified_at === null"
        class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <Icon
            name="fa6-solid:triangle-exclamation"
            class="text-yellow-600 dark:text-yellow-400 mt-1"
            aria-hidden="true"
          />
          <div class="flex-1">
            <h3 class="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
              {{ t('profile.email_not_verified_title') }}
            </h3>
            <p class="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
              {{ t('profile.email_not_verified_message') }}
            </p>
            <button
              :disabled="isSending"
              class="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="resendVerification"
            >
              <Icon name="fa6-solid:spinner" class="mr-2" aria-hidden="true" />
              <Icon name="fa6-solid:envelope" class="mr-2" aria-hidden="true" />
              {{ t('profile.resend_verification') }}
            </button>
            <p v-if="verificationSent" class="text-sm text-green-700 dark:text-green-400 mt-2">
              <Icon name="fa6-solid:circle-check" class="mr-1" aria-hidden="true" />
              {{ t('profile.verification_sent') }}
            </p>
          </div>
        </div>
      </div>
    </ClientOnly>

    <UserInfoCard :user="userData" :user-achievements="userAchievements" :is-own-profile="true" />
    <UserStatsCard
      :karma="userData?.karma_points || 0"
      :posts="userData?.posts_count || 0"
      :comments="userData?.comments_count || 0"
      :votes="userData?.votes_count || 0"
      :level="levelInfo"
      :progress-percentage="progressPercentage"
      :next-level-points="nextLevelPoints"
    />
  </ProfileLayout>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useI18n } from '#i18n'
  import { useAuthStore } from '~/stores/auth'
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'
  import UserInfoCard from '~/components/profile/UserInfoCard.vue'
  import UserStatsCard from '~/components/profile/UserStatsCard.vue'

  definePageMeta({
    middleware: ['auth'],
  })

  const { t } = useI18n()
  const authStore = useAuthStore()
  const { $api } = useNuxtApp()

  const isSending = ref(false)
  const verificationSent = ref(false)

  onMounted(async () => {
    // Always refresh user data to get latest email verification status
    await authStore.fetchUser()
  })

  async function resendVerification() {
    isSending.value = true
    verificationSent.value = false

    try {
      await $api.auth.resendVerificationEmail()
      verificationSent.value = true

      // Hide success message after 5 seconds
      setTimeout(() => {
        verificationSent.value = false
      }, 5000)
    } catch (error) {
      console.error('Error resending verification:', error)
    } finally {
      isSending.value = false
    }
  }
</script>
