export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$router.options.scrollBehavior = (to, from, savedPosition) => {
    // If there's a saved position (from browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }

    // If navigating to a hash (like #c-5), let the browser handle it
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: -120, // Offset for fixed header
      }
    }

    // Otherwise, scroll to top
    return { top: 0 }
  }
})
