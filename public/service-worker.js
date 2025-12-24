self.addEventListener('install', function (event) {
  var offlineRequest = new Request('/pwa/offline.html')
  event.waitUntil(
    fetch(offlineRequest).then(function (response) {
      return caches.open('offline').then(function (cache) {
        return cache.put(offlineRequest, response)
      })
    })
  )
})

self.addEventListener('fetch', function (event) {
  var request = event.request
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request).catch(function (error) {
        return caches.open('offline').then(function (cache) {
          return cache.match('/pwa/offline.html')
        })
      })
    )
  }
})

self.addEventListener('push', function (event) {
  if (!event.data) {
    return
  }

  try {
    var data = event.data.json()
    var options = {
      body: data.body || '',
      icon: data.icon || '/pwa/icon-192.png',
      badge: data.badge || '/pwa/icon-32.png',
      image: data.image,
      tag: data.tag || 'default',
      renotify: data.renotify || false,
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {},
    }

    if (data.silent) {
      return
    }

    event.waitUntil(self.registration.showNotification(data.title || 'Repostea', options))
  } catch (error) {
    console.error('Error processing push notification:', error)

    event.waitUntil(
      self.registration.showNotification('Repostea', {
        body: 'You have a new notification',
        icon: '/pwa/icon-192.png',
        badge: '/pwa/icon-32.png',
        tag: 'fallback',
      })
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  var notificationData = event.notification.data || {}
  var action = event.action
  var url = '/'

  if (action) {
    switch (action) {
      case 'view':
        url = notificationData.url || '/'
        break
      case 'reply':
        url = notificationData.replyUrl || notificationData.url || '/'
        break
      case 'dismiss':
        return
      default:
        url = notificationData.url || '/'
    }
  } else if (notificationData.url) {
    url = notificationData.url
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      var matchingClient = null

      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url.includes(url.split('?')[0])) {
          matchingClient = client
          break
        }
      }

      if (matchingClient) {
        return matchingClient.focus().then(function (client) {
          if (url !== '/' && client.url !== url) {
            return client.navigate(url)
          }
          return client
        })
      } else if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

self.addEventListener('notificationclose', function (event) {
  var notificationData = event.notification.data || {}

  if (notificationData.closeAction) {
    event.waitUntil(
      fetch(notificationData.closeAction, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: notificationData.id,
          action: 'close',
        }),
      }).catch(function (error) {
        console.error('Error reporting notification close:', error)
      })
    )
  }
})

self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription.options.applicationServerKey,
      })
      .then(function (newSubscription) {
        return fetch('/api/v1/notifications/push-subscription', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            old_endpoint: event.oldSubscription.endpoint,
            new_subscription: {
              endpoint: newSubscription.endpoint,
              keys: {
                p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')),
                auth: arrayBufferToBase64(newSubscription.getKey('auth')),
              },
            },
          }),
        })
      })
      .catch(function (error) {
        console.error('Error handling subscription change:', error)
      })
  )
})

function arrayBufferToBase64(buffer) {
  if (!buffer) return ''
  var bytes = new Uint8Array(buffer)
  var binary = ''
  for (var i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
