<template>
  <div class="author-info flex items-center">
    <!-- Don't show avatar for anonymous posts -->
    <template v-if="!isAnonymous">
      <div v-if="user && user.avatar" class="author-avatar mr-1">
        <NuxtImg
          :src="user.avatar"
          :alt="user.username"
          width="16"
          height="16"
          class="w-4 h-4 rounded-full object-cover"
          loading="lazy"
          format="webp"
          preset="avatar"
        />
      </div>
      <div v-else class="author-avatar mr-1">
        <div
          class="w-4 h-4 rounded-full flex items-center justify-center"
          :class="user?.is_guest || isGuest ? 'author-guest-avatar' : 'author-default-avatar'"
        >
          <Icon
            :name="user?.is_guest || isGuest ? 'fa6-solid:user-secret' : 'fa6-solid:user'"
            class="text-xs"
            :class="
              user?.is_guest || isGuest
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-gray-400 dark:text-gray-500'
            "
            aria-hidden="true"
          />
        </div>
      </div>
    </template>
    <span>
      {{ t('common.by') }}
      <template v-if="isAnonymous">
        <span class="font-medium text-gray-600 dark:text-gray-400">
          {{ displayName }}
        </span>
      </template>
      <template v-else-if="user?.is_guest || isGuest">
        <span class="font-medium text-gray-600 dark:text-gray-400">
          {{ displayName }}
        </span>
      </template>
      <template v-else-if="!user">
        <span class="font-medium text-gray-500 dark:text-gray-500 italic"> [deleted] </span>
      </template>
      <template v-else>
        <NuxtLink
          :to="localePath(`/u/${user?.username || 'anonymous'}`)"
          class="font-medium text-primary hover:text-primary-dark dark:hover:text-primary-dark"
        >
          {{ user?.username || t('common.guest') }}
        </NuxtLink>
      </template>
      <span v-if="user?.isAdmin" class="ml-1 text-red-500 text-xs">
        <Icon name="fa6-solid:shield-halved" aria-hidden="true" />
      </span>
      <span v-else-if="user?.isGlobalModerator" class="ml-1 text-green-500 text-xs">
        <Icon name="fa6-solid:gavel" aria-hidden="true" />
      </span>
      <span v-if="user?.isBot" class="ml-1 text-blue-500 text-xs">
        <Icon name="fa6-solid:robot" aria-hidden="true" />
      </span>
    </span>
  </div>
</template>

<script setup>
  import { useI18n, useLocalePath } from '#i18n'
  import { computed } from 'vue'

  const { t } = useI18n()
  const localePath = useLocalePath()

  const props = defineProps({
    user: {
      type: Object,
      default: () => null,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    authorName: {
      type: String,
      default: '',
    },
  })

  const displayName = computed(() => {
    // Priority 1: Use authorName if provided (backend handles all naming logic)
    if (props.authorName) {
      return props.authorName
    }
    // Priority 2: If anonymous, show "Anonymous" text
    if (props.isAnonymous) {
      return t('common.anonymous')
    }
    // Priority 3: If guest user, show "Anonymous"
    if (props.user?.is_guest || props.isGuest) {
      return t('common.anonymous')
    }
    // Priority 4: Show username or fallback to guest
    return props.user?.username || t('common.guest')
  })
</script>

<style scoped>
  .author-avatar img {
    @apply object-cover;
  }

  .author-guest-avatar {
    background-color: var(--color-bg-subtle);
  }

  .author-default-avatar {
    background-color: var(--color-bg-hover);
  }
</style>
