export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Check if there's a secret parameter in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const secret = urlParams.get('secret')

    if (secret) {
      // Store the secret in sessionStorage
      sessionStorage.setItem('maintenance_secret', secret)
    }
  }
})
