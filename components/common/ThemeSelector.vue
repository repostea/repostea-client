<template>
  <div ref="themeDropdownRef" class="relative">
    <div>
      <button
        class="flex text-sm rounded-full focus:outline-none hover:bg-white/10 p-2 theme-selector-btn"
        :title="t('settings.theme')"
        :aria-expanded="showDropdown"
        aria-haspopup="menu"
        @click="toggleDropdown"
      >
        <span class="sr-only">{{ t('settings.theme') }}</span>
        <Icon :name="getThemeIconify" aria-hidden="true" />
      </button>
    </div>

    <div
      v-if="showDropdown"
      class="theme-dropdown origin-top-right absolute right-0 mt-2 w-64 rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-20 max-h-[70vh] overflow-y-auto"
      role="menu"
    >
      <div class="theme-dropdown-header px-4 py-2 text-xs font-semibold">
        {{ t('settings.themes') }}
      </div>

      <!-- Temas Claros -->
      <template v-if="themesByCategory.light.length > 0">
        <div class="theme-category-header">
          <Icon name="fa6-solid:sun" class="mr-1.5 text-yellow-500" aria-hidden="true" />
          <span>{{ t('settings.themes_light') }}</span>
        </div>
        <button
          v-for="theme in themesByCategory.light"
          :key="theme.name"
          class="theme-option inline-flex items-center w-full text-left px-4 py-2 text-sm"
          :class="{ 'theme-option-active': preferencesStore.theme === theme.name }"
          role="menuitem"
          @click="switchTheme(theme.name)"
        >
          <Icon :name="theme.iconify" :class="['mr-2 flex-shrink-0', theme.colorClass]" aria-hidden="true" />
          <span>{{ theme.label }}</span>
        </button>
      </template>

      <!-- Temas Oscuros -->
      <template v-if="themesByCategory.dark.length > 0">
        <div class="theme-category-header">
          <Icon name="fa6-solid:moon" class="mr-1.5 text-slate-400" aria-hidden="true" />
          <span>{{ t('settings.themes_dark') }}</span>
        </div>
        <button
          v-for="theme in themesByCategory.dark"
          :key="theme.name"
          class="theme-option inline-flex items-center w-full text-left px-4 py-2 text-sm"
          :class="{ 'theme-option-active': preferencesStore.theme === theme.name }"
          role="menuitem"
          @click="switchTheme(theme.name)"
        >
          <Icon :name="theme.iconify" :class="['mr-2 flex-shrink-0', theme.colorClass]" aria-hidden="true" />
          <span>{{ theme.label }}</span>
        </button>
      </template>

      <!-- Temas Alto Contraste -->
      <template v-if="themesByCategory['high-contrast'].length > 0">
        <div class="theme-category-header">
          <Icon name="fa6-solid:circle-half-stroke" class="mr-1.5 text-primary dark:text-primary-light" aria-hidden="true" />
          <span>{{ t('settings.themes_high_contrast') }}</span>
        </div>
        <button
          v-for="theme in themesByCategory['high-contrast']"
          :key="theme.name"
          class="theme-option inline-flex items-center w-full text-left px-4 py-2 text-sm"
          :class="{ 'theme-option-active': preferencesStore.theme === theme.name }"
          role="menuitem"
          @click="switchTheme(theme.name)"
        >
          <Icon :name="theme.iconify" :class="['mr-2 flex-shrink-0', theme.colorClass]" aria-hidden="true" />
          <span>{{ theme.label }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useI18n } from '#i18n'
  import { useUserPreferencesStore } from '~/stores/userPreferences'
  import { useThemes, themeClasses, isDarkTheme, availableThemes as allThemes } from '~/composables/useThemes'

  const { themesByCategory } = useThemes()
  const { t } = useI18n()
  const preferencesStore = useUserPreferencesStore()

  const emit = defineEmits(['theme-selected'])

  const themeDropdownRef = ref(null)
  const showDropdown = ref(false)

  const getThemeIconify = computed(() => {
    return 'fa6-solid:palette'
  })

  function toggleDropdown() {
    showDropdown.value = !showDropdown.value
  }

  function switchTheme(themeName) {
    const theme = allThemes.find((t) => t.name === themeName)
    if (!theme) return

    if (process.client) {
      document.documentElement.classList.remove(...themeClasses)
      document.documentElement.classList.add(`theme-${themeName}`)

      if (isDarkTheme(themeName)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // Update URL with theme parameter (for sharing/preview)
      const url = new URL(window.location.href)
      url.searchParams.set('theme', themeName)
      window.history.replaceState({}, '', url.toString())

      // Save theme preference (works for all users, persists in cookie)
      preferencesStore.setTheme(themeName)
    }

    showDropdown.value = false
    emit('theme-selected', themeName)
  }

  onMounted(() => {
    if (process.client) {
      window.addEventListener('click', (event) => {
        if (
          showDropdown.value &&
          themeDropdownRef.value &&
          !themeDropdownRef.value.contains(event.target)
        ) {
          showDropdown.value = false
        }
      })
    }
  })

  defineExpose({ switchTheme })
</script>

<style scoped>
  .theme-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .theme-dropdown-header {
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border-default);
  }

  .theme-category-header {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    background-color: var(--color-bg-elevated);
    border-top: 1px solid var(--color-border-subtle);
    margin-top: 0.25rem;
  }

  .theme-category-header:first-of-type {
    margin-top: 0;
    border-top: none;
  }

  .theme-option {
    color: var(--color-text-primary);
  }

  .theme-option:hover {
    background-color: var(--color-bg-hover);
  }

  .theme-option-active {
    background-color: var(--color-bg-active);
  }

  .theme-selector-btn {
    color: var(--color-navbar-text-secondary);
  }

  .theme-selector-btn:hover {
    color: var(--color-navbar-text);
  }
</style>
