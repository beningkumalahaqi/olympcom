import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { invalidateCache, CACHE_TAGS, getPostCacheTag } from '@/lib/cache-server'
import { NotificationService } from '@/lib/notificationService'

export async function POST(request, { params }) {
  const { postId } = await params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePic: true
          }
        }
      }
    })

    // Send notification to post author (only if not commenting on own post)
    if (post.authorId !== session.user.id) {
      try {
        await NotificationService.notifyNewComment(
          postId,
          comment.id,
          session.user.id,
          post.authorId,
          content.trim()
        )
      } catch (error) {
        console.error('Failed to send comment notification:', error)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Invalidate posts cache and specific post cache after comment creation
    invalidateCache([CACHE_TAGS.POSTS, CACHE_TAGS.COMMENTS, getPostCacheTag(postId)])
  }
}
