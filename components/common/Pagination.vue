<template>
  <nav
    v-if="lastPage > 1"
    class="flex items-center justify-center gap-1 sm:gap-2"
    role="navigation"
    :aria-label="$t('pagination.navigation')"
  >
    <!-- Previous button -->
    <button
      :disabled="currentPage === 1"
      :aria-label="$t('pagination.previous')"
      class="pagination-btn"
      :class="{ 'pagination-btn-disabled': currentPage === 1 }"
      @click="goToPage(currentPage - 1)"
    >
      <Icon name="fa6-solid:chevron-left" class="w-3 h-3" />
    </button>

    <!-- Page numbers -->
    <template v-for="page in visiblePages" :key="page">
      <span v-if="page === '...'" class="px-2 text-text-muted dark:text-text-dark-muted">
        ...
      </span>
      <button
        v-else
        :aria-label="$t('pagination.go_to_page', { page })"
        :aria-current="page === currentPage ? 'page' : undefined"
        class="pagination-btn"
        :class="{ 'pagination-btn-active': page === currentPage }"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
    </template>

    <!-- Next button -->
    <button
      :disabled="currentPage === lastPage"
      :aria-label="$t('pagination.next')"
      class="pagination-btn"
      :class="{ 'pagination-btn-disabled': currentPage === lastPage }"
      @click="goToPage(currentPage + 1)"
    >
      <Icon name="fa6-solid:chevron-right" class="w-3 h-3" />
    </button>
  </nav>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from '#i18n'

  useI18n()

  const props = defineProps({
    currentPage: {
      type: Number,
      required: true,
    },
    lastPage: {
      type: Number,
      required: true,
    },
    maxVisiblePages: {
      type: Number,
      default: 7,
    },
  })

  const emit = defineEmits(['page-change'])

  // Calculate which page numbers to show
  const visiblePages = computed(() => {
    const pages = []
    const total = props.lastPage
    const current = props.currentPage
    const maxVisible = props.maxVisiblePages

    if (total <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of middle section
      let start = Math.max(2, current - 1)
      let end = Math.min(total - 1, current + 1)

      // Adjust if we're near the beginning
      if (current <= 3) {
        end = Math.min(total - 1, 4)
      }

      // Adjust if we're near the end
      if (current >= total - 2) {
        start = Math.max(2, total - 3)
      }

      // Add ellipsis before middle section if needed
      if (start > 2) {
        pages.push('...')
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis after middle section if needed
      if (end < total - 1) {
        pages.push('...')
      }

      // Always show last page
      pages.push(total)
    }

    return pages
  })

  function goToPage(page) {
    if (page >= 1 && page <= props.lastPage && page !== props.currentPage) {
      emit('page-change', page)
    }
  }
</script>

<style scoped>
  .pagination-btn {
    @apply min-w-[32px] h-8 px-2 flex items-center justify-center rounded-md text-sm font-medium transition-colors;
    background-color: var(--color-bg-card);
    color: var(--color-text);
    border: 1px solid var(--color-border-default);
  }

  .pagination-btn:hover:not(:disabled):not(.pagination-btn-active) {
    background-color: var(--color-bg-hover);
  }

  .pagination-btn-active {
    @apply text-white;
    background-color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .pagination-btn-disabled {
    @apply opacity-50 cursor-not-allowed;
  }
</style>
