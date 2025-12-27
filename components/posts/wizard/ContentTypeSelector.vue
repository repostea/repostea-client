<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-xl font-semibold mb-2">{{ t('submit.wizard.content_type_title') }}</h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('submit.wizard.content_type_subtitle') }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        v-for="type in contentTypes"
        :key="type.value"
        :data-testid="`content-type-${type.value}`"
        class="content-type-option p-6 border-2 rounded-lg transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:scale-105 text-center flex flex-col items-center"
        :class="
          selectedType === type.value
            ? 'border-primary bg-primary/10 scale-105 shadow-lg'
            : 'wizard-type-border-inactive'
        "
        @click="$emit('select', type.value)"
      >
        <div class="mb-3">
          <Icon :name="type.icon" :class="type.color" class="text-3xl" aria-hidden="true" />
        </div>
        <h3 class="font-medium mb-1">{{ type.title }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ type.description }}</p>
      </button>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    contentTypes: {
      type: Array,
      required: true,
    },
    selectedType: {
      type: String,
      default: '',
    },
  })

  defineEmits(['select'])
</script>
