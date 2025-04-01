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
            <h2 class="text-lg font-medium">Establecer nueva contraseña</h2>
          </div>

          <div class="p-6">
            <div
              v-if="success"
              class="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-md mb-4"
            >
              La contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva
              contraseña.
            </div>

            <div
              v-if="errorMessage && !success"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <form v-if="!success" @submit.prevent="resetPassword">
              <div class="mb-4">
                <label for="password" class="block text-sm font-medium mb-1"
                  >Nueva contraseña</label
                >
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': error,
                  }"
                  required
                  minlength="6"
                  autofocus
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              </div>

              <div class="mb-6">
                <label for="passwordConfirm" class="block text-sm font-medium mb-1"
                  >Confirmar contraseña</label
                >
                <input
                  id="passwordConfirm"
                  v-model="passwordConfirm"
                  type="password"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': passwordMismatch,
                  }"
                  required
                />
                <p v-if="passwordMismatch" class="mt-1 text-xs text-red-500">
                  Las contraseñas no coinciden
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
                Cambiar contraseña
              </button>
            </form>

            <div v-else class="text-center mt-4">
              <NuxtLink
                :to="$localePath('/auth/login')"
                class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors inline-block"
              >
                Ir al inicio de sesión
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { initSupabase } from '~/services/supabase'
  import { useAuthStore } from '~/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  const password = ref('')
  const passwordConfirm = ref('')
  const loading = ref(false)
  const error = ref(false)
  const errorMessage = ref('')
  const success = ref(false)

  const passwordMismatch = computed(() => {
    return password.value && passwordConfirm.value && password.value !== passwordConfirm.value
  })

  async function resetPassword() {
    loading.value = true
    error.value = false
    errorMessage.value = ''
    success.value = false

    try {
      const supabase = initSupabase()
      if (!supabase) {
        throw new Error('No se pudo inicializar Supabase')
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        error.value = true
        errorMessage.value = resetError.message
      } else {
        success.value = true
      }
    } catch (err) {
      error.value = true
      errorMessage.value = 'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.'
      console.error('Error al enviar la recuperación de contraseña:', err)
    } finally {
      loading.value = false
    }
  }
</script>
