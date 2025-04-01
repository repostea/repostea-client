<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-center">
      <div class="w-full max-w-md">
        <div
          class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700"
        >
          <div
            class="bg-gray-50 dark:bg-neutral-800 px-6 py-4 border-b border-border-color dark:border-neutral-700 rounded-t-lg"
          >
            <h2 class="text-lg font-medium">
              {{ $t('auth.complete_profile') }}
            </h2>
          </div>

          <div class="p-6">
            <div
              v-if="errorMessage"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <p class="mb-4 text-text-muted dark:text-text-dark-muted">
              {{ $t('auth.username_required') }}
            </p>

            <form @submit.prevent="completeProfile">
              <div class="mb-4">
                <label for="username" class="block text-sm font-medium mb-1">{{
                  $t('auth.username')
                }}</label>
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': usernameError,
                  }"
                  required
                  autofocus
                />
                <p v-if="usernameError" class="mt-1 text-sm text-red-500">
                  {{ usernameError }}
                </p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ $t('auth.username_tip') }}
                </p>
              </div>

              <div class="mb-4">
                <label for="display-name" class="block text-sm font-medium mb-1">{{
                  $t('auth.display_name')
                }}</label>
                <input
                  id="display-name"
                  v-model="displayName"
                  type="text"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ $t('auth.display_name_tip') }}
                </p>
              </div>

              <button
                type="submit"
                class="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors"
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                ></span>
                {{ $t('auth.save_profile') }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { initSupabase } from '~/services/supabase'

  const router = useRouter()
  const authStore = useAuthStore()
  const loading = ref(false)
  const errorMessage = ref('')
  const usernameError = ref('')
  const username = ref('')
  const displayName = ref('')

  if (authStore.user) {
    username.value =
      authStore.user.user_metadata?.username || authStore.user.email?.split('@')[0] || ''
    displayName.value =
      authStore.user.user_metadata?.display_name || authStore.user.user_metadata?.name || ''
  }

  async function validateUsername(value) {
    if (!value.trim()) {
      return 'El nombre de usuario es obligatorio'
    }

    if (value.length < 3) {
      return 'El nombre de usuario debe tener al menos 3 caracteres'
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'
    }

    return ''
  }

  async function completeProfile() {
    loading.value = true
    usernameError.value = ''
    errorMessage.value = ''

    try {
      usernameError.value = await validateUsername(username.value)
      if (usernameError.value) {
        loading.value = false
        return
      }

      const supabase = initSupabase()
      if (!supabase) {
        throw new Error('No se pudo inicializar Supabase')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: username.value,
          display_name: displayName.value || username.value,
        },
      })

      if (updateError) throw updateError

      await authStore.fetchUser()

      const flashMessage = useCookie('flash_message')
      const flashType = useCookie('flash_type')
      flashMessage.value = 'Perfil actualizado correctamente'
      flashType.value = 'success'

      router.push('/')
    } catch (error) {
      console.error('Error al completar el perfil:', error)
      errorMessage.value = error.message || 'Ha ocurrido un error al guardar tu perfil'
    } finally {
      loading.value = false
    }
  }
</script>
