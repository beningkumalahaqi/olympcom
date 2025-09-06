'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import Link from 'next/link'
import Chat from '../../components/Chat'
import { useMobileFCM } from '../../hooks/useMobileFCM'

export default function GlobalChatPage() {
  const { data: session, status } = useSession()
  const { isMobile, registerFCMToken } = useMobileFCM()

  // Sync user to Firebase when session loads
  useEffect(() => {
    if (session?.user) {
      fetch('/api/sync-user', { method: 'POST' })
        .catch(err => console.error('Failed to sync user:', err))
    }
  }, [session])

  // Register FCM token for mobile users
  useEffect(() => {
    if (session?.user && isMobile) {
      registerFCMToken()
    }
  }, [session, isMobile, registerFCMToken])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in Required
          </h1>
          <p className="text-gray-600 mb-6">
            You need to sign in to access the global chat.
          </p>
          <Link 
            href="/api/auth/signin"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 pt-4 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Global Chat
          </h1>
          <p className="text-gray-600 text-sm">
            Connect with the entire Olympus community in real-time
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <Chat 
            chatId="global"
            participants={[]}
          />
        </div>

        {/* Mobile notification status */}
        {isMobile && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📱 Mobile notifications are enabled for this chat
            </p>
          </div>
        )}

        {/* Chat Guidelines */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Chat Guidelines</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Be respectful and kind to all community members</li>
            <li>• Keep conversations relevant and constructive</li>
            <li>• No spam, harassment, or inappropriate content</li>
            <li>• Messages are visible to all users in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
