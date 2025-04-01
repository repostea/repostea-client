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
            <h2 class="text-lg font-medium">Recuperar contraseña</h2>
          </div>

          <div class="p-6">
            <div
              v-if="success"
              class="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-md mb-4"
            >
              Se ha enviado un correo electrónico con las instrucciones para recuperar tu
              contraseña. Revisa tu bandeja de entrada.
            </div>

            <div
              v-if="errorMessage && !success"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <form v-if="!success" @submit.prevent="resetPassword">
              <div class="mb-4">
                <label for="email" class="block text-sm font-medium mb-1">Correo electrónico</label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': error,
                  }"
                  required
                  autocomplete="email"
                  autofocus
                />
              </div>

              <div class="flex items-center justify-between">
                <button
                  type="submit"
                  class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors"
                  :disabled="loading"
                >
                  <span
                    v-if="loading"
                    class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  Enviar instrucciones
                </button>

                <NuxtLink
                  :to="$localePath('/auth/login')"
                  class="text-primary hover:text-primary-dark text-sm"
                >
                  Volver al inicio de sesión
                </NuxtLink>
              </div>
            </form>

            <div v-else class="text-center">
              <NuxtLink
                :to="$localePath('/auth/login')"
                class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors inline-block"
              >
                Volver al inicio de sesión
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { initSupabase } from '~/services/supabase'

  const email = ref('')
  const loading = ref(false)
  const error = ref(false)
  const errorMessage = ref('')
  const success = ref(false)

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
      errorMessage.value = 'An error has occurred. Please try again later.'
      console.error('Error sending password recovery:', err)
    } finally {
      loading.value = false
    }
  }
</script>
