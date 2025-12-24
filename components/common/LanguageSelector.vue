<template>
  <div ref="languageDropdownRef" class="relative">
    <div>
      <button
        class="relative flex text-sm rounded-full focus:outline-none hover:bg-white/10 p-2 lang-selector-btn"
        :title="t('common.language')"
        :aria-expanded="showDropdown"
        aria-haspopup="menu"
        @click="toggleDropdown"
      >
        <span class="sr-only">{{ t('common.language') }}</span>
        <Icon name="fa6-solid:globe" aria-hidden="true" />

        <!-- Language indicator badge -->
        <span
          class="absolute -top-0.5 -right-0.5 bg-primary rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-medium px-0.5 text-[10px] btn-primary-text"
        >
          {{ currentLocale.toUpperCase() }}
        </span>
      </button>
    </div>

    <div
      v-if="showDropdown"
      class="language-dropdown origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
      role="menu"
    >
      <button
        v-for="lang in availableLocales"
        :key="lang.code"
        class="language-option block w-full text-left px-4 py-2 text-sm"
        :class="{
          'language-option-active': currentLocale === lang.code,
        }"
        role="menuitem"
        @click="switchLocale(lang.code)"
      >
        <span class="inline-block w-6 mr-2">{{ lang.flag }}</span>
        <span class="inline-block w-8 font-semibold">{{ lang.code.toUpperCase() }}</span>
        <span class="ml-1">{{ lang.native }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useI18n } from '#i18n'
  import languages from '~/utils/language-data'
  const { t } = useI18n()

  const { locale, locales } = useI18n()
  const route = useRoute()
  const languageDropdownRef = ref(null)
  const showDropdown = ref(false)

  const currentLocale = computed(() => locale.value)
  const availableLocales = computed(() => {
    // Show all locales that are configured in nuxt.config.ts (from NUXT_PUBLIC_SUPPORTED_LOCALES)
    // Filter out hidden interface languages (easter eggs accessible only via URL)
    return locales.value
      .map((loc) => {
        if (typeof loc === 'string') {
          return { code: loc, name: loc.toUpperCase() }
        }

        // Find additional metadata from our language-data.js
        const langData = languages.find((lang) => lang.code === loc.code)

        return {
          code: loc.code,
          name: loc.name || loc.code.toUpperCase(),
          native: langData?.native || loc.name,
          flag: langData?.flag || '',
          interfaceHidden: langData?.interfaceHidden || false,
        }
      })
      .filter((loc) => !loc.interfaceHidden)
  })

  function toggleDropdown() {
    showDropdown.value = !showDropdown.value
  }

  function switchLocale(localeCode) {
    const currentPath = route.fullPath
    const pathParts = currentPath.split('/')
    const hasLocalePrefix = pathParts.length > 1 && pathParts[1].length === 2
    let newPath
    if (hasLocalePrefix) {
      pathParts[1] = localeCode
      newPath = pathParts.join('/')
    } else {
      newPath = `${localeCode}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`
    }

    window.location.href = newPath
    showDropdown.value = false
  }

  onMounted(() => {
    if (import.meta.client) {
      window.addEventListener('click', (event) => {
        if (
          showDropdown.value &&
          languageDropdownRef.value &&
          !languageDropdownRef.value.contains(event.target)
        ) {
          showDropdown.value = false
        }
      })
    }
  })
</script>

<style scoped>
  .language-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .language-option {
    color: var(--color-text-primary);
  }

  .language-option:hover {
    background-color: var(--color-bg-hover);
  }

  .language-option-active {
    background-color: var(--color-bg-active);
  }

  .lang-selector-btn {
    color: var(--color-navbar-text-secondary);
  }

  .lang-selector-btn:hover {
    color: var(--color-navbar-text);
  }
</style>
