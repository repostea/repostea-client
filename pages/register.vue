<template>
  <div>Redirigiendo...</div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'

  const router = useRouter()
  const route = useRoute()

  onMounted(() => {
    // Redirect to correct route, preserving query parameters
    router.replace({
      path: '/auth/register',
      query: route.query,
    })
  })
</script>
