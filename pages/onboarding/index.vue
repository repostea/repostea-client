<script setup>
  import { useLocalePath } from '#i18n'

  definePageMeta({
    layout: false,
  })

  const localePath = useLocalePath()

  // Redirect to welcome step immediately
  navigateTo(localePath('/onboarding/welcome'), { replace: true })
</script>

<template>
  <div/>
</template>
