<template>
  <div class="min-h-screen flex flex-col bg-page dark:bg-page-dark">
    <nav class="navbar shadow-md">
      <div class="container mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <NuxtLink
                :to="$localePath('/')"
                class="navbar-brand tracking-tight flex items-center"
              >
                <i class="fas fa-share-alt mr-2"></i>
                Repostea
              </NuxtLink>
            </div>
            <div class="hidden md:ml-6 md:flex md:space-x-1">
              <NuxtLink
                :to="$localePath('/')"
                class="nav-link flex items-center"
                active-class="active"
              >
                <i class="fas fa-fire-alt mr-1"></i>
                {{ $t('navigation.home') }}
              </NuxtLink>
              <!--NuxtLink
                                :to="$localePath('/pending')"
                                class="nav-link flex items-center"
                                active-class="active"
                            >
                                <i class="fas fa-clock mr-1"></i>
                                {{ $t('navigation.pending') }}
                            </NuxtLink-->
              <NuxtLink
                :to="$localePath('/tags')"
                class="nav-link flex items-center"
                active-class="active"
              >
                <i class="fas fa-tags mr-1"></i>
                {{ $t('navigation.topics') }}
              </NuxtLink>

              <!--NuxtLink
                                v-if="authStore.isAuthenticated"
                                :to="$localePath('/links/submit')"
                                class="nav-link flex items-center"
                                active-class="active"
                            >
                                <i class="fas fa-plus-circle mr-1"></i>
                                {{ $t('navigation.submit') }}
                            </NuxtLink-->
            </div>
          </div>

          <div class="hidden md:ml-6 md:flex md:items-center">
            <div class="relative ml-3">
              <LanguageSelector />
            </div>

            <button
              @click="toggleDarkMode"
              class="ml-3 p-2 flex text-sm rounded-full focus:outline-none hover:bg-white/10"
              :title="isDarkMode ? $t('common.light_mode') : $t('common.dark_mode')"
            >
              <span class="sr-only">{{
                isDarkMode ? $t('common.light_mode') : $t('common.dark_mode')
              }}</span>
              <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
            </button>

            <template v-if="!authStore.isAuthenticated">
              <NuxtLink
                :to="$localePath('/auth/login')"
                class="inline-block px-4 py-1.5 ml-3 mr-2 rounded-md text-sm border border-transparent hover:bg-white/10 transition-colors"
              >
                <i class="fas fa-sign-in-alt mr-1"></i>
                {{ $t('navigation.login') }}
              </NuxtLink>

              <NuxtLink
                :to="$localePath('/auth/register')"
                class="inline-block px-4 py-1.5 mr-3 rounded-md text-sm bg-white/20 hover:bg-white/30 transition-all"
              >
                <i class="fas fa-user-plus mr-1"></i>
                {{ $t('navigation.register') }}
              </NuxtLink>
            </template>

            <div class="relative" ref="userDropdownRef">
              <div>
                <button
                  @click="toggleUserDropdown"
                  class="flex items-center text-sm rounded-full focus:outline-none hover:bg-white/10 p-1"
                >
                  <span class="sr-only">Open user menu</span>
                  <span class="rounded-full p-1 px-2 bg-primary-dark flex items-center">
                    <i class="fas fa-user-circle mr-1"></i>
                    <span v-if="!authStore.isAuthenticated" class="italic">{{
                      displayUsername
                    }}</span>
                    <span v-else>{{ displayUsername }}</span>
                    <i class="fas fa-chevron-down ml-1 text-xs"></i>
                  </span>
                </button>
              </div>

              <div
                v-if="showUserDropdown"
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-white dark:bg-card-bg-dark ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
              >
                <template v-if="authStore.isAuthenticated">
                  <NuxtLink
                    :to="`/users/${authStore.username}`"
                    class="block px-4 py-2 text-sm text-text dark:text-text-dark hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <i class="fas fa-user-circle mr-1"></i>
                    {{ $t('navigation.my_profile') }}
                  </NuxtLink>

                  <NuxtLink
                    :to="$localePath('/settings')"
                    class="block px-4 py-2 text-sm text-text dark:text-text-dark hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <i class="fas fa-cog mr-1"></i>
                    {{ $t('navigation.settings') }}
                  </NuxtLink>

                  <NuxtLink
                    v-if="authStore.isAdmin"
                    :to="$localePath('/admin')"
                    class="block px-4 py-2 text-sm text-text dark:text-text-dark hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <i class="fas fa-shield-alt mr-1"></i>
                    {{ $t('navigation.admin') }}
                  </NuxtLink>

                  <div class="border-t border-gray-200 dark:border-neutral-700 my-1"></div>

                  <button
                    @click="logout"
                    class="block w-full text-left px-4 py-2 text-sm text-text dark:text-text-dark hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <i class="fas fa-sign-out-alt mr-1"></i>
                    {{ $t('navigation.logout') }}
                  </button>
                </template>
                <template v-else>
                  <NuxtLink
                    :to="$localePath('/settings')"
                    class="block px-4 py-2 text-sm text-text dark:text-text-dark hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <i class="fas fa-cog mr-1"></i>
                    {{ $t('navigation.settings') }}
                  </NuxtLink>
                </template>
              </div>
            </div>
          </div>

          <div class="flex items-center md:hidden">
            <button
              @click="toggleMobileMenu"
              class="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-dark focus:outline-none"
            >
              <span class="sr-only">Open menu</span>
              <i :class="showMobileMenu ? 'fas fa-times' : 'fas fa-bars'"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="showMobileMenu" class="md:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <div class="px-3 py-2 mb-2 text-center">
            <span class="rounded-full py-1 px-3 bg-primary-dark inline-flex items-center">
              <i class="fas fa-user-circle mr-1"></i>
              <span v-if="!authStore.isAuthenticated" class="italic">{{ displayUsername }}</span>
              <span v-else>{{ displayUsername }}</span>
            </span>
          </div>

          <NuxtLink
            :to="$localePath('/')"
            class="block px-3 py-2 rounded-md text-base font-medium text-white"
            active-class="bg-primary-dark"
            @click="showMobileMenu = false"
          >
            <i class="fas fa-fire-alt mr-1"></i>
            {{ $t('navigation.home') }}
          </NuxtLink>

          <NuxtLink
            :to="$localePath('/tags')"
            class="block px-3 py-2 rounded-md text-base font-medium text-white"
            active-class="bg-primary-dark"
            @click="showMobileMenu = false"
          >
            <i class="fas fa-tags mr-1"></i>
            {{ $t('navigation.topics') }}
          </NuxtLink>

          <NuxtLink
            :to="$localePath('/settings')"
            class="block px-3 py-2 rounded-md text-base font-medium text-white"
            active-class="bg-primary-dark"
            @click="showMobileMenu = false"
          >
            <i class="fas fa-cog mr-1"></i>
            {{ $t('navigation.settings') }}
          </NuxtLink>

          <template v-if="authStore.isAuthenticated">
            <NuxtLink
              :to="`/users/${authStore.username}`"
              class="block px-3 py-2 rounded-md text-base font-medium text-white"
              active-class="bg-primary-dark"
              @click="showMobileMenu = false"
            >
              <i class="fas fa-user-circle mr-1"></i>
              {{ $t('navigation.my_profile') }}
            </NuxtLink>

            <button
              @click="logout"
              class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white"
            >
              <i class="fas fa-sign-out-alt mr-1"></i>
              {{ $t('navigation.logout') }}
            </button>
          </template>

          <template v-else>
            <NuxtLink
              :to="$localePath('/auth/login')"
              class="block px-3 py-2 rounded-md text-base font-medium text-white"
              active-class="bg-primary-dark"
              @click="showMobileMenu = false"
            >
              <i class="fas fa-sign-in-alt mr-1"></i>
              {{ $t('navigation.login') }}
            </NuxtLink>

            <NuxtLink
              :to="$localePath('/auth/register')"
              class="block px-3 py-2 rounded-md text-base font-medium text-white"
              active-class="bg-primary-dark"
              @click="showMobileMenu = false"
            >
              <i class="fas fa-user-plus mr-1"></i>
              {{ $t('navigation.register') }}
            </NuxtLink>
          </template>

          <div class="flex justify-between px-3 py-2">
            <button
              @click="toggleDarkMode"
              class="rounded-md text-base font-medium flex items-center text-white"
            >
              <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'" class="mr-2"></i>
              {{ isDarkMode ? $t('common.light_mode') : $t('common.dark_mode') }}
            </button>

            <LanguageSelector />
          </div>
        </div>
      </div>
    </nav>

    <div
      v-if="$slots.subnav"
      class="sub-navbar bg-white dark:bg-card-bg-dark border-b border-gray-200 dark:border-neutral-700 shadow-sm"
    >
      <div class="container mx-auto">
        <div class="flex overflow-x-auto">
          <slot name="subnav"></slot>
        </div>
      </div>
    </div>

    <main class="flex-grow container mx-auto px-4 py-6">
      <div v-if="successMessage" class="alert alert-success flex items-center mb-6">
        <i class="fas fa-check-circle mr-2 text-xl"></i>
        <span>{{ successMessage }}</span>
      </div>

      <div v-if="errorMessage" class="alert alert-danger flex items-center mb-6">
        <i class="fas fa-exclamation-circle mr-2 text-xl"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <slot />
    </main>

    <footer>
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h5 class="text-xl font-bold mb-4 flex items-center">
              <i class="fas fa-share-alt mr-2"></i> Repostea
            </h5>
            <p class="text-sm text-white/80">
              {{
                $t('footer.copyright', {
                  year: new Date().getFullYear(),
                })
              }}
            </p>
          </div>
          <div>
            <h5 class="font-bold mb-4">{{ $t('footer.about') }}</h5>
            <ul class="space-y-2">
              <li>
                <NuxtLink
                  :to="$localePath('/about')"
                  class="text-sm hover:underline flex items-center"
                >
                  <i class="fas fa-info-circle mr-1"></i>
                  {{ $t('footer.about') }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  :to="$localePath('/terms')"
                  class="text-sm hover:underline flex items-center"
                >
                  <i class="fas fa-gavel mr-1"></i>
                  {{ $t('footer.terms') }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  :to="$localePath('/privacy')"
                  class="text-sm hover:underline flex items-center"
                >
                  <i class="fas fa-lock mr-1"></i>
                  {{ $t('footer.privacy') }}
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <h5 class="font-bold mb-4">
              {{ $t('footer.contact') }}
            </h5>
            <ul class="space-y-2">
              <li>
                <a href="#" class="text-sm hover:underline flex items-center">
                  <i class="fas fa-envelope mr-1"></i>
                  {{ $t('footer.contact') }}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 class="font-bold mb-4">
              {{ $t('footer.follow_us') }}
            </h5>
            <div class="flex space-x-4">
              <NuxtLink
                :to="$localePath('/social')"
                class="text-white hover:text-gray-300 transition-colors"
              >
                <i class="fab fa-twitter fa-lg"></i>
              </NuxtLink>
              <NuxtLink
                :to="$localePath('/social')"
                class="text-white hover:text-gray-300 transition-colors"
              >
                <i class="fab fa-facebook fa-lg"></i>
              </NuxtLink>
              <NuxtLink
                :to="$localePath('/social')"
                class="text-white hover:text-gray-300 transition-colors"
              >
                <i class="fab fa-instagram fa-lg"></i>
              </NuxtLink>
              <NuxtLink
                :to="$localePath('/social')"
                class="text-white hover:text-gray-300 transition-colors"
              >
                <i class="fab fa-github fa-lg"></i>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import LanguageSelector from '@/components/common/LanguageSelector.vue'

  const authStore = useAuthStore()
  const showMobileMenu = ref(false)
  const showUserDropdown = ref(false)
  const isDarkMode = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const userDropdownRef = ref(null)

  const displayUsername = computed(() => {
    if (authStore.isAuthenticated) {
      return authStore.username || authStore.user?.email || 'Anónimo'
    } else {
      return 'Pobrecito Hablador'
    }
  })

  onMounted(() => {
    authStore.initialize()

    if (process.client) {
      //isDarkMode.value = localStorage.getItem('darkMode') === 'true' || (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      isDarkMode.value = localStorage.getItem('darkMode') === 'true'

      if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      const flash = useCookie('flash_message')
      const flashType = useCookie('flash_type')

      if (flash.value) {
        if (flashType.value === 'success') {
          successMessage.value = flash.value
        } else if (flashType.value === 'error') {
          errorMessage.value = flash.value
        }

        flash.value = null
        flashType.value = null

        setTimeout(() => {
          successMessage.value = ''
          errorMessage.value = ''
        }, 5000)
      }
    }
  })

  function toggleMobileMenu() {
    showMobileMenu.value = !showMobileMenu.value
    if (showMobileMenu.value) {
      showUserDropdown.value = false
    }
  }

  function toggleUserDropdown() {
    showUserDropdown.value = !showUserDropdown.value
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value

    if (process.client) {
      localStorage.setItem('darkMode', isDarkMode.value.toString())

      if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  async function logout() {
    try {
      await authStore.logout()
      navigateTo('/')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  if (process.client) {
    window.addEventListener('click', (event) => {
      if (
        showUserDropdown.value &&
        userDropdownRef.value &&
        !userDropdownRef.value.contains(event.target)
      ) {
        showUserDropdown.value = false
      }
    })
  }
</script>
