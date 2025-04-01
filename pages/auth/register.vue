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
              {{ $t('auth.register') }}
            </h2>
          </div>

          <div
            class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-md"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <i class="fas fa-shield-alt text-xl mt-0.5 mr-3"></i>
              </div>
              <div>
                <h3 class="font-medium mb-1">Seguridad de tus datos</h3>
                <p class="text-sm">
                  Esta plataforma no almacena tus credenciales directamente ni gestiona la
                  autenticación internamente. Utilizamos
                  <a
                    href="https://supabase.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline hover:text-blue-900 dark:hover:text-blue-100"
                    >Supabase</a
                  >, un proveedor externo que cumple con altos estándares de seguridad y protección
                  de datos. Las contraseñas están cifradas de forma segura y nosotros no accedemos
                  ni manipulamos esa información. Además, los servidores utilizados se encuentran en
                  la Unión Europea, garantizando el cumplimiento del RGPD.
                </p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div
              v-if="errorMessage"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <form @submit.prevent="register">
              <div class="mb-4">
                <label for="username" class="block text-sm font-medium mb-1">{{
                  $t('auth.username')
                }}</label>
                <input
                  id="username"
                  v-model="formData.username"
                  type="text"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.username,
                  }"
                  required
                  autocomplete="username"
                  autofocus
                />
                <p v-if="errors.username" class="mt-1 text-sm text-red-500">
                  {{ errors.username }}
                </p>
              </div>

              <div class="mb-4">
                <label for="email" class="block text-sm font-medium mb-1">{{
                  $t('auth.email')
                }}</label>
                <input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.email,
                  }"
                  required
                  autocomplete="email"
                />
                <p v-if="errors.email" class="mt-1 text-sm text-red-500">
                  {{ errors.email }}
                </p>
              </div>

              <div class="mb-4">
                <label for="password" class="block text-sm font-medium mb-1">{{
                  $t('auth.password')
                }}</label>
                <input
                  id="password"
                  v-model="formData.password"
                  type="password"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.password,
                  }"
                  required
                  autocomplete="new-password"
                />
                <p v-if="errors.password" class="mt-1 text-sm text-red-500">
                  {{ errors.password }}
                </p>
              </div>

              <div class="mb-6">
                <label for="password-confirm" class="block text-sm font-medium mb-1">{{
                  $t('auth.confirm_password')
                }}</label>
                <input
                  id="password-confirm"
                  v-model="formData.password_confirmation"
                  type="password"
                  class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.password_confirmation,
                  }"
                  required
                  autocomplete="new-password"
                />
                <p v-if="errors.password_confirmation" class="mt-1 text-sm text-red-500">
                  {{ errors.password_confirmation }}
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
                {{ $t('auth.register') }}
              </button>

              <div class="mt-4 text-center">
                <p class="text-sm">
                  {{ $t('auth.already_registered') }}
                  <NuxtLink
                    :to="$localePath('/auth/login')"
                    class="text-primary hover:text-primary-dark"
                  >
                    {{ $t('auth.login') }}
                  </NuxtLink>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useRouter } from 'vue-router'

  const authStore = useAuthStore()
  const router = useRouter()
  const loading = ref(false)
  const errors = reactive({})
  const errorMessage = ref('')

  const formData = reactive({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  })

  async function validateForm() {
    let isValid = true
    errors.username = ''
    errors.email = ''
    errors.password = ''
    errors.password_confirmation = ''
    errorMessage.value = ''


    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es obligatorio'
      isValid = false
    } else if (formData.username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres'
      isValid = false
    }


    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio'
      isValid = false
    } else if (!emailPattern.test(formData.email)) {
      errors.email = 'Por favor, introduce un correo electrónico válido'
      isValid = false
    }

    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria'
      isValid = false
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
      isValid = false
    }

    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Las contraseñas no coinciden'
      isValid = false
    }

    return isValid
  }

  async function register() {
    if (!validateForm()) {
      return
    }

    loading.value = true

    try {
      await authStore.register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
      })

      const flashMessage = useCookie('flash_message')
      const flashType = useCookie('flash_type')
      flashMessage.value = 'Te has registrado correctamente'
      flashType.value = 'success'

      router.push('/')
    } catch (error) {
      console.error('Error de registro:', error)

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errors.email = 'This email is already in use'
            break
          case 'auth/invalid-email':
            errors.email = 'The e-mail address is invalid'
            break
          case 'auth/weak-password':
            errors.password = 'Password is too weak'
            break
          default:
            errorMessage.value = error.message || 'An error occurred during registration'
        }
      } else {
        errorMessage.value = 'An error occurred during registration'
      }
    } finally {
      loading.value = false
    }
  }
</script>
