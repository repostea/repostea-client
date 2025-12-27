<template>
  <button
    v-if="showBadge"
    type="button"
    class="seal-corner-badge"
    :class="badgeClass"
    :title="badgeTooltip"
    :aria-label="badgeTooltip"
    @click.stop="$emit('click')"
  >
    <Icon
      :name="badgeIconify"
      class="badge-icon"
      :class="{ 'rotated-icon': isRecommended }"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from '#i18n'

  interface Props {
    recommendedCount?: number
    adviseAgainstCount?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    recommendedCount: 0,
    adviseAgainstCount: 0,
  })

  defineEmits<{
    click: []
  }>()

  const { t } = useI18n()

  const showBadge = computed(() => {
    // Only show if there are seals AND one type has more than the other (no tie)
    const hasSeals = props.recommendedCount > 0 || props.adviseAgainstCount > 0
    const noTie = props.recommendedCount !== props.adviseAgainstCount
    return hasSeals && noTie
  })

  const isRecommended = computed(() => {
    return props.recommendedCount > props.adviseAgainstCount
  })

  const badgeClass = computed(() => {
    const diff = props.recommendedCount - props.adviseAgainstCount
    if (diff > 0) return 'badge-recommended'
    if (diff < 0) return 'badge-advise-against'
    return 'badge-neutral'
  })

  const badgeIconify = computed(() => {
    const diff = props.recommendedCount - props.adviseAgainstCount
    if (diff > 0) return 'fa6-solid:award'
    if (diff < 0) return 'fa6-solid:triangle-exclamation'
    return 'fa6-solid:certificate'
  })

  const badgeTooltip = computed(() => {
    const diff = props.recommendedCount - props.adviseAgainstCount
    if (diff > 0) {
      return t('seals.recommended_tooltip', { count: props.recommendedCount })
    }
    if (diff < 0) {
      return t('seals.advised_against_tooltip', { count: props.adviseAgainstCount })
    }
    return `${props.recommendedCount} ${t('seals.recommended')} / ${props.adviseAgainstCount} ${t('seals.advised_against')}`
  })
</script>

<style scoped>
  .seal-corner-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0;
  }

  .badge-icon {
    font-size: 1.75rem;
    line-height: 1;
  }

  .rotated-icon {
    transform: rotate(-15deg);
  }

  /* Recommended badge - Green */
  .badge-recommended {
    color: var(--color-seal-recommended);
  }

  /* Advise Against badge - Orange */
  .badge-advise-against {
    color: var(--color-seal-advise-against);
  }

  /* Neutral badge - Yellow */
  .badge-neutral {
    color: var(--color-seal-neutral);
  }
</style>
