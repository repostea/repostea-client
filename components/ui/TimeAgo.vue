<template>
  <span :title="formattedDate">{{ timeAgo }}</span>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  // Props
  const props = defineProps({
    datetime: {
      type: [String, Date, Number],
      required: true,
    },
    autoUpdate: {
      type: Boolean,
      default: true,
    },
    updateInterval: {
      type: Number,
      default: 60000, // 1 minute
    },
  })

  // Get locale from Nuxt i18n
  const { locale } = useI18n()

  // State and timer
  const now = ref(new Date())
  let timer = null

  // Parsed date from prop
  const date = computed(() => {
    if (props.datetime instanceof Date) {
      return props.datetime
    }
    return new Date(props.datetime)
  })

  // Full date format for tooltip (uses current locale)
  const formattedDate = computed(() => {
    return date.value.toLocaleString(locale.value, { timeZone: 'Europe/Madrid' })
  })

  // Relative time formatter using browser's Intl API
  const rtf = computed(() => {
    return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
  })

  // Calculate time difference using Intl.RelativeTimeFormat
  const timeAgo = computed(() => {
    const seconds = Math.floor((now.value - date.value) / 1000)

    // Less than 1 minute
    if (seconds < 60) {
      return rtf.value.format(-seconds, 'second')
    }

    // Less than 1 hour
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return rtf.value.format(-minutes, 'minute')
    }

    // Less than 1 day
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return rtf.value.format(-hours, 'hour')
    }

    // Less than 1 week
    const days = Math.floor(hours / 24)
    if (days < 7) {
      return rtf.value.format(-days, 'day')
    }

    // Less than 1 month (approximate)
    if (days < 30) {
      const weeks = Math.floor(days / 7)
      return rtf.value.format(-weeks, 'week')
    }

    // Less than 1 year (approximate)
    const months = Math.floor(days / 30)
    if (months < 12) {
      return rtf.value.format(-months, 'month')
    }

    // More than 1 year
    const years = Math.floor(days / 365)
    return rtf.value.format(-years, 'year')
  })

  // Function to update current time
  function updateNow() {
    now.value = new Date()
  }

  // Set up automatic updates
  onMounted(() => {
    if (props.autoUpdate) {
      timer = setInterval(updateNow, props.updateInterval)
    }
  })

  // Clean up the timer
  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
    }
  })
</script>
