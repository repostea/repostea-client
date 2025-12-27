<template>
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-2 text-text dark:text-text-dark flex items-center">
      <Icon
        v-if="icon"
        :name="`fa6-solid:${icon}`"
        class="mr-3 text-primary dark:text-primary-light"
        aria-hidden="true"
      />
      {{ title }}
    </h1>
    <p v-if="description" class="text-text-muted dark:text-text-dark-muted text-lg">
      {{ description }}
    </p>
  </div>
</template>

<script setup>
  defineProps({
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
  })
</script>
