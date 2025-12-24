<template>
  <div
    class="user-stats-card card-bg rounded-lg shadow-sm overflow-hidden mb-6"
  >
    <div class="p-4">
      <!-- Current Level - Highlighted -->
      <div class="user-stats-header mb-4 text-center pb-4">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          {{ t('profile.current_level') }}
        </p>
        <ClientOnly fallback-tag="p" fallback="...">
          <p class="text-2xl font-bold text-primary dark:text-primary-light">
            {{ level.level || 'Novato' }}
          </p>
        </ClientOnly>
        <ClientOnly fallback-tag="p" fallback="...">
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ karma.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) }} {{ t('profile.karma_points') }}
          </p>
        </ClientOnly>
      </div>

      <!-- Progress to Next Level -->
      <ClientOnly>
        <div v-if="hasKarmaForLevel && nextLevelPoints > karma">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {{ t('profile.next_level_progress') }}
            </p>
            <p class="text-xs font-semibold text-primary dark:text-primary-light">
              {{ progressPercentage.toFixed(0) }}%
            </p>
          </div>
          <div class="user-stats-progress-bg w-full rounded-full h-3 mb-2">
            <div
              class="bg-primary dark:bg-primary-light h-3 rounded-full transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            />
          </div>
          <div class="text-center text-xs text-gray-500 dark:text-gray-400">
            <span>{{ karma.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) }} / {{ nextLevelPoints.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) }}</span>
          </div>
        </div>
        <div v-else-if="!hasKarmaForLevel" class="text-center py-3">
          <div class="text-orange-500 dark:text-orange-400 text-xl mb-2">
            <Icon name="fa6-solid:arrow-up" aria-hidden="true" />
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {{ t('profile.recover_karma_for_next_level') }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {{ level.min?.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) }} {{ t('profile.karma_needed') }}
          </p>
        </div>
        <div v-else class="text-center py-2">
          <div class="text-yellow-500 text-2xl mb-1">
            <Icon name="fa6-solid:crown" aria-hidden="true" />
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {{ t('profile.max_level_reached') }}
          </p>
        </div>
      </ClientOnly>
    </div>
    <div class="user-stats-footer">
      <div class="user-stats-grid grid grid-cols-3">
        <div class="p-3 text-center">
          <div class="font-medium">{{ posts }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ t('profile.posts') }}</div>
        </div>
        <div class="p-3 text-center">
          <div class="font-medium">{{ comments }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ t('profile.comments') }}</div>
        </div>
        <div class="p-3 text-center">
          <div class="font-medium">{{ votes }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ t('profile.votes') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    karma: {
      type: Number,
      default: 0,
    },
    posts: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    votes: {
      type: Number,
      default: 0,
    },
    level: {
      type: Object,
      default: () => ({ level: 'newcomer', min: 0, max: 50 }),
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    nextLevelPoints: {
      type: Number,
      default: 50,
    },
    hasKarmaForLevel: {
      type: Boolean,
      default: true,
    },
  })
</script>

<style scoped>
  .user-stats-card {
    border: 1px solid var(--color-border-default);
  }

  .user-stats-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .user-stats-progress-bg {
    background-color: var(--color-bg-hover);
  }

  .user-stats-footer {
    border-top: 1px solid var(--color-border-default);
  }

  .user-stats-grid > div {
    border-right: 1px solid var(--color-border-default);
  }

  .user-stats-grid > div:last-child {
    border-right: none;
  }
</style>
