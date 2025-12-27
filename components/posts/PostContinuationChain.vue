<template>
  <div
    v-if="continuationInfo && continuationInfo.posts && continuationInfo.posts.length > 1"
    class="mb-4 p-2 rounded continuation-chain-card"
  >
    <div class="flex items-center justify-between mb-1.5">
      <div class="text-[10px] font-medium text-primary dark:text-primary-light flex items-center">
        <Icon name="fa6-solid:list-ol" class="mr-1" aria-hidden="true" />
        {{ t('posts.relationships.continuation_chain') }}
      </div>
      <div
        class="text-[9px] font-semibold text-primary dark:text-primary-light px-1.5 py-0.5 rounded chain-badge"
      >
        {{ t('posts.relationships.part_of_chain', continuationInfo) }}
      </div>
    </div>
    <div class="flex flex-col gap-1">
      <NuxtLink
        v-for="(chainPost, index) in continuationInfo.posts"
        :key="chainPost.id"
        :to="localePath(chainPost.url || `/posts/${chainPost.slug || chainPost.id}`)"
        :class="[
          'px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center min-w-0',
          chainPost.id === postId ? 'chain-link-active' : 'chain-link',
        ]"
      >
        <span class="font-semibold mr-1 flex-shrink-0">{{ index + 1 }}.</span>
        <span class="truncate min-w-0">{{ chainPost.title }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  const { t } = useI18n()
  const localePath = useLocalePath()

  const props = defineProps({
    postId: {
      type: [Number, String],
      required: true,
    },
    chain: {
      type: Array,
      default: () => [],
    },
  })

  const continuationInfo = computed(() => {
    if (!props.chain || props.chain.length <= 1) {
      return null
    }

    const currentIndex = props.chain.findIndex((post) => post.id === props.postId)
    if (currentIndex === -1) return null

    return {
      current: currentIndex + 1,
      total: props.chain.length,
      posts: props.chain,
    }
  })
</script>

<style scoped>
  .continuation-chain-card {
    background-color: rgba(var(--color-primary-rgb), 0.15);
    border: 1px solid rgba(var(--color-primary-rgb), 0.4);
    box-shadow: 0 4px 6px -1px rgba(var(--color-primary-rgb), 0.1);
  }

  .chain-link {
    background-color: rgba(255, 255, 255, 0.7);
    color: var(--color-primary);
    border: 1px solid rgba(var(--color-primary-rgb), 0.5);
  }

  .dark .chain-link {
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(var(--color-primary-rgb), 0.6);
  }

  .chain-link:hover {
    background-color: rgba(var(--color-primary-rgb), 0.08);
  }

  .chain-link-active {
    background-color: var(--color-primary);
    color: var(--color-btn-primary-text);
  }

  .chain-badge {
    background-color: rgba(255, 255, 255, 0.9);
  }

  .dark .chain-badge {
    background-color: rgba(0, 0, 0, 0.3);
  }
</style>
