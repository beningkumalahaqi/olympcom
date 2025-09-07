import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { adminDb } from '../../../lib/firebase-admin'
import { prisma } from '../../../lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data from Supabase/Prisma
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        profilePic: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Sync user to Firebase
    const userDoc = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.profilePic || null,
      lastSync: new Date(),
      mobileFcmToken: null
    }

    await adminDb.collection('users').doc(user.id).set(userDoc, { merge: true })

    console.log(`User ${user.id} synced to Firebase`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'User synced successfully',
      userId: user.id 
    })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ 
      error: 'Failed to sync user',
      details: error.message 
    }, { status: 500 })
  }
}
