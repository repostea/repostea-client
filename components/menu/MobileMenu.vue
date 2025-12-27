<template>
  <div class="h-full flex items-center">
    <div class="flex items-center justify-end md:hidden w-full h-full gap-1">
      <div v-if="authStore.isAuthenticated" class="flex-shrink-0 flex items-center">
        <NotificationDropdown />
      </div>
      <div class="flex-shrink-0 flex items-center">
        <AuthNav class="mobile-auth" />
      </div>
      <button
        class="menu-button p-2 my-auto rounded-md focus:outline-none"
        style="color: var(--color-navbar-text)"
        :class="{ 'menu-open': isOpen }"
        :aria-label="t('navigation.main_menu')"
        :aria-expanded="isOpen"
        @click="toggleMenu"
      >
        <span class="menu-bar" />
        <span class="menu-bar" />
        <span class="menu-bar" />
      </button>
    </div>

    <div
      class="mobile-menu-container md:hidden bg-navbar-bg dark:bg-navbar-bg-dark border-t border-white/10 fixed top-16 left-0 right-0 z-50"
      style="color: var(--color-navbar-text)"
      :class="{ open: isOpen }"
    >
      <div class="container mx-auto px-4 py-2 space-y-2">
        <NuxtLink
          v-if="route.path !== '/'"
          :to="localePath('/')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          :aria-label="t('navigation.home')"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:house" class="w-8 text-center" aria-hidden="true" />
        </NuxtLink>

        <NuxtLink
          :to="localePath('/submit')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:circle-plus" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('navigation.submit') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/agora')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:landmark" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('agora.title') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/s')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:users" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('navigation.subs') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/stats')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:chart-line" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('stats.title') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/rankings')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:trophy" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('rankings.title') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/lists')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:bookmark" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('navigation.saved_lists') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/activity')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:rss" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('activity.title') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/help')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:circle-question" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('help.title') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath('/federation')"
          class="mobile-nav-link flex items-center py-3 px-2 rounded-md"
          active-class="active"
          @click="closeMenu"
        >
          <Icon name="fa6-solid:globe" class="w-8 text-center" aria-hidden="true" />
          <span>{{ t('federation.menu_title') }}</span>
        </NuxtLink>

        <div class="border-t border-white/10 mt-3 pt-3 pb-1">
          <div class="flex items-center justify-between">
            <span class="text-sm" style="color: var(--color-navbar-text-secondary)">{{
              t('navigation.settings')
            }}</span>
          </div>
        </div>

        <div class="space-y-0.5">
          <button
            class="mobile-nav-link flex items-center w-full py-1.5 px-2 text-sm cursor-pointer rounded-md"
            @click="openLanguageSelector"
          >
            <Icon name="fa6-solid:language" class="w-8 text-center" aria-hidden="true" />
            <span>{{ t('navigation.language') }}</span>
          </button>

          <button
            class="mobile-nav-link flex items-center w-full py-1.5 px-2 text-sm cursor-pointer rounded-md"
            @click="openThemeSelector"
          >
            <Icon name="fa6-solid:palette" class="w-8 text-center" aria-hidden="true" />
            <span>{{ t('navigation.theme') }}</span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showLanguageModal"
      class="mobile-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeLanguageModal"
    >
      <div class="mobile-modal rounded-lg p-4 w-4/5 max-w-md" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium modal-title">
            {{ t('navigation.language') }}
          </h3>
          <button
            class="modal-close-btn"
            :aria-label="t('common.close')"
            @click="closeLanguageModal"
          >
            <Icon name="fa6-solid:xmark" aria-hidden="true" />
          </button>
        </div>
        <div class="modal-content">
          <MobileLanguageSelector @language-selected="handleLanguageSelected" />
        </div>
      </div>
    </div>

    <div
      v-if="showThemeModal"
      class="mobile-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeThemeModal"
    >
      <div class="mobile-modal rounded-lg p-4 w-4/5 max-w-md" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium modal-title">
            {{ t('navigation.theme') }}
          </h3>
          <button class="modal-close-btn" :aria-label="t('common.close')" @click="closeThemeModal">
            <Icon name="fa6-solid:xmark" aria-hidden="true" />
          </button>
        </div>
        <div class="modal-content">
          <MobileThemeSelector @theme-selected="handleThemeSelected" />
        </div>
      </div>
    </div>

    <NuxtLink
      v-if="!isOnSubmitPage"
      :to="fabLink"
      class="mobile-fab fixed lg:hidden"
      :aria-label="t('navigation.submit')"
    >
      <Icon name="fa6-solid:plus" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { useLocalePath, useI18n } from '#i18n'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import MobileLanguageSelector from './MobileLanguageSelector.vue'
  import MobileThemeSelector from './MobileThemeSelector.vue'
  import NotificationDropdown from '~/components/notifications/NotificationDropdown.vue'

  const { t } = useI18n()
  const route = useRoute()
  const authStore = useAuthStore()
  const localePath = useLocalePath()

  // Hide FAB when on submit page
  const isOnSubmitPage = computed(() => route.path.includes('/submit'))

  // Get sub name if we're on a sub page
  const currentSubName = computed(() => {
    if (route.path.startsWith('/s/') || route.path.includes('/s/')) {
      const match = route.path.match(/\/s\/([^/]+)/)
      return match ? match[1] : null
    }
    return null
  })

  // FAB link with sub context
  const fabLink = computed(() => {
    const basePath = localePath('/submit')
    return currentSubName.value ? `${basePath}?sub=${currentSubName.value}` : basePath
  })

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const isOpen = ref(props.modelValue)
  const showLanguageModal = ref(false)
  const showThemeModal = ref(false)

  const toggleMenu = () => {
    isOpen.value = !isOpen.value
    emit('update:modelValue', isOpen.value)
  }

  const closeMenu = () => {
    isOpen.value = false
    emit('update:modelValue', false)
  }

  const openLanguageSelector = () => {
    closeMenu()
    showLanguageModal.value = true
  }

  const closeLanguageModal = () => {
    showLanguageModal.value = false
  }

  const openThemeSelector = () => {
    closeMenu()
    showThemeModal.value = true
  }

  const closeThemeModal = () => {
    showThemeModal.value = false
  }

  const handleLanguageSelected = () => {
    closeLanguageModal()
  }

  const handleThemeSelected = () => {
    closeThemeModal()
  }

  const handleResize = () => {
    if (window.innerWidth >= 768 && isOpen.value) {
      closeMenu()
    }
    if (window.innerWidth >= 768) {
      showLanguageModal.value = false
      showThemeModal.value = false
    }
  }

  const handleClickOutside = (event) => {
    const menuContainer = document.querySelector('.mobile-menu-container')
    const menuButton = document.querySelector('.menu-button')

    if (
      isOpen.value &&
      menuContainer &&
      !menuContainer.contains(event.target) &&
      menuButton &&
      !menuButton.contains(event.target)
    ) {
      closeMenu()
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      window.addEventListener('resize', handleResize)
      document.addEventListener('click', handleClickOutside)
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.client) {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

<style scoped>
  .mobile-menu-container {
    transition:
      max-height 0.3s ease,
      opacity 0.2s ease;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .mobile-menu-container.open {
    max-height: calc(100vh - 64px);
    opacity: 1;
    overflow-y: auto;
  }

  .menu-button {
    position: relative;
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: auto 0;
    padding: 16px;
    margin-right: 4px;
  }

  .menu-bar {
    width: 24px;
    height: 2px;
    background-color: var(--color-navbar-text);
    transition: all 0.3s ease;
    position: absolute;
  }

  .menu-bar:nth-child(1) {
    transform: translateY(-6px);
  }

  .menu-bar:nth-child(3) {
    transform: translateY(6px);
  }

  .menu-open .menu-bar:nth-child(1) {
    transform: rotate(45deg);
  }

  .menu-open .menu-bar:nth-child(2) {
    opacity: 0;
  }

  .menu-open .menu-bar:nth-child(3) {
    transform: rotate(-45deg);
  }

  .mobile-nav-link {
    transition: all 0.2s ease;
  }

  .mobile-nav-link:active,
  .mobile-nav-link.active {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .mobile-nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .mobile-fab {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: var(--color-btn-primary-text);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 40;
    transition: all 0.3s ease;
  }

  .mobile-fab:hover,
  .mobile-fab:active {
    background-color: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .mobile-fab i {
    font-size: 1.5rem;
  }

  /* Styles for modals */
  .mobile-modal-overlay {
    animation: fadeIn 0.2s ease forwards;
  }

  .mobile-modal {
    transform: scale(0.9);
    opacity: 0;
    animation: scaleIn 0.3s ease forwards;
    max-height: 80vh;
    overflow-y: auto;
    background-color: var(--color-bg-card);
    color: var(--color-text-primary);
  }

  .modal-title {
    color: var(--color-text-primary);
  }

  .modal-close-btn {
    color: var(--color-text-muted);
    transition: color 0.2s ease;
  }

  .modal-close-btn:hover {
    color: var(--color-text-primary);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Additional styles for mobile AuthNav */
  .mobile-auth {
    display: flex;
    align-items: center;
  }

  /* Optimize mobile header spacing */
  @media (max-width: 767px) {
    .mobile-auth :deep(.user-info) {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
    }

    .mobile-auth :deep(.btn-login),
    .mobile-auth :deep(.btn-register) {
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
    }

    .mobile-auth :deep(.btn-register) {
      min-width: 32px;
      width: 32px;
      height: 32px;
    }
  }
</style>
