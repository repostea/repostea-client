<template>
  <div ref="menuRef" class="auth-nav">
    <div v-if="authStore.isAuthenticated" class="user-menu">
      <button
        class="user-info"
        :aria-expanded="isOpen"
        aria-haspopup="menu"
        data-testid="user-menu-button"
        @click.stop="toggleDropdown"
      >
        <Icon v-if="isGuest" name="fa6-solid:user-secret" class="text-lg" aria-hidden="true" />
        <Icon v-else name="fa6-solid:circle-user" class="text-lg" aria-hidden="true" />
        <!-- Desktop: Show full username (only on large screens) -->
        <span class="username hidden lg:inline truncate">
          <div v-if="isGuest" class="flex flex-col">
            <span class="guest-name-header">
              {{ authStore.user?.display_name || authStore.user?.name || 'Guest' }}
            </span>
            <span class="guest-indicator">{{ t('auth.guest') }}</span>
          </div>
          <span v-else>{{ authStore.username }}</span>
        </span>
        <!-- Mobile & Tablet: Show only icon + arrow, no text to save space -->
        <span class="lg:hidden" />
        <Icon name="fa6-solid:chevron-down" class="ml-1 text-xs" aria-hidden="true" />
      </button>

      <div v-if="isOpen" class="dropdown-menu" role="menu" data-testid="user-dropdown">
        <!-- Different menu for guest users -->
        <template v-if="isGuest">
          <div class="guest-info menu-item inline-flex items-center">
            <Icon name="fa6-solid:user-secret" class="mr-2 flex-shrink-0" aria-hidden="true" />
            <div class="flex flex-col">
              <span class="guest-name">{{
                authStore.user?.display_name || authStore.user?.name || 'Guest'
              }}</span>
              <span class="guest-indicator-dropdown">{{ t('auth.guest') }}</span>
            </div>
          </div>

          <div class="menu-divider" role="separator" />

          <button class="menu-item logout inline-flex items-center" role="menuitem" @click="logout">
            <Icon
              name="fa6-solid:right-from-bracket"
              class="mr-2 flex-shrink-0"
              aria-hidden="true"
            />
            <span class="logout-text">{{ t('auth.exit_guest') }}</span>
          </button>
        </template>

        <!-- Regular user menu -->
        <template v-else>
          <NuxtLink
            :to="localePath('/profile/')"
            class="menu-item inline-flex items-center"
            role="menuitem"
            @click="closeDropdown"
          >
            <Icon name="fa6-solid:circle-user" class="mr-2" aria-hidden="true" />
            {{ t('navigation.my_profile') }}
          </NuxtLink>

          <NuxtLink
            :to="localePath('/profile/posts')"
            class="menu-item inline-flex items-center"
            role="menuitem"
            @click="closeDropdown"
          >
            <Icon name="fa6-solid:newspaper" class="mr-2" aria-hidden="true" />
            {{ t('profile.my_posts') }}
          </NuxtLink>

          <NuxtLink
            :to="localePath('/profile/settings')"
            class="menu-item inline-flex items-center"
            role="menuitem"
            @click="closeDropdown"
          >
            <Icon name="fa6-solid:gear" class="mr-2" aria-hidden="true" />
            {{ t('navigation.settings') }}
          </NuxtLink>

          <div class="menu-divider" role="separator" />

          <button class="menu-item logout inline-flex items-center" role="menuitem" @click="logout">
            <Icon name="fa6-solid:right-from-bracket" class="mr-2" aria-hidden="true" />
            {{ t('navigation.logout') }}
          </button>
        </template>
      </div>
    </div>

    <div v-else class="auth-buttons">
      <NuxtLink :to="localePath('/auth/login')" class="btn-login" :aria-label="t('auth.login')">
        <span class="login-text">{{ t('auth.login') }}</span>
        <Icon name="fa6-solid:right-to-bracket" class="login-icon" aria-hidden="true" />
      </NuxtLink>

      <NuxtLink
        :to="localePath('/auth/register')"
        class="btn-register"
        :aria-label="t('auth.register')"
      >
        <span class="hidden lg:inline">{{ t('auth.register') }}</span>
        <Icon name="fa6-solid:user-plus" class="lg:hidden" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath, useI18n } from '#i18n'

  const authStore = useAuthStore()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const isOpen = ref(false)
  const menuRef = ref(null)

  // Check if the user is guest (SSR-safe)
  const isGuest = computed(() => {
    return authStore.user?.is_guest === true
  })

  onMounted(() => {
    // Auth store is already initialized by the plugin
    document.addEventListener('click', handleClickOutside)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  const handleClickOutside = (event) => {
    if (menuRef.value && !menuRef.value.contains(event.target)) {
      isOpen.value = false
    }
  }

  const toggleDropdown = () => {
    isOpen.value = !isOpen.value
  }

  const closeDropdown = () => {
    isOpen.value = false
  }

  const logout = async () => {
    try {
      await authStore.logout()
      isOpen.value = false
      window.location.href = localePath('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }
</script>

<style scoped>
  .auth-nav {
    position: relative;
  }

  .user-menu {
    position: relative;
  }

  .user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 9999px;
    transition: background-color 0.2s;
    min-height: 44px; /* Minimum touch target size for mobile accessibility */
    min-width: 44px;
  }

  @media (min-width: 768px) {
    .user-info {
      padding: 0.5rem 1rem;
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  @media (min-width: 1024px) {
    .user-info {
      max-width: 220px; /* Limitar ancho cuando se muestra el nombre */
    }
  }

  .user-info:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .username {
    font-weight: 500;
    margin: 0 0.5rem;
    max-width: 100px; /* Limitar ancho del nombre de usuario */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /* Don't set display here - let Tailwind classes control it */
  }

  @media (min-width: 1024px) {
    .username {
      max-width: 140px; /* Mayor ancho en pantallas grandes */
      display: flex; /* Only apply flex on large screens */
      flex-direction: column;
      justify-content: center;
    }
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    width: 240px;
    z-index: 100;
    overflow: hidden;
  }

  /* Mobile-specific dropdown positioning */
  @media (max-width: 767px) {
    .dropdown-menu {
      right: -0.5rem; /* Offset slightly to prevent edge overflow */
      width: 220px; /* Wider to accommodate "Mis Publicaciones" */
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25); /* Stronger shadow for mobile */
    }
  }

  @media (max-width: 480px) {
    .dropdown-menu {
      right: -1rem; /* More offset on very small screens */
      width: 200px; /* Wider to accommodate text */
    }
  }

  .dark .dropdown-menu {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: background-color 0.2s;
    white-space: nowrap;
  }

  .menu-item :deep(.iconify) {
    color: var(--color-primary);
  }

  .menu-item:hover {
    background-color: var(--color-bg-hover);
  }

  .menu-divider {
    height: 1px;
    background-color: var(--color-border-default);
    margin: 0.25rem 0;
  }

  .logout {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-danger);
  }

  .logout :deep(.iconify) {
    color: var(--color-danger);
  }

  .auth-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .btn-login,
  .btn-register {
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .btn-login {
    color: var(--color-navbar-text);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-login:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  /* Por defecto mostrar texto, ocultar icono */
  .login-icon {
    display: none;
  }

  /* En móviles estrechos, mostrar icono en lugar de texto */
  @media (max-width: 380px) {
    .login-text {
      display: none;
    }

    .login-icon {
      display: block;
      font-size: 1.1rem;
    }

    .btn-login {
      min-width: 36px;
      min-height: 36px;
      padding: 0.375rem;
    }
  }

  .btn-register {
    color: var(--color-btn-primary-text);
    background-color: var(--color-primary);
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
  }

  @media (min-width: 768px) {
    .btn-register {
      border-radius: 0.25rem;
    }
  }

  .btn-register:hover {
    opacity: 0.9;
  }

  .anonymous-badge {
    display: inline-flex;
    align-items: center;
    color: var(--color-warning);
    font-style: italic;
  }

  .guest-info {
    background-color: var(--color-warning-bg);
    color: var(--color-warning);
    font-weight: 500;
    cursor: default;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.625rem 1rem;
    display: flex;
    align-items: flex-start;
  }

  .anonymous-info:hover,
  .guest-info:hover {
    background-color: var(--color-warning-bg);
  }

  .guest-name,
  .guest-name-header,
  .logout-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    display: inline-block;
    font-size: 0.875rem;
    line-height: 1.25;
  }

  .guest-indicator,
  .guest-indicator-dropdown {
    font-size: 0.7rem;
    color: var(--color-warning);
    font-style: italic;
    display: block;
    line-height: 1;
    margin-top: -2px;
  }

  /* Ensure consistent styling for the logout button in anonymous menu */
  .anonymous-info + .menu-divider + .logout {
    font-size: 0.875rem;
    padding: 0.625rem 1rem;
  }

  /* Mobile username styles */
  .username-mobile {
    color: var(--color-warning);
    font-style: italic;
    margin: 0 0.25rem;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Improved mobile layout */
  @media (max-width: 767px) {
    .user-info {
      padding: 0.25rem 0.5rem;
      max-width: none;
    }

    .user-menu {
      flex-shrink: 0;
    }
  }
</style>
