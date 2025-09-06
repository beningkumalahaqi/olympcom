// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message: ', payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click events
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received.')

  event.notification.close()

  const data = event.notification.data
  
  let url = '/'
  
  // Determine URL based on notification type
  if (data.type === 'chat' && data.chatId) {
    url = `/chat/${data.chatId}`
  } else if (data.type === 'post' && data.postId) {
    url = `/posts/${data.postId}`
  } else if (data.type === 'announcement') {
    url = '/announcements'
  } else if (data.type === 'comment' && data.postId) {
    url = `/posts/${data.postId}`
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
