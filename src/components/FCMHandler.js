'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useMobileFCM } from '../hooks/useMobileFCM'

export default function FCMHandler() {
  const { data: session } = useSession()
  const { isMobile, registerFCMToken } = useMobileFCM()

  // Sync user to Firebase and register FCM when session loads
  useEffect(() => {
    if (session?.user) {
      // Sync user to Firebase
      fetch('/api/sync-user', { method: 'POST' })
        .catch(err => console.error('Failed to sync user:', err))

      // Register FCM token for mobile users
      if (isMobile) {
        registerFCMToken()
      }
    }
  }, [session, isMobile, registerFCMToken])

  return null // This component doesn't render anything
}
