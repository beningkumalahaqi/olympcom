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

    // Get messages from Firebase
    const messagesRef = adminDb.collection('chats').doc(chatId).collection('messages')
    const snapshot = await messagesRef.orderBy('timestamp', 'asc').limit(100).get()
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }))

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { chatId } = await params
    const { text, type = 'text' } = await request.json()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }

    // Sync user to Firebase first
    await fetch(`${process.env.NEXTAUTH_URL}/api/sync-user`, { 
      method: 'POST',
      headers: { 'Cookie': request.headers.get('cookie') || '' }
    })

    // Add message to Firebase
    const messageData = {
      text: text.trim(),
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      userAvatar: session.user.profilePic || null,
      timestamp: new Date(),
      type,
      status: 'sent'
    }

    const messagesRef = adminDb.collection('chats').doc(chatId).collection('messages')
    const docRef = await messagesRef.add(messageData)

    // TODO: Send notifications to other chat participants
    
    return NextResponse.json({ 
      success: true, 
      messageId: docRef.id,
      message: { id: docRef.id, ...messageData }
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error.message 
    }, { status: 500 })
  }
}
