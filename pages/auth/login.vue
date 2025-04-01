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
              {{ $t('auth.login') }}
            </h2>
          </div>

          <div class="p-6">
            <div
              v-if="errorMessage"
              class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md mb-4"
            >
              {{ errorMessage }}
            </div>

            <form @submit.prevent="login">
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
                  autofocus
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
                  autocomplete="current-password"
                />
                <p v-if="errors.password" class="mt-1 text-sm text-red-500">
                  {{ errors.password }}
                </p>
              </div>

              <div class="mb-4">
                <div class="flex items-center">
                  <input
                    id="remember"
                    v-model="formData.remember"
                    type="checkbox"
                    class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label for="remember" class="ml-2 text-sm">
                    {{ $t('auth.remember_me') }}
                  </label>
                </div>
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
                  {{ $t('auth.login') }}
                </button>

                <NuxtLink
                  :to="$localePath('/auth/forgot-password')"
                  class="text-primary hover:text-primary-dark text-sm"
                >
                  {{ $t('auth.forgot_password') }}
                </NuxtLink>
              </div>

              <div class="mt-4 text-center">
                <p class="text-sm">
                  {{ $t('auth.need_account') }}
                  <NuxtLink
                    :to="$localePath('/auth/register')"
                    class="text-primary hover:text-primary-dark"
                  >
                    {{ $t('auth.register') }}
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
    email: '',
    password: '',
    remember: false,
  })

  async function socialLogin(provider) {
    loading.value = true
    try {
      await authStore.socialLogin(provider)
    } catch (error) {
      console.error(`Error logging in with ${provider}:`, error)
      errorMessage.value = error.message || `Error al iniciar sesión con ${provider}`
    } finally {
      loading.value = false
    }
  }

  function validateForm() {
    let isValid = true
    errors.email = ''
    errors.password = ''
    errorMessage.value = ''

    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio'
      isValid = false
    }

    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria'
      isValid = false
    }

    return isValid
  }

  async function login() {
    if (!validateForm()) {
      return
    }

    loading.value = true
    errors.email = ''
    errors.password = ''
    errorMessage.value = ''

    try {
      await authStore.login({
        email: formData.email,
        password: formData.password,
        remember: formData.remember,
      })

      const flashMessage = useCookie('flash_message')
      const flashType = useCookie('flash_type')
      flashMessage.value = 'You are successfully logged in'
      flashType.value = 'success'

      router.push('/')
    } catch (error) {
      console.error('Error de inicio de sesión:', error)

      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            errors.email = 'The e-mail address is invalid'
            break
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage.value = 'The credentials provided are incorrect'
            break
          case 'auth/too-many-requests':
            errorMessage.value = 'Too many login attempts. Please try again later'
            break
          default:
            errorMessage.value = error.message || 'An error occurred while logging in'
        }
      } else if (error.response) {
        const { data } = error.response
        if (data && data.errors) {
          if (data.errors.email) errors.email = data.errors.email[0]
          if (data.errors.password) errors.password = data.errors.password[0]
        } else {
          errorMessage.value = data.message || 'An error occurred while logging in'
        }
      } else {
        errorMessage.value = 'An error occurred while logging in'
      }
    } finally {
      loading.value = false
    }
  }
</script>
