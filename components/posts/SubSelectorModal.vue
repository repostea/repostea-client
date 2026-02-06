<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      @click.self="close"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

      <!-- Modal -->
      <div
        class="sub-modal relative w-full max-w-2xl h-[90vh] sm:h-[80vh] rounded-lg shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'sub-selector-modal-title'"
        @click.stop
      >
        <!-- Header -->
        <div class="sub-modal-header p-4 flex-shrink-0">
          <div class="flex items-center justify-between mb-3">
            <h2
              id="sub-selector-modal-title"
              class="text-xl font-semibold text-text dark:text-text-dark flex items-center gap-2"
            >
              <Icon name="fa6-solid:globe" class="text-primary" aria-hidden="true" />
              {{ t('subs.select_sub') }}
            </h2>
            <button
              class="sub-modal-close-btn p-2 rounded-lg"
              :aria-label="t('common.close')"
              @click="close"
            >
              <Icon name="fa6-solid:xmark" class="text-lg" aria-hidden="true" />
            </button>
          </div>

          <!-- Search input -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon
                name="fa6-solid:magnifying-glass"
                class="text-gray-400 text-sm"
                aria-hidden="true"
              />
            </div>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="t('subs.search_all_subs')"
              class="sub-modal-input w-full pl-10 pr-4 py-3 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              @keydown.escape="close"
            />
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <Icon
              name="fa6-solid:spinner"
              class="animate-spin text-3xl text-primary mb-2"
              aria-hidden="true"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
          </div>
        </div>

        <!-- Subs list -->
        <div v-else class="flex-1 overflow-y-auto p-4">
          <!-- General option -->
          <button
            type="button"
            class="sub-modal-option w-full flex items-center gap-3 p-3 mb-2 rounded-lg transition-colors text-left"
            @click="selectSub(null)"
          >
            <div
              class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            >
              <Icon name="fa6-solid:earth-americas" aria-hidden="true" />
            </div>
            <div class="flex-1">
              <div class="font-medium text-text dark:text-text-dark">
                {{ t('subs.post_in_general') }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('subs.visible_to_all') }}
              </div>
            </div>
            <Icon name="fa6-solid:chevron-right" class="text-gray-400 text-sm" aria-hidden="true" />
          </button>

          <!-- Subscribed subs section -->
          <div v-if="subscribedSubs.length > 0" class="mb-4">
            <h3
              class="sub-modal-section-title text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            >
              {{ t('subs.my_subs') }}
            </h3>
            <div class="space-y-1">
              <button
                v-for="sub in subscribedSubs"
                :key="sub.id"
                type="button"
                class="sub-modal-option w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                @click="selectSub(sub.id, sub)"
              >
                <SubIcon :sub="sub" size="lg" />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-text dark:text-text-dark truncate">
                    s/{{ sub.name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {{ sub.display_name || sub.name }}
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span
                    class="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full"
                  >
                    {{ t('subs.subscribed') }}
                  </span>
                  <Icon
                    name="fa6-solid:chevron-right"
                    class="text-gray-400 text-sm"
                    aria-hidden="true"
                  />
                </div>
              </button>
            </div>
          </div>

          <!-- Other subs section -->
          <div v-if="otherSubs.length > 0">
            <h3
              class="sub-modal-section-title text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            >
              {{ t('subs.other_subs') }}
            </h3>
            <div class="space-y-1">
              <button
                v-for="sub in otherSubs"
                :key="sub.id"
                type="button"
                class="sub-modal-option w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                :class="{ 'opacity-50 cursor-not-allowed': isSubDisabled(sub) }"
                :disabled="isSubDisabled(sub)"
                @click="!isSubDisabled(sub) && selectSub(sub.id, sub)"
              >
                <SubIcon :sub="sub" size="lg" />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-text dark:text-text-dark truncate">
                    s/{{ sub.name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {{ sub.display_name || sub.name }}
                    <span v-if="sub.require_approval" class="text-amber-600 dark:text-amber-400">
                      · {{ t('subs.requires_approval') }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <Icon
                    v-if="isSubDisabled(sub)"
                    name="fa6-solid:lock"
                    class="text-gray-400"
                    aria-hidden="true"
                  />
                  <Icon
                    v-else
                    name="fa6-solid:chevron-right"
                    class="text-gray-400 text-sm"
                    aria-hidden="true"
                  />
                </div>
              </button>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="searchQuery && subscribedSubs.length === 0 && otherSubs.length === 0"
            class="text-center py-12"
          >
            <Icon
              name="fa6-solid:magnifying-glass"
              class="text-gray-400 text-4xl mb-4"
              aria-hidden="true"
            />
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('subs.no_subs_found') }}
            </p>
          </div>
        </div>

        <!-- Footer hint -->
        <div class="sub-modal-footer p-3 text-center flex-shrink-0">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            <Icon name="fa6-solid:circle-info" class="mr-1" aria-hidden="true" />
            {{ t('subs.select_sub_hint') }}
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
  import { useI18n } from '#i18n'
  import { useSubsStore } from '~/stores/subs'

  const { t } = useI18n()
  const subsStore = useSubsStore()

  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false,
    },
    mySubs: {
      type: Array,
      default: () => [],
    },
    currentSubId: {
      type: [Number, null],
      default: null,
    },
  })

  const emit = defineEmits(['close', 'select'])

  const searchInputRef = ref(null)
  const searchQuery = ref('')
  const allSubs = ref([])
  const loading = ref(false)

  // Load all subs when modal opens
  watch(
    () => props.isOpen,
    async (isOpen) => {
      if (isOpen) {
        await loadAllSubs()
        nextTick(() => {
          searchInputRef.value?.focus()
        })
      } else {
        searchQuery.value = ''
      }
    }
  )

  async function loadAllSubs() {
    if (allSubs.value.length > 0) return

    loading.value = true
    try {
      await subsStore.fetchSubs({ per_page: 100 })
      allSubs.value = subsStore.subs || []
    } catch (error) {
      console.error('Error loading all subs:', error)
    } finally {
      loading.value = false
    }
  }

  // Filter subs by search query
  const filteredSubs = computed(() => {
    let subs = allSubs.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      subs = subs.filter(
        (sub) =>
          sub.name.toLowerCase().includes(query) ||
          (sub.display_name && sub.display_name.toLowerCase().includes(query))
      )
    }

    // Exclude currently selected sub
    if (props.currentSubId !== null) {
      subs = subs.filter((sub) => sub.id !== props.currentSubId)
    }

    return subs
  })

  // Separate subscribed and other subs
  const mySubIds = computed(() => new Set(props.mySubs.map((s) => s.id)))

  const subscribedSubs = computed(() => {
    return filteredSubs.value.filter((sub) => mySubIds.value.has(sub.id))
  })

  const otherSubs = computed(() => {
    return filteredSubs.value.filter((sub) => !mySubIds.value.has(sub.id))
  })

  function isSubDisabled(sub) {
    return sub.require_approval && !mySubIds.value.has(sub.id)
  }

  function selectSub(subId, subObj = null) {
    emit('select', { subId, subObj })
    close()
  }

  function close() {
    emit('close')
  }

  // Close on Escape key
  function handleEscape(e) {
    if (e.key === 'Escape' && props.isOpen) {
      close()
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      document.addEventListener('keydown', handleEscape)
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.client) {
      document.removeEventListener('keydown', handleEscape)
    }
  })
</script>

<style scoped>
  .sub-modal {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .sub-modal-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .sub-modal-close-btn {
    color: var(--color-text-muted);
    transition: all 0.2s ease;
  }

  .sub-modal-close-btn:hover {
    color: var(--color-text-primary);
    background-color: var(--color-bg-hover);
  }

  .sub-modal-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .sub-modal-input::placeholder {
    color: var(--color-text-muted);
  }

  .sub-modal-section-title {
    color: var(--color-text-muted);
  }

  .sub-modal-option {
    background-color: transparent;
  }

  .sub-modal-option:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
  }

  .sub-modal-footer {
    border-top: 1px solid var(--color-border-default);
    background-color: var(--color-bg-subtle);
  }
</style>
