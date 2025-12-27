<template>
  <div>
    <div class="card-bg p-6 rounded-lg shadow-sm border border-border-color text-center">
      <Icon
        name="fa6-solid:triangle-exclamation"
        class="text-3xl text-danger mb-3"
        aria-hidden="true"
      />
      <h2 class="text-xl font-bold mb-2">{{ t('errors.404.title') }}</h2>
      <p>{{ t('errors.404.message') }}</p>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'
  const { t } = useI18n()
</script>
