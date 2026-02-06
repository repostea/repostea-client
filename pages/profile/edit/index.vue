<template>
  <ProfileLayout active-tab="profile">
    <!-- Personal Info Section -->
    <div
      class="bg-white dark:bg-card-dark rounded-lg shadow-sm border profile-edit-border overflow-hidden mb-6"
    >
      <div class="px-6 py-4 border-b profile-edit-border">
        <h2 class="text-lg font-medium">{{ t('profile.personal_info') }}</h2>
      </div>
      <div class="p-6">
        <UserProfileForm :user="userData" @updated="handleProfileUpdated" />
      </div>
    </div>

    <!-- Tortilla Easter Egg -->
    <div
      class="bg-white dark:bg-card-dark rounded-lg shadow-sm border profile-edit-border overflow-hidden"
    >
      <div class="px-6 py-4 border-b profile-edit-border">
        <h2 class="text-lg font-medium">{{ t('profile.tortilla.title') }}</h2>
      </div>
      <div class="p-6">
        <label class="block text-sm font-medium mb-3 text-text dark:text-text-dark">
          {{ t('profile.tortilla.question') }}
        </label>

        <div class="space-y-2">
          <label
            class="flex items-center space-x-3 cursor-pointer p-3 rounded-lg profile-edit-option-hover transition-colors"
          >
            <input
              v-model="tortillaPreference"
              type="radio"
              name="tortilla"
              value="con-cebolla"
              class="w-5 h-5 text-primary profile-edit-radio focus:ring-2 focus:ring-primary cursor-pointer"
              @change="handleTortillaChange"
            />
            <span class="text-sm text-text dark:text-text-dark">{{
              t('profile.tortilla.with_onion')
            }}</span>
          </label>

          <label
            v-if="showSinCebollaOption"
            class="flex items-center space-x-3 cursor-pointer p-3 rounded-lg profile-edit-option-hover transition-colors"
          >
            <input
              v-model="tortillaPreference"
              type="radio"
              name="tortilla"
              value="sin-cebolla"
              class="w-5 h-5 text-primary profile-edit-radio focus:ring-2 focus:ring-primary cursor-pointer"
              @change="handleTortillaChange"
            />
            <span class="text-sm text-text dark:text-text-dark">{{
              t('profile.tortilla.without_onion')
            }}</span>
          </label>
        </div>

        <!-- Mensaje cuando se bloquea la opción -->
        <div
          v-if="tortillaBlocked"
          class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg"
        >
          <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-200 text-center">
            {{ t('profile.tortilla.blocked_message') }}
          </p>
          <p class="text-xs text-yellow-700 dark:text-yellow-300 text-center mt-2">
            {{ t('profile.tortilla.blocked_subtitle') }}
          </p>
        </div>
      </div>
    </div>
  </ProfileLayout>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n } from '#i18n'
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'
  import UserProfileForm from '~/components/profile/UserProfileForm.vue'

  definePageMeta({
    middleware: ['auth'],
  })

  const authStore = useAuthStore()
  const { t } = useI18n()

  const successMessage = ref('')

  const userData = computed(() => authStore.user || {})

  // Tortilla Easter Egg state
  const tortillaPreference = ref('con-cebolla')
  const sinCebollaAttempts = ref(0)
  const showSinCebollaOption = ref(true)
  const tortillaBlocked = ref(false)
  let tortillaTimeout = null

  function handleTortillaChange() {
    if (tortillaPreference.value === 'sin-cebolla') {
      sinCebollaAttempts.value++

      if (sinCebollaAttempts.value >= 3) {
        // Third time: block the 'sin cebolla' (no onion) option
        showSinCebollaOption.value = false
        tortillaBlocked.value = true
        tortillaPreference.value = 'con-cebolla'
      } else {
        // First or second time: auto-change after 0.9 seconds
        if (tortillaTimeout) {
          clearTimeout(tortillaTimeout)
        }

        tortillaTimeout = setTimeout(() => {
          tortillaPreference.value = 'con-cebolla'
        }, 900)
      }
    }
  }

  function handleProfileUpdated() {
    successMessage.value = t('profile.profile_updated')
  }

  onMounted(async () => {
    if (authStore.shouldRefreshUser) {
      await authStore.fetchUser()
    }
  })
</script>

<style scoped>
  .profile-edit-border {
    border-color: var(--color-border-default);
  }

  .profile-edit-option-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .profile-edit-radio {
    background-color: var(--color-bg-input);
    border-color: var(--color-border-default);
  }
</style>
