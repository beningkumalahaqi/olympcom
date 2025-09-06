import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { adminDb } from '../../../../../lib/firebase-admin'

export async function GET(request, { params }) {
  const { chatId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', chatId })}\n\n`)

      let lastMessageCount = 0
      
      // Check for new messages every 5 seconds (much less frequent than 2 seconds)
      const interval = setInterval(async () => {
        try {
          const messagesRef = adminDb.collection('chats').doc(chatId).collection('messages')
          const snapshot = await messagesRef.orderBy('timestamp', 'desc').limit(1).get()
          
          if (!snapshot.empty) {
            const totalMessages = (await messagesRef.get()).size
            
            // Only fetch and send if message count changed
            if (totalMessages !== lastMessageCount) {
              const allMessagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get()
              const messages = allMessagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
              }))
              
              controller.enqueue(`data: ${JSON.stringify({ 
                type: 'messages', 
                messages,
                count: totalMessages 
              })}\n\n`)
              
              lastMessageCount = totalMessages
            }
          }
        } catch (error) {
          console.error('SSE error:', error)
          controller.enqueue(`data: ${JSON.stringify({ 
            type: 'error', 
            error: error.message 
          })}\n\n`)
        }
      }, 5000) // Check every 5 seconds instead of 2

      // Cleanup function
      const cleanup = () => {
        clearInterval(interval)
        controller.close()
      }

      // Handle client disconnect
      request.signal?.addEventListener('abort', cleanup)
      
      // Set a timeout to prevent long-running connections
      setTimeout(cleanup, 30 * 60 * 1000) // 30 minutes max
    }
  })

  return new Response(stream, { headers })
}
