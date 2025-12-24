<template>
  <div class="ranking-filters">
    <div class="ranking-filters-container inline-flex rounded-lg p-1">
      <button
        v-for="time in timeframes"
        :key="time.id"
        class="timeframe-btn"
        :class="{ active: selectedTimeframe === time.id }"
        @click="$emit('timeframe-change', time.id)"
      >
        {{ t(time.label) }}
      </button>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    selectedTimeframe: {
      type: String,
      default: 'all',
    },
  })

  defineEmits(['timeframe-change'])

  const timeframes = [
    { id: 'all', label: 'rankings.timeframes.all_time' },
    { id: 'month', label: 'rankings.timeframes.this_month' },
    { id: 'week', label: 'rankings.timeframes.this_week' },
    { id: 'today', label: 'rankings.timeframes.today' },
  ]
</script>

<style scoped>
  .ranking-filters {
    @apply flex justify-center mb-6;
  }

  .timeframe-btn {
    @apply px-3 py-1.5 text-sm font-medium rounded-md transition-all;
    @apply text-gray-700 dark:text-gray-300;
    @apply hover:text-gray-900 dark:hover:text-white;
  }

  .timeframe-btn.active {
    @apply bg-white shadow-sm;
    background-color: var(--color-bg-card);
    @apply text-primary-dark dark:text-primary-light;
  }

  .ranking-filters-container {
    background-color: var(--color-bg-hover);
  }
</style>
