/**
 * Service for managing localStorage operations
 */
export const localStorageService = {
  /**
   * Clear all voted posts from localStorage
   */
  clearVotedPosts() {
    if (typeof window === 'undefined') return

    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('voted_') || key.startsWith('post_vote_'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  },
}
