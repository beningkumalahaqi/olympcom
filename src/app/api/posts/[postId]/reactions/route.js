import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { invalidateCache, CACHE_TAGS, getPostCacheTag } from '@/lib/cache-server'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = await params
    const { type } = await request.json()

    if (!type) {
      return NextResponse.json(
        { error: 'Reaction type is required' },
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

    // Check if user already reacted with this type
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        postId,
        userId: session.user.id,
        type
      }
    })

    if (existingReaction) {
      // Remove reaction if it exists
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      })
      
      return NextResponse.json({ action: 'removed' })
    } else {
      // Add new reaction
      const reaction = await prisma.reaction.create({
        data: {
          type,
          postId,
          userId: session.user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return NextResponse.json({ action: 'added', reaction })
    }
  } catch (error) {
    console.error('Error handling reaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Invalidate posts cache and specific post cache after reaction change
    invalidateCache([CACHE_TAGS.POSTS, CACHE_TAGS.REACTIONS, getPostCacheTag(postId)])
  }
}
