<template>
  <div :class="containerClass">
    <div :class="spinnerClass" role="status" :aria-label="loadingText"/>
    <span v-if="showText" :class="textClass">
      {{ loadingText }}
    </span>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  const props = defineProps({
    // Size variants: xs, sm, md, lg, xl
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
    },
    // Color variants: primary, white, neutral, current
    color: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'white', 'neutral', 'current'].includes(value),
    },
    // Display mode: inline, block, centered
    display: {
      type: String,
      default: 'block',
      validator: (value) => ['inline', 'block', 'centered'].includes(value),
    },
    // Show loading text
    showText: {
      type: Boolean,
      default: false,
    },
    // Custom loading text (defaults to i18n)
    text: {
      type: String,
      default: null,
    },
    // Custom CSS classes
    customClass: {
      type: String,
      default: '',
    },
  })

  // Size configurations
  const sizeConfig = {
    xs: { size: 'w-3 h-3', border: 'border' },
    sm: { size: 'w-4 h-4', border: 'border-2' },
    md: { size: 'w-6 h-6', border: 'border-2' },
    lg: { size: 'w-8 h-8', border: 'border-4' },
    xl: { size: 'w-10 h-10', border: 'border-4' },
  }

  // Color configurations
  const colorConfig = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    neutral: 'border-neutral-500 border-t-transparent',
    current: 'border-current border-t-transparent',
  }

  // Display configurations
  const displayConfig = {
    inline: 'inline-flex items-center',
    block: 'flex items-center',
    centered: 'flex items-center justify-center',
  }

  // Computed classes
  const containerClass = computed(() => {
    const base = displayConfig[props.display]
    const spacing = props.showText && props.display === 'inline' ? 'gap-2' : 'gap-2'
    return `${base} ${spacing} ${props.customClass}`.trim()
  })

  const spinnerClass = computed(() => {
    const config = sizeConfig[props.size]
    const color = colorConfig[props.color]
    return `${config.size} ${config.border} ${color} rounded-full animate-spin`
  })

  const textClass = computed(() => {
    const baseClass = 'text-gray-500 dark:text-gray-400'
    const sizeClass = props.size === 'xs' || props.size === 'sm' ? 'text-xs' : 'text-sm'
    return `${baseClass} ${sizeClass}`
  })

  const loadingText = computed(() => {
    return props.text || t('common.loading')
  })
</script>
