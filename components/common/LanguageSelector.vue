<template>
  <div class="relative" ref="languageDropdownRef">
    <div>
      <button
        @click="toggleDropdown"
        class="flex text-sm rounded-full focus:outline-none hover:bg-white/10 p-2"
      >
        <span class="sr-only">{{ $t('common.language') }}</span>
        <i class="fas fa-globe"></i>
      </button>
    </div>

    <div
      v-if="showDropdown"
      class="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-white dark:bg-card-bg-dark ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
    >
      <button
        v-for="locale in availableLocales"
        :key="locale.code"
        @click="switchLocale(locale.code)"
        class="block w-full text-left px-4 py-2 text-sm text-text dark:text-text-dark hover:bg-gray-100 dark:hover:bg-neutral-700"
        :class="{
          'bg-gray-100 dark:bg-neutral-800': currentLocale === locale.code,
        }"
      >
        {{ locale.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useI18n } from 'vue-i18n'

  const props = defineProps({
    buttonClass: {
      type: String,
      default: '',
    },
  })

  const { locale, locales } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const languageDropdownRef = ref(null)
  const showDropdown = ref(false)

  const currentLocale = computed(() => locale.value)
  const availableLocales = computed(() => {
    return locales.value.map((loc) => {
      if (typeof loc === 'string') {
        return { code: loc, name: loc.toUpperCase() }
      }
      return {
        code: loc.code,
        name: loc.name || loc.code.toUpperCase(),
      }
    })
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
      newPath = `/${localeCode}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`
    }

    window.location.href = newPath
    locale.value = localeCode
    showDropdown.value = false
  }

  onMounted(() => {
    if (process.client) {
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
