import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { adminDb } from '../../../../../lib/firebase-admin'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { chatId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const since = url.searchParams.get('since') // Timestamp of last message client has
    const limit = parseInt(url.searchParams.get('limit') || '50')

    let query = adminDb.collection('chats').doc(chatId).collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(limit)

    // Only get messages after the 'since' timestamp
    if (since) {
      const sinceDate = new Date(since)
      query = query.where('timestamp', '>', sinceDate)
    }

    const snapshot = await query.get()
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }))

    // Get the latest message timestamp for next request
    const latestTimestamp = messages.length > 0 
      ? messages[messages.length - 1].timestamp 
      : since || new Date()

    return NextResponse.json({
      messages,
      latestTimestamp,
      hasNewMessages: messages.length > 0,
      count: messages.length
    })
  } catch (error) {
    console.error('Error fetching new messages:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error.message 
    }, { status: 500 })
  }
}
