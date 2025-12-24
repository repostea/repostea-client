<template>
  <div>
    <button
      v-if="canChangeStatus"
      class="p-1.5 text-sm rounded-md border transition-colors"
      :class="buttonClass"
      :title="buttonTitle"
      :aria-label="buttonTitle"
      :disabled="isChanging"
      @click="toggleStatus"
    >
      <span
        v-if="isChanging"
        class="inline-block animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"
        aria-hidden="true"
      />
      <Icon v-else :name="buttonIconify" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useI18n } from '#i18n'

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['status-changed'])
  const { t } = useI18n()
  const { $api } = useNuxtApp()

  const isChanging = ref(false)

  const canChangeStatus = computed(() => {
    // Can only change status if draft or published (not hidden, pending, or rejected)
    return props.post.status === 'draft' || props.post.status === 'published'
  })

  const buttonClass = computed(() => {
    if (props.post.status === 'draft') {
      return 'border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
    }
    return 'border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
  })

  const buttonIconify = computed(() => {
    return props.post.status === 'draft' ? 'fa6-solid:circle-check' : 'fa6-solid:rotate-left'
  })

  const buttonTitle = computed(() => {
    return props.post.status === 'draft' ? t('posts.publish_draft') : t('posts.unpublish_to_draft')
  })

  async function toggleStatus() {
    try {
      isChanging.value = true
      const newStatus = props.post.status === 'draft' ? 'published' : 'draft'

      await $api.posts.updatePostStatus(props.post.id, newStatus)

      emit('status-changed', props.post.id, newStatus)
    } catch (error) {
      console.error('Error al cambiar el estado del post:', error)
    } finally {
      isChanging.value = false
    }
  }
</script>
