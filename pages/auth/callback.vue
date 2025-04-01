// pages/auth/callback.vue
<template>
  <div class="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
    <div class="text-center">
      <div
        class="spinner w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"
      ></div>
      <h2 class="text-xl font-medium mb-2">
        {{ $t('auth.completing_login') }}
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        {{ $t('auth.please_wait') }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { initSupabase } from '~/services/supabase'

  const router = useRouter()
  const authStore = useAuthStore()

  onMounted(async () => {
    try {
      const supabase = initSupabase()
      if (!supabase) {
        throw new Error('Supabase could not be initialized')
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { data } = await supabase.auth.getSession()

      if (data.session) {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          await authStore.fetchUser()
          if (!userData.user.user_metadata?.username) {
            router.push('/auth/complete-profile')
            return
          }

          const flashMessage = useCookie('flash_message')
          const flashType = useCookie('flash_type')
          flashMessage.value = 'Has iniciado sesión correctamente'
          flashType.value = 'success'
          router.push('/')
        } else {
          router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error processing OAuth callback:', error)
      router.push('/auth/login')
    }
  })
</script>

<style scoped>
  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
