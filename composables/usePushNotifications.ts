import { ref, computed, readonly } from 'vue'
import { useI18n } from '#i18n'
import { useNotification } from './useNotification'
import { useNuxtApp } from '#app'
import { useAuthStore } from '~/stores/auth'

// Define NotificationPermission type locally since it's not available in all environments
type NotificationPermission = 'default' | 'denied' | 'granted'

export interface PushNotificationPreferences {
  enabled: boolean
  comments: boolean
  votes: boolean
  mentions: boolean
  system: boolean
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

const subscription = ref<PushSubscription | null>(null)
const isSupported = ref(false)
const isSubscribed = ref(false)
const permission = ref<NotificationPermission>('default')
const loading = ref(false)
const serviceWorkerRegistration = ref<ServiceWorkerRegistration | null>(null)

const defaultPreferences: PushNotificationPreferences = {
  enabled: false,
  comments: true,
  votes: true,
  mentions: true,
  system: true,
}

const preferences = ref<PushNotificationPreferences>({ ...defaultPreferences })

export function usePushNotifications() {
  const { t } = useI18n()
  const notification = useNotification()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const canSubscribe = computed(() => {
    return (
      isSupported.value &&
      permission.value === 'granted' &&
      !isSubscribed.value &&
      authStore.isAuthenticated
    )
  })

  const canUnsubscribe = computed(() => {
    return isSupported.value && isSubscribed.value
  })

  const needsPermission = computed(() => {
    return isSupported.value && permission.value === 'default'
  })

  const isBlocked = computed(() => {
    return permission.value === 'denied'
  })

  const checkSupport = async () => {
    if (!import.meta.client) return

    isSupported.value =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

    if (isSupported.value) {
      permission.value = Notification.permission
      await registerServiceWorker()
      await checkExistingSubscription()
    }
  }

  const registerServiceWorker = async () => {
    if (!isSupported.value) return

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js')
      serviceWorkerRegistration.value = registration

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              checkExistingSubscription()
            }
          })
        }
      })
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  }

  const checkExistingSubscription = async () => {
    if (!serviceWorkerRegistration.value) return

    try {
      const existingSubscription =
        await serviceWorkerRegistration.value.pushManager.getSubscription()
      subscription.value = existingSubscription
      isSubscribed.value = !!existingSubscription
    } catch (error) {
      console.error('Error checking existing subscription:', error)
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported.value) return false

    loading.value = true
    try {
      const result = await Notification.requestPermission()
      permission.value = result

      if (result === 'granted') {
        notification.success(t('notifications.push.permission_granted'))
        return true
      } else if (result === 'denied') {
        notification.error(t('notifications.push.permission_denied'))
        return false
      }
      return false
    } catch (error) {
      console.error('Error requesting permission:', error)
      notification.error(t('notifications.push.permission_error'))
      return false
    } finally {
      loading.value = false
    }
  }

  const subscribe = async (): Promise<boolean> => {
    if (!canSubscribe.value || !serviceWorkerRegistration.value) return false

    loading.value = true
    try {
      const publicKey = await getVapidPublicKey()
      if (!publicKey) return false

      const pushSubscription = await serviceWorkerRegistration.value.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      subscription.value = pushSubscription
      isSubscribed.value = true

      const subscriptionData: PushSubscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')),
        },
      }

      await savePushSubscription(subscriptionData)

      notification.success(t('notifications.push.subscription_success'), {
        translate: true,
      })
      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      notification.error(t('notifications.push.subscription_error'), {
        translate: true,
      })
      return false
    } finally {
      loading.value = false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    if (!canUnsubscribe.value || !subscription.value) return false

    loading.value = true
    try {
      const endpoint = subscription.value.endpoint
      await subscription.value.unsubscribe()
      await removePushSubscription(endpoint)

      subscription.value = null
      isSubscribed.value = false

      notification.success(t('notifications.push.unsubscribe_success'), {
        translate: true,
      })
      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      notification.error(t('notifications.push.unsubscribe_error'), {
        translate: true,
      })
      return false
    } finally {
      loading.value = false
    }
  }

  const updatePreferences = async (
    newPreferences: Partial<PushNotificationPreferences>
  ): Promise<boolean> => {
    if (!authStore.isAuthenticated) return false

    loading.value = true
    try {
      const updatedPreferences = { ...preferences.value, ...newPreferences }

      await $api.notifications.updatePushPreferences(updatedPreferences)
      preferences.value = updatedPreferences

      notification.success(t('notifications.push.preferences_updated'), {
        translate: true,
      })
      return true
    } catch (error) {
      console.error('Error updating push preferences:', error)
      notification.error(t('notifications.push.preferences_error'), {
        translate: true,
      })
      return false
    } finally {
      loading.value = false
    }
  }

  const loadPreferences = async () => {
    if (!authStore.isAuthenticated) return

    try {
      const response = await $api.notifications.getPushPreferences()
      preferences.value = { ...defaultPreferences, ...response.data }
    } catch (error) {
      console.error('Error loading push preferences:', error)
      preferences.value = { ...defaultPreferences }
    }
  }

  const getVapidPublicKey = async (): Promise<string | null> => {
    try {
      const response = await $api.notifications.getVapidPublicKey()
      return response.data.public_key
    } catch (error) {
      console.error('Error getting VAPID public key:', error)
      return null
    }
  }

  const savePushSubscription = async (subscriptionData: PushSubscriptionData) => {
    await $api.notifications.savePushSubscription({
      ...subscriptionData,
      preferences: preferences.value,
    })
  }

  const removePushSubscription = async (endpoint: string) => {
    await $api.notifications.removePushSubscription(endpoint)
  }

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
    if (!buffer) return ''
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  const testNotification = async () => {
    if (!isSupported.value || permission.value !== 'granted') return

    try {
      await $api.notifications.sendTestPushNotification()
      notification.success(t('notifications.push.test_sent'), {
        translate: true,
      })
    } catch (error) {
      console.error('Error sending test notification:', error)
      notification.error(t('notifications.push.test_error'), {
        translate: true,
      })
    }
  }

  const initialize = async () => {
    await checkSupport()
    if (authStore.isAuthenticated) {
      await loadPreferences()
    }
  }

  return {
    subscription: readonly(subscription),
    isSupported: readonly(isSupported),
    isSubscribed: readonly(isSubscribed),
    permission: readonly(permission),
    loading: readonly(loading),
    preferences: readonly(preferences),

    canSubscribe,
    canUnsubscribe,
    needsPermission,
    isBlocked,

    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    loadPreferences,
    testNotification,
  }
}
