<template>
  <div class="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center">
    <Icon name="fa6-solid:asterisk" class="text-xs mr-1" aria-hidden="true" />
    {{ t('submit.validation.required_fields_description') }}
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()
</script>
