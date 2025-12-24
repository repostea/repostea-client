import type { Ref } from 'vue'

export interface UserSeals {
  available_seals: number
  total_earned: number
  total_used: number
  last_awarded_at: string | null
}

export interface SealMarkResponse {
  success: boolean
  message?: string
  available_seals?: number
  post?: {
    recommended_seals_count: number
    advise_against_seals_count: number
  }
  comment?: {
    recommended_seals_count: number
    advise_against_seals_count: number
  }
  error?: string
}

export interface UserMarksCheck {
  has_recommended: boolean
  has_advise_against: boolean
}

// Global state for user seals (shared across all components)
const globalUserSeals: Ref<UserSeals | null> = ref(null)
const globalLoading = ref(false)
const globalError: Ref<string | null> = ref(null)
const globalFetched = ref(false) // Track if seals have been fetched

export const useSeals = () => {
  const { $api } = useNuxtApp()

  // Use global shared state
  const userSeals = globalUserSeals
  const loading = globalLoading
  const error = globalError

  /**
   * Fetch user's available seals
   * Uses global state to prevent multiple concurrent requests
   */
  const fetchUserSeals = async (force = false): Promise<void> => {
    // If already fetched and not forcing, skip
    if (globalFetched.value && !force) {
      return
    }

    // If already loading, skip to prevent duplicate requests
    if (loading.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $api.seals.getUserSeals()
      userSeals.value = response.data
      globalFetched.value = true
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch seals'
      console.error('Error fetching user seals:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply a seal mark to a post
   */
  const markPost = async (
    postId: number,
    type: 'recommended' | 'advise_against'
  ): Promise<SealMarkResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await $api.seals.markPost(postId, type)
      const data = response.data

      // Update user's available seals count
      if (data.available_seals !== undefined && userSeals.value) {
        userSeals.value.available_seals = data.available_seals
      }

      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to apply seal'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove a seal mark from a post
   */
  const unmarkPost = async (
    postId: number,
    type: 'recommended' | 'advise_against'
  ): Promise<SealMarkResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await $api.seals.unmarkPost(postId, type)
      const data = response.data

      // Update user's available seals count
      if (data.available_seals !== undefined && userSeals.value) {
        userSeals.value.available_seals = data.available_seals
      }

      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to remove seal'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply a seal mark to a comment
   */
  const markComment = async (
    commentId: number,
    type: 'recommended' | 'advise_against'
  ): Promise<SealMarkResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await $api.seals.markComment(commentId, type)
      const data = response.data

      // Update user's available seals count
      if (data.available_seals !== undefined && userSeals.value) {
        userSeals.value.available_seals = data.available_seals
      }

      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to apply seal'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove a seal mark from a comment
   */
  const unmarkComment = async (
    commentId: number,
    type: 'recommended' | 'advise_against'
  ): Promise<SealMarkResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await $api.seals.unmarkComment(commentId, type)
      const data = response.data

      // Update user's available seals count
      if (data.available_seals !== undefined && userSeals.value) {
        userSeals.value.available_seals = data.available_seals
      }

      return data
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to remove seal'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if user has marked content
   */
  const checkUserMarks = async (
    contentType: 'post' | 'comment',
    contentId: number
  ): Promise<UserMarksCheck | null> => {
    try {
      const response = await $api.seals.checkUserMarks(contentType, contentId)
      return response.data
    } catch (err: any) {
      console.error('Error checking user marks:', err)
      return null
    }
  }

  /**
   * Get seal marks for a post
   */
  const getPostMarks = async (postId: number) => {
    try {
      const response = await $api.seals.getPostMarks(postId)
      return response.data
    } catch (err: any) {
      console.error('Error fetching post marks:', err)
      return { recommended: [], advise_against: [] }
    }
  }

  /**
   * Get seal marks for a comment
   */
  const getCommentMarks = async (commentId: number) => {
    try {
      const response = await $api.seals.getCommentMarks(commentId)
      return response.data
    } catch (err: any) {
      console.error('Error fetching comment marks:', err)
      return { recommended: [], advise_against: [] }
    }
  }

  /**
   * Reset seals state (e.g., when user logs out)
   */
  const resetSeals = (): void => {
    globalUserSeals.value = null
    globalFetched.value = false
    globalLoading.value = false
    globalError.value = null
  }

  return {
    userSeals,
    loading,
    error,
    fetchUserSeals,
    markPost,
    unmarkPost,
    markComment,
    unmarkComment,
    checkUserMarks,
    getPostMarks,
    getCommentMarks,
    resetSeals,
  }
}
