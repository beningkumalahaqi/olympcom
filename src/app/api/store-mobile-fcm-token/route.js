import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { adminDb } from '../../../lib/firebase-admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { mobileFcmToken } = await request.json()
    
    // Get authenticated session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mobileFcmToken) {
      return NextResponse.json({ error: 'Mobile FCM token is required' }, { status: 400 })
    }

    // Update user's FCM token in Firebase
    await adminDb.collection('users').doc(session.user.id).update({
      mobileFcmToken,
      lastTokenUpdate: new Date()
    })

    console.log(`FCM token updated for user ${session.user.id}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'FCM token stored successfully' 
    })
  } catch (error) {
    console.error('Error storing FCM token:', error)
    return NextResponse.json({ 
      error: 'Failed to store FCM token',
      details: error.message 
    }, { status: 500 })
  }
}
