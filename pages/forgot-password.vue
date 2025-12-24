<template>
  <div>Redirigiendo...</div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'

  const router = useRouter()
  const route = useRoute()

  onMounted(() => {
    router.replace({
      path: '/auth/forgot-password',
      query: route.query,
    })
  })
</script>
