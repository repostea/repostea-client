<template>
  <div class="min-h-screen flex flex-col bg-page dark:bg-page-dark">
    <!-- Navbar similar to main site -->
    <nav class="navbar shadow-md">
      <div class="container mx-auto px-4 sm:px-4">
        <div class="flex justify-center h-16 items-center">
          <div class="logo-container">
            <NuxtImg
              src="/logo-wolf.png"
              :alt="appName"
              class="logo-image"
              width="36"
              height="36"
              format="webp"
              quality="80"
            />
            <span class="logo-text">{{ appName }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="max-w-2xl w-full text-center">
        <!-- Title -->
        <h1 class="text-5xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
          {{ $t('maintenance.title') }}
        </h1>

        <!-- Message -->
        <p class="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-lg mx-auto">
          {{ $t('maintenance.message') }}
        </p>

        <!-- Info card -->
        <div class="bg-card dark:bg-card-dark rounded-lg shadow-xl p-8 mb-8 maintenance-card-border">
          <p class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {{ $t('maintenance.estimated_time') }}
          </p>

          <!-- Check status button -->
          <button
            :disabled="checking"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
            @click="checkStatus"
          >
            <span v-if="!checking">
              {{ $t('maintenance.check_status') }}
            </span>
            <span v-else>
              {{ $t('maintenance.checking') }}
            </span>
          </button>

          <!-- Auto-refresh info -->
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-6">
            {{ $t('maintenance.auto_refresh') }}
          </p>
        </div>

        <!-- Additional message -->
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('maintenance.improving') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNuxtApp } from '#app'
import { useRouter } from 'vue-router'

const { $api } = useNuxtApp()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const appName = runtimeConfig.public.appName || 'Repostea'

const checking = ref(false)
let checkInterval = null

// Check API status
const checkStatus = async () => {
  checking.value = true

  try {
    // Try to fetch any simple endpoint to check if API is back
    await $api.stats.getGeneral()

    // If successful, API is back online
    router.push('/')
  } catch (error) {
    // Still in maintenance mode
    if (error.response?.status !== 503) {
      // If it's not 503, API might be back but with another error
      router.push('/')
    }
  } finally {
    checking.value = false
  }
}

// Auto-check every 30 seconds
onMounted(() => {
  checkInterval = setInterval(() => {
    checkStatus()
  }, 30000) // 30 seconds
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})

// Set page meta
definePageMeta({
  layout: false,
})
</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.025em;
  color: white;
  text-transform: uppercase;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.maintenance-card-border {
  border: 1px solid var(--color-border-default);
}
</style>
