<template>
  <div class="sort-controls">
    <div class="flex items-center space-x-2">
      <button
        class="sort-button"
        :class="{ active: isActiveSort('lastActive', 'desc') }"
        @click="setSort('lastActive', 'desc')"
      >
        <Icon name="fa6-solid:clock" aria-hidden="true" />
        <span class="ml-1">{{ $t('links.recent') }}</span>
      </button>
      <button
        class="sort-button"
        :class="{ active: isActiveSort('favourites', 'desc') }"
        @click="setSort('favourites', 'desc')"
      >
        <Icon name="fa6-solid:bolt" aria-hidden="true" />
        <span class="ml-1">{{ $t('links.most_valued') }}</span>
      </button>
      <button
        class="sort-button"
        :class="{ active: isActiveSort('comments', 'desc') }"
        @click="setSort('comments', 'desc')"
      >
        <Icon name="fa6-solid:comments" aria-hidden="true" />
        <span class="ml-1">{{ $t('links.most_commented') }}</span>
      </button>
      <button
        class="sort-button"
        :class="{ active: isActiveSort('views', 'desc') }"
        @click="setSort('views', 'desc')"
      >
        <Icon name="fa6-solid:eye" aria-hidden="true" />
        <span class="ml-1">{{ $t('links.most_visited') }}</span>
      </button>
    </div>

    <div v-if="needsTimeFilter(sort)" class="mt-2">
      <select
        v-model="timeIntervalModel"
        class="time-select"
        :aria-label="$t('filters.time_period')"
        :class="{
          'time-select-active': timeIntervalModel !== '1440',
        }"
      >
        <option value="1440">{{ $t('filters.last_24_hours') }}</option>
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

  // Initialize i18n
  useI18n()

  const props = defineProps({
    sort: {
      type: String,
      default: 'lastActive',
    },
    direction: {
      type: String,
      default: 'desc',
    },
    timeInterval: {
      type: String,
      default: '43200',
    },
  })

  const emit = defineEmits(['update:sort', 'update:direction', 'update:timeInterval'])

  const timeIntervalModel = computed({
    get: () => props.timeInterval,
    set: (value) => emit('update:timeInterval', value),
  })

  function isActiveSort(sortKey, directionKey) {
    return props.sort === sortKey && props.direction === directionKey
  }

  function setSort(sortKey, directionKey) {
    if (props.sort === sortKey && props.direction === directionKey) return
    emit('update:sort', sortKey)
    emit('update:direction', directionKey)
  }

  function needsTimeFilter(sort) {
    return ['favourites', 'comments', 'views'].includes(sort)
  }
</script>

<style scoped>
  .sort-controls {
    @apply rounded-lg p-3 shadow-sm;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .sort-button {
    @apply px-3 py-2 text-sm rounded-md transition-colors;
    color: var(--color-text-muted);
  }

  .sort-button:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }

  .sort-button.active {
    @apply font-medium bg-primary-light dark:bg-primary-dark text-white;
  }

  .time-select {
    @apply px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all w-full;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .time-select-active {
    border-color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .sort-controls {
      @apply p-2;
    }

    .sort-button {
      @apply px-2 py-1;
    }

    .sort-button span {
      @apply hidden;
    }

    .sort-button.active span {
      @apply inline;
    }
  }
</style>
