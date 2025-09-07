import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getMessagingInstance } from '../lib/firebase'

export function useMobileFCM() {
  const { data: session } = useSession()
  const [fcmToken, setFcmToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check if running in mobile WebView
  const isMobile = typeof window !== 'undefined' && 
    (window.navigator.userAgent.includes('AndroidBridge') || 
     window.AndroidBridge !== undefined)

  // Register FCM token
  const registerFCMToken = useCallback(async () => {
    if (!session?.user || !isMobile) return

    setLoading(true)
    try {
      const messaging = await getMessagingInstance()
      if (!messaging) {
        throw new Error('Firebase messaging not supported')
      }

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      // Get FCM token
      const { getToken } = await import('firebase/messaging')
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      })

      if (token) {
        setFcmToken(token)
        
        // Store token on server
        await fetch('/api/store-mobile-fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ mobileFcmToken: token })
        })

        // Also send to Android bridge if available
        if (window.AndroidBridge && window.AndroidBridge.storeMobileFCMToken) {
          window.AndroidBridge.storeMobileFCMToken(token, session.user.id)
        }

        console.log('FCM token registered:', token)
      }
    } catch (err) {
      console.error('Error registering FCM token:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session?.user, isMobile])

  // Handle foreground messages
  useEffect(() => {
    if (!isMobile) return

    const setupForegroundMessaging = async () => {
      const messaging = await getMessagingInstance()
      if (!messaging) return

      const { onMessage } = await import('firebase/messaging')
      
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload)
        
        // Show notification
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icon-192x192.png'
          })
        }

        // Handle notification click
        if (window.AndroidBridge && window.AndroidBridge.handleNotificationClick) {
          window.AndroidBridge.handleNotificationClick(
            payload.data?.type || 'chat',
            payload.data?.userId || '',
            payload.data || {}
          )
        }
      })
    }

    setupForegroundMessaging()
  }, [isMobile])

  // Auto-register when user logs in
  useEffect(() => {
    if (session?.user && isMobile) {
      registerFCMToken()
    }
  }, [session?.user, isMobile, registerFCMToken])

  // Setup global mobile FCM handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.setMobileFCMToken = (token) => {
        setFcmToken(token)
        if (session?.user) {
          fetch('/api/store-mobile-fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileFcmToken: token })
          })
        }
      }

      window.handleNotificationClick = (type, userId, data) => {
        console.log('Notification clicked:', { type, userId, data })
        
        // Navigate based on notification type
        if (type === 'chat' && data.chatId) {
          window.location.href = `/chat/${data.chatId}`
        } else if (type === 'post' && data.postId) {
          window.location.href = `/posts/${data.postId}`
        } else if (type === 'announcement') {
          window.location.href = '/announcements'
        }
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.setMobileFCMToken
        delete window.handleNotificationClick
      }
    }
  }, [session])

  return {
    fcmToken,
    loading,
    error,
    isMobile,
    registerFCMToken
  }
}
