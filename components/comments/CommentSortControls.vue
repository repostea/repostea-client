<template>
  <div class="sort-controls">
    <div class="sort-buttons">
      <button
        v-for="option in sortOptions"
        :key="option.key"
        :class="{ active: isActive(option) }"
        class="sort-btn"
        :aria-label="option.label"
        :aria-pressed="isActive(option)"
        @click="selectSort(option)"
      >
        <Icon :name="option.icon" :class="{ 'mr-1.5': isActive(option) }" aria-hidden="true" />
        <span v-if="isActive(option)" class="ml-0.5 sm:ml-0">{{ option.label }}</span>
        <span v-else class="hidden sm:inline ml-1.5">{{ option.label }}</span>
      </button>
    </div>

    <div v-if="needsTimeFilter" class="time-filter">
      <select
        :value="timeInterval"
        :aria-label="$t('filters.time_period')"
        class="time-select"
        @change="$emit('update:timeInterval', $event.target.value)"
      >
        <option value="1440">{{ $t('filters.last_24_hours') }}</option>
        <option value="2880">{{ $t('filters.last_48_hours') }}</option>
        <option value="10080">{{ $t('filters.last_7_days') }}</option>
        <option value="43200">{{ $t('filters.last_30_days') }}</option>
        <option value="0">{{ $t('filters.all_time') }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  const props = defineProps({
    sort: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      required: true,
    },
    timeInterval: {
      type: String,
      required: true,
    },
  })

  const emit = defineEmits(['update:sort', 'update:direction', 'update:timeInterval'])

  const sortOptions = [
    { key: 'recent', direction: 'desc', label: t('comments.sort.recent'), icon: 'fa6-solid:clock' },
    { key: 'votes', direction: 'desc', label: t('comments.sort.most_votes'), icon: 'fa6-solid:arrow-up' },
    { key: 'didactic', direction: 'desc', label: t('comments.vote_types.didactic'), icon: 'fa6-solid:graduation-cap' },
    { key: 'interesting', direction: 'desc', label: t('comments.vote_types.interesting'), icon: 'fa6-solid:star' },
    { key: 'elaborate', direction: 'desc', label: t('comments.vote_types.elaborate'), icon: 'fa6-solid:pen-fancy' },
    { key: 'funny', direction: 'desc', label: t('comments.vote_types.funny'), icon: 'fa6-solid:face-grin-squint' },
  ]

  const needsTimeFilter = computed(() => {
    return props.sort !== 'recent'
  })

  const isActive = (option) => {
    return props.sort === option.key && props.direction === option.direction
  }

  const selectSort = (option) => {
    emit('update:sort', option.key)
    emit('update:direction', option.direction)
  }
</script>

<style scoped>
  .sort-controls {
    @apply flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full;
  }

  .sort-buttons {
    @apply flex flex-wrap gap-2;
  }

  .sort-btn {
    @apply px-3 py-1.5 text-sm rounded-md transition-colors flex items-center justify-center;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-muted);
    min-width: 40px;
  }

  .sort-btn:hover {
    background-color: var(--color-bg-hover);
  }

  @media (max-width: 640px) {
    .sort-btn:not(.active) {
      @apply px-2.5;
    }
  }

  .sort-btn.active {
    @apply font-medium;
    border-color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
  }

  .time-filter {
    @apply ml-auto;
  }

  .time-select {
    @apply px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  @media (max-width: 640px) {
    .time-filter {
      @apply ml-0 w-full;
    }

    .time-select {
      @apply w-full;
    }
  }
</style>
