<template>
  <div class="mobile-theme-selector">
    <div class="grid grid-cols-1 gap-1">
      <div class="mb-2 px-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
        {{ $t('settings.themes') }}
      </div>

      <!-- Temas Claros -->
      <template v-if="themesByCategory.light.length > 0">
        <div class="category-header">
          <Icon name="fa6-solid:sun" class="mr-1.5 text-yellow-500" aria-hidden="true" />
          <span>{{ $t('settings.themes_light') }}</span>
        </div>
        <button
          v-for="theme in themesByCategory.light"
          :key="theme.name"
          class="theme-button"
          :class="{ 'theme-button-active': preferencesStore.theme === theme.name }"
          @click="switchTheme(theme.name)"
        >
          <div class="flex items-center">
            <Icon :name="theme.iconify" :class="['mr-2', theme.colorClass]" aria-hidden="true" />
            {{ theme.label }}
          </div>
        </button>
      </template>

      <!-- Temas Oscuros -->
      <template v-if="themesByCategory.dark.length > 0">
        <div class="category-header mt-2">
          <Icon name="fa6-solid:moon" class="mr-1.5 text-slate-400" aria-hidden="true" />
          <span>{{ $t('settings.themes_dark') }}</span>
        </div>
        <button
          v-for="theme in themesByCategory.dark"
          :key="theme.name"
          class="theme-button"
          :class="{ 'theme-button-active': preferencesStore.theme === theme.name }"
          @click="switchTheme(theme.name)"
        >
          <div class="flex items-center">
            <Icon :name="theme.iconify" :class="['mr-2', theme.colorClass]" aria-hidden="true" />
            {{ theme.label }}
          </div>
        </button>
      </template>

      <!-- Temas Alto Contraste -->
      <template v-if="themesByCategory['high-contrast'].length > 0">
        <div class="category-header mt-2">
          <Icon
            name="fa6-solid:circle-half-stroke"
            class="mr-1.5 text-primary dark:text-primary-light"
            aria-hidden="true"
          />
          <span>{{ $t('settings.themes_high_contrast') }}</span>
        </div>
        <button
          v-for="theme in themesByCategory['high-contrast']"
          :key="theme.name"
          class="theme-button"
          :class="{ 'theme-button-active': preferencesStore.theme === theme.name }"
          @click="switchTheme(theme.name)"
        >
          <div class="flex items-center">
            <Icon :name="theme.iconify" :class="['mr-2', theme.colorClass]" aria-hidden="true" />
            {{ theme.label }}
          </div>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { useUserPreferencesStore } from '~/stores/userPreferences'
  import {
    useThemes,
    themeClasses,
    isDarkTheme,
    availableThemes as allThemes,
  } from '~/composables/useThemes'

  const { themesByCategory } = useThemes()
  const preferencesStore = useUserPreferencesStore()
  const emit = defineEmits(['theme-selected'])

  function switchTheme(themeName) {
    const theme = allThemes.find((t) => t.name === themeName)
    if (!theme) return

    if (import.meta.client) {
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

    emit('theme-selected', themeName)
  }
</script>

<style scoped>
  .mobile-theme-selector {
    width: 100%;
  }

  .category-header {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .theme-button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    border-radius: 0.375rem;
    color: var(--color-text-primary);
  }

  .theme-button:hover {
    background-color: var(--color-bg-hover);
  }

  .theme-button-active {
    background-color: var(--color-bg-active);
  }
</style>
