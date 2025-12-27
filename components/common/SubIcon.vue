<template>
  <component
    :is="linkTo ? NuxtLink : 'div'"
    :to="linkTo"
    class="sub-icon flex-shrink-0 rounded-lg flex items-center justify-center font-bold overflow-hidden"
    :class="sizeClasses"
    :style="{ backgroundColor: bgColor }"
  >
    <NuxtImg
      v-if="hasImage"
      :src="sub.icon"
      :alt="sub.name"
      class="w-full h-full object-cover"
      :width="imageDimension"
      :height="imageDimension"
      format="webp"
      loading="lazy"
      :placeholder="[imageDimension, imageDimension, 10]"
    />
    <span v-else class="text-white">{{ initials }}</span>
  </component>
</template>

<script setup>
  import { computed } from 'vue'
  import { useLocalePath } from '#i18n'

  const NuxtLink = resolveComponent('NuxtLink')
  const localePath = useLocalePath()

  const props = defineProps({
    sub: {
      type: Object,
      required: true,
    },
    size: {
      type: String,
      default: 'md', // 'xs', 'sm', 'md', 'lg', 'xl'
      validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v),
    },
    linked: {
      type: Boolean,
      default: false,
    },
  })

  const sizeClasses = computed(() => {
    const sizes = {
      xs: 'w-5 h-5 text-[8px]',
      sm: 'w-6 h-6 text-[9px]',
      md: 'w-8 h-8 text-[10px]',
      lg: 'w-10 h-10 text-xs',
      xl: 'w-12 h-12 text-sm',
    }
    return sizes[props.size]
  })

  const imageDimension = computed(() => {
    const dimensions = { xs: 20, sm: 24, md: 32, lg: 40, xl: 48 }
    return dimensions[props.size]
  })

  const linkTo = computed(() => {
    if (!props.linked || !props.sub?.name) return null
    return localePath(`/s/${props.sub.name}`)
  })

  const hasImage = computed(() => {
    const icon = props.sub?.icon
    if (!icon) return false
    return (
      icon.startsWith('http://') ||
      icon.startsWith('https://') ||
      icon.startsWith('/') ||
      icon.startsWith('data:image')
    )
  })

  const initials = computed(() => {
    const name = props.sub?.name
    if (!name) return '?'
    return name.substring(0, 2).toUpperCase()
  })

  const bgColor = computed(() => {
    const name = props.sub?.name
    if (!name) return '#6366f1'
    // Map first letter to color (a-z = 0-25)
    const firstChar = name.toLowerCase().charCodeAt(0) - 97
    const colors = [
      '#ef4444',
      '#dc2626',
      '#f97316',
      '#ea580c',
      '#eab308',
      '#ca8a04',
      '#84cc16',
      '#22c55e',
      '#16a34a',
      '#14b8a6',
      '#0d9488',
      '#06b6d4',
      '#0891b2',
      '#3b82f6',
      '#2563eb',
      '#6366f1',
      '#4f46e5',
      '#8b5cf6',
      '#7c3aed',
      '#a855f7',
      '#9333ea',
      '#d946ef',
      '#c026d3',
      '#ec4899',
      '#db2777',
      '#f43f5e',
    ]
    const index = Math.max(0, Math.min(firstChar, 25))
    return colors[index]
  })
</script>
