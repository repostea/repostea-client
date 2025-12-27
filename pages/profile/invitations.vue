<template>
  <ProfileLayout active-tab="invitations">
    <div class="space-y-6">
      <!-- Invitation Stats -->
      <div class="card-bg rounded-lg shadow-sm border invitations-border p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-medium">{{ t('invitations.title') }}</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ t('invitations.description') }}
            </p>
          </div>
          <button
            :disabled="!canCreate || loading"
            class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            @click="createInvitation"
          >
            <Icon name="fa6-solid:plus" class="mr-2" aria-hidden="true" />
            {{ t('invitations.create') }}
          </button>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-4 invitations-stats-bg rounded-lg">
            <div class="text-2xl font-bold text-primary">{{ stats.used }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('invitations.used') }}
            </div>
          </div>
          <div class="text-center p-4 invitations-stats-bg rounded-lg">
            <div class="text-2xl font-bold text-green-600">
              {{ stats.remaining === 'unlimited' ? '∞' : stats.remaining }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('invitations.remaining') }}
            </div>
          </div>
          <div class="text-center p-4 invitations-stats-bg rounded-lg">
            <div class="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {{ stats.limit === 'unlimited' ? '∞' : stats.limit }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('invitations.limit') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Invitations List -->
      <div class="card-bg rounded-lg shadow-sm border invitations-border">
        <div class="px-6 py-4 border-b invitations-border">
          <h3 class="text-lg font-medium">{{ t('invitations.my_invitations') }}</h3>
        </div>

        <div v-if="loading" class="p-6 text-center">
          <Icon name="fa6-solid:spinner" class="text-2xl text-gray-400" aria-hidden="true" />
        </div>

        <div
          v-else-if="invitations.length === 0"
          class="p-6 text-center text-gray-500 dark:text-gray-400"
        >
          {{ t('invitations.no_invitations') }}
        </div>

        <div v-else class="divide-y invitations-divider">
          <div
            v-for="invitation in invitations"
            :key="invitation.id"
            class="p-6 invitations-item-hover transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <span
                    v-if="!invitation.is_active"
                    class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs"
                  >
                    {{ t('invitations.inactive') }}
                  </span>
                  <span
                    v-else-if="invitation.current_uses >= invitation.max_uses"
                    class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded text-xs"
                  >
                    {{ t('invitations.used_up') }}
                  </span>
                </div>
                <div class="mb-2">
                  <code
                    class="px-3 py-2 invitations-code-bg rounded font-mono text-sm block break-all"
                  >
                    {{ invitation.registration_url }}
                  </code>
                </div>
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span
                    >{{ t('invitations.uses') }}: {{ invitation.current_uses }} /
                    {{ invitation.max_uses }}</span
                  >
                  <span class="mx-2">•</span>
                  <span
                    >{{ t('invitations.created') }}: {{ formatDate(invitation.created_at) }}</span
                  >
                  <span v-if="invitation.expires_at" class="mx-2">•</span>
                  <span v-if="invitation.expires_at"
                    >{{ t('invitations.expires') }}: {{ formatDate(invitation.expires_at) }}</span
                  >
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <button
                  class="px-3 py-2 text-sm invitations-copy-btn text-gray-700 dark:text-gray-300 rounded transition-colors"
                  :title="t('invitations.copy_link')"
                  :aria-label="t('invitations.copy_link')"
                  @click="copyInvitationLink(invitation.registration_url)"
                >
                  <Icon name="fa6-solid:copy" aria-hidden="true" />
                </button>
                <button
                  class="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded transition-colors"
                  :title="t('invitations.delete')"
                  :aria-label="t('invitations.delete')"
                  @click="confirmDeleteInvitation(invitation.id)"
                >
                  <Icon name="fa6-solid:trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      :title="t('invitations.confirm_delete_title')"
      :message="t('invitations.confirm_delete')"
      :confirm-text="t('common.delete')"
      :loading="isDeleting"
      variant="danger"
      @confirm="deleteInvitation"
    />
  </ProfileLayout>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useI18n } from '#i18n'
  import { useNuxtApp } from '#app'
  import { useNotification } from '~/composables/useNotification'
  import ProfileLayout from '~/components/profile/ProfileLayout.vue'

  definePageMeta({
    middleware: ['auth'],
  })

  const { t } = useI18n()
  const { $api } = useNuxtApp()
  const { success, error: showError } = useNotification()

  const invitations = ref([])
  const stats = ref({
    limit: 0,
    used: 0,
    remaining: 0,
  })
  const loading = ref(false)
  const showDeleteConfirm = ref(false)
  const pendingDeleteId = ref(null)
  const isDeleting = ref(false)
  const canCreate = computed(
    () => stats.value.remaining > 0 || stats.value.remaining === 'unlimited'
  )

  async function fetchInvitations() {
    loading.value = true
    try {
      const response = await $api.invitations.getInvitations()

      invitations.value = response.data.invitations
      stats.value = {
        limit: response.data.limit,
        used: response.data.used,
        remaining: response.data.remaining,
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      loading.value = false
    }
  }

  async function createInvitation() {
    if (!canCreate.value || loading.value) return

    loading.value = true
    try {
      await $api.invitations.createInvitation({
        max_uses: 1,
      })

      await fetchInvitations()
    } catch (err) {
      if (!err._interceptorWillNotify) {
        showError(err.response?.data?.message || t('invitations.error_creating'))
      }
    } finally {
      loading.value = false
    }
  }

  function confirmDeleteInvitation(id) {
    pendingDeleteId.value = id
    showDeleteConfirm.value = true
  }

  async function deleteInvitation() {
    if (!pendingDeleteId.value) return

    isDeleting.value = true
    try {
      await $api.invitations.deleteInvitation(pendingDeleteId.value)
      showDeleteConfirm.value = false
      pendingDeleteId.value = null
      await fetchInvitations()
    } catch (err) {
      if (!err._interceptorWillNotify) {
        showError(err.response?.data?.message || t('invitations.error_deleting'))
      }
    } finally {
      isDeleting.value = false
    }
  }

  async function copyInvitationLink(url) {
    try {
      await navigator.clipboard.writeText(url)
      success(t('invitations.link_copied'))
    } catch {
      showError(t('common.copy_failed'))
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  onMounted(() => {
    fetchInvitations()
  })
</script>

<style scoped>
  .invitations-border {
    border-color: var(--color-border-default);
  }

  .invitations-stats-bg {
    background-color: var(--color-bg-subtle);
  }

  .invitations-divider {
    --tw-divide-opacity: 1;
    border-color: var(--color-border-default);
  }

  .invitations-item-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .invitations-code-bg {
    background-color: var(--color-bg-subtle);
  }

  .invitations-copy-btn {
    background-color: var(--color-bg-subtle);
  }

  .invitations-copy-btn:hover {
    background-color: var(--color-bg-active);
  }
</style>
