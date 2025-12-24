<template>
  <div class="error-container" role="alert" aria-live="assertive">
    <div
      class="error-card card-bg p-6 rounded-lg shadow-sm text-center"
    >
      <Icon :name="iconIconify" :class="iconColor + ' text-3xl mb-3'" aria-hidden="true" />
      <h2 class="text-xl font-bold mb-2">{{ title }}</h2>
      <p class="mb-4">{{ message }}</p>

      <div v-if="showAction" class="mt-4">
        <button v-if="actionType === 'retry'" class="btn btn-primary" @click="$emit('retry')">
          {{ t('common.retry') }}
        </button>

        <NuxtLink v-else-if="actionType === 'home'" to="/" class="btn btn-primary">
          {{ t('navigation.back_to_home') }}
        </NuxtLink>

        <button v-else-if="actionType === 'back'" class="btn btn-primary" @click="$router.back()">
          {{ t('common.go_back') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from '#i18n'

  const props = defineProps({
    type: {
      type: String,
      default: 'generic',
      validator: (value) =>
        ['404', '500', 'network', 'generic', 'unauthorized', 'forbidden'].includes(value),
    },
    customTitle: {
      type: String,
      default: null,
    },
    customMessage: {
      type: String,
      default: null,
    },
    showAction: {
      type: Boolean,
      default: true,
    },
    actionType: {
      type: String,
      default: 'home',
      validator: (value) => ['home', 'retry', 'back'].includes(value),
    },
  })

  defineEmits(['retry'])

  const { t } = useI18n()

  const title = computed(() => {
    if (props.customTitle) return props.customTitle

    return props.type === 'generic' ? t('errors.generic.title') : t(`errors.${props.type}.title`)
  })

  const message = computed(() => {
    if (props.customMessage) return props.customMessage

    return props.type === 'generic'
      ? t('errors.generic.message')
      : t(`errors.${props.type}.message`)
  })

  const iconIconify = computed(() => {
    switch (props.type) {
      case '404':
        return 'fa6-solid:magnifying-glass'
      case '500':
        return 'fa6-solid:triangle-exclamation'
      case 'network':
        return 'fa6-solid:wifi'
      case 'unauthorized':
        return 'fa6-solid:lock'
      case 'forbidden':
        return 'fa6-solid:ban'
      default:
        return 'fa6-solid:circle-exclamation'
    }
  })

  const iconColor = computed(() => {
    switch (props.type) {
      case '404':
      case 'unauthorized':
        return 'text-warning'
      default:
        return 'text-danger'
    }
  })
</script>

<style scoped>
  .error-card {
    border: 1px solid var(--color-border-default);
  }
</style>
