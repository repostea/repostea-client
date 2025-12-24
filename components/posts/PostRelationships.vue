<template>
  <div
    class="post-relationships-container card-bg rounded-lg shadow-sm mb-4"
  >
    <div class="post-relationships-header px-4 py-3">
      <div class="flex items-center justify-between">
        <h3 class="font-medium inline-flex items-center"><Icon name="fa6-solid:link" class="mr-2" aria-hidden="true" /> <span>{{ t('posts.relationships.title') }}</span></h3>
        <button
          v-if="canAddRelationship"
          class="text-xs px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors inline-flex items-center"
          :title="t('posts.relationships.add')"
          @click="showAddModal = true"
        ><Icon name="fa6-solid:plus" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('common.add') }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="p-4 text-center">
      <div
        class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"
      />
    </div>

    <div
      v-else-if="error"
      class="p-4 text-center text-red-500 dark:text-red-400 text-sm inline-flex items-center justify-center"
    ><Icon name="fa6-solid:triangle-exclamation" class="mr-2 flex-shrink-0" aria-hidden="true" /> <span>{{ error }}</span>
    </div>

    <div
      v-else-if="ownRelationships.length === 0 && externalRelationships.length === 0"
      class="p-4 text-center text-gray-500 dark:text-gray-400"
    >
      <p class="text-sm">{{ t('posts.relationships.none') }}</p>
    </div>

    <div v-else class="post-relationships-list">
      <!-- Own Content Relations Block -->
      <div v-if="groupedOwnRelationships.length > 0" class="p-3">
        <div class="post-relationships-section-header mb-3 pb-2">
          <h4 class="text-sm font-bold text-text dark:text-text-dark inline-flex items-center"><Icon name="fa6-solid:circle-user" class="mr-2 text-primary flex-shrink-0" aria-hidden="true" /> <span>{{ t('posts.relationships.own_content') }}</span>
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('posts.relationships.own_content_description') }}
          </p>
        </div>

        <div class="space-y-3">
          <div
            v-for="group in groupedOwnRelationships"
            :key="'own-' + group.type"
          >
            <div class="flex items-center mb-2">
              <Icon
                :name="`fa6-solid:${group.icon}`"
                class="text-xs mr-2"
                :style="{ color: getTypeColor(group.type) }"
                aria-hidden="true"
              />
              <span class="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {{ group.label }} ({{ group.items.length }})
              </span>
            </div>

            <div class="space-y-2 ml-4">
              <div
                v-for="relationship in group.items"
                :key="relationship.id"
                class="group relative"
              >
                <NuxtLink
                  :to="localePath(`/p/${relationship.post.uuid}`)"
                  class="post-relationship-link block rounded p-2 transition-colors"
                >
                  <div class="flex items-start">
                    <div class="flex-grow min-w-0">
                      <div class="text-sm font-medium text-text dark:text-text-dark line-clamp-2">
                        {{ relationship.post.title }}
                      </div>
                      <div
                        v-if="relationship.post.content"
                        class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1"
                      >
                        {{ relationship.post.content }}
                      </div>
                      <div class="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span class="inline-flex items-center"><Icon name="fa6-solid:user" class="text-xs mr-1" aria-hidden="true" /> <span>{{ relationship.post.author }}</span></span>
                        <span class="inline-flex items-center"><Icon name="fa6-solid:clock" class="text-xs mr-1" aria-hidden="true" /> <span>{{ formatDate(relationship.post.created_at) }}</span></span>
                      </div>
                    </div>

                    <button
                      v-if="canDelete(relationship)"
                      class="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-opacity"
                      :title="t('common.delete')"
                      :aria-label="t('common.delete')"
                      @click.prevent="deleteRelationship(relationship.id)"
                    >
                      <Icon name="fa6-solid:xmark" class="text-sm" aria-hidden="true" />
                    </button>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- External Content Relations Block -->
      <div v-if="groupedExternalRelationships.length > 0" class="p-3">
        <div class="post-relationships-section-header mb-3 pb-2">
          <h4 class="text-sm font-bold text-text dark:text-text-dark inline-flex items-center"><Icon name="fa6-solid:link" class="mr-2 text-green-600 flex-shrink-0" aria-hidden="true" /> <span>{{ t('posts.relationships.external_content') }}</span>
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('posts.relationships.external_content_description') }}
          </p>
        </div>

        <div class="space-y-3">
          <div
            v-for="group in groupedExternalRelationships"
            :key="'external-' + group.type"
          >
            <div class="flex items-center mb-2">
              <Icon
                :name="`fa6-solid:${group.icon}`"
                class="text-xs mr-2"
                :style="{ color: getTypeColor(group.type) }"
                aria-hidden="true"
              />
              <span class="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {{ group.label }} ({{ group.items.length }})
              </span>
            </div>

            <div class="space-y-2 ml-4">
              <div
                v-for="relationship in group.items"
                :key="relationship.id"
                class="group relative"
              >
                <NuxtLink
                  :to="localePath(`/p/${relationship.post.uuid}`)"
                  class="post-relationship-link block rounded p-2 transition-colors"
                >
                  <div class="flex items-start">
                    <div class="flex-grow min-w-0">
                      <div class="text-sm font-medium text-text dark:text-text-dark line-clamp-2">
                        {{ relationship.post.title }}
                      </div>
                      <div
                        v-if="relationship.post.content"
                        class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1"
                      >
                        {{ relationship.post.content }}
                      </div>
                      <div class="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span class="inline-flex items-center"><Icon name="fa6-solid:user" class="text-xs mr-1" aria-hidden="true" /> <span>{{ relationship.post.author }}</span></span>
                        <span class="inline-flex items-center"><Icon name="fa6-solid:clock" class="text-xs mr-1" aria-hidden="true" /> <span>{{ formatDate(relationship.post.created_at) }}</span></span>
                      </div>
                    </div>

                    <button
                      v-if="canDelete(relationship)"
                      class="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-opacity"
                      :title="t('common.delete')"
                      :aria-label="t('common.delete')"
                      @click.prevent="deleteRelationship(relationship.id)"
                    >
                      <Icon name="fa6-solid:xmark" class="text-sm" aria-hidden="true" />
                    </button>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Relationship Modal -->
    <AddRelationshipModal
      v-if="showAddModal"
      :post-id="postId"
      :current-post-title="currentPostTitle"
      :post-author-id="postAuthorId"
      @close="showAddModal = false"
      @created="handleRelationshipCreated"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useNuxtApp } from '#app'
  import { useLocalePath, useI18n } from '#i18n'
  import { useAuthStore } from '~/stores/auth'
  import { useNotification } from '~/composables/useNotification'
  import AddRelationshipModal from './AddRelationshipModal.vue'

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()
  const { error: showError } = useNotification()

  const props = defineProps({
    postId: {
      type: [Number, String],
      required: true,
    },
    currentPostTitle: {
      type: String,
      default: '',
    },
    postAuthorId: {
      type: [Number, String],
      default: null,
    },
  })

  const ownRelationships = ref([])
  const externalRelationships = ref([])
  const loading = ref(true)
  const error = ref(null)
  const showAddModal = ref(false)

  const canAddRelationship = computed(() => {
    return authStore.isAuthenticated
  })

  const canDelete = (relationship) => {
    if (!authStore.isAuthenticated) return false
    // User can delete if they created the relationship or they own the post
    return (
      relationship.created_by === authStore.user?.username ||
      props.postAuthorId === authStore.user?.id
    )
  }

  const groupedOwnRelationships = computed(() => {
    const groups = {}

    ownRelationships.value.forEach((rel) => {
      if (!groups[rel.type]) {
        groups[rel.type] = {
          type: rel.type,
          label: getTypeLabel(rel.type),
          icon: getTypeIcon(rel.type),
          items: [],
        }
      }
      groups[rel.type].items.push(rel)
    })

    return Object.values(groups)
  })

  const groupedExternalRelationships = computed(() => {
    const groups = {}

    externalRelationships.value.forEach((rel) => {
      if (!groups[rel.type]) {
        groups[rel.type] = {
          type: rel.type,
          label: getTypeLabel(rel.type),
          icon: getTypeIcon(rel.type),
          items: [],
        }
      }
      groups[rel.type].items.push(rel)
    })

    return Object.values(groups)
  })

  function getTypeLabel(type) {
    const labels = {
      reply: t('posts.relationships.types.reply'),
      continuation: t('posts.relationships.types.continuation'),
      related: t('posts.relationships.types.related'),
      update: t('posts.relationships.types.update'),
      correction: t('posts.relationships.types.correction'),
      duplicate: t('posts.relationships.types.duplicate'),
    }
    return labels[type] || type
  }

  function getTypeIcon(type) {
    const icons = {
      reply: 'reply',
      continuation: 'arrow-right',
      related: 'link',
      update: 'sync',
      correction: 'edit',
      duplicate: 'copy',
    }
    return icons[type] || 'link'
  }

  function getTypeColor(type) {
    const colors = {
      reply: '#3b82f6', // blue
      continuation: '#8b5cf6', // purple
      related: '#10b981', // green
      update: '#f59e0b', // amber
      correction: '#ef4444', // red
      duplicate: '#6b7280', // gray
    }
    return colors[type] || '#6b7280'
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.round(diffMs / 1000)
    const diffMin = Math.round(diffSec / 60)
    const diffHour = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHour / 24)

    if (diffSec < 60) return t('time.just_now')
    if (diffMin < 60) return t('time.minutes_ago', { count: diffMin })
    if (diffHour < 24) return t('time.hours_ago', { count: diffHour })
    if (diffDay < 30) return t('time.days_ago', { count: diffDay })

    return date.toLocaleDateString(locale.value, { timeZone: timezone })
  }

  async function loadRelationships() {
    try {
      loading.value = true
      error.value = null

      const response = await $api.posts.getRelationships(props.postId)
      const data = response.data.data || {}

      // Handle new grouped structure
      if (data.own !== undefined && data.external !== undefined) {
        ownRelationships.value = data.own || []
        externalRelationships.value = data.external || []
      } else {
        // Fallback for old structure (backwards compatibility)
        ownRelationships.value = []
        externalRelationships.value = Array.isArray(data) ? data : []
      }
    } catch (err) {
      console.error('Error loading relationships:', err)
      error.value = t('posts.relationships.error_loading')
      ownRelationships.value = []
      externalRelationships.value = []
    } finally {
      loading.value = false
    }
  }

  async function deleteRelationship(relationshipId) {
    if (!confirm(t('posts.relationships.confirm_delete'))) {
      return
    }

    try {
      await $api.posts.deleteRelationship(props.postId, relationshipId)
      await loadRelationships()
    } catch (err) {
      if (!err._interceptorWillNotify) {
        showError(err.response?.data?.message || t('posts.relationships.error_deleting'))
      }
    }
  }

  function handleRelationshipCreated() {
    showAddModal.value = false
    loadRelationships()
  }

  onMounted(() => {
    loadRelationships()
  })
</script>

<style scoped>
  .post-relationships-container {
    border: 1px solid var(--color-border-default);
  }

  .post-relationships-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .post-relationships-list > div {
    border-bottom: 1px solid var(--color-border-default);
  }

  .post-relationships-list > div:last-child {
    border-bottom: none;
  }

  .post-relationships-section-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .post-relationship-link:hover {
    background-color: var(--color-bg-hover);
  }
</style>
