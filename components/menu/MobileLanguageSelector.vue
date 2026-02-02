<template>
  <div class="mobile-language-selector">
    <div class="grid grid-cols-1 gap-2 p-2">
      <button
        v-for="loc in availableLocales"
        :key="loc.code"
        class="mobile-lang-btn flex items-center px-4 py-3 text-sm rounded-md text-text dark:text-text-dark"
        :class="{
          'mobile-lang-btn-active': currentLocale === loc.code,
        }"
        @click="switchLocale(loc.code)"
      >
        <span class="inline-block w-6 mr-2">{{ loc.flag }}</span>
        <span class="inline-block w-8 font-semibold">{{ loc.code.toUpperCase() }}</span>
        <span class="ml-1">{{ loc.native }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useI18n } from '#i18n'
  import languages from '~/utils/language-data'

  const { locale, locales } = useI18n()
  const route = useRoute()
  const emit = defineEmits(['language-selected'])

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

  function switchLocale(localeCode) {
    // Separate path from query string
    const currentPath = route.path
    const queryString = route.fullPath.includes('?')
      ? route.fullPath.substring(route.fullPath.indexOf('?'))
      : ''

    const pathParts = currentPath.split('/')
    const hasLocalePrefix = pathParts.length > 1 && pathParts[1].length === 2

    let newPath
    if (hasLocalePrefix) {
      pathParts[1] = localeCode
      newPath = pathParts.join('/')
    } else {
      newPath = `/${localeCode}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`
    }

    // Re-append query string
    window.location.href = newPath + queryString
    emit('language-selected', localeCode)
  }
</script>

<style scoped>
  .mobile-language-selector {
    width: 100%;
  }

  .mobile-lang-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .mobile-lang-btn-active {
    background-color: var(--color-bg-active);
  }
</style>
