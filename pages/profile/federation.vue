<template>
  <ProfileLayout active-tab="federation">
    <div class="space-y-6">
      <div
        class="card-bg rounded-lg shadow-sm border settings-border overflow-hidden"
      >
        <div class="px-6 py-4 border-b settings-border">
          <h2 class="text-lg font-medium inline-flex items-center">
            <Icon name="fa6-solid:globe" class="mr-2 text-primary" aria-hidden="true" />
            {{ t('settings.federation.title') }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t('settings.federation.description') }}
          </p>
        </div>
        <div class="p-6">
          <FederationSettings />
        </div>
      </div>
    </div>
  </ProfileLayout>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useI18n } from '#i18n'
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'
  import FederationSettings from '~/components/profile/FederationSettings.vue'
  import { useActivityPub } from '~/composables/useActivityPub'

  definePageMeta({
    middleware: ['auth'],
  })

  const authStore = useAuthStore()
  const { t } = useI18n()
  const { checkServerStatus } = useActivityPub()

  onMounted(async () => {
    if (authStore.shouldRefreshUser) {
      await authStore.fetchUser()
    }
    await checkServerStatus()
  })
</script>

<style scoped>
  .settings-border {
    border-color: var(--color-border-default);
  }
</style>
