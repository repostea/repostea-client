export const useUserTimezone = () => {
  const DEFAULT_TIMEZONE = 'Europe/Madrid'

  // Read from cookie (works in SSR and client)
  const timezoneCookie = useCookie('user_timezone', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })

  // If no cookie, detect from browser (client-side only)
  if (import.meta.client && !timezoneCookie.value) {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (detectedTimezone) {
        timezoneCookie.value = detectedTimezone
      }
    } catch {
      timezoneCookie.value = DEFAULT_TIMEZONE
    }
  }

  return {
    timezone: timezoneCookie.value || DEFAULT_TIMEZONE,
  }
}
