<template>
  <div
    v-if="embed"
    class="embed-preview flex items-center justify-between p-3 rounded-lg border animate-fade-in"
  >
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <div
        class="provider-icon w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        :class="providerIconClass"
      >
        <Icon :name="providerIcon" class="text-lg text-white" aria-hidden="true" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-text dark:text-text-dark truncate">
          {{ t('embed.detected', { provider: embed.provider }) }}
        </p>
        <p class="text-xs text-text-muted dark:text-text-dark-muted truncate">
          {{ truncatedUrl }}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0 ml-3">
      <button
        type="button"
        class="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-hover transition-colors"
        @click="$emit('insert-embed')"
      >
        {{ t('embed.insert') }}
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-sm font-medium rounded-md text-text-muted dark:text-text-dark-muted hover:bg-bg-hover dark:hover:bg-bg-dark-hover transition-colors"
        @click="$emit('insert-link')"
      >
        {{ t('embed.link_only') }}
      </button>
      <button
        type="button"
        class="p-1.5 text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark transition-colors"
        :aria-label="t('common.close')"
        @click="$emit('dismiss')"
      >
        <Icon name="fa6-solid:xmark" class="text-sm" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#i18n'
import type { EmbedInfo } from '~/composables/useEmbedDetection'

const props = defineProps<{
  embed: EmbedInfo | null
}>()

defineEmits<{
  'insert-embed': []
  'insert-link': []
  'dismiss': []
}>()

const { t } = useI18n()

const providerIcon = computed(() => {
  if (!props.embed) return 'fa6-solid:link'

  const icons: Record<string, string> = {
    'YouTube': 'fa6-brands:youtube',
    'Vimeo': 'fa6-brands:vimeo-v',
    'Dailymotion': 'fa6-solid:play',
    'X (Twitter)': 'fa6-brands:x-twitter',
    'Instagram': 'fa6-brands:instagram',
    'TikTok': 'fa6-brands:tiktok',
    'Spotify': 'fa6-brands:spotify',
    'SoundCloud': 'fa6-brands:soundcloud',
    'Suno': 'fa6-solid:music',
  }

  return icons[props.embed.provider] || 'fa6-solid:link'
})

const providerIconClass = computed(() => {
  if (!props.embed) return 'bg-gray-500'

  const classes: Record<string, string> = {
    'YouTube': 'bg-red-600',
    'Vimeo': 'bg-blue-500',
    'Dailymotion': 'bg-blue-600',
    'X (Twitter)': 'bg-black',
    'Instagram': 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600',
    'TikTok': 'bg-black',
    'Spotify': 'bg-green-500',
    'SoundCloud': 'bg-orange-500',
    'Suno': 'bg-gradient-to-r from-purple-500 to-pink-500',
  }

  return classes[props.embed.provider] || 'bg-gray-500'
})

const truncatedUrl = computed(() => {
  if (!props.embed?.url) return ''
  const url = props.embed.url
  if (url.length > 50) {
    return url.substring(0, 47) + '...'
  }
  return url
})
</script>

<style scoped>
.embed-preview {
  background-color: var(--color-bg-card);
  border-color: var(--color-border-default);
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
