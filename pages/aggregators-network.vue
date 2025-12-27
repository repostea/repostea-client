<template>
  <div />
</template>

<script setup>
  definePageMeta({
    middleware: () => {
      return navigateTo('/', { redirectCode: 301 })
    },
  })
</script>
