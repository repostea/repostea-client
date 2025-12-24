<template>
  <div class="author-info flex items-center">
    <span class="text-sm text-gray-500 dark:text-gray-400">
      {{ $t('federation.via_fediverse') }}
    </span>
    <a
      :href="remoteUser.profile_url"
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light ml-1"
    >
      {{ remoteUser.display_name || remoteUser.username }}@{{ remoteUser.domain }}
    </a>
  </div>
</template>

<script setup>
defineProps({
  remoteUser: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.author-info a {
  text-decoration: none;
}
</style>
