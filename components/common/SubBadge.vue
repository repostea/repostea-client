<template>
  <NuxtLink
    :to="localePath(`/s/${sub.name}`)"
    class="sub-badge"
    :class="[sizeClass]"
    :title="`${sub.display_name || sub.name}\n${sub.members_count || 0} ${t('subs.members')}\n${sub.posts_count || 0} ${t('subs.posts')}`"
    @click.stop
  >
    <span v-if="showIcon && sub.icon" class="sub-badge-icon">{{ sub.icon }}</span>
    <span>s/{{ sub.name }}</span>
  </NuxtLink>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'

  const { t } = useI18n()
  const localePath = useLocalePath()

  const props = defineProps({
    sub: {
      type: Object,
      required: true,
    },
    size: {
      type: String,
      default: 'md', // 'xs', 'sm', 'md', 'lg'
      validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value),
    },
    showIcon: {
      type: Boolean,
      default: false,
    },
  })

  const sizeClass = computed(() => `sub-badge--${props.size}`)
</script>

<style scoped>
  .sub-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border-radius: 0.25rem;
    font-weight: 500;
    background-color: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
    transition: all 0.2s ease;
  }

  .sub-badge:hover {
    background-color: rgba(var(--color-primary-rgb), 0.2);
    text-decoration: none;
  }

  .dark .sub-badge {
    background-color: rgba(var(--color-primary-rgb), 0.15);
    color: var(--color-primary-light);
  }

  .dark .sub-badge:hover {
    background-color: rgba(var(--color-primary-rgb), 0.25);
  }

  /* Sizes */
  .sub-badge--xs {
    padding: 0px 3px;
    font-size: 0.6rem;
    border-radius: 2px;
  }

  .sub-badge--sm {
    padding: 0.125rem 0.375rem;
    font-size: 0.7rem;
  }

  .sub-badge--md {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .sub-badge--lg {
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
  }

  .sub-badge-icon {
    font-size: 1em;
  }
</style>
