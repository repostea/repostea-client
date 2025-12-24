<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-6">{{ t('posts.title') }}</h1>
    <div
      class="card-bg rounded-lg shadow-sm border border-border-color p-8 text-center"
    >
      <Icon name="fa6-solid:file-lines" class="text-4xl text-gray-400 dark:text-gray-500 mb-4" aria-hidden="true" />
      <h3 class="text-xl font-medium mb-2">{{ t('posts.index.title') }}</h3>
      <p class="text-text-muted dark:text-text-dark-muted mb-4">
        {{ t('posts.index.message') }}
      </p>
      <NuxtLink :to="localePath('/')" class="btn btn-primary hover:text-white">
        {{ t('common.back_to_home') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
  import { useLocalePath, useI18n  } from '#i18n'

  
  const localePath = useLocalePath()
  const { t } = useI18n()
</script>
