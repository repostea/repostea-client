/**
 * Composable to manage user session tracking
 * Generates and persists a session ID for analytics
 */
export const useSession = () => {
  const getSessionId = (): string => {
    if (import.meta.server) return ''

    let sessionId = localStorage.getItem('session_id')

    if (!sessionId) {
      // Generate a new session ID
      sessionId = crypto.randomUUID()
      localStorage.setItem('session_id', sessionId)
    }

    return sessionId
  }

  const getScreenResolution = (): string => {
    if (import.meta.server) return ''

    return `${window.screen.width}x${window.screen.height}`
  }

  const getReferer = (): string => {
    if (import.meta.server) return ''

    return document.referrer || ''
  }

  return {
    getSessionId,
    getScreenResolution,
    getReferer
  }
}
