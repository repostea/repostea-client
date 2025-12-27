<template>
  <div
    v-if="show && users.length > 0"
    class="editor-mentions-dropdown absolute z-10 rounded-md shadow-lg max-h-48 overflow-y-auto min-w-[200px] max-w-[300px]"
    :style="{ left: left + 'px', top: top + 'px' }"
  >
    <div
      v-for="(user, index) in users"
      :key="user.id"
      class="editor-mention-item px-3 py-2 cursor-pointer flex items-center"
      :class="{ 'editor-mention-item-active': index === selectedIndex }"
      @click="$emit('select', user)"
    >
      <NuxtImg
        v-if="user.avatar"
        :src="user.avatar"
        :alt="user.username"
        width="24"
        height="24"
        loading="lazy"
        class="w-6 h-6 rounded-full mr-2"
      />
      <div
        v-else
        class="editor-avatar-placeholder w-6 h-6 rounded-full mr-2 flex items-center justify-center"
      >
        <Icon
          name="fa6-solid:user"
          class="text-xs text-text-muted dark:text-text-dark-muted"
          aria-hidden="true"
        />
      </div>
      <span class="text-sm">@{{ user.username }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  users: {
    type: Array,
    default: () => [],
  },
  selectedIndex: {
    type: Number,
    default: 0,
  },
  left: {
    type: Number,
    default: 0,
  },
  top: {
    type: Number,
    default: 0,
  },
})

defineEmits(['select'])
</script>

<style scoped>
.editor-mentions-dropdown {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
}

.editor-mention-item:hover {
  background-color: var(--color-bg-hover);
}

.editor-mention-item-active {
  background-color: var(--color-bg-hover);
}

.editor-avatar-placeholder {
  background-color: var(--color-bg-hover);
}
</style>
