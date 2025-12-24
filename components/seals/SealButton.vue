<template>
  <div class="seal-button-container">
    <!-- Single Seal Button -->
    <FooterButton
      icon="fa6-solid:award"
      :label="showLabel ? $t('seals.seal') : undefined"
      :title="$t('seals.seal')"
      :active="hasRecommended || hasAdviseAgainst"
      :class="{
        'recommended-active': hasRecommended && !hasAdviseAgainst,
        'reported-active': hasAdviseAgainst && !hasRecommended
      }"
      @click="openModal()"
    />

    <!-- Available seals indicator - only on client since userSeals comes from client state -->
    <div v-if="showAvailable && userSeals" class="seals-available" :title="$t('seals.available_tooltip')">
      <Icon name="fa6-solid:certificate" class="seal-icon-small" aria-hidden="true" />
      <span class="seal-count-text">{{ userSeals.available_seals }}</span>
    </div>

    <!-- Selection Modal - Only render after user interaction -->
    <SealConfirmModal
      v-if="hasInteracted"
      :is-open="isModalOpen"
      :has-recommended="hasRecommended"
      :has-reported="hasAdviseAgainst"
      :available-seals="userSeals?.available_seals || 0"
      :has-available-seals="hasAvailableSeals"
      :is-own-content="isOwnContent"
      @select="handleSelect"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from '#i18n'
import { useAuthStore } from '~/stores/auth'
import { useNotification } from '~/composables/useNotification'
import { useSeals } from '~/composables/useSeals'
import FooterButton from '~/components/posts/postCard/FooterButton.vue'

interface Props {
  contentType: 'post' | 'comment'
  contentId: number
  recommendedCount?: number
  adviseAgainstCount?: number
  userHasRecommended?: boolean
  userHasAdviseAgainst?: boolean
  showLabel?: boolean
  showAvailable?: boolean
  showAsSeal?: boolean
  isOwnContent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recommendedCount: 0,
  adviseAgainstCount: 0,
  userHasRecommended: false,
  userHasAdviseAgainst: false,
  showLabel: false,
  showAvailable: false,
  showAsSeal: false,
  isOwnContent: false,
})

const emit = defineEmits<{
  updated: [counts: { recommended: number; advise_against: number }]
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const { success, error } = useNotification()
const { userSeals, loading, markPost, unmarkPost, markComment, unmarkComment } = useSeals()

const hasRecommended = ref(props.userHasRecommended)
const hasAdviseAgainst = ref(props.userHasAdviseAgainst)
const localRecommendedCount = ref(props.recommendedCount)
const localAdviseAgainstCount = ref(props.adviseAgainstCount)

// Modal state
const isModalOpen = ref(false)
const hasInteracted = ref(false)

const hasAvailableSeals = computed(() => {
  return !!(userSeals.value && userSeals.value.available_seals > 0)
})

const openModal = () => {
  hasInteracted.value = true
  if (!authStore.isAuthenticated || loading.value) {
    // Could redirect to login or show a message
    return
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleSelect = async (type: 'recommended' | 'advise_against') => {
  closeModal()
  await toggleSeal(type)
}

const toggleSeal = async (type: 'recommended' | 'advise_against') => {
  if (!authStore.isAuthenticated || loading.value) return

  try {
    const isRemoving = type === 'recommended' ? hasRecommended.value : hasAdviseAgainst.value

    let response

    if (props.contentType === 'post') {
      response = isRemoving
        ? await unmarkPost(props.contentId, type)
        : await markPost(props.contentId, type)
    } else {
      response = isRemoving
        ? await unmarkComment(props.contentId, type)
        : await markComment(props.contentId, type)
    }

    if (response.success) {
      // Update local state with backend response
      if (type === 'recommended') {
        hasRecommended.value = !hasRecommended.value
      } else {
        hasAdviseAgainst.value = !hasAdviseAgainst.value
      }

      // Use counts from backend response if available, otherwise calculate locally
      if (response.post) {
        localRecommendedCount.value = response.post.recommended_seals_count
        localAdviseAgainstCount.value = response.post.advise_against_seals_count
      } else {
        // Fallback to local calculation
        if (type === 'recommended') {
          localRecommendedCount.value += hasRecommended.value ? 1 : -1
        } else {
          localAdviseAgainstCount.value += hasAdviseAgainst.value ? 1 : -1
        }
      }

      // Emit update event
      emit('updated', {
        recommended: localRecommendedCount.value,
        advise_against: localAdviseAgainstCount.value,
      })

      // Show success notification
      success(
        isRemoving
          ? t('seals.seal_removed_success')
          : t('seals.seal_applied_success'),
        { priority: 'low' }
      )
    }
  } catch (err: any) {
    // Only show notification if interceptor didn't already show it
    // This prevents duplicate notifications while still handling errors
    if (!err._interceptorWillNotify) {
      const message = err.response?.data?.error || err.response?.data?.message || t('seals.seal_error')
      error(message)
    }
  }
}

// Seals are loaded centrally when the user authenticates, not here
// This prevents multiple API calls when rendering multiple SealButton components

// Watch for prop changes
watch(() => props.recommendedCount, (newVal) => {
  localRecommendedCount.value = newVal
})

watch(() => props.adviseAgainstCount, (newVal) => {
  localAdviseAgainstCount.value = newVal
})

watch(() => props.userHasRecommended, (newVal) => {
  hasRecommended.value = newVal
})

watch(() => props.userHasAdviseAgainst, (newVal) => {
  hasAdviseAgainst.value = newVal
})
</script>

<style scoped>
.seal-button-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Override FooterButton colors for active states */
.recommended-active {
  color: var(--color-seal-recommended) !important;
}

.reported-active {
  color: var(--color-danger) !important;
}

.seals-available {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  color: var(--color-warning);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: help;
}

.seal-icon-small {
  font-size: 0.875rem;
  line-height: 1;
}

.seal-count-text {
  font-size: 0.875rem;
}
</style>
