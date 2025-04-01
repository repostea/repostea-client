<template>
  <div
    class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-4"
  >
    <div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
      <h3 class="font-medium"><i class="fas fa-user mr-2"></i>{{ $t('links.show.author') }}</h3>
    </div>
    <div class="p-4">
      <div class="flex items-center mb-3">
        <div class="mr-3">
          <div v-if="user?.avatar" class="w-16 h-16">
            <img
              :src="user.avatar"
              class="rounded-full w-full h-full object-cover"
              :alt="user.username"
            />
          </div>
          <div
            v-else
            class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl"
          >
            <i class="fas fa-user-circle"></i>
          </div>
        </div>
        <div>
          <h5 class="font-medium mb-1">
            <NuxtLink :to="`/users/${user?.username}`" class="text-primary hover:underline">
              {{ user?.username }}
            </NuxtLink>
          </h5>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            <div>
              {{ $t('user.karma') }}:
              <span class="font-bold">{{ formatNumber(user?.karma) }}</span>
            </div>
            <div>
              {{ $t('user.joined') }}:
              {{ formatDate(user?.created_at) }}
            </div>
          </div>
        </div>
      </div>

      <p v-if="user?.bio" class="text-sm">
        {{ user.bio }}
      </p>
      <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
        {{ $t('user.no_bio') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  const props = defineProps({
    user: {
      type: Object,
      required: true,
    },
  })

  function formatNumber(num) {
    if (!num) return '0.0'
    return Number(num).toFixed(1)
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
</script>
