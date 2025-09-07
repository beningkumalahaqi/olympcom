import { NotificationService } from '../../../../lib/notificationService'
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function POST(request) {
  try {
    const { type, postId, authorId, reactorId, commentId, announcementId, content, reactionType } = await request.json()
    
    // Validate webhook secret for security (optional but recommended)
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
    }

    if (!type) {
      return NextResponse.json({ 
        error: 'Type is required' 
      }, { status: 400 })
    }

    let result

    switch (type) {
      case 'new_post':
        if (!postId || !authorId) {
          return NextResponse.json({ error: 'postId and authorId required for new_post' }, { status: 400 })
        }
        
        result = await NotificationService.notifyNewPost(
          postId,
          authorId,
          content || ''
        )
        break

      case 'new_reaction':
        if (!postId || !reactorId) {
          return NextResponse.json({ error: 'postId and reactorId required for new_reaction' }, { status: 400 })
        }
        
        // Get post author ID from database
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true }
        })
        
        if (!post) {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }
        
        result = await NotificationService.notifyNewReaction(
          postId,
          reactorId,
          post.userId,
          reactionType || 'like'
        )
        break

      case 'new_comment':
        if (!postId || !commentId || !authorId) {
          return NextResponse.json({ error: 'postId, commentId and authorId required for new_comment' }, { status: 400 })
        }
        
        // Get post author ID from database
        const commentPost = await prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true }
        })
        
        if (!commentPost) {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }
        
        result = await NotificationService.notifyNewComment(
          postId,
          commentId,
          authorId,
          commentPost.userId,
          content || ''
        )
        break

      case 'new_announcement':
        if (!announcementId) {
          return NextResponse.json({ error: 'announcementId required for new_announcement' }, { status: 400 })
        }
        
        result = await NotificationService.notifyNewAnnouncement(
          announcementId,
          content || ''
        )
        break
        break

      case 'new_chat_message':
        result = await NotificationService.notifyNewChatMessage(
          data.chatId,
          session.user.id,
          data.recipientIds || [],
          data.messageText || ''
        )
        break

      case 'new_announcement':
        result = await NotificationService.notifyNewAnnouncement(
          data.announcementId,
          data.title || '',
          data.content || ''
        )
        break

      default:
        return NextResponse.json({ 
          error: 'Invalid notification type' 
        }, { status: 400 })
    }

    return NextResponse.json({
      success: result.success,
      sent: result.sent || 0,
      message: `Notification triggered successfully`
    })
  } catch (error) {
    console.error('Error triggering notification:', error)
    return NextResponse.json({
      error: 'Failed to trigger notification',
      details: error.message
    }, { status: 500 })
  }
}
