<template>
  <div class="hidden md:flex items-center">
    <!-- Main navigation links with smaller icons -->
    <div class="flex">
      <NuxtLink
        :to="localePath('/')"
        class="nav-link flex items-center px-3"
        active-class="active"
        :aria-label="t('navigation.home')"
      >
        <Icon name="fa6-solid:house" class="text-sm" aria-hidden="true" />
      </NuxtLink>

      <NuxtLink
        :to="localePath('/submit')"
        class="nav-link nav-link-submit flex items-center px-3"
        active-class="active"
        data-testid="submit-button"
      >
        <Icon name="fa6-solid:plus" class="text-sm" aria-hidden="true" />
        <span class="ml-2">{{ t('navigation.submit') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/agora')"
        class="nav-link flex items-center px-3"
        active-class="active"
      >
        <Icon name="fa6-solid:landmark" class="text-sm" aria-hidden="true" />
        <span class="ml-2">{{ t('agora.title') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/s')"
        class="nav-link flex items-center px-3"
        active-class="active"
      >
        <Icon name="fa6-solid:users" class="text-sm" aria-hidden="true" />
        <span class="ml-2">{{ t('navigation.subs') }}</span>
      </NuxtLink>

      <div v-click-outside="closeActionsMenu" class="relative">
        <button
          class="nav-link flex items-center px-3"
          :class="{ active: isActionsMenuOpen }"
          :aria-expanded="isActionsMenuOpen"
          aria-haspopup="menu"
          data-testid="actions-menu-trigger"
          @click="toggleActionsMenu"
        >
          <Icon name="fa6-solid:ellipsis" class="text-sm" aria-hidden="true" />
          <span class="ml-2">{{ t('navigation.actions') }}</span>
          <Icon
            name="fa6-solid:chevron-down"
            class="text-xs ml-1"
            :class="{ 'transform rotate-180': isActionsMenuOpen }"
            aria-hidden="true"
          />
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="isActionsMenuOpen"
          class="dropdown-menu absolute right-0 mt-1 py-2 w-48 rounded-md shadow-lg z-50"
          role="menu"
        >
          <NuxtLink
            :to="localePath('/stats')"
            class="dropdown-item flex items-center px-4 py-2 text-sm"
            role="menuitem"
            @click="closeActionsMenu"
          >
            <Icon name="fa6-solid:chart-line" class="w-5 text-primary mr-2" aria-hidden="true" />
            <span>{{ t('stats.title') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/rankings')"
            class="dropdown-item flex items-center px-4 py-2 text-sm"
            role="menuitem"
            @click="closeActionsMenu"
          >
            <Icon name="fa6-solid:trophy" class="w-5 text-primary mr-2" aria-hidden="true" />
            <span>{{ t('rankings.title') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/lists')"
            class="dropdown-item flex items-center px-4 py-2 text-sm"
            role="menuitem"
            @click="closeActionsMenu"
          >
            <Icon name="fa6-solid:bookmark" class="w-5 text-primary mr-2" aria-hidden="true" />
            <span>{{ t('navigation.saved_lists') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/activity')"
            class="dropdown-item flex items-center px-4 py-2 text-sm"
            role="menuitem"
            @click="closeActionsMenu"
          >
            <Icon name="fa6-solid:rss" class="w-5 text-primary mr-2" aria-hidden="true" />
            <span>{{ t('activity.title') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/help')"
            class="dropdown-item flex items-center px-4 py-2 text-sm"
            role="menuitem"
            @click="closeActionsMenu"
          >
            <Icon name="fa6-solid:circle-question" class="w-5 text-primary mr-2" aria-hidden="true" />
            <span>{{ t('help.title') }}</span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/federation')"
            class="dropdown-item flex items-center px-4 py-2 text-sm"
            role="menuitem"
            @click="closeActionsMenu"
          >
            <Icon name="fa6-solid:globe" class="w-5 text-primary mr-2" aria-hidden="true" />
            <span>{{ t('federation.menu_title') }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="border-l h-6 mx-2" style="border-color: var(--color-navbar-text-secondary)"/>
    <div class="flex items-center">
      <ThemeSelector ref="themeSelector" />
      <LanguageSelector class="ml-2" />
      <NotificationDropdown v-if="authStore.isAuthenticated" class="ml-2" />
      <AuthNav class="ml-2" />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useLocalePath, useI18n  } from '#i18n'

  import { useAuthStore } from '~/stores/auth'
  import LanguageSelector from '~/components/common/LanguageSelector.vue'
  import NotificationDropdown from '~/components/notifications/NotificationDropdown.vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const authStore = useAuthStore()

  const isActionsMenuOpen = ref(false)

  const toggleActionsMenu = () => {
    isActionsMenuOpen.value = !isActionsMenuOpen.value
  }

  const closeActionsMenu = () => {
    isActionsMenuOpen.value = false
  }

  const vClickOutside = {
    mounted(el, binding) {
      el._clickOutside = (event) => {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event)
        }
      }
      document.addEventListener('click', el._clickOutside)
    },
    unmounted(el) {
      document.removeEventListener('click', el._clickOutside)
    },
  }
</script>

<style scoped>
  /* Additional navigation link styles */
  .nav-link {
    @apply font-medium py-4 relative transition-all hover:no-underline;
    color: var(--color-navbar-text-secondary);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .nav-link:hover {
    color: var(--color-navbar-text);
    background-color: rgba(255, 255, 255, 0.1);
  }

  .nav-link.active {
    color: var(--color-navbar-text);
    background-color: rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 -3px 0 var(--color-navbar-text);
  }

  /* Special styles for Submit button - more subtle */
  .nav-link-submit {
    @apply bg-white/10 rounded-lg mx-1;
  }

  .nav-link-submit:hover {
    @apply bg-white/15;
    transform: translateY(-1px);
  }

  .nav-link-submit.active {
    @apply bg-white/25 border-white/40;
    box-shadow:
      0 4px 12px rgba(255, 255, 255, 0.2),
      inset 0 -3px 0 white;
  }

  /* Prevent text wrapping */
  .whitespace-nowrap {
    white-space: nowrap;
  }

  /* Animation for dropdown menu */
  .absolute {
    animation: fadeIn 0.15s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Dropdown menu styles */
  .dropdown-menu {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .dropdown-item {
    color: var(--color-text-primary);
  }

  .dropdown-item:hover {
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }
</style>
