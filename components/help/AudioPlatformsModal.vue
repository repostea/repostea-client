<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

      <!-- Modal -->
      <div
        class="relative w-full max-w-4xl card-bg rounded-lg shadow-xl border audio-modal-border max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-platforms-modal-title"
        @click.stop
      >
        <!-- Header -->
        <div class="card-bg p-6 border-b audio-modal-border">
          <div class="flex items-center justify-between mb-4">
            <h2
              id="audio-platforms-modal-title"
              class="text-2xl font-semibold text-text dark:text-text-dark flex items-center gap-2"
            >
              <Icon name="fa6-solid:headphones" class="text-primary" aria-hidden="true" />
              {{ t('audio_help.modal_title') }}
            </h2>
            <button
              class="text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark p-2 rounded audio-modal-close-hover transition-colors"
              :aria-label="t('common.close')"
              @click="close"
            >
              <Icon name="fa6-solid:xmark" class="text-xl" aria-hidden="true" />
            </button>
          </div>

          <!-- Search Bar -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('audio_help.search_placeholder')"
              class="w-full px-4 py-3 pl-11 rounded-lg audio-modal-input focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Icon
              name="fa6-solid:magnifying-glass"
              class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="px-6 py-3 audio-modal-tabs-bg border-b audio-modal-border">
          <div class="flex flex-wrap gap-2">
            <button
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                selectedCategory === 'all' ? 'bg-primary text-white' : 'audio-modal-tab-inactive',
              ]"
              @click="selectedCategory = 'all'"
            >
              {{ t('audio_help.all_platforms') }} ({{ allPlatforms.length }})
            </button>
            <button
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center',
                selectedCategory === 'podcasts'
                  ? 'bg-primary text-white'
                  : 'audio-modal-tab-inactive',
              ]"
              @click="selectedCategory = 'podcasts'"
            >
              <Icon name="fa6-solid:podcast" class="mr-1 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('audio_help.category_podcasts') }} ({{ podcastCount }})</span>
            </button>
            <button
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center',
                selectedCategory === 'music' ? 'bg-primary text-white' : 'audio-modal-tab-inactive',
              ]"
              @click="selectedCategory = 'music'"
            >
              <Icon name="fa6-solid:music" class="mr-1 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('audio_help.category_music') }} ({{ musicCount }})</span>
            </button>
            <button
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center',
                selectedCategory === 'audiobooks'
                  ? 'bg-primary text-white'
                  : 'audio-modal-tab-inactive',
              ]"
              @click="selectedCategory = 'audiobooks'"
            >
              <Icon name="fa6-solid:book-open" class="mr-1 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('audio_help.category_audiobooks') }} ({{ audiobookCount }})</span>
            </button>
          </div>
        </div>

        <!-- Platforms List -->
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="filteredPlatforms.length > 0" class="space-y-3">
            <div
              v-for="platform in filteredPlatforms"
              :key="platform.id"
              class="audio-modal-item rounded-lg p-4 audio-modal-item-border hover:border-primary dark:hover:border-primary transition-all"
            >
              <!-- Platform Header -->
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div class="flex-shrink-0">
                  <Icon
                    :name="platform.icon"
                    :class="['text-3xl', getPlatformIconColor(platform.id)]"
                    aria-hidden="true"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <!-- Name and Category -->
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="font-semibold text-lg text-text dark:text-text-dark">
                      {{ platform.name }}
                    </h3>
                    <span
                      :class="[
                        'inline-block px-2 py-0.5 text-xs rounded-full',
                        getCategoryClass(platform.category),
                      ]"
                    >
                      {{ getCategoryLabel(platform.category) }}
                    </span>
                  </div>

                  <!-- Description -->
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {{ platform.description }}
                  </p>

                  <!-- How to copy link -->
                  <div
                    v-if="platform.howToCopy"
                    class="audio-modal-code-bg rounded p-3 mb-3 audio-modal-item-border"
                  >
                    <p
                      class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"
                    >
                      <Icon name="fa6-solid:circle-info" class="text-primary" aria-hidden="true" />
                      {{ t('audio_help.how_to_copy') }}
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">{{ platform.howToCopy }}</p>
                  </div>

                  <!-- Example URL -->
                  <div v-if="platform.exampleUrl" class="mb-3">
                    <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {{ t('audio_help.example_url') }}:
                    </p>
                    <code
                      class="text-xs audio-modal-code-bg p-2 rounded block overflow-x-auto audio-modal-item-border"
                    >
                      {{ platform.exampleUrl }}
                    </code>
                  </div>

                  <!-- Search Button -->
                  <a
                    :href="platform.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark hover:text-white transition-colors"
                  >
                    <Icon name="fa6-solid:magnifying-glass" aria-hidden="true" />
                    {{ t('audio_help.search_on_platform', { platform: platform.name }) }}
                    <Icon
                      name="fa6-solid:arrow-up-right-from-square"
                      class="text-xs"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else class="text-center py-12">
            <Icon
              name="fa6-solid:magnifying-glass"
              class="text-4xl text-gray-300 dark:text-gray-600 mb-4"
              aria-hidden="true"
            />
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('audio_help.no_results') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    isOpen: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['close'])

  // State
  const searchQuery = ref('')
  const selectedCategory = ref('all')

  // All platforms data
  const allPlatforms = computed(() => [
    // Podcasts
    {
      id: 'spotify',
      name: t('audio_help.platforms.spotify.name'),
      description: t('audio_help.platforms.spotify.description'),
      category: 'podcasts',
      icon: 'fa6-brands:spotify',
      url: 'https://open.spotify.com/search',
      exampleUrl: 'https://open.spotify.com/show/xyz',
      howToCopy: t('audio_help.platforms.spotify.how_to_copy'),
    },
    {
      id: 'ivoox',
      name: t('audio_help.platforms.ivoox.name'),
      description: t('audio_help.platforms.ivoox.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://www.ivoox.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'apple_podcasts',
      name: t('audio_help.platforms.apple_podcasts.name'),
      description: t('audio_help.platforms.apple_podcasts.description'),
      category: 'podcasts',
      icon: 'fa6-brands:apple',
      url: 'https://podcasts.apple.com',
      exampleUrl: 'https://podcasts.apple.com/us/podcast/xyz/id123456',
      howToCopy: t('audio_help.platforms.apple_podcasts.how_to_copy'),
    },
    {
      id: 'anchor',
      name: t('audio_help.platforms.anchor.name'),
      description: t('audio_help.platforms.anchor.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://anchor.fm',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'spreaker',
      name: t('audio_help.platforms.spreaker.name'),
      description: t('audio_help.platforms.spreaker.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://www.spreaker.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'transistor',
      name: t('audio_help.platforms.transistor.name'),
      description: t('audio_help.platforms.transistor.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://transistor.fm',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'buzzsprout',
      name: t('audio_help.platforms.buzzsprout.name'),
      description: t('audio_help.platforms.buzzsprout.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://www.buzzsprout.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'podbean',
      name: t('audio_help.platforms.podbean.name'),
      description: t('audio_help.platforms.podbean.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://www.podbean.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'captivate',
      name: t('audio_help.platforms.captivate.name'),
      description: t('audio_help.platforms.captivate.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://www.captivate.fm',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'castos',
      name: t('audio_help.platforms.castos.name'),
      description: t('audio_help.platforms.castos.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://castos.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'acast',
      name: t('audio_help.platforms.acast.name'),
      description: t('audio_help.platforms.acast.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://www.acast.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'megaphone',
      name: t('audio_help.platforms.megaphone.name'),
      description: t('audio_help.platforms.megaphone.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://megaphone.fm',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'simplecast',
      name: t('audio_help.platforms.simplecast.name'),
      description: t('audio_help.platforms.simplecast.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://www.simplecast.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'podigee',
      name: t('audio_help.platforms.podigee.name'),
      description: t('audio_help.platforms.podigee.description'),
      category: 'podcasts',
      icon: 'fa6-solid:podcast',
      url: 'https://www.podigee.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'google_podcasts',
      name: t('audio_help.platforms.google_podcasts.name'),
      description: t('audio_help.platforms.google_podcasts.description'),
      category: 'podcasts',
      icon: 'fa6-brands:google',
      url: 'https://podcasts.google.com',
      exampleUrl: '',
      howToCopy: '',
    },
    // Music
    {
      id: 'soundcloud',
      name: t('audio_help.platforms.soundcloud.name'),
      description: t('audio_help.platforms.soundcloud.description'),
      category: 'music',
      icon: 'fa6-brands:soundcloud',
      url: 'https://soundcloud.com/search',
      exampleUrl: 'https://soundcloud.com/artist/track-name',
      howToCopy: t('audio_help.platforms.soundcloud.how_to_copy'),
    },
    {
      id: 'bandcamp',
      name: t('audio_help.platforms.bandcamp.name'),
      description: t('audio_help.platforms.bandcamp.description'),
      category: 'music',
      icon: 'fa6-brands:bandcamp',
      url: 'https://bandcamp.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'mixcloud',
      name: t('audio_help.platforms.mixcloud.name'),
      description: t('audio_help.platforms.mixcloud.description'),
      category: 'music',
      icon: 'fa6-brands:mixcloud',
      url: 'https://www.mixcloud.com/discover',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'audioboom',
      name: t('audio_help.platforms.audioboom.name'),
      description: t('audio_help.platforms.audioboom.description'),
      category: 'music',
      icon: 'fa6-solid:podcast',
      url: 'https://audioboom.com',
      exampleUrl: '',
      howToCopy: '',
    },
    {
      id: 'deezer',
      name: t('audio_help.platforms.deezer.name'),
      description: t('audio_help.platforms.deezer.description'),
      category: 'music',
      icon: 'fa6-brands:deezer',
      url: 'https://www.deezer.com/search',
      exampleUrl: '',
      howToCopy: '',
    },
    // Audiobooks
    {
      id: 'audible',
      name: t('audio_help.platforms.audible.name'),
      description: t('audio_help.platforms.audible.description'),
      category: 'audiobooks',
      icon: 'fa6-brands:audible',
      url: 'https://www.audible.com',
      exampleUrl: '',
      howToCopy: '',
    },
  ])

  // Category counts
  const podcastCount = computed(
    () => allPlatforms.value.filter((p) => p.category === 'podcasts').length
  )
  const musicCount = computed(() => allPlatforms.value.filter((p) => p.category === 'music').length)
  const audiobookCount = computed(
    () => allPlatforms.value.filter((p) => p.category === 'audiobooks').length
  )

  // Filtered platforms
  const filteredPlatforms = computed(() => {
    let platforms = allPlatforms.value

    // Filter by category
    if (selectedCategory.value !== 'all') {
      platforms = platforms.filter((p) => p.category === selectedCategory.value)
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      platforms = platforms.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      )
    }

    return platforms
  })

  // Helper functions
  function getCategoryClass(category) {
    switch (category) {
      case 'podcasts':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'music':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'audiobooks':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  function getCategoryLabel(category) {
    switch (category) {
      case 'podcasts':
        return t('audio_help.category_podcasts')
      case 'music':
        return t('audio_help.category_music')
      case 'audiobooks':
        return t('audio_help.category_audiobooks')
      default:
        return category
    }
  }

  function getPlatformIconColor(platformId) {
    const colors = {
      spotify: 'text-green-500',
      ivoox: 'text-orange-500',
      apple_podcasts: 'text-purple-500',
      soundcloud: 'text-orange-400',
      bandcamp: 'text-blue-400',
      mixcloud: 'text-blue-300',
      audible: 'text-orange-600',
    }
    return colors[platformId] || 'text-gray-500'
  }

  function close() {
    emit('close')
  }
</script>

<style scoped>
  .audio-modal-border {
    border-color: var(--color-border-default);
  }

  .audio-modal-input-border {
    border: 1px solid var(--color-border-default);
  }

  .audio-modal-tab-inactive {
    background-color: var(--color-bg-card);
    color: var(--color-text-secondary);
  }

  .audio-modal-tab-inactive:hover {
    background-color: var(--color-bg-hover);
  }

  .audio-modal-close-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .audio-modal-item-border {
    border: 1px solid var(--color-border-default);
  }

  .audio-modal-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }

  .audio-modal-item {
    background-color: var(--color-bg-subtle);
  }

  .audio-modal-tabs-bg {
    background-color: var(--color-bg-subtle);
  }

  .audio-modal-code-bg {
    background-color: var(--color-bg-card);
  }
</style>
