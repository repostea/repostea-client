<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <div class="card-bg rounded-lg shadow-sm border border-default p-6 text-center">
        <!-- Loading state -->
        <div v-if="loading" class="space-y-4">
          <LoadingSpinner size="lg" display="centered" />
          <p class="text-text-muted dark:text-text-dark-muted">
            {{ t('auth.completing_login') }}
          </p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="space-y-4">
          <div class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Icon name="heroicons:x-mark" class="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 class="text-lg font-medium text-red-600 dark:text-red-400">
            {{ t('auth.mbin_callback_error') }}
          </h2>
          <p class="text-sm text-text-muted dark:text-text-dark-muted">
            {{ error }}
          </p>
          <NuxtLink
            :to="localePath('/auth/login')"
            class="inline-block mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            {{ t('auth.back_to_login') }}
          </NuxtLink>
        </div>

        <!-- Success state (brief, before redirect) -->
        <div v-else class="space-y-4">
          <div class="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Icon name="heroicons:check" class="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p class="text-text-muted dark:text-text-dark-muted">
            {{ t('auth.logged_in') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalePath, useI18n  } from '#i18n'
import { useMbinAuth } from '@/composables/useMbinAuth'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'


const { t } = useI18n()

const route = useRoute()
const localePath = useLocalePath()
const { $redirectAfterAuth } = useNuxtApp()

const { completeMbinLogin, error: authError } = useMbinAuth()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const code = route.query.code || ''
  const state = route.query.state || ''
  const errorParam = route.query.error || ''

  // Check for error from Mbin
  if (errorParam) {
    loading.value = false
    error.value = route.query.error_description || errorParam
    return
  }

  // Validate required params
  if (!code || !state) {
    loading.value = false
    error.value = t('auth.mbin_callback_error')
    return
  }

  // Complete the OAuth flow
  const result = await completeMbinLogin(code, state)

  loading.value = false

  if (result.success) {
    // Redirect to returnUrl or home after successful login
    setTimeout(() => {
      if (result.returnUrl && result.returnUrl.startsWith('/')) {
        navigateTo(result.returnUrl)
      } else {
        $redirectAfterAuth('/')
      }
    }, 500)
  } else {
    error.value = authError.value || t('auth.mbin_callback_error')
  }
})
</script>
