import { ref, computed } from 'vue'
import { useNuxtApp } from '#app'
import { useAuth } from './useAuth'

export interface ActivityPubUserSettings {
  federation_enabled: boolean
  federation_enabled_at: string | null
  default_federate_posts: boolean
  indexable: boolean
  show_followers_count: boolean
  handle: string | null
  actor_uri: string | null
}

export interface ActivityPubPostSettings {
  should_federate: boolean
  is_federated: boolean
  federated_at: string | null
  note_uri: string | null
}

export interface ActivityPubSubSettings {
  federation_enabled: boolean
  federation_enabled_at: string | null
  auto_announce: boolean
  accept_remote_posts: boolean
  handle: string | null
  actor_uri: string | null
}

export const useActivityPub = () => {
  const { $api } = useNuxtApp()
  const { user } = useAuth()

  const userSettings = ref<ActivityPubUserSettings | null>(null)
  const serverEnabled = ref<boolean | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Server has ActivityPub enabled globally
  const isServerEnabled = computed(() => serverEnabled.value ?? false)
  // User has federation enabled AND server has it enabled
  const isFederationEnabled = computed(() => isServerEnabled.value && (userSettings.value?.federation_enabled ?? false))
  const defaultFederatePosts = computed(() => userSettings.value?.default_federate_posts ?? false)
  const userHandle = computed(() => userSettings.value?.handle ?? null)
  const userActorUri = computed(() => userSettings.value?.actor_uri ?? null)

  const checkServerStatus = async () => {
    try {
      const response = await $api.activitypub.getStatus()
      serverEnabled.value = response.data?.enabled ?? false
      return serverEnabled.value
    } catch {
      serverEnabled.value = false
      return false
    }
  }

  const fetchUserSettings = async () => {
    if (!user.value) return null

    // Also check server status when fetching user settings
    if (serverEnabled.value === null) {
      await checkServerStatus()
    }

    // If server doesn't have ActivityPub enabled, don't bother fetching user settings
    if (!serverEnabled.value) {
      return null
    }

    loading.value = true
    error.value = null

    try {
      const response = await $api.activitypub.getSettings()
      userSettings.value = response.data
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch federation settings'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateUserSettings = async (settings: Partial<ActivityPubUserSettings>) => {
    if (!user.value) return null

    loading.value = true
    error.value = null

    try {
      const response = await $api.activitypub.updateSettings(settings)
      userSettings.value = response.data
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update federation settings'
      return null
    } finally {
      loading.value = false
    }
  }

  const enableFederation = async () => {
    return updateUserSettings({ federation_enabled: true })
  }

  const disableFederation = async () => {
    return updateUserSettings({ federation_enabled: false })
  }

  const toggleDefaultFederatePosts = async () => {
    if (!userSettings.value) await fetchUserSettings()
    const newValue = !userSettings.value?.default_federate_posts
    return updateUserSettings({ default_federate_posts: newValue })
  }

  const fetchPostSettings = async (postId: number) => {
    try {
      const response = await $api.activitypub.getPostSettings(postId)
      return response.data as ActivityPubPostSettings
    } catch {
      return null
    }
  }

  const updatePostSettings = async (postId: number, settings: Partial<ActivityPubPostSettings>) => {
    try {
      const response = await $api.activitypub.updatePostSettings(postId, settings)
      return response.data as ActivityPubPostSettings
    } catch {
      return null
    }
  }

  const setPostFederation = async (postId: number, shouldFederate: boolean) => {
    return updatePostSettings(postId, { should_federate: shouldFederate })
  }

  const fetchSubSettings = async (subId: number) => {
    try {
      const response = await $api.activitypub.getSubSettings(subId)
      return response.data as ActivityPubSubSettings
    } catch {
      return null
    }
  }

  const updateSubSettings = async (subId: number, settings: Partial<ActivityPubSubSettings>) => {
    try {
      const response = await $api.activitypub.updateSubSettings(subId, settings)
      return response.data as ActivityPubSubSettings
    } catch {
      return null
    }
  }

  return {
    // State
    userSettings,
    serverEnabled,
    loading,
    error,

    // Computed
    isServerEnabled,
    isFederationEnabled,
    defaultFederatePosts,
    userHandle,
    userActorUri,

    // Server status
    checkServerStatus,

    // User settings methods
    fetchUserSettings,
    updateUserSettings,
    enableFederation,
    disableFederation,
    toggleDefaultFederatePosts,

    // Post settings methods
    fetchPostSettings,
    updatePostSettings,
    setPostFederation,

    // Sub settings methods
    fetchSubSettings,
    updateSubSettings,
  }
}
