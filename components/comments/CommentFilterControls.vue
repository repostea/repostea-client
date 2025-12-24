<template>
  <div class="filter-controls">
    <button class="filter-toggle-btn" :aria-expanded="showFilters" @click="toggleFilters">
      <Icon name="fa6-solid:filter" class="mr-1.5" aria-hidden="true" />
      <span>{{ $t('common.filters') }}</span>
      <Icon
        :name="showFilters ? 'fa6-solid:chevron-up' : 'fa6-solid:chevron-down'"
        class="ml-1"
        aria-hidden="true"
      />
    </button>

    <div v-if="showFilters" class="filters-panel">
      <div class="filter-group">
        <label for="comment-filter-sub" class="filter-label">{{ $t('filters.sub') }}</label>
        <select id="comment-filter-sub" v-model="filters.sub" class="filter-select">
          <option value="">{{ $t('filters.all_subs') }}</option>
          <!-- Subs loaded dynamically -->
        </select>
      </div>

      <div class="filter-actions">
        <button class="apply-btn" @click="applyFilters">
          {{ $t('common.apply') }}
        </button>
        <button class="clear-btn" @click="clearFilters">
          {{ $t('common.clear') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue'

  const emit = defineEmits(['filter-changed'])

  const showFilters = ref(false)
  const filters = reactive({
    sub: '',
  })

  const toggleFilters = () => {
    showFilters.value = !showFilters.value
  }

  const applyFilters = () => {
    emit('filter-changed', { ...filters })
  }

  const clearFilters = () => {
    filters.sub = ''
    emit('filter-changed', {})
  }
</script>

<style scoped>
  .filter-controls {
    @apply relative;
  }

  .filter-toggle-btn {
    @apply px-3 py-1.5 text-sm rounded-md transition-colors flex items-center;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .filter-toggle-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .filters-panel {
    @apply absolute top-full left-0 mt-2 p-4 rounded-lg shadow-lg z-10 min-w-[250px];
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .filter-group {
    @apply mb-4;
  }

  .filter-label {
    @apply block text-sm font-medium mb-2;
    color: var(--color-text-primary);
  }

  .filter-select {
    @apply w-full px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-primary;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .filter-actions {
    @apply flex gap-2;
  }

  .apply-btn {
    @apply flex-1 px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary-dark transition-colors font-medium;
  }

  .clear-btn {
    @apply flex-1 px-4 py-2 text-sm rounded-md transition-colors;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .clear-btn:hover {
    background-color: var(--color-bg-hover);
  }
</style>
