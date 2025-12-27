<template>
  <button
    class="footer-btn"
    :class="{ 'footer-btn-active': active }"
    :title="title"
    :aria-label="ariaLabel || title"
    @click="$emit('click', $event)"
  >
    <Icon v-if="icon" :name="icon" class="footer-btn-icon" aria-hidden="true" />
    <span v-if="label" class="footer-btn-label">{{ label }}</span>
    <span v-if="count !== undefined && count > 0" class="footer-btn-count">{{ count }}</span>
    <slot />
  </button>
</template>

<script setup>
  defineProps({
    icon: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: '',
    },
    ariaLabel: {
      type: String,
      default: null,
    },
    count: {
      type: Number,
      default: undefined,
    },
    active: {
      type: Boolean,
      default: false,
    },
  })

  defineEmits(['click'])
</script>

<style scoped>
  .footer-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    background: transparent;
    border: none;
    padding: 0.35rem 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .footer-btn:hover {
    color: var(--color-primary);
    background-color: var(--color-bg-active);
  }

  .footer-btn-active {
    color: var(--color-primary);
  }

  .footer-btn-icon {
    font-size: 0.75rem;
    width: 0.75rem;
    height: 0.75rem;
  }

  .footer-btn-label {
    font-size: 0.75rem;
  }

  .footer-btn-count {
    font-size: 0.7rem;
    font-weight: 600;
  }
</style>
